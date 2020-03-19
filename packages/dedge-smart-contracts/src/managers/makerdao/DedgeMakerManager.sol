// Largely referenced from https://github.com/mrdavey/CollateralSwapFrontend

pragma solidity 0.5.16;

import "../../lib/aave/FlashLoanReceiverBase.sol";

import "../../lib/makerdao/MakerVaultBase.sol";

import "../../lib/uniswap/UniswapBase.sol";

import "../../interfaces/aave/ILendingPoolAddressesProvider.sol";
import "../../interfaces/aave/ILendingPool.sol";

import "../../interfaces/uniswap/IUniswapExchange.sol";
import "../../interfaces/uniswap/IUniswapFactory.sol";

import "../../interfaces/IERC20.sol";


contract DedgeMakerManager is MakerVaultBase, UniswapBase, FlashLoanReceiverBase {
    address constant AaveLendingPoolAddressProviderAddress = 0x24a42fD28C976A61Df5D00D0599C34c4f90748c8;
    address constant AaveEthAddress = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    address constant UniswapFactoryAddress = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;

    address constant DaiAddress = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant BatAddress = 0x0D8775F648430679A709E98d2b0Cb6250d2887EF;
    address constant UsdcAddress = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    // https://changelog.makerdao.com/
    // https://changelog.makerdao.com/releases/mainnet/1.0.4/contracts.json
    address constant EthJoinAddress = 0x2F0b23f53734252Bda2277357e97e1517d6B042A;
    address constant UsdcJoinAddress = 0xA191e578a6736167326d05c119CE0c90849E84B7;
    address constant BatJoinAddress = 0x3D0B1912B66114d4096F48A8CEe3A56C231772cA;
    address constant DaiJoinAddress = 0x9759A6Ac90977b93B58547b4A71c78317f391A28;
    address constant JugAddress = 0x19c0976f590D67707E62397C87829d896Dc0f1F1;
    address constant DssCdpManagerAddress = 0x5ef30b9986345249bc32d8928B7ee64DE9435E39;

    function () external payable {}

    constructor () public {}

    // Helper functions
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

    function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }


    // Callback function called by Aave's lendingPool.flashLoan() function
    function executeOperation(
        address reserve,
        uint256 loanedAmount,
        uint256 fee,
        bytes calldata data
    ) external {
        require(loanedAmount <= getBalanceInternal(address(this), reserve), "Invalid balance, was the flashLoan successful?");

        // Pay back owed dai
        uint daiDebt = loanedAmount.add(fee);

        // (account for 2.5% slippage on avg)
        uint uniswapDaiInput = daiDebt.mul(1025).div(1000);

        // Extract data params
        (
            address payable usrDedgeProxy,
            address makerMigrateManager,
            address collateralAddress,
            address collateralJoinAddress,
            uint cdpId
        ) = abi.decode(data, (
            address,
            address,
            address,
            address,
            uint
        ));

        if (collateralAddress == AaveEthAddress) {
            // Get back collateralized ETH
            uint collateralAmount = _wipeAllAndFreeETH(DssCdpManagerAddress, collateralJoinAddress, DaiJoinAddress, cdpId);
            // Calculate amount of collateral (ETH) we need to sell to pay back DAI
            uint collateralSellAmount = getTokenToEthInputPriceFromUniswap(DaiAddress, uniswapDaiInput);
            // Sell ETH, buy DAI to repay Aave
            _buyTokensWithEthFromUniswap(DaiAddress, collateralSellAmount, daiDebt);
            // Transfer remaining ETH back to user
            (bool success, ) = usrDedgeProxy.call.value(collateralAmount.sub(collateralSellAmount))("");
            require(success, "mkr-mgr-eth-xfer-failed");
        } else {
            // Get back collateralized asset
            _wipeAllAndFreeGem(DssCdpManagerAddress, collateralJoinAddress, DaiJoinAddress, cdpId);
            // Calculate amount of collateral (ERC20) we need to sell to pay back DAI
            uint collateralSellAmount = getTokenToTokenPriceFromUniswap(DaiAddress, collateralAddress, uniswapDaiInput);
            // Sell collateral token to get ETH
            uint ethAmount = _sellTokensForEthFromUniswap(collateralAddress, collateralSellAmount);
            // Sell ETH to get DAI
            _buyTokensWithEthFromUniswap(DaiAddress, ethAmount, daiDebt);
            // Transfer remaining ERC20 token back to user
            require(
                IERC20(collateralAddress).transfer(
                    usrDedgeProxy,
                    IERC20(collateralAddress).balanceOf(makerMigrateManager)
                ),
                "mkr-mgr-erc20-xfer-failed"
            );
        }

        // Return funds
        transferFundsBackToPoolInternal(reserve, daiDebt);

        // Transfer any excess DAI to user
        uint daiLeftoverBalance = IERC20(DaiAddress).balanceOf(makerMigrateManager);
        if (daiLeftoverBalance > 0) {
            require(
                IERC20(DaiAddress).transfer(usrDedgeProxy, daiLeftoverBalance),
                "mkr-mgr-dai-xfer-failed"
            );
        }

        // Contract has no more access to CDP
        _cdpAllow(DssCdpManagerAddress, cdpId, makerMigrateManager, 0);
    }

    // Imports maker vault into Dedge
    function importMakerVault(
        address usrDedgeProxy,
        address makerMigrateManager,
        address collateralAddress,
        address collateralJoinAddress,
        uint cdpId
    ) public payable {
        // Allows contract to do stuff with the CDP
        _cdpAllow(DssCdpManagerAddress, cdpId, makerMigrateManager, 1);

        // Get Debt
        uint daiDebt = getVaultDebt(DssCdpManagerAddress, cdpId);

        // 1. Flashloan DAI
        bytes memory data = abi.encode(usrDedgeProxy, makerMigrateManager, collateralAddress, collateralJoinAddress, cdpId);
        ILendingPool lendingPool = ILendingPool(ILendingPoolAddressesProvider(AaveLendingPoolAddressProviderAddress).getLendingPool());
        lendingPool.flashLoan(makerMigrateManager, DaiAddress, daiDebt, data);

        // Flashloan should now call the `executeOperation` contract
        // UserDedgeProxy should now have their original collateral _and_ their excess DAI (if any)
    }
}
