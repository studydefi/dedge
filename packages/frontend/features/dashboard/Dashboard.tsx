import {
  Modal,
  Card,
  Box,
  Button,
  Heading,
  Text,
  Flex,
  Flash,
} from "rimble-ui";
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
import ContractsContainer from "../../containers/Contracts";
import { ModalBottom, ModalCloseIcon } from "../../components/Modal";

import { useState } from "react";

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
  const { ready } = ContractsContainer.useContainer();
  const { hasProxy } = DACProxyContainer.useContainer();

  const [isModalOpen, setIsModalOpen] = useState(false);

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
          details, refer to our
          <Button.Text onClick={() => setIsModalOpen(true)}>FAQ.</Button.Text>
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

      {address && !ready && (
        <Flash variant="warning" mt="2">
          <Flex alignItems="center" justifyContent="center">
            <Text fontWeight={"bold"} mr="2">
              Contracts not found, are you sure you are on Mainnet?
            </Text>
          </Flex>
        </Flash>
      )}

      {address && ready && !hasProxy && (
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

      <Modal isOpen={isModalOpen}>
        <Card width={"640px"} p={0}>
          <ModalCloseIcon onClick={() => setIsModalOpen(false)} />

          <Box p={4}>
            <Heading.h3 mb="4">FAQ</Heading.h3>

            <Box>
              <Heading.h5 mb="2">Q: Does your cat have an Instagram page?</Heading.h5>
              <Text>
                <a href="https://www.instagram.com/mr.miso.oz">Yes</a>
              </Text>
            </Box>

            <br />

            <Box mb="4">
              <Heading.h5 mb="2">Q: How can I start using this?</Heading.h5>
              <Text>
                1. Create a vault with MakerDAO <br />
                2. Create a smart-wallet on dedge.exchange <br />
                3. Import that vault into dedge.exchange <br />
                4. Start swapping your debt/collateral!
              </Text>
            </Box>

            <Box>
              <Heading.h5 mb="2">Q: Does Dedge have access to my funds?</Heading.h5>
              <Text>No</Text>
            </Box>

            <br />

            <Box>
              <Heading.h5 mb="2">Q: What is the smart wallet for?</Heading.h5>
              <Text>
                The smart wallet allows us to perform atomic transactions on
                your behalf. For example, taking out a loan and repaying your
                debt.
              </Text>
            </Box>
          </Box>

          <ModalBottom>
            <Button.Outline onClick={() => setIsModalOpen(false)}>
              Close
            </Button.Outline>
          </ModalBottom>
        </Card>
      </Modal>
    </Container>
  );
};

export default Dashboard;
