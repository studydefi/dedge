import { useState, useEffect } from "react";

import CoinsContainer from "../../containers/Coins";
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";
import ContractsContainer from "../../containers/Contracts";

import getPreviewAmount from "./utils/getPreviewAmount";

const usePreviewAmount = (
  thingToSwap,
  fromTokenStr,
  toTokenStr,
  amountToSwap,
) => {
  const { COINS } = CoinsContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { signer } = ConnectionContainer.useContainer();
  const { hasProxy } = DACProxyContainer.useContainer();

  const [amountToReceive, setAmountToReceive] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);

  const updateResultAmount = async () => {
    setLoading(true);

    const received = await getPreviewAmount(
      signer,
      contracts.uniswapFactory,
      thingToSwap,
      COINS[fromTokenStr],
      amountToSwap,
      COINS[toTokenStr],
    );

    setAmountToReceive(received.toString());
    setLoading(false);
  };

  useEffect(() => {
    if (!signer) return;
    if (!hasProxy) return;
    if (parseFloat(amountToSwap) === 0) return;
    if (isNaN(parseFloat(amountToSwap))) return;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    setTimeoutId(setTimeout(updateResultAmount, 250));
  }, [hasProxy, fromTokenStr, toTokenStr, amountToSwap]);

  return { amountToReceive, loading };
};

export default usePreviewAmount;
