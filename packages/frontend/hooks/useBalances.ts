import { ethers } from "ethers";
import { useState, useEffect } from "react";

const weiToString = (wei: ethers.utils.BigNumber, usdc = false) => {
  const { formatUnits, formatEther } = ethers.utils;
  return usdc ? formatUnits(wei.toString(), 6) : formatEther(wei.toString());
};

interface Balances {
  eth: string;
  dai: string;
  bat: string;
  usdc: string;
}

type Contracts = Record<string, ethers.Contract>;
type Provider = ethers.providers.Provider;

const useBalances = (
  contracts: Contracts,
  provider: Provider,
  address: string,
): [Balances, () => Promise<void>] => {
  const [balances, setBalances] = useState<Balances | null>(null);

  const getBalances = async () => {
    const { dai, bat, usdc } = contracts;

    const ethBalanceWei = await provider.getBalance(address);
    const daiBalanceWei = await dai.balanceOf(address);
    const batBalanceWei = await bat.balanceOf(address);
    const usdcBalanceWei = await usdc.balanceOf(address);

    const newBalance = {
      eth: weiToString(ethBalanceWei),
      dai: weiToString(daiBalanceWei),
      bat: weiToString(batBalanceWei),
      usdc: weiToString(usdcBalanceWei, true),
    };

    setBalances(newBalance);
  };

  useEffect(() => {
    if (address && contracts && provider) {
      getBalances();
    }
  }, [address, contracts, provider]);

  return [balances, getBalances];
};

export default useBalances;
