import maker from "./maker";
import erc20 from "./erc20";
import dappsys from "./dappsys";
import uniswap from "./uniswap";
import compound from "./compound";
import networkIds from './networks'

// note: a lego is just a Javascript object with two fields: address and abi

const legos = {
  maker,
  erc20,
  dappsys,
  uniswap,
  compound,
  networkIds,
};

export default legos;
