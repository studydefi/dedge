import networkdIds from "./networks";

import uniswapFactoryAbi from "./abi/uniswap/Factory.json";
import uniswapExchangeAbi from "./abi/uniswap/Exchange.json";

const uniswap = {
  uniswapFactory: {
    address: {
      [networkdIds.mainnet]: "0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95"
    },
    abi: uniswapFactoryAbi,
  },
  uniswapExchange: {
    abi: uniswapExchangeAbi,
  },
};

export default uniswap;
