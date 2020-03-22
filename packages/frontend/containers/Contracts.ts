import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import EthersContainer from "./Ethers";
import legos from "../../money-legos";

const CONTRACTS = {
  makerProxyRegistry: legos.maker.proxyRegistry,
  dedgeProxyRegistry: legos.dedge.proxyRegistry,
};

function useContracts() {
  const [contracts, setContracts] = useState({});
  const { signer } = EthersContainer.useContainer();

  const initContracts = () => {
    const contractInstances = {};

    for (const name in CONTRACTS) {
      const { address, abi } = CONTRACTS[name];
      const instance = new ethers.Contract(address, abi, signer);
      contractInstances[name] = instance;
    }

    setContracts(contractInstances);
  };

  useEffect(() => {
    if (signer) {
      initContracts();
    }
  }, [signer]);

  return { contracts };
}

const ContractsContainer = createContainer(useContracts);

export default ContractsContainer;
