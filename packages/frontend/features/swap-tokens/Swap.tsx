import {
  Box,
  Text,
  Field,
  Input,
  Link
} from "rimble-ui";

import Select from "../../components/Select";
import SwapConfirm from "./SwapConfirm";

import DACProxyContainer from "../../containers/DACProxy";
import { useState } from "react";
import CoinsContainer from "../../containers/Coins";
import useIsAmountAvailable from "./useIsAmountAvailable";

const Swap = () => {
  const { hasProxy } = DACProxyContainer.useContainer();
  const { stableCoins, volatileCoins } = CoinsContainer.useContainer();

  const [thingToSwap, setThingToSwap] = useState("debt");
  const [fromTokenStr, setFromTokenStr] = useState("dai");
  const [toTokenStr, setToTokenStr] = useState("eth");
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

  return (
    <>
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

      <SwapConfirm
        thingToSwap={thingToSwap}
        fromTokenStr={fromTokenStr}
        toTokenStr={toTokenStr}
        amountToSwap={amountToSwap}
        disabled={disableConfirm}
        outline={!hasProxy}
      />
    </>
  );
};
export default Swap;
