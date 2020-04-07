import { useState } from "react";
import {
  Box,
  Flex,
  Loader,
  Modal,
  Text,
  Button,
  Heading,
  Card,
  Icon,
} from "rimble-ui";

import { ModalBottom, ModalCloseIcon } from "../../components/Modal";

import CoinsContainer from "../../containers/Coins";
import useSwap from "./useSwap";
import CompoundPositions from "../../containers/CompoundPositions";

const SwapConfirm = ({
  thingToSwap,
  fromTokenStr,
  toTokenStr,
  amountToSwap,
  disabled,
  outline,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const { COINS } = CoinsContainer.useContainer();
  const { getBalances } = CompoundPositions.useContainer();
  const { swapFunction, loading } = useSwap(
    thingToSwap,
    fromTokenStr,
    toTokenStr,
    amountToSwap,
  );

  const fromToken = COINS[fromTokenStr];
  const toToken = COINS[toTokenStr];

  const MyButton = outline ? Button.Outline : Button;

  return (
    <Box>
      <MyButton width="100%" onClick={openModal} disabled={disabled}>
        <Flex alignItems="center">
          <span>Confirm</span>
          <Icon name="Launch" color={outline ? "primary" : "white"} ml="2" />
        </Flex>
      </MyButton>
      {thingToSwap === "collateral" && (
        <>
          <Text fontSize="0" color="#999" fontWeight="bold" mt="2">
            Due to nature of slippages:
          </Text>
          <Text fontSize="0" color="#999">
            MAX: 95% (90% recommended)
          </Text>
        </>
      )}

      <Modal isOpen={isOpen}>
        <Card width={"640px"} p={0}>
          <ModalCloseIcon onClick={closeModal} />

          <Box p={4} pb={1}>
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

            <Box>
              <Text fontSize="0" color="#999">
                Service Fee: 0.135% (0.09% to AAVE for flash loan)
              </Text>
            </Box>
          </Box>

          <ModalBottom>
            <Button.Outline onClick={closeModal}>Close</Button.Outline>
            <Button
              ml={3}
              disabled={loading}
              onClick={async () => {
                await swapFunction();
                getBalances();
                closeModal();
              }}
            >
              {loading ? (
                <Flex alignItems="center">
                  <span>Swapping...</span> <Loader color="white" ml="2" />
                </Flex>
              ) : (
                "Perform swap"
              )}
            </Button>
          </ModalBottom>
        </Card>
      </Modal>
    </Box>
  );
};

export default SwapConfirm;
