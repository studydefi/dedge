import instaRegistryAbi from "./abi/instadapp/instaregistry.json";

import networkIds from "./networks";

const instadapp = {
  instaRegistry: {
    abi: instaRegistryAbi,
    address: {
      [networkIds.mainnet]: "0x498b3BfaBE9F73db90D252bCD4Fa9548Cd0Fd981"
    }
  }
};

export default instadapp;
