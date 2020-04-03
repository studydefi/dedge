import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ContractsContainer from "./Contracts";
import DACProxyContainer from "./DACProxy";
import CoinsContainer from "./Coins";
import { dedgeHelpers } from "../../smart-contracts/dist/helpers";
import ConnectionContainer from "./Connection";

function useCompoundPositions() {
  const [compoundPositions, setCompoundPositions] = useState({});
  const [compoundApy, setCompoundApy] = useState({});
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const { signer } = ConnectionContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { proxyAddress, hasProxy } = DACProxyContainer.useContainer();
  const { COINS } = CoinsContainer.useContainer();

  const getTotals = async () => {
    const {
      borrowBalanceUSD,
      supplyBalanceUSD,
      currentBorrowPercentage,
      ethInUSD,
      liquidationPriceUSD,
    } = await dedgeHelpers.compound.getAccountInformation(signer, proxyAddress);

    setTotals({
      borrowBalanceUSD,
      supplyBalanceUSD,
      currentBorrowPercentage,
      ethInUSD,
      liquidationPriceUSD,
    });
  };

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

    const process = (x, u = 18) =>
      ethers.utils.formatUnits(x.toString(), u).toString();

    const coinContracts = [cEther, cBat, cDai, cUsdc, cRep, cZrx, cWbtc];

    const [eth, bat, dai, usdc, rep, zrx, wbtc] = await Promise.all(
      coinContracts.map(cToken =>
        dedgeHelpers.compound
          .getAccountSnapshot(signer, cToken.address, proxyAddress)
          .then(res => {
            const isUsdc = cToken.address === cUsdc.address;
            return {
              borrow: process(res.borrowBalance, isUsdc ? 6 : 18),
              supply: process(res.balanceOfUnderlying, isUsdc ? 6 : 18),
            };
          }),
      ),
    );

    setCompoundPositions({
      eth: { ...COINS.eth, ...eth },
      bat: { ...COINS.bat, ...bat },
      dai: { ...COINS.dai, ...dai },
      usdc: { ...COINS.usdc, ...usdc },
      rep: { ...COINS.rep, ...rep },
      zrx: { ...COINS.zrx, ...zrx },
      wbtc: { ...COINS.wbtc, ...wbtc },
    });
    await getApy();
    await getTotals();
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

  return {
    compoundPositions,
    loading,
    getBalances,
    lastRefresh,
    compoundApy,
    totals,
  };
}

const CompoundPositions = createContainer(useCompoundPositions);

export default CompoundPositions;
