import { useState } from "react";
import { Box, Modal, Text, Button, Heading, Card, EthAddress } from "rimble-ui";

import { ModalBottom, ModalCloseIcon } from "../../components/Modal";

import CoinsContainer from "../../containers/Coins";
import useSwap from "./useSwap";

const SwapConfirm = ({
  thingToSwap,
  fromTokenStr,
  toTokenStr,
  amountToSwap,
  disabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const { COINS } = CoinsContainer.useContainer();
  const { swapFunction } = useSwap(
    thingToSwap,
    fromTokenStr,
    toTokenStr,
    amountToSwap,
  );

  const fromToken = COINS[fromTokenStr];
  const toToken = COINS[toTokenStr];

  return (
    <Box>
      <Button width="100%" onClick={openModal} disabled={disabled}>
        Confirm
      </Button>

      <Modal isOpen={isOpen}>
        <Card width={"640px"} p={0}>
          <ModalCloseIcon onClick={closeModal} />

          <Box p={4}>
            <Heading.h3 mb="4">
              Swap {thingToSwap} from {fromToken.symbol} to {toToken.symbol}
            </Heading.h3>

            <Box mb="4">
              <Heading.h5 mb="2">Please confirm that you want to:</Heading.h5>
              <Text>
                Swap {amountToSwap} {fromToken.symbol} of {thingToSwap} to{" "}
                {toToken.symbol}
              </Text>
            </Box>
          </Box>

          <ModalBottom>
            <Button.Outline onClick={closeModal}>Close</Button.Outline>
            <Button ml={3} onClick={swapFunction}>
              Perform Swap
            </Button>
          </ModalBottom>
        </Card>
      </Modal>
    </Box>
  );
};

export default SwapConfirm;
