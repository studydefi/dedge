import { ethers } from "ethers";
import { Box, Text, Field, Input, Link, Tooltip } from "rimble-ui";
import styled from "styled-components";

import Select from "../../components/Select";
import SwapConfirm from "./SwapConfirm";

import { useState, useEffect } from "react";

import DACProxyContainer from "../../containers/DACProxy";
import CoinsContainer from "../../containers/Coins";
import ConnectionContainer from "../../containers/Connection";
import ContractsContainer from "../../containers/Contracts";

import useIsAmountAvailable from "./useIsAmountAvailable";
import useSwapResult from "./useSwapResult";

const Container = styled(Box)`
  margin-right: 16px;
  box-shadow: 2px 2px rgba(255, 0, 0, 0.5), 1px -2px rgba(0, 0, 255, 0.5),
    -1px 0px rgba(250, 180, 40, 0.5);
`;

const SwapOptions = () => {
  const { COINS } = CoinsContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { signer } = ConnectionContainer.useContainer();
  const { hasProxy } = DACProxyContainer.useContainer();
  const { stableCoins, volatileCoins } = CoinsContainer.useContainer();

  const [thingToSwap, setThingToSwap] = useState("debt");
  const [fromTokenStr, setFromTokenStr] = useState("dai");
  const [toTokenStr, setToTokenStr] = useState("eth");

  const [receiveAmountAsyncId, setReceiveAmountAsyncId] = useState(null);

  const [amountToReceive, setAmountToReceive] = useState("");
  const [amountToSwap, setAmountToSwap] = useState("");

  const { isAmountAvailable, canSwapAmount } = useIsAmountAvailable(
    amountToSwap,
    fromTokenStr,
    thingToSwap
  );

  const disableConfirm =
    !hasProxy || // not connected or no smart wallet
    fromTokenStr === toTokenStr || // same token
    !isAmountAvailable || // amount not available
    amountToSwap === "" || // no amount specified
    amountToSwap === "0";

  const setMax = () => {
    if (!hasProxy) return;
    setAmountToSwap(canSwapAmount.toString());
  };

  const getAmountToReceive = async () => {
    const { uniswapFactory } = contracts;

    setAmountToReceive(null);

    const fromToken = COINS[fromTokenStr];
    const toToken = COINS[toTokenStr];

    const amountWei = ethers.utils.parseUnits(amountToSwap, fromToken.decimals);

    const receivedWei = await useSwapResult(
      signer,
      uniswapFactory,
      fromToken.address,
      toToken.address,
      amountWei
    );
    // Minus 0.135% in fees if colalteral, else add 0.135%
    const receivedFixed =
      thingToSwap === "debt"
        ? receivedWei.mul(100135).div(100000)
        : receivedWei.mul(99865).div(100000);

    const received = ethers.utils.formatUnits(
      receivedFixed.toString(),
      toToken.decimals
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
    setReceiveAmountAsyncId(setTimeout(getAmountToReceive, 250));
  }, [hasProxy, fromTokenStr, toTokenStr, amountToSwap]);

  return (
    <Container p="3">
      <Box>
        <Field label="I would like to swap" width="100%">
          <Select
            required
            onChange={(e) => setThingToSwap(e.target.value)}
            value={thingToSwap}
          >
            <option value="debt">Debt (borrowed)</option>
            <option value="collateral">Collateral (supplied)</option>
          </Select>
        </Field>
      </Box>

      <Box>
        <Field label="From" width="100%">
          <Select
            required
            value={fromTokenStr}
            onChange={(e) => setFromTokenStr(e.target.value)}
          >
            <optgroup label="Volatile Crypto">
              {volatileCoins.map((coin) => {
                const { key, name } = coin;
                return (
                  <option key={key} value={key}>
                    {name}
                  </option>
                );
              })}
            </optgroup>
            <optgroup label="Stablecoin">
              {stableCoins.map((coin) => {
                const { key, name } = coin;
                return (
                  <option key={key} value={key}>
                    {name}
                  </option>
                );
              })}
            </optgroup>
          </Select>
        </Field>
      </Box>

      <Box>
        <Field label="To" width="100%">
          <Select
            required
            value={toTokenStr}
            onChange={(e) => setToTokenStr(e.target.value)}
          >
            <optgroup label="Volatile Crypto">
              {volatileCoins.map((coin) => {
                const { key, name } = coin;
                return (
                  <option key={key} value={key} disabled={key === fromTokenStr}>
                    {name}
                  </option>
                );
              })}
            </optgroup>
            <optgroup label="Stablecoin">
              {stableCoins.map((coin) => {
                const { key, name } = coin;
                return (
                  <option key={key} value={key} disabled={key === fromTokenStr}>
                    {name}
                  </option>
                );
              })}
            </optgroup>
          </Select>
        </Field>
      </Box>

      <Box mb="3">
        <Field
          mb="0"
          label={`Amount of ${fromTokenStr.toLocaleUpperCase()} to swap`}
        >
          <Input
            type="number"
            required={true}
            placeholder="1337"
            value={amountToSwap}
            onChange={(e) => setAmountToSwap(e.target.value.toString())}
          />
        </Field>
        <Text textAlign="right" opacity={!hasProxy ? "0.5" : "1"}>
          <Link onClick={setMax}>Set max</Link>
        </Text>
      </Box>

      <Box mb="3">
        <Field
          mb="0"
          label={`Converted to ${toTokenStr.toLocaleUpperCase()} (approx)`}
        >
          <Input
            required={true}
            placeholder="1337"
            value={amountToReceive === null ? "...." : amountToReceive}
          />
        </Field>
      </Box>

      <SwapConfirm
        thingToSwap={thingToSwap}
        fromTokenStr={fromTokenStr}
        toTokenStr={toTokenStr}
        amountToSwap={amountToSwap}
        disabled={disableConfirm}
        outline={!hasProxy}
      />
    </Container>
  );
};
export default SwapOptions;
