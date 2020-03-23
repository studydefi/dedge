import uniswapFactoryDef from "../smart-contracts/build/IUniswapFactory.json";
import uniswapExchangeDef from "../smart-contracts/build/IUniswapExchange.json";

const uniswap = {
  uniswapFactory: {
    address: "0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95",
    abi: uniswapFactoryDef.abi,
  },
  uniswapExchange: {
    abi: uniswapExchangeDef.abi,
  },
};

export default uniswap;
