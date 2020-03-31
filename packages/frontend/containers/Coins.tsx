import { createContainer } from "unstated-next";

const COINS = {
  eth: { name: "Ether", symbol: "ETH", icon: "Eth" },
  bat: { name: "Basic Attention Token", symbol: "BAT", icon: "Bat" },
  dai: { name: "Dai", symbol: "DAI", icon: "Dai" },
  usdc: { name: "USD Coin", symbol: "USDC", icon: "Usd" },
  rep: { name: "Augur", symbol: "REP", icon: "Rep" },
  zrx: { name: "0x", symbol: "ZRX", icon: "Zrx" },
  wbtc: { name: "Wrapped BTC", symbol: "WBTC", icon: "Btc" },
};

function useCoins() {
  // might need to do more fancy stuff here later, but
  // for now this is just a simple global object to be
  // referenced
  return { COINS };
}

const CoinsContainer = createContainer(useCoins);

export default CoinsContainer;
