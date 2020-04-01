import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ContractsContainer from "./Contracts";
import DACProxyContainer from "./DACProxy";
import CoinsContainer from "./Coins";

function useCompoundPositions() {
  const [compoundPositions, setCompoundPositions] = useState({});
  const [compoundApy, setCompoundApy] = useState({});
  const [loading, setLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const { contracts } = ContractsContainer.useContainer();
  const { proxyAddress, hasProxy } = DACProxyContainer.useContainer();
  const { COINS } = CoinsContainer.useContainer();

  const getApy = async () => {
    const res = await fetch("https://api.compound.finance/api/v2/ctoken");
    const data = await res.json();

    const ratesFor = symbol => {
      const token = data.cToken.filter(
        x => x.underlying_symbol === symbol.toUpperCase(),
      )[0];

      const borrowRate = parseFloat(token.borrow_rate.value);
      const supplyRate = parseFloat(token.supply_rate.value);
      return { borrowRate, supplyRate };
    };

    setCompoundApy({
      eth: { ...ratesFor("eth") },
      bat: { ...ratesFor("bat") },
      dai: { ...ratesFor("dai") },
      usdc: { ...ratesFor("usdc") },
      rep: { ...ratesFor("rep") },
      zrx: { ...ratesFor("zrx") },
      wbtc: { ...ratesFor("wbtc") },
    });
  };

  const getBalances = async () => {
    const { cEther, cBat, cDai, cUsdc, cRep, cZrx, cWbtc } = contracts;

    console.log("fetching Compound balances");
    setLoading(true);
    clearTimeout(timeoutId);

    // weird bug where this fails if nothing is supplied yet
    try {
      await cDai.balanceOfUnderlying(proxyAddress);
    } catch (error) {
      // we just assume its all zero balances
      setCompoundPositions({
        eth: { ...COINS.eth, supply: "0", borrow: "0" },
        bat: { ...COINS.bat, supply: "0", borrow: "0" },
        dai: { ...COINS.dai, supply: "0", borrow: "0" },
        usdc: { ...COINS.usdc, supply: "0", borrow: "0" },
        rep: { ...COINS.rep, supply: "0", borrow: "0" },
        zrx: { ...COINS.zrx, supply: "0", borrow: "0" },
        wbtc: { ...COINS.wbtc, supply: "0", borrow: "0" },
      });
      setLoading(false);

      setLastRefresh(new Date()); // save the time of last refresh
      const myTimeoutId = setTimeout(getBalances, 30000); // every 30 seconds get balances again
      setTimeoutId(myTimeoutId); // save timeout id so we can cancel if manual refresh

      // quit early
      return;
    }

    const coinContracts = [cEther, cBat, cDai, cUsdc, cRep, cZrx, cWbtc];

    // borrow balances
    const [bEth, bBat, bDai, bUsdc, bRep, bZrx, bWbtc] = await Promise.all(
      coinContracts.map(x => x.borrowBalanceStored(proxyAddress)),
    );

    // supply balances
    const [sEth, sBat, sDai, sUsdc, sRep, sZrx, sWbtc] = await Promise.all(
      coinContracts.map(x => x.balanceOfUnderlying(proxyAddress)),
    );

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
    await getApy();
    setLoading(false);

    setLastRefresh(new Date()); // save the time of last refresh
    const myTimeoutId = setTimeout(getBalances, 30000); // every 30 seconds get balances again
    setTimeoutId(myTimeoutId); // save timeout id so we can cancel if manual refresh
  };

  useEffect(() => {
    if (hasProxy) {
      try {
        getBalances();
      } catch (error) {
        throw Error("Error retreiving Compound balances");
      }
    }
  }, [contracts, proxyAddress]);

  return { compoundPositions, loading, getBalances, lastRefresh, compoundApy };
}

const CompoundPositions = createContainer(useCompoundPositions);

export default CompoundPositions;
