// Largely referenced from https://github.com/mrdavey/CollateralSwapFrontend

pragma solidity 0.5.16;

import "../../interfaces/IERC20.sol";

contract GemLike {
    function approve(address, uint) public;
    function transfer(address, uint) public;
    function transferFrom(address, address, uint) public;
    function deposit() public payable;
    function withdraw(uint) public;
}

contract ManagerLike {
    function cdpCan(address, uint, address) public view returns (uint);
    function ilks(uint) public view returns (bytes32);
    function owns(uint) public view returns (address);
    function urns(uint) public view returns (address);
    function vat() public view returns (address);
    function open(bytes32, address) public returns (uint);
    function give(uint, address) public;
    function cdpAllow(uint, address, uint) public;
    function urnAllow(address, uint) public;
    function frob(uint, int, int) public;
    function flux(uint, address, uint) public;
    function move(uint, address, uint) public;
    function exit(address, uint, address, uint) public;
    function quit(uint, address) public;
    function enter(address, uint) public;
    function shift(uint, uint) public;
}

contract VatLike {
    function can(address, address) public view returns (uint);
    function ilks(bytes32) public view returns (uint, uint, uint, uint, uint);
    function dai(address) public view returns (uint);
    function urns(bytes32, address) public view returns (uint, uint);
    function frob(bytes32, address, address, address, int, int) public;
    function hope(address) public;
    function move(address, address, uint) public;
}

contract GemJoinLike {
    function dec() public returns (uint);
    function gem() public returns (GemLike);
    function join(address, uint) public payable;
    function exit(address, uint) public;
}

contract GNTJoinLike {
    function bags(address) public view returns (address);
    function make(address) public returns (address);
}

contract DaiJoinLike {
    function vat() public returns (VatLike);
    function dai() public returns (GemLike);
    function join(address, uint) public payable;
    function exit(address, uint) public;
}

contract JugLike {
    function drip(bytes32) public returns (uint);
}

contract MakerVaultBase {
    address constant AaveLendingPoolAddressProviderAddress = 0x24a42fD28C976A61Df5D00D0599C34c4f90748c8;
    address constant AaveEthAddress = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    address constant DaiAddress = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant BatAddress = 0x0D8775F648430679A709E98d2b0Cb6250d2887EF;

    address constant EthJoinAddress = 0x2F0b23f53734252Bda2277357e97e1517d6B042A;
    address constant BatJoinAddress = 0x3D0B1912B66114d4096F48A8CEe3A56C231772cA;
    address constant DaiJoinAddress = 0x9759A6Ac90977b93B58547b4A71c78317f391A28;
    address constant JugAddress = 0x19c0976f590D67707E62397C87829d896Dc0f1F1;
    address constant DssCdpManagerAddress = 0x5ef30b9986345249bc32d8928B7ee64DE9435E39;

    // Dss-proxy-actions
    uint256 constant RAY = 10 ** 27;

    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, "mul-overflow");
    }

    function daiJoin_join(address apt, address urn, uint wad) public {
        // DAI is already in SwapActions contract as it was flashloaned to us
        // DaiJoinLike(apt).dai().transferFrom(msg.sender, address(this), wad);
        // Approves adapter to take the DAI amount
        DaiJoinLike(apt).dai().approve(apt, wad);
        // Joins DAI into the vat
        DaiJoinLike(apt).join(urn, wad);
    }

    // Internal functions
    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, "sub-overflow");
    }

    function toInt(uint x) internal pure returns (int y) {
        y = int(x);
        require(y >= 0, "int-overflow");
    }

    function toRad(uint wad) internal pure returns (uint rad) {
        rad = mul(wad, 10 ** 27);
    }

    function _convertTo18(address gemJoin, uint256 amt) internal returns (uint256 wad) {
        // For those collaterals that have less than 18 decimals precision we need to do the conversion before passing to frob function
        // Adapters will automatically handle the difference of precision
        wad = mul(
            amt,
            10 ** (18 - GemJoinLike(gemJoin).dec())
        );
    }

    function _cdpAllow(
        address manager,
        uint cdp,
        address usr,
        uint ok
    ) internal {
        ManagerLike(manager).cdpAllow(cdp, usr, ok);
    }

    function _ethJoin_join(address apt, address urn, uint wadC) internal {
        // Wraps ETH in WETH
        GemJoinLike(apt).gem().deposit.value(wadC)();
        // Approves adapter to take the WETH amount
        GemJoinLike(apt).gem().approve(address(apt), wadC);
        // Joins WETH collateral into the vat
        GemJoinLike(apt).join(urn, wadC);
    }

    function _flux(
        address manager,
        uint cdp,
        address dst,
        uint wad
    ) internal {
        ManagerLike(manager).flux(cdp, dst, wad);
    }

    function _frob(
        address manager,
        uint cdp,
        int dink,
        int dart
    ) internal {
        ManagerLike(manager).frob(cdp, dink, dart);
    }

    function _gemJoin_join(address apt, address urn, uint wad) internal {
        // Approves adapter to take the token amount
        GemJoinLike(apt).gem().approve(apt, wad);
        // Joins token collateral into the vat
        GemJoinLike(apt).join(urn, wad);
    }

    function _getDrawDart(
        address vat,
        address jug,
        address urn,
        bytes32 ilk,
        uint wad
    ) internal returns (int dart) {
        // Updates stability fee rate
        uint rate = JugLike(jug).drip(ilk);
        // Gets DAI balance of the urn in the vat
        uint dai = VatLike(vat).dai(urn);
        // If there was already enough DAI in the vat balance, just exits it without adding more debt
        if (dai < mul(wad, RAY)) {
            // Calculates the needed dart so together with the existing dai in the vat is enough to exit wad amount of DAI tokens
            dart = toInt(sub(mul(wad, RAY), dai) / rate);
            // This is neeeded due lack of precision. It might need to sum an extra dart wei (for the given DAI wad amount)
            dart = mul(uint(dart), rate) < mul(wad, RAY) ? dart + 1 : dart;
        }
    }

    // ink = collateral, art = normalised debt, actual debt = art * rate
    function _getDebt(
        address manager,
        uint cdp
    )
        internal
        view
        returns (uint debt)
    {
        address vat = ManagerLike(manager).vat();
        address urn = ManagerLike(manager).urns(cdp);
        bytes32 ilk = ManagerLike(manager).ilks(cdp);
        address owner = ManagerLike(manager).owns(cdp);

        debt = _getWipeAllWad(vat, owner, urn, ilk);
    }

    function _getWipeAllWad(
        address vat,
        address usr,
        address urn,
        bytes32 ilk
    ) internal view returns (uint wad) {
        // Gets actual rate from the vat
        (, uint rate,,,) = VatLike(vat).ilks(ilk);
        // Gets actual art value of the urn
        (, uint art) = VatLike(vat).urns(ilk, urn);
        // Gets actual dai amount in the urn
        uint dai = VatLike(vat).dai(usr);

        uint rad = sub(mul(art, rate), dai);
        wad = rad / RAY;

        // If the rad precision has some dust, it will need to request for 1 extra wad wei
        wad = mul(wad, RAY) < rad ? wad + 1 : wad;
    }

    function _give(
        address manager,
        uint cdp,
        address usr
    ) internal {
        ManagerLike(manager).give(cdp, usr);
    }

    function _move(
        address manager,
        uint cdp,
        address dst,
        uint rad
    ) internal {
        ManagerLike(manager).move(cdp, dst, rad);
    }

    function _open(
        address manager,
        bytes32 ilk,
        address usr
    ) internal returns (uint cdp) {
        cdp = ManagerLike(manager).open(ilk, usr);
    }

    // ETH collateral --> Gem collateral

    function _wipeAllAndFreeETH(
        address manager,
        address ethJoin,
        address daiJoin,
        uint cdp
    )
        internal
        returns (uint)
    {
        address vat = ManagerLike(manager).vat();
        address urn = ManagerLike(manager).urns(cdp);
        bytes32 ilk = ManagerLike(manager).ilks(cdp);
        (uint ink, uint art) = VatLike(vat).urns(ilk, urn);

        // Joins DAI amount into the vat
        daiJoin_join(daiJoin, urn, _getWipeAllWad(vat, urn, urn, ilk));
        // Paybacks debt to the CDP and unlocks WETH amount from it
        _frob(
            manager,
            cdp,
            -toInt(ink),
            -int(art)
        );
        // Moves the amount from the CDP urn to proxy's address
        _flux(manager, cdp, address(this), ink);
        // Exits WETH amount to proxy address as a token
        GemJoinLike(ethJoin).exit(address(this), ink);
        // Converts WETH to ETH
        GemJoinLike(ethJoin).gem().withdraw(ink);
        return ink;
    }

    function _openLockGemAndDraw(
        address manager,
        address jug,
        address gemJoin,
        address daiJoin,
        bytes32 ilk,
        uint wadC,
        uint wadD
    )
        internal
        returns (uint cdp)
    {
        // Open a new CDP
        cdp = _open(manager, ilk, address(this));

        address urn = ManagerLike(manager).urns(cdp);
        address vat = ManagerLike(manager).vat();
        // Takes token amount from user's wallet and joins into the vat
        _gemJoin_join(gemJoin, urn, wadC);
        // Locks token amount into the CDP and generates debt
        _frob(manager, cdp, toInt(_convertTo18(gemJoin, wadC)), _getDrawDart(vat, jug, urn, ilk, wadD));
        // Moves the DAI amount (balance in the vat in rad) to this address
        _move(manager, cdp, address(this), toRad(wadD));
        // Allows adapter to access to proxy's DAI balance in the vat
        if (VatLike(vat).can(address(this), address(daiJoin)) == 0) {
            VatLike(vat).hope(daiJoin);
        }
        // Exits DAI to the user's wallet as a token
        DaiJoinLike(daiJoin).exit(address(this), wadD);
    }

    // Gem collateral --> ETH collateral

    function _wipeAllAndFreeGem(
        address manager,
        address gemJoin,
        address daiJoin,
        uint cdp
    ) internal returns (uint) {
        address vat = ManagerLike(manager).vat();
        address urn = ManagerLike(manager).urns(cdp);
        bytes32 ilk = ManagerLike(manager).ilks(cdp);
        (uint ink, uint art) = VatLike(vat).urns(ilk, urn);

        // Joins DAI amount into the vat
        daiJoin_join(daiJoin, urn, _getWipeAllWad(vat, urn, urn, ilk));
        uint wad18 = _convertTo18(gemJoin, ink);
        // Paybacks debt to the CDP and unlocks token amount from it
        _frob(
            manager,
            cdp,
            -toInt(wad18),
            -int(art)
        );
        // Moves the amount from the CDP urn to proxy's address
        _flux(manager, cdp, address(this), wad18);
        // Exits token amount to the user's wallet as a token
        GemJoinLike(gemJoin).exit(address(this), ink);
        return ink;
    }

    function _openLockETHAndDraw(
        address manager,
        address jug,
        address ethJoin,
        address daiJoin,
        bytes32 ilk,
        uint wadC,
        uint wadD
    )
        internal
        returns (uint cdp)
    {
        cdp = _open(manager, ilk, address(this));

        address urn = ManagerLike(manager).urns(cdp);
        address vat = ManagerLike(manager).vat();
        // Receives ETH amount, converts it to WETH and joins it into the vat
        _ethJoin_join(ethJoin, urn, wadC);
        // Locks WETH amount into the CDP and generates debt
        _frob(manager, cdp, toInt(wadC), _getDrawDart(vat, jug, urn, ilk, wadD));
        // Moves the DAI amount (balance in the vat in rad) to proxy's address
        _move(manager, cdp, address(this), toRad(wadD));
        // Allows adapter to access to proxy's DAI balance in the vat
        if (VatLike(vat).can(address(this), address(daiJoin)) == 0) {
            VatLike(vat).hope(daiJoin);
        }
        // Exits DAI to the user's wallet as a token
        DaiJoinLike(daiJoin).exit(address(this), wadD);
    }    
}
