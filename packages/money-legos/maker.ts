import makerProxyRegistryAbi from "../smart-contracts/test/abi/ProxyRegistry.json";
import dssCdpManagerAbi from "../smart-contracts/test/abi/DssCdpManager.json";

const maker = {
  proxyRegistry: {
    address: "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4",
    abi: makerProxyRegistryAbi,
  },
  dssCdpManager: {
    address: "0x5ef30b9986345249bc32d8928B7ee64DE9435E39",
    abi: dssCdpManagerAbi,
  },
};

export default maker;
