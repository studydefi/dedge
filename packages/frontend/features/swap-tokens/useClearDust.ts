import useClearDustOperation from "./useClearDustOperation";
import ContractsContainer from "../../containers/Contracts";
import CoinContainer from "../../containers/Coins";
import { ethers } from "ethers";
import { Wei } from "../../types";
import { useState } from "react";

const inWei = (x: string, u = 18): Wei => ethers.utils.parseUnits(x, u);

const useSwap = (thingToClear, fromTokenStr, toTokenStr, amountToClear) => {
  const { COINS } = CoinContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { clearDustCollateral, clearDustDebt } = useClearDustOperation();
  const [loading, setLoading] = useState(false);

  const clearDustFunction = async () => {
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
      amountToClear,
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
    if (thingToClear === "debt") {
      window.analytics.track("Clear Dust Start", {
        from: fromTokenStr,
        to: toTokenStr,
        amount: amountToClear,
      });
      const tx = await clearDustDebt(
        ADDRESS_MAP[fromTokenStr],
        ADDRESS_MAP[toTokenStr],
        amount
      );
      window.toastProvider.addMessage(`Clearing dust (debt)...`, {
        secondaryMessage: "Check progress on Etherscan",
        actionHref: `https://etherscan.io/tx/${tx.hash}`,
        actionText: "Check",
        variant: "processing",
      });
      await tx.wait();
      setLoading(false);
      window.toastProvider.addMessage(`Clear Dust (Debt) Success!`, {
        variant: "success",
      });
      window.analytics.track("Clear Dust (Debt) Success", {
        from: fromTokenStr,
        to: toTokenStr,
        amount: amountToClear,
      });
      return;
    }

    // perform swap collateral
    window.analytics.track("Clearing Dust (Collateral) Start", {
      from: fromTokenStr,
      to: toTokenStr,
      amount: amountToClear,
    });
    const tx = await clearDustCollateral(
      ADDRESS_MAP[fromTokenStr],
      ADDRESS_MAP[toTokenStr],
      amount
    );
    window.toastProvider.addMessage(`Clearing dust (collateral)...`, {
      secondaryMessage: "Check progress on Etherscan",
      actionHref: `https://etherscan.io/tx/${tx.hash}`,
      actionText: "Check",
      variant: "processing",
    });
    await tx.wait();

    window.toastProvider.addMessage(`Clear dust (collateral) success!`, {
      variant: "success",
    });
    window.analytics.track("Clear Dust (Collateral) Success", {
      from: fromTokenStr,
      to: toTokenStr,
      amount: amountToClear,
    });
    setLoading(false);
    return;
  };

  return { clearDustFunction, loading };
};

export default useSwap;
