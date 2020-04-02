/*
    A manager to exit all positions (collateral and debt)
*/

pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import "../interfaces/IERC20.sol";

import "../interfaces/compound/IComptroller.sol";
import "../interfaces/compound/ICEther.sol";
import "../interfaces/compound/ICToken.sol";

import "../interfaces/aave/ILendingPoolAddressesProvider.sol";
import "../interfaces/aave/ILendingPool.sol";
import "../interfaces/aave/ILendingPoolParametersProvider.sol";

import "../lib/uniswap/UniswapLiteBase.sol";
import "../lib/dapphub/Guard.sol";

import "../registries/AddressRegistry.sol";

import "../proxies/DACProxy.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";


contract DedgeExitManager is UniswapLiteBase {
    using SafeMath for uint256;

    function() external payable {}

    constructor() public {}

    struct DebtMarket {
        address cToken;
        uint256 amount;
    }

    struct CollateralMarket {
        address cToken;
        uint256 amount;
    }

    struct ExitPositionCalldata {
        address payable exitUserAddress;
        address addressRegistryAddress;
        DebtMarket[] debtMarket;
        CollateralMarket[] collateralMarket;
    }

    function _proxyGuardPermit(address payable proxyAddress, address src)
        internal
    {
        address g = address(DACProxy(proxyAddress).authority());

        DSGuard(g).permit(
            bytes32(bytes20(address(src))),
            DSGuard(g).ANY(),
            DSGuard(g).ANY()
        );
    }

    function _proxyGuardForbid(address payable proxyAddress, address src)
        internal
    {
        address g = address(DACProxy(proxyAddress).authority());

        DSGuard(g).forbid(
            bytes32(bytes20(address(src))),
            DSGuard(g).ANY(),
            DSGuard(g).ANY()
        );
    }

    function _approve(address cToken, uint256 amount) public {
        // Approves CToken contract to call `transferFrom`
        address underlying = ICToken(cToken).underlying();
        require(
            IERC20(underlying).approve(cToken, amount) == true,
            "cmpnd-mgr-ctoken-approved-failed"
        );
    }

    function _transfer(
        address CEtherAddress,
        address cToken,
        address recipient,
        uint256 amount
    ) internal {
        if (cToken == CEtherAddress) {
            recipient.call.value(amount)("");
        } else {
            require(
                IERC20(ICToken(cToken).underlying()).transfer(
                    recipient,
                    amount
                ),
                "cmpnd-mgr-transfer-failed"
            );
        }
    }

    function _repayBorrow(address CEtherAddress, address cToken, uint256 amount)
        internal
    {
        if (cToken == CEtherAddress) {
            ICEther(cToken).repayBorrow.value(amount)();
        } else {
            _approve(cToken, amount);
            require(
                ICToken(cToken).repayBorrow(amount) == 0,
                "cmpnd-mgr-ctoken-repay-failed"
            );
        }
    }

    function _redeemUnderlying(address cToken, uint256 redeemTokens) internal {
        uint a = ICToken(cToken).redeemUnderlying(redeemTokens);
        require(
            a == 0,
            "cmpnd-mgr-ctoken-redeem-underlying-failed"
        );
    }

    function _repayDebt(address CEtherAddress, address cToken, uint256 amount)
        internal
    {
        // Always assume we have enough ETH to repay debt
        if (cToken != CEtherAddress) {
            address underlying = ICToken(cToken).underlying();

            // Get ETH needed to get ERC20
            uint256 ethAmount = _getEthToTokenOutput(underlying, amount);

            // Convert ETH to token
            _ethToToken(underlying, ethAmount);
        }

        _repayBorrow(CEtherAddress, cToken, amount);
    }

    function _retrieveCollateral(
        address CEtherAddress,
        address cToken,
        uint256 amount
    ) internal returns (uint256) {
        // Redeems token
        _redeemUnderlying(cToken, amount);

        if (cToken == CEtherAddress) {
            return amount;
        }

        address underlying = ICToken(cToken).underlying();
        return _tokenToEth(underlying, amount);
    }

    function exitPositionsPostLoan(
        uint256 _amount,
        uint256 _fee,
        uint256 _protocolFee,
        bytes calldata _params
    ) external {
        // We should now have funds
        ExitPositionCalldata memory epCalldata = abi.decode(
            _params,
            (ExitPositionCalldata)
        );

        AddressRegistry addressRegistry = AddressRegistry(
            epCalldata.addressRegistryAddress
        );
        address CEtherAddress = addressRegistry.CEtherAddress();

        // Repay debt and retrieve collateral
        for (uint256 i = 0; i < epCalldata.debtMarket.length; i++) {
            _repayDebt(
                CEtherAddress,
                epCalldata.debtMarket[i].cToken,
                epCalldata.debtMarket[i].amount
            );
        }

        uint256 totalEthAmount;
        for (uint256 i = 0; i < epCalldata.collateralMarket.length; i++) {
            totalEthAmount += _retrieveCollateral(
                CEtherAddress,
                epCalldata.collateralMarket[i].cToken,
                epCalldata.collateralMarket[i].amount
            );
        }

        // Repays (ETH - fees) back to exitAddress
        epCalldata.exitUserAddress.call.value(
            totalEthAmount.sub(_amount).sub(_fee).sub(_protocolFee)
        )("");
    }

    function exitPositions(
        uint256 totalEthDebtAmount,
        address dedgeExitManagerAddress,
        address payable dacProxyAddress,
        address addressRegistryAddress,
        bytes calldata executeOperationCalldataParams
    ) external {
        AddressRegistry addressRegistry = AddressRegistry(
            addressRegistryAddress
        );

        // Injects target address into calldataParams
        bytes memory addressAndExecuteOperationCalldataParams = abi
            .encodePacked(
            abi.encode(dedgeExitManagerAddress),
            executeOperationCalldataParams
        );

        ILendingPool lendingPool = ILendingPool(
            ILendingPoolAddressesProvider(
                addressRegistry.AaveLendingPoolAddressProviderAddress()
            )
                .getLendingPool()
        );

        // Approve lendingPool to call proxy
        _proxyGuardPermit(dacProxyAddress, address(lendingPool));

        // 3. Flashloan ETH with relevant data
        lendingPool.flashLoan(
            dacProxyAddress,
            addressRegistry.AaveEthAddress(),
            totalEthDebtAmount,
            addressAndExecuteOperationCalldataParams
        );

        // Forbids lendingPool to call proxy
        _proxyGuardForbid(dacProxyAddress, address(lendingPool));
    }
}
