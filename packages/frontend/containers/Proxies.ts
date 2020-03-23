import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import EthersContainer from "./Ethers";
import ContractsContainer from "./Contracts";

import legos from "../../money-legos";

function useProxies() {
  const { signer } = EthersContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer() as any;

  const [makerProxyAddr, setMakerProxyAddr] = useState(null);
  const [dedgeProxyAddr, setDedgeProxyAddr] = useState(null);
  const [makerProxy, setMakerProxy] = useState(null);
  const [dedgeProxy, setDedgeProxy] = useState(null);

  // get proxy addresses
  const getProxyAddresses = async () => {
    const { makerProxyRegistry, dedgeProxyRegistry } = contracts;
    const userAddr = await signer.getAddress();
    const makerAddr = await makerProxyRegistry.proxies(userAddr);
    const dedgeAddr = await dedgeProxyRegistry.proxies(userAddr);
    setMakerProxyAddr(makerAddr);
    setDedgeProxyAddr(dedgeAddr);
  };

  // set proxy contract instances
  const setProxyContracts = async () => {
    const { dsproxy } = legos.dappsys;
    const makerProxy = new ethers.Contract(makerProxyAddr, dsproxy.abi, signer);
    const dedgeProxy = new ethers.Contract(dedgeProxyAddr, dsproxy.abi, signer);
    setMakerProxy(makerProxy);
    setDedgeProxy(dedgeProxy);
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

  useEffect(() => {
    if (makerProxyAddr && dedgeProxyAddr) {
      setProxyContracts();
    }
  }, [makerProxyAddr, dedgeProxyAddr]);

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
