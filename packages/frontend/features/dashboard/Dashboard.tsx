import { Box, Text, Flex, Flash } from "rimble-ui";
import styled from "styled-components";

import SwapOptions from "../swap-tokens/SwapOptions";
import CurrentPosition from "../position/CurrentPosition";
import ImportVault from "../import-vault/ImportVault";
import Balances from "../position/Balances";
import { LogoText } from "../../components/Logo";
import MetaMask from "../topbar/MetaMask";
import SmartWallet from "../topbar/SmartWallet";
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";

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

const Dashboard = () => {
  const { address } = ConnectionContainer.useContainer();
  const { hasProxy } = DACProxyContainer.useContainer();
  return (
    <Container>
      {/* <Title mb="4">Swap your debt and collateral via Compound</Title> */}
      <Flash>
        <Box>
          <LogoText>Swap debt AND collateral on Compound!</LogoText>
        </Box>
        <Box>
          <Text fontWeight={"bold"}>
            e.g. Take advantage of a bear market by having your debt go down
            with it.
          </Text>
        </Box>
        <hr />
        <Box>
          Please note that this is beta software, use at your own risk. For more
          details, refer to our{" "}
          <Flash.Link target="_blank" rel="noopener noreferrer">
            FAQ
          </Flash.Link>
          .
        </Box>
      </Flash>

      {!address && (
        <Flash variant="warning" mt="2">
          <Flex alignItems="center" justifyContent="center">
            <Text fontWeight={"bold"}>Please connect to MetaMask:</Text>
            <MetaMask size="medium" outline={false} />
          </Flex>
        </Flash>
      )}

      {address && !hasProxy && (
          <Flash variant="warning" mt="2">
            <Flex alignItems="center" justifyContent="center">
              <Text fontWeight={"bold"} mr="2">
                Please create a Smart Wallet:
              </Text>
              <SmartWallet size="medium" outline={false} />
            </Flex>
          </Flash>
        )}

      <Contents py="4">
        <SwapOptions />
        <DataDisplay>
          {/* <ImportVault /> */}
          <Balances />
          <CurrentPosition />
        </DataDisplay>
      </Contents>
    </Container>
  );
};

export default Dashboard;
