/*
    Dedge's Aave and Compound manager
*/

pragma solidity 0.5.16;


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

import "../../interfaces/IAddressRegistry.sol";
import "../../interfaces/IActionRegistry.sol";
import "../../interfaces/IERC20.sol";

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

    // Main entry point for swapping debt
    function swapDebt(
        address actionRegistryAddress,
        address addressRegistryAddress,
        address payable dacProxyAddress,
        address oldCTokenAddress,            // Old CToken debt address
        uint oldTokenUnderlyingTargetAmount, // Target debt of the ctoken underlying debt
        address newCTokenAddress             // New debt address (must be a cToken address)
    ) public payable {
        // Calling from dacProxy context (msg.sender is dacProxy)
        // 1. Calculates delta between current oldCToken and target oldCToken
        // 2. Get amount of ETH you would get selling that from Uniswap
        // 3. Flashloans ETH to dacProxy
        require(oldCTokenAddress != newCTokenAddress, "cmpd-old-new-debt-address-same");
        
        // Gets registries
        IAddressRegistry addressRegistry = IAddressRegistry(addressRegistryAddress);
        IActionRegistry actionRegistry = IActionRegistry(actionRegistryAddress);

        // Get user guard
        address guardAddress = address(DACProxy(dacProxyAddress).authority());

        // 1. Calculates delta
        // TODO: Change from borrowBalanceStored to borrowBalanceCurrent
        uint oldTokenUnderlyingDelta = ICToken(oldCTokenAddress)
            .borrowBalanceStored(dacProxyAddress)
            .sub(oldTokenUnderlyingTargetAmount);

        uint ethDebtAmount;

        // 2. Get amount of ETH needed
        // If the old target is ether than the ethDebtAmount is just the delta
        if (oldCTokenAddress == addressRegistry.CEtherAddress()) {
            ethDebtAmount = oldTokenUnderlyingDelta;
        } else {
            // Otherwise calculate it from uniswap
            ethDebtAmount = _getTokenToEthInput(
                ICToken(oldCTokenAddress).underlying(),
                oldTokenUnderlyingDelta
            );
        }

        // 3. Flashloan ETH with relevant data
        bytes memory data = abi.encode(
            actionRegistry.ACTION_SWAP_DEBT(),
            actionRegistryAddress,
            addressRegistryAddress,
            oldCTokenAddress,
            newCTokenAddress
        );

        ILendingPool lendingPool = ILendingPool(
            ILendingPoolAddressesProvider(
                addressRegistry.AaveLendingPoolAddressProviderAddress()
            ).getLendingPool()
        );

        // Approve lending pool to call proxy
        _guardPermit(guardAddress, address(lendingPool));

        lendingPool.flashLoan(
            dacProxyAddress,
            addressRegistry.AaveEthAddress(),
            ethDebtAmount,
            data
        );

        // Forbids lending pool to call proxy
        _guardForbid(guardAddress, address(lendingPool));
    }
}
