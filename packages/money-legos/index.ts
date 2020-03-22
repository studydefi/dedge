import makerProxyRegistryAbi from "../smart-contracts/test/abi/ProxyRegistry.json";
import { dedgeProxyFactoryAddress } from "../smart-contracts/build/DeployedAddresses.json";
import dedgeProxyFactoryDef from "../smart-contracts/build/DedgeProxyFactory.json";

const legos = {
  maker: {
    proxyRegistry: {
      address: "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4",
      abi: makerProxyRegistryAbi,
    },
  },
  dedge: {
    proxyRegistry: {
      address: dedgeProxyFactoryAddress,
      abi: dedgeProxyFactoryDef.abi,
    },
  },
};

export default legos;
