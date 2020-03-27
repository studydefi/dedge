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

    function enterMarkets(
        address[] memory cTokens   // Address of the Compound derivation token (e.g. cDAI)
    ) public {
        // Enter the compound markets for all the specified tokens
        uint[] memory errors = IComptroller(CompoundComptrollerAddress).enterMarkets(cTokens);

        for (uint i = 0; i < errors.length; i++) {
            require(errors[i] == 0, "cmpnd-mgr-enter-markets-failed");
        }
    }

    function approveCTokens(
        address[] memory cTokens    // Tokens to approve
    ) public {
        for (uint i = 0; i < cTokens.length; i++) {
            // Don't need to approve ICEther
            if (cTokens[i] != CEtherAddress) {
                address underlying = ICToken(cTokens[i]).underlying();

                // Approves Compound CTokens
                require(IERC20(underlying).approve(cTokens[i], uint256(-1)) == true, "cmpnd-mgr-ctoken-approved-failed");
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
            ICEther(cToken).repayBorrow.value(msg.value)();
        } else {
            require(ICToken(cToken).repayBorrow(amount) == 0, "cmpnd-mgr-ctoken-repay-failed");
        }
    }

    function repayBorrowBehalf(address recipient, address cToken, uint amount) public payable {
        if (cToken == CEtherAddress) {
            ICEther(cToken).repayBorrowBehalf.value(msg.value)(recipient);
        } else {
            require(ICToken(cToken).repayBorrowBehalf(recipient, amount) == 0, "cmpnd-mgr-ctoken-repaybehalf-failed");
        }
    }

    function redeem(address cToken, uint redeemTokens) public payable {
        require(ICToken(cToken).redeem(redeemTokens) == 0, "cmpnd-mgr-ctoken-redeem-failed");
    }

    function redeemUnderlying(address cToken, uint redeemTokens) public payable {
        require(ICToken(cToken).redeemUnderlying(redeemTokens) == 0, "cmpnd-mgr-ctoken-redeem-underlying-failed");
    }
}
