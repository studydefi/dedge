import { Box, Text, Field, Input, Button, Tooltip } from "rimble-ui";
import styled from "styled-components";

import Select from "../../components/Select";
import DACProxyContainer from "../../containers/DACProxy";
import useSwapOperation from "./useSwapOperation";
import ContractsContainer from "../../containers/Contracts";
import { ethers } from "ethers";
import { useState } from "react";

const Container = styled(Box)`
  box-shadow: 2px 2px rgba(255, 0, 0, 0.5), 1px -2px rgba(0, 0, 255, 0.5),
    -1px 0px rgba(250, 180, 40, 0.5);
`;

const SwapOptions = () => {
  const { proxy } = DACProxyContainer.useContainer();

  const [thingToSwap, setThingToSwap] = useState("debt");
  const [fromTokenStr, setFromTokenStr] = useState("dai");
  const [toTokenStr, setToTokenStr] = useState("eth");
  const [amountToSwap, setAmountToSwap] = useState("");
  const swap = () => {
    console.log(
      `I want to swap ${amountToSwap} ${fromTokenStr} of my ${thingToSwap} to ${toTokenStr}`,
    );
    // const { contracts } = ContractsContainer.useContainer();
    // const { swapDebt, swapCollateral } = useSwapOperation();
    // const { cEther, cDai, cBat } = contracts;
    // const amount = ethers.utils.parseEther("100");
    // swapDebt(cDai.address, cEther.address, amount);
    // swapCollateral(cEther.address, cBat.address, ethers.utils.parseEther("1"))
  };

  return (
    <Container p="3">
      <Box>
        <Field label="I would like to swap" width="100%">
          <Select
            required
            onChange={e => setThingToSwap(e.target.value)}
            value={thingToSwap}
          >
            <option value="debt">Debt</option>
            <option value="collateral">Collateral</option>
          </Select>
        </Field>
      </Box>

      <Box>
        <Field label="From" width="100%">
          <Select
            required
            value={fromTokenStr}
            onChange={e => setFromTokenStr(e.target.value)}
          >
            <optgroup label="Volatile Crypto">
              <option value="eth">Ethereum</option>
              <option value="bat">Basic Attention Token</option>
            </optgroup>
            <optgroup label="Stablecoin">
              <option value="dai">DAI</option>
              <option value="usdc">USD Coin</option>
            </optgroup>
          </Select>
        </Field>
      </Box>

      <Box>
        <Field label="To" width="100%">
          <Select
            required
            value={toTokenStr}
            onChange={e => setToTokenStr(e.target.value)}
          >
            <optgroup label="Volatile Crypto">
              <option value="eth">Ethereum</option>
              <option value="bat">Basic Attention Token</option>
            </optgroup>
            <optgroup label="Stablecoin">
              <option value="dai">DAI</option>
              <option value="usdc">USD Coin</option>
            </optgroup>
          </Select>
        </Field>
      </Box>

      <Box>
        <Field label={`Amount of ${fromTokenStr.toLocaleUpperCase()} to swap`}>
          <Input
            type="number"
            required={true}
            placeholder="1.0"
            value={amountToSwap}
            onChange={e => setAmountToSwap(e.target.value)}
          />
        </Field>
      </Box>

      {!proxy ? (
        <Box>
          <Button width="100%" disabled>
            Swap
          </Button>
        </Box>
      ) : (
        <Button width="100%" onClick={swap}>
          Swap
        </Button>
      )}
    </Container>
  );
};
export default SwapOptions;
