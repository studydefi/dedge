// Largely referenced from https://github.com/mrdavey/CollateralSwapFrontend

pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import "../../lib/aave/FlashLoanReceiverBase.sol";

import "../../lib/dapphub/Guard.sol";

import "../../lib/makerdao/DssProxyActionsBase.sol";

import "../../lib/uniswap/UniswapBase.sol";

import "../../interfaces/aave/ILendingPoolAddressesProvider.sol";
import "../../interfaces/aave/ILendingPool.sol";

import "../../interfaces/uniswap/IUniswapExchange.sol";
import "../../interfaces/uniswap/IUniswapFactory.sol";

import "../../interfaces/IERC20.sol";

import "../../registries/ActionRegistry.sol";
import "../../registries/AddressRegistry.sol";

import "../../proxies/compound/DACProxy.sol";


contract DedgeMakerManager is DssProxyActionsBase {
    function () external payable {}

    constructor () public {}

    struct ImportMakerVaultCallData {
        uint actionId;
        address actionRegistryAddress;
        address addressRegistryAddress;
        uint cdpId;
        address collateralCTokenAddress;
        address collateralJoinAddress;
        address dedgeMakerManagerAddress;
    }

    // Helper functions
    function convertToERC20Decimals(address token, uint256 wad18) public returns (uint256) {
        // Converts wad18 decimal place collateral
        // (aka what getVaultCollateral returns) to ERC20 decimals
        return wad18 / (10 ** (18 - IERC20(token).decimals()));
    }

    function getVaultDebt(
        address manager,
        uint cdp
    )
        public
        view
        returns (uint debt)
    {
        address vat = ManagerLike(manager).vat();
        address urn = ManagerLike(manager).urns(cdp);
        bytes32 ilk = ManagerLike(manager).ilks(cdp);
        address owner = ManagerLike(manager).owns(cdp);

        debt = _getWipeAllWad(vat, owner, urn, ilk);
    }

    function getVaultCollateral(
        address manager,
        uint cdp
    ) public view returns (uint ink) {
        address vat = ManagerLike(manager).vat();
        address urn = ManagerLike(manager).urns(cdp);
        bytes32 ilk = ManagerLike(manager).ilks(cdp);
        (ink,) = VatLike(vat).urns(ilk, urn);
    }

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

    // Imports maker vault into Dedge
    function importMakerVault(
        address payable dacProxyAddress,
        address dedgeMakerManagerAddress,
        address actionRegistryAddress,
        address addressRegistryAddress,
        address collateralCTokenAddress,
        address collateralJoinAddress,
        uint cdpId
    ) public payable {
        AddressRegistry addressRegistry = AddressRegistry(addressRegistryAddress);

        address cdpManager = addressRegistry.DssCdpManagerAddress();

        address guardAddress = address(DACProxy(dacProxyAddress).authority());

        // Get Debt
        uint daiDebt = getVaultDebt(cdpManager, cdpId);

        // 1. Flashloan DAI
        bytes memory data = abi.encode(ImportMakerVaultCallData({
            actionId: ActionRegistry(actionRegistryAddress).ACTION_IMPORT_VAULT(),
            actionRegistryAddress: actionRegistryAddress,
            addressRegistryAddress: addressRegistryAddress,
            cdpId: cdpId,
            collateralCTokenAddress: collateralCTokenAddress,
            collateralJoinAddress: collateralJoinAddress,
            dedgeMakerManagerAddress: dedgeMakerManagerAddress
        }));

        ILendingPool lendingPool = ILendingPool(
            ILendingPoolAddressesProvider(
                addressRegistry.AaveLendingPoolAddressProviderAddress()
            ).getLendingPool()
        );

        cdpAllow(addressRegistry.DssCdpManagerAddress(), cdpId, dedgeMakerManagerAddress, 1);
        _guardPermit(guardAddress, address(lendingPool));

        lendingPool.flashLoan(dacProxyAddress, addressRegistry.DaiAddress(), daiDebt, data);

        _guardForbid(guardAddress, address(lendingPool));
        cdpAllow(addressRegistry.DssCdpManagerAddress(), cdpId, dedgeMakerManagerAddress, 0);
    }
}
