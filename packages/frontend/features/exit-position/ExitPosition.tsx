import { useState } from "react";
import {
  Box,
  Flex,
  Loader,
  Modal,
  Text,
  Button,
  Heading,
  Card
} from "rimble-ui";

// components
import { ModalBottom, ModalCloseIcon } from "../../components/Modal";

// containers
import ContractsContainer from "../../containers/Contracts";
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";
import CompoundPositions from "../../containers/CompoundPositions";

import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";

const ExitPositionsButton = () => {
  const { address, signer } = ConnectionContainer.useContainer();
  const { getBalances } = CompoundPositions.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();

  // state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState(null);

  // hooks
  const [loading, setLoading] = useState(false);

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  return (
    <Box>
      <Button onClick={openModal}>Exit Positions</Button>

      <Modal isOpen={isOpen}>
        <Card width={"640px"} p={0}>
          <ModalCloseIcon onClick={closeModal} />

          <Box p={4}>
            <Heading.h3 mb="4">Exit Positions</Heading.h3>

            <Box mb="4">
              <Heading.h5 mb="2">Please confirm that you want to:</Heading.h5>
              <Text>
                This will exit both supplied and borrowed positions and convert
                them into ETH
              </Text>
            </Box>

            <Box>
              <Text fontSize="0" color="#999">
                Service Fee: 0.0135% (0.09% to AAVE for flash loan)
              </Text>
            </Box>
          </Box>

          <ModalBottom>
            <Button.Outline onClick={closeModal}>Close</Button.Outline>
            <Button
              ml={3}
              disabled={loading}
              onClick={async () => {
                setLoading(true);

                const { dedgeAddressRegistry, dedgeExitManager } = contracts;

                const {
                  etherToBorrowWeiBN,
                  debtMarkets,
                  collateralMarkets,
                } = await dedgeHelpers.exit.getExitPositionParameters(
                  signer,
                  proxy.address
                );

                const tx = await dedgeHelpers.exit.exitPositionToETH(
                  address,
                  etherToBorrowWeiBN,
                  proxy,
                  dedgeAddressRegistry.address,
                  dedgeExitManager.address,
                  debtMarkets,
                  collateralMarkets
                );
                window.toastProvider.addMessage(`Exiting positions...`, {
                  secondaryMessage: "Check progress on Etherscan",
                  actionHref: `https://etherscan.io/tx/${tx.hash}`,
                  actionText: "Check",
                  variant: "processing",
                });
                await tx.wait();

                window.toastProvider.addMessage(`Exited Positions!`, {
                  variant: "success",
                });

                setLoading(false);
                getBalances();
                closeModal();
              }}
            >
              {loading ? (
                <Flex alignItems="center">
                  <span>Exiting...</span> <Loader color="white" ml="2" />
                </Flex>
              ) : (
                "Exit Position"
              )}
            </Button>
          </ModalBottom>
        </Card>
      </Modal>
    </Box>
  );
};

export default ExitPositionsButton;
