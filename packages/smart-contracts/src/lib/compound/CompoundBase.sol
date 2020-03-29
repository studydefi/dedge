/*  Mostly functions from https://compound.finance/developers/ctokens
    and https://compound.finance/developers/comptroller
*/
pragma solidity 0.5.16;

import "../../interfaces/compound/IComptroller.sol";
import "../../interfaces/compound/ICEther.sol";
import "../../interfaces/compound/ICToken.sol";

import "../../interfaces/IERC20.sol";

contract CompoundBase {
    address constant CompoundComptrollerAddress = 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B;
    address constant CEtherAddress = 0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5;

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "safe-math-sub-failed");
        uint256 c = a - b;

        return c;
    }

    function _transferFrom(
        address sender,
        address recipient,
        address cToken,
        uint amount
    ) internal {
        address underlying = ICToken(cToken).underlying();
        require(
            IERC20(underlying).transferFrom(sender, recipient, amount),
            "cmpnd-mgr-transfer-from-failed"
        );
    }

    function _transfer(
        address cToken,
        address recipient,
        uint amount
    ) internal {
        if (cToken == CEtherAddress) {
            recipient.call.value(amount)("");
        } else {
            require(
                IERC20(ICToken(cToken).underlying()).transfer(recipient, amount),
                "cmpnd-mgr-transfer-failed"
            );
        }
    }

    function enterMarkets(
        address[] memory cTokens   // Address of the Compound derivation token (e.g. cDAI)
    ) public {
        // Enter the compound markets for all the specified tokens
        uint[] memory errors = IComptroller(CompoundComptrollerAddress).enterMarkets(cTokens);

        for (uint i = 0; i < errors.length; i++) {
            require(errors[i] == 0, "cmpnd-mgr-enter-markets-failed");
        }
    }

    function approveCToken(
        address cToken,
        uint amount
    ) public {
        // Approves CToken contract to call `transferFrom`
        address underlying = ICToken(cToken).underlying();
        require(
            IERC20(underlying).approve(cToken, amount) == true,
            "cmpnd-mgr-ctoken-approved-failed"
        );
    }

    function approveCTokens(
        address[] memory cTokens    // Tokens to approve
    ) public {
        for (uint i = 0; i < cTokens.length; i++) {
            // Don't need to approve ICEther
            if (cTokens[i] != CEtherAddress) {
                approveCToken(cTokens[i], uint(-1));
            }
        }
    }

    function enterMarketsAndApproveCTokens(
        address[] memory cTokens
    ) public {
        enterMarkets(cTokens);
        approveCTokens(cTokens);
    }

    function supplyETH() public payable {
        ICEther(CEtherAddress).mint.value(msg.value)();
    }

    function supply(address cToken, uint amount) public payable {
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

    function borrow(address cToken, uint borrowAmount) public {
        require(ICToken(cToken).borrow(borrowAmount) == 0, "cmpnd-mgr-ctoken-borrow-failed");
    }

    function supplyAndBorrow(
        address supplyCToken,
        uint supplyAmount,
        address borrowCToken,
        uint borrowAmount
    ) public payable {
        supply(supplyCToken, supplyAmount);
        borrow(borrowCToken, borrowAmount);
    }

    function supplyETHAndBorrow(
        address cToken,
        uint borrowAmount
    ) public payable {
        // Supply some Ether
        supplyETH();

        // Borrow some CTokens
        borrow(cToken, borrowAmount);
    }

    function repayBorrow(address cToken, uint amount) public payable {
        if (cToken == CEtherAddress) {
            ICEther(cToken).repayBorrow.value(amount)();
        } else {
            approveCToken(cToken, amount);
            require(ICToken(cToken).repayBorrow(amount) == 0, "cmpnd-mgr-ctoken-repay-failed");
        }
    }

    function repayBorrowBehalf(address recipient, address cToken, uint amount) public payable {
        if (cToken == CEtherAddress) {
            ICEther(cToken).repayBorrowBehalf.value(amount)(recipient);
        } else {
            approveCToken(cToken, amount);
            require(ICToken(cToken).repayBorrowBehalf(recipient, amount) == 0, "cmpnd-mgr-ctoken-repaybehalf-failed");
        }
    }

    function redeem(address cToken, uint redeemTokens) public payable {
        require(ICToken(cToken).redeem(redeemTokens) == 0, "cmpnd-mgr-ctoken-redeem-failed");
    }

    function redeemUnderlying(address cToken, uint redeemTokens) public payable {
        require(ICToken(cToken).redeemUnderlying(redeemTokens) == 0, "cmpnd-mgr-ctoken-redeem-underlying-failed");
    }

    // -- Helper functions so proxy doesn't hold any funds, all funds borrowed
    // or redeemed gets sent to user
    // User needs to `approve(spender, amount)` before through proxy functions work

    function supplyThroughProxy(
        address cToken,
        uint amount
    ) public payable {
        // Gets initial CToken balance
        uint initialBal = ICToken(cToken).balanceOf(address(this));

        // If cToken isn't an ether address, we need to transferFrom
        // If this fails, users needs to execute `approve(spender, amount)` to this proxy
        if (cToken != CEtherAddress) {
            _transferFrom(msg.sender, address(this), cToken, amount);
        }
        supply(cToken, amount);

        // Sends CToken back to user
        uint finalBal = ICToken(cToken).balanceOf(address(this));

        _transfer(cToken, msg.sender, sub(finalBal, initialBal));
    }

    function repayBorrowThroughProxy(address cToken, uint amount) public payable {
        if (cToken != CEtherAddress) {
            _transferFrom(msg.sender, address(this), cToken, amount);
        }
        repayBorrow(cToken, amount);
    }

    function repayBorrowBehalfThroughProxy(address recipient, address cToken, uint amount) public payable {
        if (cToken != CEtherAddress) {
            _transferFrom(msg.sender, address(this), cToken, amount);
        }
        repayBorrowBehalf(recipient, cToken, amount);
    }

    function borrowThroughProxy(address cToken, uint amount) public {
        borrow(cToken, amount);
        _transfer(cToken, msg.sender, amount);
    }

    function redeemThroughProxy(
        address cToken,
        uint amount
    ) public payable {
        redeem(cToken, amount);
        _transfer(cToken, msg.sender, amount);
    }

    function redeemUnderlyingThroughProxy(
        address cToken,
        uint amount
    ) public payable {
        redeemUnderlying(cToken, amount);
        _transfer(cToken, msg.sender, amount);
    }
}
