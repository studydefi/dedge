import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import { legos } from "money-legos";
import Connection from "./Connection";
import Contracts from "./Contracts";

import { dedgeHelpers } from "../../smart-contracts/dist/helpers";

function useDACProxy() {
  const { signer } = Connection.useContainer();
  const { contracts } = Contracts.useContainer();

  const [proxy, setProxyContract] = useState(null);
  const [proxyAddress, setProxyAddress] = useState(null);

  // get proxy address
  const fetchProxyAddress = async () => {
    const { dacProxyFactory } = contracts;
    const userAddr = await signer.getAddress();
    const proxyAddress = await dacProxyFactory.proxies(userAddr);

    setProxyAddress(proxyAddress);
  };

  // create a proxy for user
  const createProxy = async () => {
    const {
      cEther,
      cDai,
      cRep,
      cZrx,
      cBat,
      cUsdc,
      cWbtc,
      dacProxyFactory,
      dedgeCompoundManager
    } = contracts;
    const tx = await dedgeHelpers.proxyFactory.buildAndEnterMarkets(
      dacProxyFactory,
      dedgeCompoundManager.address,
      [
        cEther.address,
        cDai.address,
        cRep.address,
        cZrx.address,
        cBat.address,
        cUsdc.address,
        cWbtc.address,
      ]
    );

    window.toastProvider.addMessage("Creating Smart Wallet...", {
      secondaryMessage: "Check progress on Etherscan",
      actionHref: `https://etherscan.io/tx/${tx.hash}`,
      actionText: "Check",
      variant: "processing"
    });

    const receipt = await tx.wait();

    window.toastProvider.addMessage("Smart Wallet created", {
      variant: "success"
    });

    fetchProxyAddress();
  };

  // fetch proxy address
  useEffect(() => {
    if (contracts.dacProxyFactory) {
      fetchProxyAddress();
    }
  }, [signer, contracts]);

  // set proxy contract instances
  useEffect(() => {
    if (proxyAddress) {
      const { abi } = legos.dappsys.dsProxy;
      const proxyContract = new ethers.Contract(proxyAddress, abi, signer);
      setProxyContract(proxyContract);
    }
  }, [proxyAddress, signer]);

  return {
    proxyAddress,
    createProxy,
    proxy,
    fetchProxyAddress
  };
}

const DACProxyContainer = createContainer(useDACProxy);

export default DACProxyContainer;
