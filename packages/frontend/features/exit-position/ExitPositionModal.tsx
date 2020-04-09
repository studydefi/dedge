import {
  Box,
  Flex,
  Loader,
  Modal,
  Text,
  Button,
  Heading,
  Card,
} from "rimble-ui";

import { ModalBottom, ModalCloseIcon } from "../../components/Modal";
import useExitPosition from "./useExitPosition";

const ExitPositionModal = ({ isOpen, closeModal }) => {
  const { exitPosition, loading } = useExitPosition();

  const handleClick = async () => {
    await exitPosition();
    closeModal();
  };

  return (
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
              Service Fee: 0.135% (0.09% to AAVE for flash loan)
            </Text>
          </Box>
        </Box>

        <ModalBottom>
          <Button.Outline onClick={closeModal}>Close</Button.Outline>
          <Button ml={3} disabled={loading} onClick={handleClick}>
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
  );
};

export default ExitPositionModal;
