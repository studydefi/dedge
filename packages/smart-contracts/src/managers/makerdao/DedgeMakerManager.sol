// Largely referenced from https://github.com/mrdavey/CollateralSwapFrontend

pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import "../../lib/aave/FlashLoanReceiverBase.sol";

import "../../lib/makerdao/DssProxyActionsBase.sol";

import "../../lib/uniswap/UniswapBase.sol";

import "../../lib/dapphub/Guard.sol";

import "../../proxies/DACProxy.sol";


import "../../interfaces/aave/ILendingPoolAddressesProvider.sol";
import "../../interfaces/aave/ILendingPool.sol";

import "../../interfaces/uniswap/IUniswapExchange.sol";
import "../../interfaces/uniswap/IUniswapFactory.sol";

import "../../interfaces/IERC20.sol";

import "../../interfaces/compound/IComptroller.sol";
import "../../interfaces/compound/ICToken.sol";
import "../../interfaces/compound/ICEther.sol";

import "../../interfaces/makerdao/IDssProxyActions.sol";

import "../../registries/ActionRegistry.sol";
import "../../registries/AddressRegistry.sol";


contract DedgeMakerManager is DssProxyActionsBase {
    function () external payable {}

    constructor () public {}

    struct ImportMakerVaultCallData {
        address addressRegistryAddress;
        uint cdpId;
        address collateralCTokenAddress;
        address collateralJoinAddress;
        uint8 collateralDecimals;
    }

    // Helper functions
    function _proxyGuardPermit(address payable proxyAddress, address src) internal {
        address g = address(DACProxy(proxyAddress).authority());

        DSGuard(g).permit(
            bytes32(bytes20(address(src))),
            DSGuard(g).ANY(),
            DSGuard(g).ANY()
        );
    }

    function _proxyGuardForbid(address payable proxyAddress, address src) internal {
        address g = address(DACProxy(proxyAddress).authority());

        DSGuard(g).forbid(
            bytes32(bytes20(address(src))),
            DSGuard(g).ANY(),
            DSGuard(g).ANY()
        );
    }

    function _convert18ToDecimal(uint amount, uint8 decimals) internal returns (uint) {
        return amount / (10 ** (18 - uint(decimals)));
    }

    function _convert18ToGemUnits(address gemJoin, uint256 wad) internal returns (uint) {
        return wad / (10 ** (18 - GemJoinLike(gemJoin).dec()));
    }

    // Gets vault debt in 18 wei
    function getVaultDebt(address manager, uint cdp) public view returns (uint debt)
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

        // Note: This returns in 18 decimals, need to
        // convert to gemUnits before passing it to
        // dss-proxy-actions
        (ink,) = VatLike(vat).urns(ilk, urn);
    }

    // Function to be called by proxy post loan
    // in order to import maker vault
    function importMakerVaultPostLoan(
        uint _amount,
        uint _aaveFee,
        uint _protocolFee,
        bytes calldata _data
    ) external {
        // Calculate total debt
        uint totalDebt = _amount + _aaveFee + _protocolFee;

        // Reconstruct data
        ImportMakerVaultCallData memory imvCalldata = abi.decode(_data, (ImportMakerVaultCallData));

        // Extract relevant data
        AddressRegistry addressRegistry = AddressRegistry(imvCalldata.addressRegistryAddress);
        address cdpManager = addressRegistry.DssCdpManagerAddress();
        address collateralCTokenAddress = imvCalldata.collateralCTokenAddress;

        // Collateral in 18 decimal places
        uint collateral18 = getVaultCollateral(cdpManager, imvCalldata.cdpId);

        // Joins the ETH/GEM/DAI market in compound if they haven't already
        address[] memory enterMarketsCToken = new address[](2);
        enterMarketsCToken[0] = collateralCTokenAddress;
        enterMarketsCToken[1] = addressRegistry.CDaiAddress();

        uint[] memory enterMarketErrors = IComptroller(
            addressRegistry.CompoundComptrollerAddress()
        ).enterMarkets(enterMarketsCToken);

        require(enterMarketErrors[0] == 0, "mkr-enter-gem-failed");
        require(enterMarketErrors[1] == 0, "mkr-enter-dai-failed");

        if (ManagerLike(cdpManager).ilks(imvCalldata.cdpId) == bytes32("ETH-A")) {
            wipeAllAndFreeETH(
                cdpManager,
                addressRegistry.EthJoinAddress(),
                addressRegistry.DaiJoinAddress(),
                imvCalldata.cdpId,
                collateral18
            );

            // Supply ETH and Borrow DAI (Compound)
            ICEther(addressRegistry.CEtherAddress()).mint.value(collateral18)();
            require(
                ICToken(addressRegistry.CDaiAddress()).borrow(totalDebt) == 0,
                "dai-borrow-fail"
            );
        } else {
            // Free GEM
            wipeAllAndFreeGem(
                cdpManager,
                imvCalldata.collateralJoinAddress,
                addressRegistry.DaiJoinAddress(),
                imvCalldata.cdpId,
                _convert18ToGemUnits(
                    imvCalldata.collateralJoinAddress,
                    collateral18
                )
            );

            // Convert collateral to relevant decimal places
            uint collateralFixedDec = _convert18ToDecimal(
                collateral18, imvCalldata.collateralDecimals
            );

            // Approve CToken Collateral underlying to enable call transferFrom
            IERC20(ICToken(collateralCTokenAddress).underlying())
                .approve(collateralCTokenAddress, collateralFixedDec);

            // Supply GEM and Borrow DAI (Compound)
            require(
                ICToken(collateralCTokenAddress).mint(
                    collateralFixedDec
                ) == 0,
                "gem-supply-fail"
            );
            require(
                ICToken(addressRegistry.CDaiAddress()).borrow(totalDebt) == 0,
                "dai-borrow-fail"
            );
        }
    }

    /* 
    Main entry point maker vault into Dedge

    @params:
        dacProxyAddress: User's proxy address
        addressRegistryAddress: AddressRegistry's Address
        cdpId: User's cdpId
        executeOperationCalldataParams:
            Abi-encoded `data` used by User's proxy's `execute(address, <data>)` function
            Used to delegatecall to another contract (i.e. this contract) in the context
            of the proxy. This allows for better flexibility and decoupling of logic from
            user's proxy. In this specific case, it is expecting the results from: (from JS)

            ```
                const IDedgeMakerManager = ethers.utils.Interface(DedgeMakerManager.abi)

                const executeOperationCalldataParams = IDedgeMakerManager
                    .functions
                    .importMakerVaultPostLoan
                    .encode([ <parameters> ])
            ```
    */
    function importMakerVault(
        address dedgeMakerManagerAddress,
        address payable dacProxyAddress,
        address addressRegistryAddress,
        uint cdpId,
        bytes calldata executeOperationCalldataParams
    ) external {
        // Get Address Registry
        AddressRegistry addressRegistry = AddressRegistry(addressRegistryAddress);

        // Get cdpManager and proxy's guard address
        address cdpManager = addressRegistry.DssCdpManagerAddress();

        // Get Debt
        uint daiDebt = getVaultDebt(cdpManager, cdpId);

        // Injects the target address into calldataParams
        // so user proxy knows which address it'll be calling `calldataParams` on
        bytes memory addressAndExecuteOperationCalldataParams = abi.encodePacked(
            abi.encode(dedgeMakerManagerAddress),
            executeOperationCalldataParams
        );
        
        // Get lending pool address
        ILendingPool lendingPool = ILendingPool(
            ILendingPoolAddressesProvider(
                addressRegistry.AaveLendingPoolAddressProviderAddress()
            ).getLendingPool()
        );

        cdpAllow(addressRegistry.DssCdpManagerAddress(), cdpId, dedgeMakerManagerAddress, 1);
        _proxyGuardPermit(dacProxyAddress, address(lendingPool));

        lendingPool.flashLoan(
            dacProxyAddress,
            addressRegistry.DaiAddress(),
            daiDebt,
            addressAndExecuteOperationCalldataParams
        );

        _proxyGuardForbid(dacProxyAddress, address(lendingPool));
        cdpAllow(addressRegistry.DssCdpManagerAddress(), cdpId, dedgeMakerManagerAddress, 0);
    }
}
