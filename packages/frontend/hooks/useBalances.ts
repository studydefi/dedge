import { ethers } from "ethers";
import { useState, useEffect } from "react";

const weiToString = (wei, usdc = false) => {
  const { formatUnits, formatEther } = ethers.utils;
  return usdc ? formatUnits(wei.toString(), 6) : formatEther(wei.toString());
};

const useBalances = (contracts, provider, address) => {
  const [balances, setBalances] = useState(null);

  const getBalances = async () => {
    const { dai, bat, usdc } = contracts;

    const ethBalanceWei = await provider.getBalance(address);
    const daiBalanceWei = await dai.balanceOf(address);
    const batBalanceWei = await bat.balanceOf(address);
    const usdcBalanceWei = await usdc.balanceOf(address);

    setBalances({
      eth: weiToString(ethBalanceWei),
      dai: weiToString(daiBalanceWei),
      bat: weiToString(batBalanceWei),
      usdc: weiToString(usdcBalanceWei, true),
    });
  };

  useEffect(() => {
    if (address && contracts && provider) {
      getBalances();
    }
  }, [address, contracts, provider]);

  return [balances, getBalances];
};

export default useBalances;
