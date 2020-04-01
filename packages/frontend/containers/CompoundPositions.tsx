import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ContractsContainer from "./Contracts";
import DACProxyContainer from "./DACProxy";
import CoinsContainer from "./Coins";

function useCompoundPositions() {
  const [compoundPositions, setCompoundPositions] = useState({});
  const [loading, setLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const { contracts } = ContractsContainer.useContainer();
  const { proxyAddress, hasProxy } = DACProxyContainer.useContainer();
  const { COINS } = CoinsContainer.useContainer();

  const getBalances = async () => {
    const { cEther, cBat, cDai, cUsdc, cRep, cZrx, cWbtc } = contracts;

    console.log("fetching Compound balances");
    setLoading(true);
    clearTimeout(timeoutId);

    // borrow balances
    const bEth = await cEther.borrowBalanceStored(proxyAddress);
    const bBat = await cBat.borrowBalanceStored(proxyAddress);
    const bDai = await cDai.borrowBalanceStored(proxyAddress);
    const bUsdc = await cUsdc.borrowBalanceStored(proxyAddress);
    const bRep = await cRep.borrowBalanceStored(proxyAddress);
    const bZrx = await cZrx.borrowBalanceStored(proxyAddress);
    const bWbtc = await cWbtc.borrowBalanceStored(proxyAddress);

    // supply balances
    const sEth = await cEther.balanceOfUnderlying(proxyAddress);
    const sBat = await cBat.balanceOfUnderlying(proxyAddress);
    const sDai = await cDai.balanceOfUnderlying(proxyAddress);
    const sUsdc = await cUsdc.balanceOfUnderlying(proxyAddress);
    const sRep = await cRep.balanceOfUnderlying(proxyAddress);
    const sZrx = await cZrx.balanceOfUnderlying(proxyAddress);
    const sWbtc = await cWbtc.balanceOfUnderlying(proxyAddress);

    const process = (x, u = 18) =>
      ethers.utils.formatUnits(x.toString(), u).toString();

    setCompoundPositions({
      eth: { ...COINS.eth, supply: process(sEth), borrow: process(bEth) },
      bat: { ...COINS.bat, supply: process(sBat), borrow: process(bBat) },
      dai: { ...COINS.dai, supply: process(sDai), borrow: process(bDai) },
      usdc: {
        ...COINS.usdc,
        supply: process(sUsdc, 6),
        borrow: process(bUsdc, 6),
      },
      rep: { ...COINS.rep, supply: process(sRep), borrow: process(bRep) },
      zrx: { ...COINS.zrx, supply: process(sZrx), borrow: process(bZrx) },
      wbtc: { ...COINS.wbtc, supply: process(sWbtc), borrow: process(bWbtc) },
    });
    setLoading(false);

    setLastRefresh(new Date()); // save the time of last refresh
    const myTimeoutId = setTimeout(getBalances, 30000); // every 30 seconds get balances again
    setTimeoutId(myTimeoutId); // save timeout id so we can cancel if manual refresh
  };

  useEffect(() => {
    if (hasProxy) {
      getBalances();
    }
  }, [contracts, proxyAddress]);

  return { compoundPositions, loading, getBalances, lastRefresh };
}

const CompoundPositions = createContainer(useCompoundPositions);

export default CompoundPositions;
