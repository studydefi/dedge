import {
  Box,
  Text,
  Icon,
  Heading,
  Flex,
  Table,
  Button,
  Loader,
} from "rimble-ui";
import styled from "styled-components";

import CompoundPositions from "../../containers/CompoundPositions";

import FromMakerDAO from "../import-vault/FromMakerDAO";
import ExitPosition from "../exit-position/ExitPosition";

const ControlsContainer = styled(Box)`
  background: white;
  // border: 1px solid rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

const RefreshButton = () => {
  const { loading, getBalances } = CompoundPositions.useContainer();
  if (!loading) {
    return (
      <Button.Outline onClick={getBalances}>Refresh Balances</Button.Outline>
    );
  }

  return (
    <Button.Outline disabled>
      <Flex alignItems="center">
        <Box mr="2">Fetching Balances</Box> <Loader />
      </Flex>
    </Button.Outline>
  );
};

const RefreshTime = styled(Box)`
  font-size: 12px;
  color: grey;
  position: absolute;
  bottom: 2px;
  right: 4px;
  text-align: right;
`;

const Controls = ({ notConnected }) => {
  const { lastRefresh } = CompoundPositions.useContainer();

  return (
    <ControlsContainer py="4" px="1">
      <FromMakerDAO />
      {notConnected ? (
        <Button.Outline disabled>Exit Positions</Button.Outline>
      ) : (
        <ExitPosition />
      )}
      {notConnected ? (
        <Button.Outline disabled>Refresh Balances</Button.Outline>
      ) : (
        <RefreshButton />
      )}
      {lastRefresh && (
        <RefreshTime>
          Last refresh: {lastRefresh.toLocaleTimeString()}
        </RefreshTime>
      )}
    </ControlsContainer>
  );
};

export default Controls;
