/*
    Dedge's Aave and Compound manager
*/

pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;


import "../../lib/compound/CompoundBase.sol";

import "../../lib/dapphub/Guard.sol";

import "../../lib/uniswap/UniswapLiteBase.sol";

import "../../interfaces/aave/ILendingPoolAddressesProvider.sol";
import "../../interfaces/aave/ILendingPool.sol";
import "../../interfaces/aave/ILendingPoolParametersProvider.sol";

import "../../interfaces/compound/ICompoundPriceOracle.sol";
import "../../interfaces/compound/IComptroller.sol";
import "../../interfaces/compound/ICEther.sol";
import "../../interfaces/compound/ICToken.sol";

import "../../interfaces/IERC20.sol";

import "../../registries/AddressRegistry.sol";
import "../../registries/ActionRegistry.sol";

import "../../proxies/compound/DACProxy.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";

contract DACManager is UniswapLiteBase, CompoundBase {
    using SafeMath for uint;

    function _guardPermit(address g, address src) internal {
        DSGuard(g).permit(
            bytes32(bytes20(address(src))),
            DSGuard(g).ANY(),
            DSGuard(g).ANY()
        );
    }

    function _guardForbid(address g, address src) internal {
        DSGuard(g).forbid(
            bytes32(bytes20(address(src))),
            DSGuard(g).ANY(),
            DSGuard(g).ANY()
        );
    }

    struct SwapOperationCalldata {
        uint actionId;
        address actionRegistryAddress;
        address addressRegistryAddress;
        address oldCTokenAddress;
        address newCTokenAddress;
    }

    // Generic swap operation
    function _swapOperation(
        uint actionId,
        address actionRegistryAddress,
        address addressRegistryAddress,
        address payable dacProxyAddress,
        address oldCTokenAddress,            // Old CToken address for [debt|collateral]
        uint oldTokenUnderlyingDelta,        // Amount of old tokens to swap to new tokens
        address newCTokenAddress             // New  address for [debt|collateral] (must be a cToken address)
    ) internal {
        // Calling from dacProxy context (msg.sender is dacProxy)
        // 1. Get amount of ETH obtained by selling that from Uniswap
        // 2. Flashloans ETH to dacProxy
        require(oldCTokenAddress != newCTokenAddress, "cmpd-old-new-debt-address-same");
        
        // Gets registries
        AddressRegistry addressRegistry = AddressRegistry(addressRegistryAddress);
        ActionRegistry actionRegistry = ActionRegistry(actionRegistryAddress);

        // Get user guard
        address guardAddress = address(DACProxy(dacProxyAddress).authority());

        // 1. Get amount of ETH needed
        // If the old target is ether than the ethDebtAmount is just the delta
        uint ethDebtAmount;

        if (oldCTokenAddress == addressRegistry.CEtherAddress()) {
            ethDebtAmount = oldTokenUnderlyingDelta;
        } else {
            // Otherwise calculate it from the exchange
            ethDebtAmount = _getEthToTokenOutput(
                ICToken(oldCTokenAddress).underlying(),
                oldTokenUnderlyingDelta
            );
        }

        // 3. Flashloan ETH with relevant data
        bytes memory data = abi.encode(
            SwapOperationCalldata({
                actionId: actionId,
                actionRegistryAddress: actionRegistryAddress,
                addressRegistryAddress: addressRegistryAddress,
                oldCTokenAddress: oldCTokenAddress,
                newCTokenAddress: newCTokenAddress
            })
        );

        ILendingPool lendingPool = ILendingPool(
            ILendingPoolAddressesProvider(
                addressRegistry.AaveLendingPoolAddressProviderAddress()
            ).getLendingPool()
        );

        // Approve lendingPool to call proxy
        _guardPermit(guardAddress, address(lendingPool));

        lendingPool.flashLoan(
            dacProxyAddress,
            addressRegistry.AaveEthAddress(),
            ethDebtAmount,
            data
        );

        // Forbids lendingPool to call proxy
        _guardForbid(guardAddress, address(lendingPool));
    }

    // Main entry point for swapping collateral
    function swapCollateral(
        address actionRegistryAddress,
        address addressRegistryAddress,
        address payable dacProxyAddress,
        address oldCTokenAddress,            // Old CToken collateral address
        uint oldTokenUnderlyingDelta, // Target collateral of the ctoken underlying debt
        address newCTokenAddress             // New collateral address (must be a cToken address)
    ) public payable {
        ActionRegistry actionRegistry = ActionRegistry(actionRegistryAddress);

        _swapOperation(
            actionRegistry.ACTION_SWAP_COLLATERAL(),
            actionRegistryAddress,
            addressRegistryAddress,
            dacProxyAddress,
            oldCTokenAddress,
            oldTokenUnderlyingDelta,
            newCTokenAddress
        );
    }

    // Main entry point for swapping debt
    function swapDebt(
        address actionRegistryAddress,
        address addressRegistryAddress,
        address payable dacProxyAddress,
        address oldCTokenAddress,            // Old CToken debt address
        uint oldTokenUnderlyingDelta, // Target debt of the ctoken underlying debt
        address newCTokenAddress             // New debt address (must be a cToken address)
    ) public payable {
        ActionRegistry actionRegistry = ActionRegistry(actionRegistryAddress);

        _swapOperation(
            actionRegistry.ACTION_SWAP_DEBT(),
            actionRegistryAddress,
            addressRegistryAddress,
            dacProxyAddress,
            oldCTokenAddress,
            oldTokenUnderlyingDelta,
            newCTokenAddress
        );
    }

    function clearDebtDust(
        address addressRegistryAddress,
        address oldCTokenAddress,
        address newCTokenAddress
    ) public payable {
        // TODO: Change to borrow balance current
        clearDebtDust(
            addressRegistryAddress,
            oldCTokenAddress,
            ICToken(oldCTokenAddress).borrowBalanceStored(msg.sender),
            newCTokenAddress
        );
    }

    // Clears dust debt by swapping old debt into new debt
    function clearDebtDust(
        address addressRegistryAddress,
        address oldCTokenAddress,
        uint oldTokenUnderlyingDustAmount,
        address newCTokenAddress
    ) public payable {
        // i.e. Has 0.1 ETH (oldCToken) debt 900 DAI (newCToken)
        // wants to have it all in DAI

        // 0. Calculates 0.1 ETH equilavent in DAI
        // 1. Borrows out 0.1 ETH equilavent in DAI (~10 DAI as of march 2020)
        // 2. Convert 10 DAI into 0.1 ETH
        // 3. Repay 0.1 ETH

        require(oldCTokenAddress != newCTokenAddress, "clear-debt-same-address");

        AddressRegistry addressRegistry = AddressRegistry(addressRegistryAddress);

        uint borrowAmount;
        address oldTokenUnderlying;
        address newTokenUnderlying;

        if (oldCTokenAddress == addressRegistry.CEtherAddress()) {
            // ETH -> Token
            newTokenUnderlying = ICToken(newCTokenAddress).underlying();

            // Calculates ETH equilavent in token
            borrowAmount = _getTokenToEthOutput(newTokenUnderlying, oldTokenUnderlyingDustAmount);

            // Borrows out equilavent token
            borrow(newCTokenAddress, borrowAmount);

            // Converts token to ETH
            _tokenToEth(newTokenUnderlying, borrowAmount, oldTokenUnderlyingDustAmount);
        } else if (newCTokenAddress == addressRegistry.CEtherAddress()) {
            // Token -> ETH
            oldTokenUnderlying = ICToken(oldCTokenAddress).underlying();

            // Calculates token equilavent in ETH
            borrowAmount = _getEthToTokenOutput(oldTokenUnderlying, oldTokenUnderlyingDustAmount);

            // Borrows out equilavent ETH
            borrow(newCTokenAddress, borrowAmount);

            // Converts ETH to token
            _ethToToken(oldTokenUnderlying, borrowAmount, oldTokenUnderlyingDustAmount);
        } else {
            // token -> token
            oldTokenUnderlying = ICToken(oldCTokenAddress).underlying();
            newTokenUnderlying = ICToken(newCTokenAddress).underlying();

            // Calculates eth borrow amount
            uint ethAmount = _getEthToTokenOutput(oldTokenUnderlying, oldTokenUnderlyingDustAmount);

            // Calculates token borrow amount
            borrowAmount = _getTokenToEthOutput(newTokenUnderlying, ethAmount);

            // Borrows out equilavent token
            borrow(newCTokenAddress, borrowAmount);

            // Converts old token to target token
            _tokenToEth(newTokenUnderlying, borrowAmount, ethAmount);
            _ethToToken(oldTokenUnderlying, ethAmount, oldTokenUnderlyingDustAmount);
        }

        // Repays borrowed
        repayBorrowed(oldCTokenAddress, oldTokenUnderlyingDustAmount);
    }

    function clearCollateralDust(
        address addressRegistryAddress,
        address oldCTokenAddress,
        address newCTokenAddress
    ) public payable {
        clearCollateralDust(
            addressRegistryAddress,
            oldCTokenAddress,
            ICToken(oldCTokenAddress).balanceOfUnderlying(msg.sender),
            newCTokenAddress
        );
    }

    function clearCollateralDust(
        address addressRegistryAddress,
        address oldCTokenAddress,
        uint oldTokenUnderlyingAmount,
        address newCTokenAddress
    ) public payable {
        // i.e. Has 10 ETH collateral and 10 DAI collateral
        // wants to have it all in ETH

        // 1. Redeems 10 DAI collateral
        // 2. Converts it to ETH
        // 3. Puts it into ETH

        // More abstractly,
        // 1. Redeems tokens
        // 2. Convert it to other token
        // 3. Put other token in

        require(oldCTokenAddress != newCTokenAddress, "clear-collateral-same-address");

        uint supplyAmount;
        AddressRegistry addressRegistry = AddressRegistry(addressRegistryAddress);

        // Redeems collateral
        redeemUnderlying(oldCTokenAddress, oldTokenUnderlyingAmount);

        if (oldCTokenAddress == addressRegistry.CEtherAddress()) {
            // ETH -> Token
            supplyAmount = _ethToToken(
                ICToken(newCTokenAddress).underlying(),
                oldTokenUnderlyingAmount
            );
        } else if (newCTokenAddress == addressRegistry.CEtherAddress()) {
            // Token -> ETH
            supplyAmount = _tokenToEth(
                ICToken(oldCTokenAddress).underlying(),
                oldTokenUnderlyingAmount
            );
        } else {
            // Token -> Token
            supplyAmount = _tokenToToken(
                ICToken(oldCTokenAddress).underlying(),
                ICToken(newCTokenAddress).underlying(),
                oldTokenUnderlyingAmount
            );
        }

        // Supplies collateral
        supply(newCTokenAddress, supplyAmount);
    }
}
