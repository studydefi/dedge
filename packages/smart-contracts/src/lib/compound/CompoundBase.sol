/*  Mostly functions from https://compound.finance/developers/ctokens
    and https://compound.finance/developers/comptroller
*/
pragma solidity 0.5.16;

import "../../interfaces/compound/IComptroller.sol";
import "../../interfaces/compound/ICEther.sol";
import "../../interfaces/compound/ICToken.sol";

import "../../interfaces/IERC20.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";

contract CompoundBase {
    using SafeMath for uint256;

    address constant CompoundComptrollerAddress = 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B;
    address constant CEtherAddress = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "safe-math-sub-failed");
        uint256 c = a - b;

        return c;
    }

    function getBorrowBalanceUnderlying(
        address cToken,
        address owner
    )
        public
        view
        returns (uint256)
    {
        (
            uint256 err,
            uint256 cTokenBalance,
            uint256 borrowBalance,
            uint256 exchangeRateMantissa
        ) = ICToken(cToken).getAccountSnapshot(owner);

        // Source: balanceOfUnderlying from any ctoken
        return cTokenBalance.mul(exchangeRateMantissa).div(1e18);
    }

    function _transferFromUnderlying(
        address sender,
        address recipient,
        address cToken,
        uint256 amount
    ) internal {
        address underlying = ICToken(cToken).underlying();
        require(
            IERC20(underlying).transferFrom(sender, recipient, amount),
            "cmpnd-mgr-transferFrom-underlying-failed"
        );
    }

    function _transferUnderlying(
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
                "cmpnd-mgr-transfer-underlying-failed"
            );
        }
    }

    function _transfer(address token, address recipient, uint256 amount)
        internal
    {
        require(
            IERC20(token).transfer(recipient, amount),
            "cmpnd-mgr-transfer-failed"
        );
    }

    function enterMarkets(
        address[] memory cTokens // Address of the Compound derivation token (e.g. cDAI)
    ) public {
        // Enter the compound markets for all the specified tokens
        uint256[] memory errors = IComptroller(CompoundComptrollerAddress)
            .enterMarkets(cTokens);

        for (uint256 i = 0; i < errors.length; i++) {
            require(errors[i] == 0, "cmpnd-mgr-enter-markets-failed");
        }
    }

    function approveCToken(address cToken, uint256 amount) public {
        // Approves CToken contract to call `transferFrom`
        address underlying = ICToken(cToken).underlying();
        require(
            IERC20(underlying).approve(cToken, amount) == true,
            "cmpnd-mgr-ctoken-approved-failed"
        );
    }

    function approveCTokens(
        address[] memory cTokens // Tokens to approve
    ) public {
        for (uint256 i = 0; i < cTokens.length; i++) {
            // Don't need to approve ICEther
            if (cTokens[i] != CEtherAddress) {
                approveCToken(cTokens[i], uint256(-1));
            }
        }
    }

    function enterMarketsAndApproveCTokens(address[] memory cTokens) public {
        enterMarkets(cTokens);
        approveCTokens(cTokens);
    }

    function supplyETH() public payable {
        ICEther(CEtherAddress).mint.value(msg.value)();
    }

    function supply(address cToken, uint256 amount) public payable {
        if (cToken == CEtherAddress) {
            ICEther(CEtherAddress).mint.value(amount)();
        } else {
            // Approves CToken contract to call `transferFrom`
            approveCToken(cToken, amount);

            require(
                ICToken(cToken).mint(amount) == 0,
                "cmpnd-mgr-ctoken-supply-failed"
            );
        }
    }

    function borrow(address cToken, uint256 borrowAmount) public {
        require(
            ICToken(cToken).borrow(borrowAmount) == 0,
            "cmpnd-mgr-ctoken-borrow-failed"
        );
    }

    function supplyAndBorrow(
        address supplyCToken,
        uint256 supplyAmount,
        address borrowCToken,
        uint256 borrowAmount
    ) public payable {
        supply(supplyCToken, supplyAmount);
        borrow(borrowCToken, borrowAmount);
    }

    function supplyETHAndBorrow(address cToken, uint256 borrowAmount)
        public
        payable
    {
        // Supply some Ether
        supplyETH();

        // Borrow some CTokens
        borrow(cToken, borrowAmount);
    }

    function repayBorrow(address cToken, uint256 amount) public payable {
        if (cToken == CEtherAddress) {
            ICEther(cToken).repayBorrow.value(amount)();
        } else {
            approveCToken(cToken, amount);
            require(
                ICToken(cToken).repayBorrow(amount) == 0,
                "cmpnd-mgr-ctoken-repay-failed"
            );
        }
    }

    function repayBorrowBehalf(
        address recipient,
        address cToken,
        uint256 amount
    ) public payable {
        if (cToken == CEtherAddress) {
            ICEther(cToken).repayBorrowBehalf.value(amount)(recipient);
        } else {
            approveCToken(cToken, amount);
            require(
                ICToken(cToken).repayBorrowBehalf(recipient, amount) == 0,
                "cmpnd-mgr-ctoken-repaybehalf-failed"
            );
        }
    }

    function redeem(address cToken, uint256 redeemTokens) public payable {
        require(
            ICToken(cToken).redeem(redeemTokens) == 0,
            "cmpnd-mgr-ctoken-redeem-failed"
        );
    }

    function redeemUnderlying(address cToken, uint256 redeemTokens)
        public
        payable
    {
        require(
            ICToken(cToken).redeemUnderlying(redeemTokens) == 0,
            "cmpnd-mgr-ctoken-redeem-underlying-failed"
        );
    }

    // -- Helper functions so proxy doesn't hold any funds, all funds borrowed
    // or redeemed gets sent to user
    // User needs to `approve(spender, amount)` before through proxy functions work

    function supplyThroughProxy(address cToken, uint256 amount) public payable {
        if (cToken != CEtherAddress) {
            _transferFromUnderlying(msg.sender, address(this), cToken, amount);
        }
        supply(cToken, amount);
    }

    function repayBorrowThroughProxy(address cToken, uint256 amount)
        public
        payable
    {
        if (cToken != CEtherAddress) {
            _transferFromUnderlying(msg.sender, address(this), cToken, amount);
        }
        repayBorrow(cToken, amount);
    }

    function repayBorrowBehalfThroughProxy(
        address recipient,
        address cToken,
        uint256 amount
    ) public payable {
        if (cToken != CEtherAddress) {
            _transferFromUnderlying(msg.sender, address(this), cToken, amount);
        }
        repayBorrowBehalf(recipient, cToken, amount);
    }

    function borrowThroughProxy(address cToken, uint256 amount) public {
        borrow(cToken, amount);
        _transferUnderlying(cToken, msg.sender, amount);
    }

    function redeemThroughProxy(address cToken, uint256 amount) public payable {
        redeem(cToken, amount);
        _transferUnderlying(cToken, msg.sender, amount);
    }

    function redeemUnderlyingThroughProxy(address cToken, uint256 amount)
        public
        payable
    {
        redeemUnderlying(cToken, amount);
        _transferUnderlying(cToken, msg.sender, amount);
    }
}
