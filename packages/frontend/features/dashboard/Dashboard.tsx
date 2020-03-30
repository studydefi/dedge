import { Box, Text, Flex, Flash } from "rimble-ui";
import styled from "styled-components";

import SwapOptions from "../swap-tokens/SwapOptions";
import CurrentPosition from "../position/CurrentPosition";
import ImportVault from "../import-vault/ImportVault";
import Balances from "../position/Balances";
import { LogoText } from "../../components/Logo";

const Container = styled(Flex)`
  // background: yellow;
  height: 100%;
  margin: auto;
  max-width: 1024px;
  flex-direction: column;
`;

const Contents = styled(Flex)`
  height: 100%;
  align-items: flex-start;
  justify-content: space-between;
`;

const DataDisplay = styled(Box)`
  // flex-direction: column;
  // justify-content: space-between;
`;

const Dashboard = () => (
  <Container>
    {/* <Title mb="4">Swap your debt and collateral via Compound</Title> */}
    <Flash>
      <Box>
        <LogoText>Swap debt AND collateral on Compound!</LogoText>
      </Box>
      <Box>
        <Text fontWeight={"bold"}>e.g. Take advantage of a bear market by having your debt go down with
        it.</Text>
      </Box>
      <hr/>
      <Box>
        Please note that this is beta software, use at your own risk. For more
        details, refer to our{" "}
        <Flash.Link target="_blank" rel="noopener noreferrer">
          FAQ
        </Flash.Link>
        .
      </Box>
    </Flash>
    <Contents py="4">
      <SwapOptions />
      <DataDisplay>
        <ImportVault />
        <Balances />
        <CurrentPosition />
      </DataDisplay>
    </Contents>
  </Container>
);

export default Dashboard;
