import ERC20Abi from "../smart-contracts/test/abi/ERC20.json";

const erc20 = {
  dai: {
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    abi: ERC20Abi,
  },
  bat: {
    address: "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
    abi: ERC20Abi,
  },
  usdc: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    abi: ERC20Abi,
  },
  zrx: {
    address: "0xE41d2489571d322189246DaFA5ebDe1F4699F498",
    abi: ERC20Abi,
  },
};

export default erc20;
