import ContractsContainer from "../containers/Contracts";
import ProxiesContainer from "../containers/Proxies";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

const useCompoundPosition = () => {
  const { contracts } = ContractsContainer.useContainer();
  const { dedgeProxyAddr } = ProxiesContainer.useContainer();

  const [supplied, setSupplied] = useState(null);
  const [borrowed, setBorrowed] = useState(null);

  const getPositions = async () => {
    const { cEther, cDai, cBat, cUsdc, cZrx } = contracts;

    // supply balances
    const ethSupplyWei = await cEther.balanceOfUnderlying(dedgeProxyAddr);
    const usdcSupplyWei = await cUsdc.balanceOfUnderlying(dedgeProxyAddr);

    const supplyBalance = {
      eth: ethers.utils.formatEther(ethSupplyWei.toString()),
      usdc: ethers.utils.formatUnits(usdcSupplyWei.toString(), 6),
    };

    setSupplied(supplyBalance);

    // borrow balances
    const ethBorrowWei = await cEther.borrowBalanceStored(dedgeProxyAddr);
    const daiBorrowWei = await cDai.borrowBalanceStored(dedgeProxyAddr);
    const batBorrowWei = await cBat.borrowBalanceStored(dedgeProxyAddr);
    const usdcBorrowWei = await cUsdc.borrowBalanceStored(dedgeProxyAddr);
    const zrxBorrowWei = await cZrx.borrowBalanceStored(dedgeProxyAddr);

    const borrowBalance = {
      eth: ethers.utils.formatEther(ethBorrowWei.toString()),
      dai: ethers.utils.formatEther(daiBorrowWei.toString()),
      bat: ethers.utils.formatEther(batBorrowWei.toString()),
      usdc: ethers.utils.formatUnits(usdcBorrowWei.toString(), 6),
      zrx: ethers.utils.formatEther(zrxBorrowWei.toString()),
    };

    setBorrowed(borrowBalance);
  };

  useEffect(() => {
    if (contracts && dedgeProxyAddr) {
      getPositions();
    }
  }, [dedgeProxyAddr, contracts]);

  return [supplied, borrowed];
};

export default useCompoundPosition;
