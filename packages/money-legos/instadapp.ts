import instaRegistryAbi from "./abi/instadapp/instaregistry.json";
import instaDssProxyActionsAbi from "./abi/instadapp/instaDssProxyActions.json"

import networkIds from "./networks";

const instadapp = {
  instaRegistry: {
    abi: instaRegistryAbi,
    address: {
      [networkIds.mainnet]: "0x498b3BfaBE9F73db90D252bCD4Fa9548Cd0Fd981"
    }
  },
  instaDssProxyActions: {
    abi: instaDssProxyActionsAbi,
    address: {
      [networkIds.mainnet]: "0x797f232C549026790E8707725DDA76DA70256fd6"
    }
  }
};

export default instadapp;
