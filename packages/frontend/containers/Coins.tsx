import { createContainer } from "unstated-next";
import { getLegos, networkIds } from "money-legos/dist";

const legos = getLegos(networkIds.mainnet);

const COINS = {
  eth: {
    name: "Ether",
    symbol: "ETH",
    icon: "Eth",
    stable: false,
    cTokenEquilaventAddress: legos.compound.cEther.address,
  },
  bat: {
    name: "Basic Attention Token",
    symbol: "BAT",
    icon: "Bat",
    stable: false,
    address: legos.erc20.bat.address,
    cTokenEquilaventAddress: legos.compound.cBAT.address,
  },
  dai: {
    name: "Dai",
    symbol: "DAI",
    icon: "Dai",
    stable: true,
    address: legos.erc20.dai.address,
    cTokenEquilaventAddress: legos.compound.cDAI.address,
  },
  usdc: {
    name: "USD Coin",
    symbol: "USDC",
    icon: "Usd",
    stable: true,
    address: legos.erc20.usdc.address,
    cTokenEquilaventAddress: legos.compound.cUSDC.address,
  },
  rep: {
    name: "Augur",
    symbol: "REP",
    icon: "Rep",
    stable: false,
    address: legos.erc20.rep.address,
    cTokenEquilaventAddress: legos.compound.cREP.address,
  },
  zrx: {
    name: "0x",
    symbol: "ZRX",
    icon: "Zrx",
    stable: false,
    address: legos.erc20.zrx.address,
    cTokenEquilaventAddress: legos.compound.cZRX.address,
  },
  wbtc: {
    name: "Wrapped BTC",
    symbol: "WBTC",
    icon: "Btc",
    stable: false,
    address: legos.erc20.wbtc.address,
    cTokenEquilaventAddress: legos.compound.cWBTC.address,
  },
};

function useCoins() {
  const coinsArray = Object.entries(COINS).map(([k, v]) => ({ ...v, key: k }));
  const stableCoins = coinsArray.filter((x) => x.stable === true);
  const volatileCoins = coinsArray.filter((x) => x.stable === false);

  return { COINS, stableCoins, volatileCoins };
}

const CoinsContainer = createContainer(useCoins);

export default CoinsContainer;
