import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import EthersContainer from "./Ethers";
import ContractsContainer from "./Contracts";

import legos from "../../money-legos";

function useProxies() {
  const { signer } = EthersContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer() as any;

  const [makerProxyAddr, setMakerProxyAddr] = useState<string | null>(null);
  const [dedgeProxyAddr, setDedgeProxyAddr] = useState<string | null>(null);
  const [makerProxy, setMakerProxy] = useState<ethers.Contract | null>(null);
  const [dedgeProxy, setDedgeProxy] = useState<ethers.Contract | null>(null);

  // get proxy addresses
  const getProxyAddresses = async () => {
    const { makerProxyRegistry, dedgeProxyRegistry } = contracts;
    const userAddr = await signer.getAddress();
    const makerAddr = await makerProxyRegistry.proxies(userAddr);
    const dedgeAddr = await dedgeProxyRegistry.proxies(userAddr);
    setMakerProxyAddr(makerAddr);
    setDedgeProxyAddr(dedgeAddr);
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

  // trigger get proxy addresses
  useEffect(() => {
    if (contracts.makerProxyRegistry && contracts.dedgeProxyRegistry) {
      getProxyAddresses();
    }
  }, [signer, contracts, makerProxyAddr, dedgeProxyAddr]);

  // set proxy contract instances
  useEffect(() => {
    if (makerProxyAddr && dedgeProxyAddr) {
      const { abi } = legos.dappsys.dsproxy;
      const makerProxy = new ethers.Contract(makerProxyAddr, abi, signer);
      const dedgeProxy = new ethers.Contract(dedgeProxyAddr, abi, signer);
      setMakerProxy(makerProxy);
      setDedgeProxy(dedgeProxy);
    }
  }, [makerProxyAddr, dedgeProxyAddr, signer]);

  return {
    makerProxyAddr,
    dedgeProxyAddr,
    makeMakerProxy,
    makeDedgeProxy,
    makerProxy,
    dedgeProxy,
    getProxyAddresses,
  };
}

const ProxiesContainer = createContainer(useProxies);

export default ProxiesContainer;
