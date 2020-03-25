import {
  dedgeProxyFactoryAddress,
  dedgeMakerManagerAddress,
  dedgeCompoundManagerAddress,
} from "../smart-contracts/build/DeployedAddresses.json";
import dedgeProxyFactoryDef from "../smart-contracts/build/DedgeProxyFactory.json";
import dedgeMakerManagerDef from "../smart-contracts/build/DedgeMakerManager.json";
import dedgeCompoundManagerDef from "../smart-contracts/build/DedgeCompoundManager.json";

const dedge = {
  proxyRegistry: {
    address: dedgeProxyFactoryAddress,
    abi: dedgeProxyFactoryDef.abi,
  },
  dedgeMakerManager: {
    address: dedgeMakerManagerAddress,
    abi: dedgeMakerManagerDef.abi,
  },
  dedgeCompoundManager: {
    address: dedgeCompoundManagerAddress,
    abi: dedgeCompoundManagerDef.abi,
  },
};

export default dedge;
