import { Heading, Flex } from "rimble-ui";
import styled from "styled-components";

import SwapOptions from "../swap-tokens/SwapOptions";
import CurrentPosition from "../position/CurrentPosition";
import Import from "../import/Import";
import Balances from "../position/Balances";

const Container = styled(Flex)`
  // background: yellow;
  height: 100%;
  flex-direction: column;
`;

const Contents = styled(Flex)`
  height: 100%;
  align-items: center;
  justify-content: space-around;
`;

const Title = styled(Heading)`
  color: dimgrey;
`;

const DataDisplay = styled(Flex)`
  flex-direction: column;
  justify-content: space-between;
`;

const Dashboard = () => (
  <Container p="4">
    <Title mb="4">Swap your debt and collateral via Compound</Title>
    <Contents>
      <SwapOptions />
      <DataDisplay>
        <Balances />
        <Import />
        <CurrentPosition />
      </DataDisplay>
    </Contents>
  </Container>
);

export default Dashboard;
