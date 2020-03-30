import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ContractsContainer from "./Contracts";
import DACProxyContainer from "./DACProxy";

type Provider = ethers.providers.Provider;
type Signer = ethers.Signer;

function useCompoundPositions() {
  const [compoundPositions, setCompoundPositions] = useState({});

  const { contracts } = ContractsContainer.useContainer();
  const { proxyAddress } = DACProxyContainer.useContainer();

  const getBalances = async () => {
    const { cEther, cBat, cDai, cUsdc } = contracts;

    console.log("fetching Compound balances")

    // borrow balances
    const bEth = await cEther.borrowBalanceStored(proxyAddress);
    const bBat = await cBat.borrowBalanceStored(proxyAddress);
    const bDai = await cDai.borrowBalanceStored(proxyAddress);
    const bUsdc = await cUsdc.borrowBalanceStored(proxyAddress);

    // supply balances
    const sEth = await cEther.balanceOfUnderlying(proxyAddress);
    const sBat = await cBat.balanceOfUnderlying(proxyAddress);
    const sDai = await cDai.balanceOfUnderlying(proxyAddress);
    const sUsdc = await cUsdc.balanceOfUnderlying(proxyAddress);

    const process = (x, u = 18) =>
      ethers.utils.formatUnits(x.toString(), u).toString();

    setCompoundPositions({
      eth: { supply: process(sEth), borrow: process(bEth) },
      bat: { supply: process(sBat), borrow: process(bBat) },
      dai: { supply: process(sDai), borrow: process(bDai) },
      usdc: { supply: process(sUsdc, 6), borrow: process(bUsdc, 6) },
    });
  };

  useEffect(() => {
    if (proxyAddress) {
      getBalances();
    }
  }, [contracts, proxyAddress]);

  return { compoundPositions };
}

const CompoundPositions = createContainer(useCompoundPositions);

export default CompoundPositions;
