import { Box, Text, Field, Input, Link, Loader } from "rimble-ui";

import Select from "../../components/Select";
import ClearDustConfirm from "./ClearDustConfirm";

import DACProxyContainer from "../../containers/DACProxy";
import ContractContainer from "../../containers/Contracts";
import CompoundPositions from "../../containers/CompoundPositions";
import CoinsContainer from "../../containers/Coins";

import { useState, useEffect } from "react";
import useDustCanSwapAmount from "./useDustCanSwapAmount";

const ClearDust = () => {
  const { contracts } = ContractContainer.useContainer();
  const { compoundPositions } = CompoundPositions.useContainer();
  const { proxyAddress, hasProxy } = DACProxyContainer.useContainer();
  const { COINS, stableCoins, volatileCoins } = CoinsContainer.useContainer();

  const [thingToClear, setThingToClear] = useState("debt");
  const [fromTokenStr, setFromTokenStr] = useState("dai");
  const [toTokenStr, setToTokenStr] = useState("eth");
  const [amountToClear, setAmountToClear] = useState("");

  const [gettingMax, setGettingMax] = useState(false);
  const [isConfirmDisabled, setIsConfirmDisabled] = useState(true);

  const tokenBalance =
    compoundPositions[fromTokenStr] === undefined
      ? null
      : thingToClear === "debt"
      ? compoundPositions[fromTokenStr].borrow
      : compoundPositions[fromTokenStr].supply;

  const getClearDustInfo = async () => {
    if (!hasProxy) return;
    if (tokenBalance === null) return

    setGettingMax(true);
    const cTokenAddress = COINS[fromTokenStr].cTokenEquilaventAddress;

    const { compoundComptroller, compoundPriceOracle } = contracts;

    const { canSwapAmount } = await useDustCanSwapAmount(
      thingToClear,
      proxyAddress,
      cTokenAddress,
      tokenBalance,
      compoundPositions[fromTokenStr].decimals,
      compoundComptroller,
      compoundPriceOracle
    );

    const amountFloat = parseFloat(amountToClear);

    const disableConfirm =
      !hasProxy || // not connected or no smart wallet
      fromTokenStr === toTokenStr || // same token
      amountFloat > tokenBalance || // can't swap more than what you have
      amountToClear === "" || // no amount specified
      amountFloat.toString() === "0" ||
      isNaN(amountFloat);

    setIsConfirmDisabled(disableConfirm);
    setAmountToClear(canSwapAmount.toString());
    setGettingMax(false);
  };

  useEffect(() => {
    if (hasProxy && tokenBalance !== null) {
      getClearDustInfo();
    }
  }, [
    hasProxy,
    thingToClear,
    fromTokenStr,
    toTokenStr,
    hasProxy,
    amountToClear,
  ]);

  return (
    <>
      <Box>
        <Field label="I would like to clear dust of" width="100%">
          <Select
            required
            onChange={(e) => setThingToClear(e.target.value)}
            value={thingToClear}
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
          label={`Amount of ${fromTokenStr.toLocaleUpperCase()} dust to clear`}
        >
          <Input
            type="number"
            required={true}
            placeholder="1337"
            value={amountToClear}
          />
        </Field>
        <Text textAlign="right" opacity={!hasProxy ? "0.5" : "1"}>
          {gettingMax ? (
            <div
              style={{
                float: "right",
                paddingTop: "4px",
                paddingBottom: "20px",
              }}
            >
              <Loader />
            </div>
          ) : (
            <div
              style={{
                paddingBottom: "24px",
              }}
            ></div>
          )}
        </Text>
      </Box>

      <ClearDustConfirm
        thingToClear={thingToClear}
        fromTokenStr={fromTokenStr}
        toTokenStr={toTokenStr}
        amountToClear={amountToClear}
        disabled={isConfirmDisabled}
        outline={!hasProxy}
      />
    </>
  );
};
export default ClearDust;
