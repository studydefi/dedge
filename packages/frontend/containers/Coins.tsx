import { createContainer } from "unstated-next";

const COINS = {
  eth: { name: "Ether", symbol: "ETH", icon: "Eth", stable: false },
  bat: {
    name: "Basic Attention Token",
    symbol: "BAT",
    icon: "Bat",
    stable: false,
  },
  dai: { name: "Dai", symbol: "DAI", icon: "Dai", stable: true },
  usdc: { name: "USD Coin", symbol: "USDC", icon: "Usd", stable: true },
  rep: { name: "Augur", symbol: "REP", icon: "Rep", stable: false },
  zrx: { name: "0x", symbol: "ZRX", icon: "Zrx", stable: false },
  wbtc: { name: "Wrapped BTC", symbol: "WBTC", icon: "Btc", stable: false },
};

function useCoins() {
  const coinsArray = Object.entries(COINS).map(([k, v]) => ({ ...v, key: k }));
  const stableCoins = coinsArray.filter(x => x.stable === true);
  const volatileCoins = coinsArray.filter(x => x.stable === false);

  return { COINS, stableCoins, volatileCoins };
}

const CoinsContainer = createContainer(useCoins);

export default CoinsContainer;
