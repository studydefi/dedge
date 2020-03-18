// This file contains the core logic for swapping debt on compound finance

pragma solidity 0.5.16;

import "../../lib/aave/FlashLoanReceiverBase.sol";

import "../../lib/compound/CompoundBase.sol";

import "../../lib/uniswap/UniswapBase.sol";

import "../../interfaces/aave/ILendingPoolAddressesProvider.sol";
import "../../interfaces/aave/ILendingPool.sol";
import "../../interfaces/aave/ILendingPoolParametersProvider.sol";

import "../../interfaces/compound/ICompoundPriceOracle.sol";
import "../../interfaces/compound/IComptroller.sol";
import "../../interfaces/compound/ICEther.sol";
import "../../interfaces/compound/ICToken.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DedgeCompoundManager is FlashLoanReceiverBase, CompoundBase, UniswapBase {
    address constant AaveLendingPoolAddressProviderAddress = 0x24a42fD28C976A61Df5D00D0599C34c4f90748c8;
    address constant AaveEthAddress = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    address constant CompoundPriceOracleAddress = 0x1D8aEdc9E924730DD3f9641CDb4D1B92B848b4bd;
    address constant CompoundComptrollerAddress = 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B;
    address constant CEtherAddress = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;

    address constant DaiAddress = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    // TODO: Change this protocol payout fee
    address payable constant protocolFeePayoutAddress = 0x56D5e01D5D2F853aA8f4ac5d2FfB4cBBCa9e2b0f;

    function () external payable {}

    constructor() public {}

    // -- Compound Manager Section

    // Calculates the number of new tokens to borrow to
    // that is equal in value to the delta between current and target debt value
    function calcNewTokensToBorrow(
        address userDedgeProxy,
        address oldCToken,
        address newCToken,
        uint oldDebtTargetAmount
    ) public view returns (uint) {
        // Get amount of borrowed tokens
        uint oldBorrowedTokensNo = ICToken(oldCToken).borrowBalanceStored(userDedgeProxy);

        // Difference between current debt and target debt
        uint deltaTargetDebtThreshold = oldBorrowedTokensNo.sub(oldDebtTargetAmount);

        require(newCToken != oldCToken, "cmpnd-mgr-debt-address-same");
        require(oldDebtTargetAmount < oldBorrowedTokensNo, "cmpnd-mgr-cannot-increase-debt");

        address oldToken;
        address newToken;

        // If old debt is ether
        if (oldCToken == CEtherAddress) {
            newToken = ICToken(newCToken).underlying();
            return getEthToTokenInputPriceFromUniswap(newToken, deltaTargetDebtThreshold);
        }
        // If new debt is ether
        else if (newCToken == CEtherAddress) {
            oldToken = ICToken(oldCToken).underlying();
            return getTokenToEthInputPriceFromUniswap(oldToken, deltaTargetDebtThreshold);
        }

        oldToken = ICToken(oldCToken).underlying();
        newToken = ICToken(newCToken).underlying();

        // Amount of newTokens that is equilavent to deltaTargetDebtThreshold
        uint deltaEthTargetDebt = getTokenToEthInputPriceFromUniswap(oldToken, deltaTargetDebtThreshold);
        return getEthToTokenInputPriceFromUniswap(newToken, deltaEthTargetDebt);
    }

    // Calculates the maximum number of `CToken` user can borrow
    function maxBorrowTokensNo(
        address userDedgeProxy,
        address CToken
    ) public view returns (uint tokenCanBorrowPerTurn) {
        // Calculate max borrowing amount for newCTokenAddress
        // https://compound.finance/developers/comptroller#account-liquidity
        // max borrow tokens = liquidity / price per token
        (uint error, uint liquidity, uint shortfall) = IComptroller(CompoundComptrollerAddress)
            .getAccountLiquidity(userDedgeProxy);

        require(error == 0, "cmpnd-mgr-get-acc-liquidity-err");
        require(shortfall == 0, "cmpnd-mgr-account-underwater");
        require(liquidity > 0, "cmpnd-mgr-excess-collateral");

        uint tokenOraclePrice = ICompoundPriceOracle(CompoundPriceOracleAddress).getUnderlyingPrice(CToken);
        // Want the result to be in Wei
        tokenCanBorrowPerTurn = liquidity.mul(1 ether).div(tokenOraclePrice);
    }

    // Keeps calling `swapDebt`
    // until oldCToken's debt reaches ~oldTokenTargetDebt
    function swapDebtUntil(
        address dedgeUserProxy,              // Dedge user proxy
        address payable compoundManager,     // Compound manager contract
        address oldCToken,                   // Old debt address
        uint oldTokenTargetDebt,             // Target debt to achieve at CToken(oldCToken).underlying()
        address newCToken                    // New debt address
    ) public payable {
        // Ideally we do this in 1 tx
        uint idealNewTokenBorrowAmount = calcNewTokensToBorrow(
            dedgeUserProxy,
            oldCToken,
            newCToken,
            oldTokenTargetDebt
        );

        // Only use 99% of the tokens we can obtain as
        // there is a chance it won't go through due to slippage
        uint maxNewTokenToBeBorrowed = maxBorrowTokensNo(
            dedgeUserProxy,
            newCToken
        ).mul(99).div(100);

        // If we can swap out the debt in 1 tx, do it
        if (idealNewTokenBorrowAmount < maxNewTokenToBeBorrowed) {
            swapDebt(
                dedgeUserProxy,
                compoundManager,
                oldCToken,
                newCToken,
                idealNewTokenBorrowAmount
            );
        }

        // Else do it multiple times until it reaches target value (approx)
        else {
            while (idealNewTokenBorrowAmount > maxNewTokenToBeBorrowed) {
                swapDebt(
                    dedgeUserProxy,
                    compoundManager,
                    oldCToken,
                    newCToken,
                    maxNewTokenToBeBorrowed
                );

                idealNewTokenBorrowAmount = calcNewTokensToBorrow(
                    dedgeUserProxy,
                    oldCToken,
                    newCToken,
                    oldTokenTargetDebt
                );

                // Recalculate max tokens that can be borrowed
                maxNewTokenToBeBorrowed = maxBorrowTokensNo(
                    dedgeUserProxy,
                    newCToken
                ).mul(99).div(100);
            }

            swapDebt(
                dedgeUserProxy,
                compoundManager,
                oldCToken,
                newCToken,
                idealNewTokenBorrowAmount
            );
        }
    }

    // Swapping debt On Compound Finance
    // Trys to swap debt on compound where
    // the new debt token is the underlying of newCTokenAddress
    // with newDebtAmount
    function swapDebt(
        address dedgeUserProxy,
        address payable compoundManager,    // Compound manager contract
        address oldCTokenAddress,   // Old debt address
        address newCTokenAddress,   // New debt address (must be a cToken address)
        uint newCTokenAdditionalDebtAmount   // Debt Amount to go into (NOT target debtAmount)
    ) public payable {
        // -- Calling from ds-proxy context (a.k.a) msg.sender is ds-proxy
        // 1. Borrow out new tokens
        // 2. Converts token to ETH
        // 3. Sends ETH to contract address
        // 4. Call flashloan via ETH pool
        // -- Calling from contract's context (a.k.a) msg.sender is contract
        // 5. Contract has ETH funds send from user
        // 6. Contract also has ETH funds from flashloan
        // 7. Exchange flashloan ETH to OLD TOKEN
        // 8. RepayBorrowBehalf OLD TOKEN (from 7.) to ds-proxy compound loan
        // 9. RepayFlashLoan from 5.
        // 10. Repay flashloans
        require(newCTokenAddress != oldCTokenAddress, "cmpnd-mgr-old-new-debt-same");

        // 1. Borrow out new tokens
        borrow(newCTokenAddress, newCTokenAdditionalDebtAmount);

        // 2. Converts tokens to DAI
        uint ethDebtAmount;

        // If we loaned ether, we can just convert it to DAI
        if (newCTokenAddress == CEtherAddress) {
            ethDebtAmount = newCTokenAdditionalDebtAmount;
        } else {
            address newCTokenUnderlying = ICToken(newCTokenAddress).underlying();
            ethDebtAmount = _sellTokensForEthFromUniswap(newCTokenUnderlying, newCTokenAdditionalDebtAmount);
        }

        // Send the ETH to Compound Manager address
        compoundManager.transfer(ethDebtAmount);

        // Calculate fees beforehand and subtract them
        // Line 5838, https://etherscan.io/address/0x24a42fD28C976A61Df5D00D0599C34c4f90748c8#code
        // Aave DAI lending pool
        bytes memory data = abi.encode(dedgeUserProxy, oldCTokenAddress);

        // Flashloan ETH
        ILendingPool lendingPool = ILendingPool(ILendingPoolAddressesProvider(AaveLendingPoolAddressProviderAddress).getLendingPool());
        lendingPool.flashLoan(compoundManager, AaveEthAddress, ethDebtAmount, data);

        // `executeOperation` will proceed from here
    }

    // Callback function called by Aave's lendingPool.flashLoan() function
    // Note: data should have the following
    //     [
    //         address userDedgeProxy,
    //         address oldCTokenAddress
    //     ]
    function executeOperation(
        address reserve,
        uint256 loanedAmount,
        uint256 fee,
        bytes calldata data
    ) external {
        // -- Calling from contract's context (a.k.a) msg.sender is contract
        // 5. Contract has ETH funds send from user
        // 6. Contract also has ETH funds from flashloan
        // 7. Exchange flashloan ETH to OLD TOKEN
        // 8. RepayBorrowBehalf OLD TOKEN (from 7.) to ds-proxy compound loan
        // 9. RepayFlashLoan from 5.
        // 10. Repay flashloans
        require(loanedAmount <= getBalanceInternal(address(this), reserve), "Invalid balance, was the flashLoan successful?");

        // Vars
        (
            address userDedgeProxy,
            address oldCTokenAddress
        ) = abi.decode(
            data,
            (address, address)
        );

        // Fee is for for aave and the protocol maker
        uint protocolFee = fee.div(2);
        uint flashloanedEthAmount = loanedAmount.sub(fee).sub(protocolFee);

        // Exchange flashloanedDaiAmount to repay old debt on behalf of user's dedge proxy
        if (oldCTokenAddress == CEtherAddress) {
            // If its ether we don't need to do anything
            ICEther(oldCTokenAddress).repayBorrowBehalf.value(flashloanedEthAmount)(userDedgeProxy);
        } else {
            // Otherwise we need to swap from ETH to old token (not cToken)
            address oldTokenAddress = ICToken(oldCTokenAddress).underlying();

            // Calculate how much old tokens we can get with our ETH
            uint oldTokenAmount = _buyTokensWithEthFromUniswap(oldTokenAddress, flashloanedEthAmount);

            // Approve contract to access funds
            require(IERC20(oldTokenAddress).approve(oldCTokenAddress, oldTokenAmount), "cmpnd-mgr-approve-repay-failed");

            // Repay on behalf
            require(ICToken(oldCTokenAddress).repayBorrowBehalf(userDedgeProxy, oldTokenAmount) == 0, "cmpnd-mgr-ctoken-repay-failed");
        }

        // XFer fund back to pool
        transferFundsBackToPoolInternal(reserve, loanedAmount.add(fee));

        // Payout fee
        // TODO: Change this address
        protocolFeePayoutAddress.call.value(protocolFee)("");
    }
}
