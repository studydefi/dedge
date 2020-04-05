import useSwapOperation from "./useSwapOperation";
import ContractsContainer from "../../containers/Contracts";
import { ethers } from "ethers";
import { Wei } from "../../types";
import { useState } from "react";

const inWei = (x: string, u = 18): Wei => ethers.utils.parseUnits(x, u);

const useSwap = (thingToSwap, fromTokenStr, toTokenStr, amountToSwap) => {
  const { contracts } = ContractsContainer.useContainer();
  const { swapDebt, swapCollateral } = useSwapOperation();
  const [loading, setLoading] = useState(false);

  const swapFunction = async () => {
    setLoading(true);
    const { cEther, cDai, cBat, cUsdc, cRep, cZrx, cWbtc } = contracts;

    const amount: Wei =
      fromTokenStr === "usdc" ? inWei(amountToSwap, 6) : inWei(amountToSwap);

    const ADDRESS_MAP = {
      eth: cEther.address,
      bat: cBat.address,
      dai: cDai.address,
      usdc: cUsdc.address,
      rep: cRep.address,
      zrx: cZrx.address,
      wbtc: cWbtc.address,
    };

    // perform swap debt
    if (thingToSwap === "debt") {
      window.analytics.track("Swap Debt Start", {
        from: fromTokenStr,
        to: toTokenStr,
        amount: amountToSwap,
      });
      const tx = await swapDebt(
        ADDRESS_MAP[fromTokenStr],
        ADDRESS_MAP[toTokenStr],
        amount,
      );
      window.toastProvider.addMessage(`Swapping debt...`, {
        secondaryMessage: "Check progress on Etherscan",
        actionHref: `https://etherscan.io/tx/${tx.hash}`,
        actionText: "Check",
        variant: "processing",
      });
      await tx.wait();
      window.toastProvider.addMessage(`Swap Debt Success!`, {
        variant: "success",
      });
      window.analytics.track("Swap Debt Success", {
        from: fromTokenStr,
        to: toTokenStr,
        amount: amountToSwap,
      });
      return;
    }

    // perform swap collateral
    window.analytics.track("Swap Collateral Start", {
      from: fromTokenStr,
      to: toTokenStr,
      amount: amountToSwap,
    });
    const tx = await swapCollateral(
      ADDRESS_MAP[fromTokenStr],
      ADDRESS_MAP[toTokenStr],
      amount,
    );
    window.toastProvider.addMessage(`Swapping collateral...`, {
      secondaryMessage: "Check progress on Etherscan",
      actionHref: `https://etherscan.io/tx/${tx.hash}`,
      actionText: "Check",
      variant: "processing",
    });
    await tx.wait();
    window.toastProvider.addMessage(`Swap Collateral Success!`, {
      variant: "success",
    });
    window.analytics.track("Swap Collateral Success", {
      from: fromTokenStr,
      to: toTokenStr,
      amount: amountToSwap,
    });
    setLoading(false);
    return;
  };

  return { swapFunction, loading };
};

export default useSwap;
