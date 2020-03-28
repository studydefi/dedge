import dsProxyAbi from "./abi/dappsys/DSProxy.json";
import dsProxyFactoryAbi from "./abi/dappsys/DSProxyFactory.json"

const dappsys = {
  dsProxy: {
    abi: dsProxyAbi,
  },
  dsProxyFactory:{
    abi: dsProxyFactoryAbi
  }
};

export default dappsys;
