import erc20 from "./erc20";

import networkIds from "./networks"

import makerProxyRegistryAbi from "./abi/makerdao/ProxyRegistry.json";
import dssCdpManagerAbi from "./abi/makerdao/DssCdpManager.json";
import dssProxyActionsAbi from "./abi/makerdao/DssProxyActions.json";

const ilks = {
  "BAT-A": {
    token: { address: erc20.bat.address },
    join: {
      address: {
        [networkIds.mainnet]: "0x3D0B1912B66114d4096F48A8CEe3A56C231772cA"
      },
    }
  },
  "ETH-A": {
    token: {
      address: Object.keys(networkIds).reduce((acc, x) => {
        // @ts-ignore
        acc[x] = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
        return acc
      }, {})
    }, // All network defaults to 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE
    join: { address: "0x2F0b23f53734252Bda2277357e97e1517d6B042A" },
  },
  "USDC-A": {
    token: { address: erc20.usdc.address },
    join: {
      address: {
        [networkIds.mainnet]: "0xA191e578a6736167326d05c119CE0c90849E84B7"
      },
    }
  },
};

const maker = {
  proxyRegistry: {
    address: {
      [networkIds.mainnet]: "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4"
    },
    abi: makerProxyRegistryAbi,
  },
  dssCdpManager: {
    address: {
      [networkIds.mainnet]: "0x5ef30b9986345249bc32d8928B7ee64DE9435E39",
    },
    abi: dssCdpManagerAbi,
  },
  dssProxyActions: {
    address: {
      [networkIds.mainnet]: "0x82ecd135dce65fbc6dbdd0e4237e0af93ffd5038",
    },
    abi: dssProxyActionsAbi,
  },
  jug: {
    address: {
      [networkIds.mainnet]: "0x19c0976f590D67707E62397C87829d896Dc0f1F1",
    }
  },
  daiJoin: {
    address: {
      [networkIds.mainnet]: "0x9759A6Ac90977b93B58547b4A71c78317f391A28"
    },
  },
  ilks,
};

export default maker;
