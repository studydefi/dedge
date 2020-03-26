/*
    Main contract to handle Aave flashloans on Compound Finance.
    (D)edge's (A)ave flashloans on (C)ompound finance Proxy.
*/

pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import "../../lib/aave/FlashLoanReceiverBase.sol";

import "../../lib/dapphub/Proxy.sol";

import "../../lib/uniswap/UniswapLiteBase.sol";

import "../../lib/makerdao/DssProxyActionsBase.sol";

import "../../managers/makerdao/DedgeMakerManager.sol";

import "../../registries/AddressRegistry.sol";
import "../../registries/ActionRegistry.sol";

import "../../interfaces/IERC20.sol";
import "../../interfaces/compound/ICEther.sol";
import "../../interfaces/compound/ICToken.sol";
import "../../interfaces/makerdao/IDssProxyActions.sol";
import "../../interfaces/compound/IComptroller.sol";

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

    struct GenericCallData {
        uint actionId;
        address actionRegistryAddress;
        address addressRegistryAddress;
    }

    struct SwapOperationCalldata {
        uint actionId;
        address actionRegistryAddress;
        address addressRegistryAddress;
        address oldCTokenAddress;
        address newCTokenAddress;
    }

    struct ImportMakerVaultCallData {
        uint actionId;
        address actionRegistryAddress;
        address addressRegistryAddress;
        uint cdpId;
        address collateralCTokenAddress;
        address collateralJoinAddress;
        uint8 collateralDecimals;
        address dedgeMakerManagerAddress;
    }

    // For future lego building blocks :)
    function executes(address[] memory _targets, bytes[] memory data)
        public auth note payable returns (bytes[] memory response)
    {
        require(_targets.length == data.length, "dacproxy-targets-data-dif-length");

        for (uint i = 0; i < _targets.length; i++) {
            response[i] = execute(_targets[i], data[i]);
        }
    }

    function _swapDebt(
        address CEtherAddress,
        address oldCTokenAddress,
        address newCTokenAddress,
        uint loanAmount,        // How much we loaned
        uint debtAmount         // How much we need to pay back
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
                "dacproxy-repay-ctoken-fail"
            );
        }

        // Steps 4, 5, 6
        // Calculates new debt amount to borrow
        // Unless new target underlying is already ether
        if (newCTokenAddress == CEtherAddress) {
            ICEther(newCTokenAddress).borrow(debtAmount);
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
                "dacproxy-borrow-ctoken-fail"
            );

            // Converts to ether
            // Note this part is a bit more strict as we need to have
            // enough ETH to repay Aave
            _tokenToEth(newTokenUnderlying, newTokenUnderlyingAmount, debtAmount);
        }
    }

    function _swapCollateral(
        address CEtherAddress,
        address oldCTokenAddress,
        address newCTokenAddress,
        uint loanAmount,        // How much we loaned
        uint feeAmount         // How much we owe in fees
    ) internal {
        // Note: totalDebt = loanAmount + feeAmount

        // 1. Has ETH from Aave flashloan
        // 2. Converts ETH into newCToken underlying
        // 3. Supplies newCToken underlying
        // 4. Redeems oldCToken underlying
        // 5. Converts outCToken underlying to ETH
        // 6. Borrow <fee> ETH to repay aave

        // Steps 2 + 3
        // Converts ETH to newCToken underlying and supply
        // Unless old target underlying is already ether
        uint repayAmount = loanAmount.sub(feeAmount);

        if (newCTokenAddress == CEtherAddress) {
            ICEther(newCTokenAddress).mint.value(repayAmount)();
        } else {
            // Gets new token underlying and converts ETH into newCToken underlying
            address newTokenUnderlying = ICToken(newCTokenAddress).underlying();
            uint newTokenUnderlyingAmount = _ethToToken(
                newTokenUnderlying,
                repayAmount
            );

            // Supplies new CTokens
            require(
                ICToken(newCTokenAddress).mint(newTokenUnderlyingAmount) == 0,
                "dacproxy-ctoken-supply-failed"
            );
        }

        // Steps 4, 5
        // Redeem CToken underlying
        if (oldCTokenAddress == CEtherAddress) {
            require(
                ICEther(oldCTokenAddress).redeemUnderlying(loanAmount) == 0,
                "dacproxy-ctoken-redeem-underlying-failed"
            );
        } else {
            // Gets old token underlying and amount to redeem (based on uniswap)
            address oldTokenUnderlying = ICToken(oldCTokenAddress).underlying();
            uint oldTokenUnderlyingAmount = _getTokenToEthOutput(oldTokenUnderlying, loanAmount);

            // Redeems them
            require(
                ICEther(oldCTokenAddress).redeemUnderlying(oldTokenUnderlyingAmount) == 0,
                "dacproxy-ctoken-redeem-underlying-failed"
            );

            // Converts them into ETH
            _tokenToEth(oldTokenUnderlying, oldTokenUnderlyingAmount, loanAmount);
        }
    }

    // Import maker vault
    function _importMakerVault(
        address dedgeMakerManagerAddress,
        address addressRegistryAddress,
        uint cdpId,
        address collateralCTokenAddress,
        address collateralJoinAddress,
        uint8 collateralDecimals,
        uint totalDebt
    ) internal {
        AddressRegistry addressRegistry = AddressRegistry(addressRegistryAddress);

        DedgeMakerManager makerManager = DedgeMakerManager(address(uint160(dedgeMakerManagerAddress)));
        address cdpManager = addressRegistry.DssCdpManagerAddress();

        uint collateral = makerManager.getVaultCollateral(cdpManager, cdpId);

        // Allows daiJoin to call transferFrom
        IERC20(addressRegistry.DaiAddress()).approve(dedgeMakerManagerAddress, uint(-1));

        // Joins the ETH/GEM/DAI market if they haven't already
        address[] memory enterMarketsCToken = new address[](2);
        enterMarketsCToken[0] = collateralCTokenAddress;
        enterMarketsCToken[1] = addressRegistry.CDaiAddress();

        uint[] memory enterMarketErrors = IComptroller(
            addressRegistry.CompoundComptrollerAddress()
        ).enterMarkets(enterMarketsCToken);

        require(enterMarketErrors[0] == 0, "dacproxy-enter-gem-failed");
        require(enterMarketErrors[1] == 0, "dacproxy-enter-dai-failed");

        if (ManagerLike(cdpManager).ilks(cdpId) == bytes32("ETH-A")) {
            // Free ETH (Maker)
            makerManager.wipeAllAndFreeETH(
                cdpManager,
                addressRegistry.EthJoinAddress(),
                addressRegistry.DaiJoinAddress(),
                cdpId,
                collateral
            );

            // Supply ETH and Borrow DAI (Compound)
            ICEther(addressRegistry.CEtherAddress()).mint.value(collateral)();
            require(
                ICToken(addressRegistry.CDaiAddress()).borrow(totalDebt) == 0,
                "dacproxy-dai-borrow-fail"
            );
        } else {
            // Free GEM
            makerManager.wipeAllAndFreeGem(
                cdpManager,
                collateralJoinAddress,
                addressRegistry.DaiJoinAddress(),
                cdpId,
                collateral
            );

            // Convert collateral to relevant decimal places
            collateral = makerManager.convert18ToDecimal(
                collateral, collateralDecimals
            );

            // Approve CToken Collateral underlying to enable call transferFrom
            IERC20(ICToken(collateralCTokenAddress).underlying())
                .approve(collateralCTokenAddress, collateral);

            // Supply GEM and Borrow DAI (Compound)
            require(
                ICToken(collateralCTokenAddress).mint(
                    collateral
                ) == 0,
                "dacproxy-gem-supply-fail"
            );
            require(
                ICToken(addressRegistry.CDaiAddress()).borrow(totalDebt) == 0,
                "dacproxy-dai-borrow-fail"
            );
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
        // Generic call data to differentiate between the
        // different kind of actions to take
        // Bit hacky but it gets past the "stack too deep" thingo
        GenericCallData memory gData = abi.decode(_params, (GenericCallData));

        // Gets registries
        ActionRegistry actionRegistry = ActionRegistry(gData.actionRegistryAddress);

        // Assumes that once the action(s) are performed
        // we will have totalDebt would of _reserve to repay
        // aave and the protocol
        uint protocolFee = _fee.div(2);
        uint totalDebt = _amount.add(_fee).add(protocolFee);

        // If we're swapping debt or collateral
        // the reserve is going to be ETH
        if (gData.actionId == actionRegistry.ACTION_SWAP_DEBT() ||
            gData.actionId == actionRegistry.ACTION_SWAP_COLLATERAL()
        ) {
            SwapOperationCalldata memory soCalldata = abi.decode(_params, (SwapOperationCalldata));
            if (gData.actionId == actionRegistry.ACTION_SWAP_DEBT()) {
                _swapDebt(
                    AddressRegistry(soCalldata.addressRegistryAddress).CEtherAddress(),
                    soCalldata.oldCTokenAddress,
                    soCalldata.newCTokenAddress,
                    _amount,
                    totalDebt
                );
            }
            else if (gData.actionId == actionRegistry.ACTION_SWAP_COLLATERAL()) {
                _swapCollateral(
                    AddressRegistry(soCalldata.addressRegistryAddress).CEtherAddress(),
                    soCalldata.oldCTokenAddress,
                    soCalldata.newCTokenAddress,
                    _amount,
                    _fee.add(protocolFee)
                );
            }

            // Payout fee
            protocolFeePayoutAddress.call.value(protocolFee)("");
        }
        
        // If we're importing a vault, the reserve is going to be dai
        else if (gData.actionId == actionRegistry.ACTION_IMPORT_VAULT()) {
            ImportMakerVaultCallData memory ivCalldata = abi.decode(_params, (ImportMakerVaultCallData));

            _importMakerVault(
                ivCalldata.dedgeMakerManagerAddress,
                ivCalldata.addressRegistryAddress,
                ivCalldata.cdpId,
                ivCalldata.collateralCTokenAddress,
                ivCalldata.collateralJoinAddress,
                ivCalldata.collateralDecimals,
                totalDebt
            );

            // Protocol fee
            IERC20(_reserve).transfer(protocolFeePayoutAddress, protocolFee);
        }

        // Otherwise revert
        else {
            revert("dacproxy-invalid-action");
        }

        // Repays aave
        transferFundsBackToPoolInternal(_reserve, _amount.add(_fee));
    }
}