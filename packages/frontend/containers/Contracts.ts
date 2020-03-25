import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import EthersContainer from "./Ethers";
import legos from "../../money-legos";

interface Lego {
  address?: string;
  abi?: Array<any>;
}

const CONTRACTS: Record<string, Lego> = {
  makerProxyRegistry: legos.maker.proxyRegistry,
  dedgeProxyRegistry: legos.dedge.proxyRegistry,
  dssCdpManager: legos.maker.dssCdpManager,
  dedgeMakerManager: legos.dedge.dedgeMakerManager,
  dai: legos.erc20.dai,
  bat: legos.erc20.bat,
  usdc: legos.erc20.usdc,
  zrx: legos.erc20.zrx,
  uniswapFactory: legos.uniswap.uniswapFactory,
  compoundComptroller: legos.compound.comptroller,
  dedgeCompoundManager: legos.dedge.dedgeCompoundManager,
};

type Contracts = Record<string, ethers.Contract>;

function useContracts() {
  const [contracts, setContracts] = useState<Contracts>({});
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
