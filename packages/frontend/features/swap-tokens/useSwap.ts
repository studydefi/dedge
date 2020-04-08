import useSwapOperation from "./useSwapOperation";
import ContractsContainer from "../../containers/Contracts";
import CoinContainer from "../../containers/Coins";
import { ethers } from "ethers";
import { Wei } from "../../types";
import { useState } from "react";

const inWei = (x: string, u = 18): Wei => ethers.utils.parseUnits(x, u);

const useSwap = (thingToSwap, fromTokenStr, toTokenStr, amountToSwap) => {
  const { COINS } = CoinContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { swapDebt, swapCollateral } = useSwapOperation();
  const [loading, setLoading] = useState(false);

  const swapFunction = async () => {
    setLoading(true);
    const { cEther, cDai, cBat, cUsdc, cRep, cZrx, cWbtc } = contracts;

    const COINS_ADDRESS_DECIMALS_MAP = {
      [COINS.eth.symbol.toLowerCase()]: COINS.eth.decimals,
      [COINS.dai.symbol.toLowerCase()]: COINS.dai.decimals,
      [COINS.bat.symbol.toLowerCase()]: COINS.bat.decimals,
      [COINS.usdc.symbol.toLowerCase()]: COINS.usdc.decimals,
      [COINS.rep.symbol.toLowerCase()]: COINS.rep.decimals,
      [COINS.zrx.symbol.toLowerCase()]: COINS.zrx.decimals,
      [COINS.wbtc.symbol.toLowerCase()]: COINS.wbtc.decimals,
    };

    const amount: Wei = inWei(
      amountToSwap,
      COINS_ADDRESS_DECIMALS_MAP[fromTokenStr.toLowerCase()]
    );

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
      let tx = null;

      try {
        await swapDebt(
          ADDRESS_MAP[fromTokenStr],
          ADDRESS_MAP[toTokenStr],
          amount
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
      } catch (e) {
        if (tx === null) {
          window.toastProvider.addMessage(`Transaction cancelled`, {
            variant: "failure",
          });
        } else {
          window.toastProvider.addMessage(`Failed to swap debt...`, {
            secondaryMessage: "Check reason on Etherscan",
            actionHref: `https://etherscan.io/tx/${tx.hash}`,
            actionText: "Check",
            variant: "failure",
          });
        }
        setLoading(false);
        return;
      }
      
      setLoading(false);
      return;
    }

    // perform swap collateral
    window.analytics.track("Swap Collateral Start", {
      from: fromTokenStr,
      to: toTokenStr,
      amount: amountToSwap,
    });
    let tx = null;

    try {
      tx = await swapCollateral(
        ADDRESS_MAP[fromTokenStr],
        ADDRESS_MAP[toTokenStr],
        amount
      );
      window.toastProvider.addMessage(`Swapping collateral...`, {
        secondaryMessage: "Check progress on Etherscan",
        actionHref: `https://etherscan.io/tx/${tx.hash}`,
        actionText: "Check",
        variant: "processing",
      });
      await tx.wait();
      setLoading(false);

      window.toastProvider.addMessage(`Swap Collateral Success!`, {
        variant: "success",
      });
      window.analytics.track("Swap Collateral Success", {
        from: fromTokenStr,
        to: toTokenStr,
        amount: amountToSwap,
      });
    } catch (e) {
      if (tx === null) {
        window.toastProvider.addMessage(`Transaction cancelled`, {
          variant: "failure",
        });
      } else {
        window.toastProvider.addMessage(`Failed to swap collateral...`, {
          secondaryMessage: "Check reason on Etherscan",
          actionHref: `https://etherscan.io/tx/${tx.hash}`,
          actionText: "Check",
          variant: "failure",
        });
      }
      setLoading(false);
      return;
    }
  };

  return { swapFunction, loading };
};

export default useSwap;
