import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import Connection from "./Connection";
import { legos } from "money-legos";

import dacProxyFactory from "../../smart-contracts/build/DACProxyFactory.json";
import dedgeCompoundManager from "../../smart-contracts/build/DedgeCompoundManager.json";
import dedgeAddressRegistry from "../../smart-contracts/build/AddressRegistry.json";
import dedgeMakerManager from "../../smart-contracts/build/DedgeMakerManager.json";

const CONTRACTS = {
  makerProxyRegistry: legos.maker.proxyRegistry,
  makerProxyActions: legos.maker.dssProxyActions,
  makerCdpManager: legos.maker.dssCdpManager,
  instaDappProxyRegistry: legos.instadapp.instaRegistry,
  cEther: legos.compound.cEther,
  cBat: legos.compound.cBAT,
  cDai: legos.compound.cDAI,
  cUsdc: legos.compound.cUSDC,
  cRep: legos.compound.cREP,
  cZrx: legos.compound.cZRX,
  cWbtc: legos.compound.cWBTC,
};

const DEDGE_CONTRACTS = {
  dacProxyFactory,
  dedgeCompoundManager,
  dedgeAddressRegistry,
  dedgeMakerManager,
};

type Contracts = Record<string, ethers.Contract>;

function useContracts() {
  const [contracts, setContracts] = useState<Contracts>({});
  const [ready, setReady] = useState(false);
  const { signer, network } = Connection.useContainer();

  const initContracts = () => {
    const contractInstances = {};

    // locally deployed contracts have to fetch from artifact, not legos
    for (const name in DEDGE_CONTRACTS) {
      const artifact = DEDGE_CONTRACTS[name];
      const { chainId } = network;

      if (!artifact.networks[chainId]) {
        throw Error(
          `The contract ${name} is not deployed on network ${chainId}`,
        );
      }

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
    setReady(true);
  };

  useEffect(() => {
    if (signer && network) {
      try {
        initContracts();
      } catch (error) {
        setContracts({});
        alert("Contracts not found, are you sure you are on Mainnet?");
      }
    }
  }, [signer, network]);

  return { contracts, ready };
}

const ContractsContainer = createContainer(useContracts);

export default ContractsContainer;
