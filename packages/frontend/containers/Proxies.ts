import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";

import EthersContainer from "./Ethers";
import ContractsContainer from "./Contracts";

function useProxies() {
  const { signer } = EthersContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer() as any;

  const [makerProxyAddr, setMakerProxy] = useState(null);
  const [dedgeProxyAddr, setDedgeProxy] = useState(null);

  // get proxy addresses
  const getProxyAddresses = async () => {
    const { makerProxyRegistry, dedgeProxyRegistry } = contracts;
    const userAddr = await signer.getAddress();
    const makerAddr = await makerProxyRegistry.proxies(userAddr);
    const dedgeAddr = await dedgeProxyRegistry.proxies(userAddr);
    setMakerProxy(makerAddr);
    setDedgeProxy(dedgeAddr);
  };

  // create a proxy for user
  const makeMakerProxy = async () => {
    await contracts.makerProxyRegistry.build();
    setTimeout(getProxyAddresses, 0);
  };

  const makeDedgeProxy = async () => {
    await contracts.dedgeProxyRegistry.build();
    setTimeout(getProxyAddresses, 0);
  };

  useEffect(() => {
    if (contracts.makerProxyRegistry && contracts.dedgeProxyRegistry) {
      getProxyAddresses();
    }
  }, [signer, contracts, makerProxyAddr, dedgeProxyAddr]);

  return { makerProxyAddr, makeMakerProxy, dedgeProxyAddr, makeDedgeProxy, getProxyAddresses };
}

const ProxiesContainer = createContainer(useProxies);

export default ProxiesContainer;
