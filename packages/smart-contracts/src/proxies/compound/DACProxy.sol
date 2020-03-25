/*
    Main contract to handle Aave flashloans on Compound Finance.
    (D)edge's (A)ave flashloans on (C)ompound finance Proxy.
*/

pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import "../../lib/aave/FlashLoanReceiverBase.sol";

import "../../lib/dapphub/Proxy.sol";

import "../../lib/uniswap/UniswapLiteBase.sol";

import "../../interfaces/IAddressRegistry.sol";
import "../../interfaces/IActionRegistry.sol";
import "../../interfaces/IERC20.sol";
import "../../interfaces/compound/ICEther.sol";
import "../../interfaces/compound/ICToken.sol";

contract DACProxy is
    DSProxy(address(1)),
    FlashLoanReceiverBase,
    UniswapLiteBase
{
    // TODO: Change this value
    address payable constant protocolFeePayoutAddress = 0x56D5e01D5D2F853aA8f4ac5d2FfB4cBBCa9e2b0f;

    constructor(address _cacheAddr) public {
        setCache(_cacheAddr);
    }

    function() external payable {}

    // For future lego building blocks :)
    function executes(address[] memory _targets, bytes[] memory data)
        public auth note payable returns (bytes[] memory response)
    {
        require(_targets.length == data.length, "dacproxy-targets-data-dif-length");

        for (uint i = 0; i < _targets.length; i++) {
            response[i] = execute(_targets[i], data[i]);
        }
    }

    // Helper functions
    function _swapDebt(
        address CEtherAddress,
        address oldCTokenAddress,
        address newCTokenAddress,
        uint loanAmount,
        uint debtAmount
    ) internal {
        // Note: debtAmonut = loanAmount + fees
        // 1. Has ETH from Aave flashloan
        // 2. Converts ETH to oldCToken underlying
        // 3. Repays oldCToken underlying
        // 4. Calculates new amount to borrow from new token to repay debtAmount
        // 5. Borrows from new token
        // 6. Convert new token to ETH 

        // Steps 2 + 3
        // Converts ETH to oldCToken underlying and repay
        // Unless old target underlying is already ether
        if (oldCTokenAddress == CEtherAddress) {
            ICEther(oldCTokenAddress).repayBorrow.value(loanAmount)();
        } else {
            // Gets old token underlying and amount
            address oldTokenUnderlying = ICToken(oldCTokenAddress).underlying();

            uint oldTokenUnderlyingAmount = _ethToToken(
                oldTokenUnderlying,
                loanAmount
            );

            // Approves CToken proxy and repays them
            IERC20(oldTokenUnderlying)
                .approve(oldCTokenAddress, oldTokenUnderlyingAmount);

            // Repays CToken
            require(
                ICToken(oldCTokenAddress).repayBorrow(oldTokenUnderlyingAmount) == 0,
                "cmpnd-repay-ctoken-fail"
            );
        }

        // Steps 4, 5, 6
        // Calculates new debt amount to borrow
        // Unless new target underlying is already ether
        if (newCTokenAddress == CEtherAddress) {
            ICEther(oldCTokenAddress).borrow(debtAmount);
        } else {
            // Gets new token underlying
            address newTokenUnderlying = ICToken(newCTokenAddress).underlying();

            // Calculates amount of old token underlying that needs to be borrowed
            // to repay debts
            uint newTokenUnderlyingAmount = _getTokenToEthOutput(
                newTokenUnderlying,
                debtAmount
            );

            // Borrows new debt
            require(
                ICToken(newCTokenAddress).borrow(newTokenUnderlyingAmount) == 0,
                "cmpnd-borrow-ctoken-fail"
            );

            // Converts to ether
            // Note this part is a bit more strict as we need to have
            // enough ETH to repay Aave
            _tokenToEth(newTokenUnderlying, newTokenUnderlyingAmount, debtAmount);
        }
    }

    // This is for Aave flashloans
    function executeOperation(
        address _reserve,
        uint256 _amount,
        uint256 _fee,
        bytes calldata _params
    ) external
        auth
    {

        // Decode params
        (
            uint actionId,
            address actionRegistryAddress,
            address addressRegistryAddress,
            address oldCTokenAddress,
            address newCTokenAddress
        ) = abi.decode(
            _params,
            (uint, address, address, address, address)
        );

        // Gets address registry
        IActionRegistry actionRegistry = IActionRegistry(actionRegistryAddress);
        IAddressRegistry addressRegistry = IAddressRegistry(addressRegistryAddress);

        // Calculate debt
        uint totalDebt = _amount.add(_fee).add(_fee.div(2));

        // Assumes that once the action(s) are performed
        // we will have totalDebt would of _reserve to repay
        // aave and the protocol

        // If we're swapping debt
        if (actionId == actionRegistry.ACTION_SWAP_DEBT()) {
            _swapDebt(
                addressRegistry.CEtherAddress(),
                oldCTokenAddress,
                newCTokenAddress,
                _amount,
                totalDebt
            );
        }

        // Repays aave
        transferFundsBackToPoolInternal(_reserve, _amount.add(_fee));

        // Payout fee
        protocolFeePayoutAddress.call.value(_fee.div(2))("");
    }
}