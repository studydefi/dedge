import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import legos from "../../money-legos";
import Connection from "./Connection";

function useDACProxy() {
  // const { signer } = Connection.useContainer()

  // const [proxy, setProxyContract] = useState(null)
  // const [proxyAddress, setProxyAddress] = useState(null)

  // // get proxy address
  // const getProxyAddresses = async () => {
  //   const { makerProxyRegistry, dedgeProxyRegistry } = contracts;
  //   const userAddr = await signer.getAddress();
  //   const proxyAddress = await proxyRegistry.proxies(userAddr);
  //   setProxyAddress(proxyAddress)
  // };

  // // create a proxy for user
  // const createProxy = async () => {
  //   await contracts.proxyRegistry.build();
  //   setTimeout(getProxyAddresses, 0);
  // };

  // // fetch proxy address
  // useEffect(() => {
  //   // if (contracts.makerProxyRegistry && contracts.dedgeProxyRegistry) {
  //   //   getProxyAddresses();
  //   // }
  // }, [signer]);

  // // set proxy contract instances
  // useEffect(() => {
  //   if (proxyAddress) {

  //     const { abi } = legos.dappsys.dsproxy;
  //     const proxyContract = new ethers.Contract(dedgeProxyAddr, abi, signer);
  //     setProxyContract(proxyContract)
  //   }
  // }, [proxyAddress, signer]);

  // return {
  //   proxyAddress,
  //   createProxy,
  //   proxy,
  //   fetchProxyAddress,
  // };

  // 3 steps:
  // 1. Use dacProxyFactory.proxies(address) to see if user has a proxy with us
  // 2. If yes, we create a contract instance with that proxyAddress
  // 3. If not, we ask the user to build one with us (requires tx) and then do step 2

  return {
    proxyAddress: "0x0000000000000000000000000000000000000000",
    createProxy: () => {},
    proxy: {},
    fetchProxyAddress: () => {},
  };
}

const DACProxyContainer = createContainer(useDACProxy);

export default DACProxyContainer;
