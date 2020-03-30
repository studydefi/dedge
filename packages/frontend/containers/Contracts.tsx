import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import Connection from "./Connection";
import { legos } from "money-legos";

import DACProxyFactory from "../../smart-contracts/build/DACProxyFactory.json";
import dedgeCompoundManager from "../../smart-contracts/build/DedgeCompoundManager.json";
import dedgeAddressRegistry from "../../smart-contracts/build/AddressRegistry.json";

const CONTRACTS = {
  makerProxyRegistry: legos.maker.proxyRegistry,
  cEther: legos.compound.cEther,
  cBat: legos.compound.cBAT,
  cDai: legos.compound.cDAI,
};

const DEDGE_CONTRACTS = {
  dacProxyFactory: DACProxyFactory,
  dedgeCompoundManager,
  dedgeAddressRegistry,
};

type Contracts = Record<string, ethers.Contract>;

function useContracts() {
  const [contracts, setContracts] = useState<Contracts>({});
  const { signer, network } = Connection.useContainer();

  const initContracts = () => {
    const contractInstances = {};

    // locally deployed contracts have to fetch from artifact, not legos
    for (const name in DEDGE_CONTRACTS) {
      const artifact = DEDGE_CONTRACTS[name];
      const { chainId } = network;

      const address = artifact.networks[chainId].address;
      const instance = new ethers.Contract(address, artifact.abi, signer);
      contractInstances[name] = instance;
    }

    // deployed contracts can just reference off the legos
    for (const name in CONTRACTS) {
      const { address, abi } = CONTRACTS[name];

      const instance = new ethers.Contract(address[1], abi, signer);
      contractInstances[name] = instance;
    }

    setContracts(contractInstances);
  };

  useEffect(() => {
    if (signer && network) {
      initContracts();
    }
  }, [signer, network]);

  return { contracts };
}

const ContractsContainer = createContainer(useContracts);

export default ContractsContainer;
