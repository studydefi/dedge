import {
  dedgeProxyFactoryAddress,
  dedgeMakerManagerAddress,
} from "../smart-contracts/build/DeployedAddresses.json";
import dedgeProxyFactoryDef from "../smart-contracts/build/DedgeProxyFactory.json";
import dedgeMakerManagerDef from "../smart-contracts/build/DedgeMakerManager.json";

const dedge = {
  proxyRegistry: {
    address: dedgeProxyFactoryAddress,
    abi: dedgeProxyFactoryDef.abi,
  },
  dedgeMakerManager: {
    address: dedgeMakerManagerAddress,
    abi: dedgeMakerManagerDef.abi,
  },
};

export default dedge;
