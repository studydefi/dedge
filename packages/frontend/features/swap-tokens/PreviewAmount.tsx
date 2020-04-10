import { useState, useEffect } from "react";
import { Box, Text, Field, Input, Link, Tooltip } from "rimble-ui";

import CoinsContainer from "../../containers/Coins";
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";
import ContractsContainer from "../../containers/Contracts";

import useGetAmountToReceive from "./useGetAmountToReceive";

const PreviewAmount = ({
  thingToSwap,
  fromTokenStr,
  toTokenStr,
  amountToSwap,
}) => {
  const { COINS } = CoinsContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { signer } = ConnectionContainer.useContainer();
  const { hasProxy } = DACProxyContainer.useContainer();

  const [receiveAmountAsyncId, setReceiveAmountAsyncId] = useState(null);

  const [amountToReceive, setAmountToReceive] = useState("");
  const updateResultAmount = async () => {
    setAmountToReceive(null);

    const received = await useGetAmountToReceive(
      signer,
      contracts.uniswapFactory,
      thingToSwap,
      COINS[fromTokenStr],
      amountToSwap,
      COINS[toTokenStr],
    );

    setAmountToReceive(received.toString());
  };

  useEffect(() => {
    if (!signer) return;
    if (!hasProxy) return;
    if (parseFloat(amountToSwap) === 0) return;
    if (isNaN(parseFloat(amountToSwap))) return;

    if (receiveAmountAsyncId !== null) {
      clearTimeout(receiveAmountAsyncId);
    }

    setReceiveAmountAsyncId(setTimeout(updateResultAmount, 250));
  }, [hasProxy, fromTokenStr, toTokenStr, amountToSwap]);

  return (
    <Box mb="3">
      <Field
        mb="0"
        label={`Converted to ${toTokenStr.toLocaleUpperCase()} (approx)`}
      >
        <Input
          readOnly
          required={true}
          placeholder="1337"
          value={amountToReceive === null ? "...." : amountToReceive}
        />
      </Field>
    </Box>
  );
};

export default PreviewAmount;
