pragma solidity 0.5.16;

import "./DACProxy.sol";

import "../lib/dapphub/Guard.sol";

import "../interfaces/aave/ILendingPoolAddressesProvider.sol";

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
    function build(address owner) public returns (address payable proxy) {
        proxy = address(new DACProxy(address(cache)));
        emit Created(msg.sender, owner, address(proxy), address(cache));

        DSGuard guard = dsGuardFactory.newGuard();
        guard.setOwner(proxy);  // Guard belongs to proxy

        DACProxy(proxy).setAuthority(guard);
        DACProxy(proxy).setOwner(owner);

        proxies[owner] = proxy;
    }
}