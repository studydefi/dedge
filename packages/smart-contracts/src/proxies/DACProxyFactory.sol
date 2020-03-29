pragma solidity 0.5.16;

import "./DACProxy.sol";

import "../lib/dapphub/Guard.sol";

import "../interfaces/compound/IComptroller.sol";

contract DACProxyFactory {
    event Created(address indexed sender, address indexed owner, address proxy, address cache);

    mapping(address=>address) public proxies;

    DSProxyCache public cache;
    DSGuardFactory public dsGuardFactory;

    constructor() public {
        cache = new DSProxyCache();
        dsGuardFactory = new DSGuardFactory();
    }

    // deploys a new proxy instance
    // sets owner of proxy to caller
    function build() public returns (address payable proxy) {
        proxy = build(msg.sender);
    }

    // deploys a new proxy instance
    // creates a new guard
    // sets custom owner of proxy
    function build(address owner) public returns (address payable) {
        // If user already has a proxy build, return that instead
        if (proxies[owner] != address(0)) {
            return address(uint160(proxies[owner]));
        }

        address payable proxy = address(new DACProxy(address(cache)));
        emit Created(msg.sender, owner, address(proxy), address(cache));

        DSGuard guard = dsGuardFactory.newGuard();
        guard.setOwner(proxy);  // Guard belongs to proxy

        DACProxy(proxy).setAuthority(guard);
        DACProxy(proxy).setOwner(owner);

        proxies[owner] = proxy;

        return proxy;
    }

    // Compound-specific code to enter markets upon proxy creation
    // So user has to perform less TX
    function buildAndEnterMarkets(
        address dedgeCompoundManager,
        bytes memory enterMarketCalldata
    ) public returns (address payable) {
        return buildAndEnterMarkets(msg.sender, dedgeCompoundManager, enterMarketCalldata);
    }

    function buildAndEnterMarkets(
        address owner,
        address dedgeCompoundManager,
        bytes memory enterMarketCalldata
    ) public returns (address payable) {
        // If user already has a proxy build, return that instead
        if (proxies[owner] != address(0)) {
            return address(uint160(proxies[owner]));
        }

        address payable proxy = address(new DACProxy(address(cache)));
        emit Created(msg.sender, owner, address(proxy), address(cache));

        DSGuard guard = dsGuardFactory.newGuard();
        guard.setOwner(proxy);  // Guard belongs to proxy

        // Enter markets via proxy
        DACProxy(proxy).execute(
            dedgeCompoundManager,
            enterMarketCalldata
        );

        DACProxy(proxy).setAuthority(guard);
        DACProxy(proxy).setOwner(owner);

        proxies[owner] = proxy;

        return proxy;
    }
}