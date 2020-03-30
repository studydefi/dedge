import { Box, Text, Field, Input, Button, Tooltip } from "rimble-ui";
import styled from "styled-components";

import Select from "../../components/Select";
import DACProxyContainer from "../../containers/DACProxy";

const Container = styled(Box)`
  box-shadow: 2px 2px rgba(255, 0, 0, 0.5), 1px -2px rgba(0, 0, 255, 0.5),
    -1px 0px rgba(250, 180, 40, 0.5);
`;

const SwapOptions = () => {
  const { proxy } = DACProxyContainer.useContainer();
  return (
    <Container p="3">
      <Box>
        <Field label="I would like to swap" width="100%">
          <Select required>
            <option value="debt">Debt</option>
            <option value="collateral">Collateral</option>
          </Select>
        </Field>
      </Box>

      <Box>
        <Field label="From Token A" width="100%">
          <Select required>
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
        <Field label="To Token B" width="100%">
          <Select required>
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
        <Field label="Amount of Token A to swap">
          <Input type="text" required={true} placeholder="1.0" />
        </Field>
      </Box>

      {!proxy ? (
          <Box>
            <Button width="100%" disabled>
              Swap
            </Button>
          </Box>
      ) : (
        <Button width="100%">Swap</Button>
      )}
    </Container>
  );
};
export default SwapOptions;
