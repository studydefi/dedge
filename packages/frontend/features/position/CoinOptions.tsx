import {
  Button,
  Modal,
  Card,
  Box,
  Flex,
  Text,
  Field,
  Input,
  Heading,
} from "rimble-ui";
import DACProxyContainer from "../../containers/DACProxy";
import { useState } from "react";
import { ModalCloseIcon, ModalBottom } from "../../components/Modal";
import CoinsContainer from "../../containers/Coins";

import SupplyCoin from "./SupplyCoin";
import BorrowCoin from "./BorrowCoin";

const CoinOptions = ({ symbol }) => {
  const { hasProxy } = DACProxyContainer.useContainer();
  const { COINS } = CoinsContainer.useContainer();
  const [isOpen, setIsOpen] = useState(false);

  const coin = COINS[symbol.toLowerCase()];

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <Button.Outline
        icon="MoreHoriz"
        size="small"
        icononly
        disabled={!hasProxy}
        onClick={openModal}
      />

      <Modal isOpen={isOpen}>
        <Card width={"640px"} p={0}>
          <ModalCloseIcon onClick={closeModal} />

          <Box p={4}>
            <Heading.h3 mb="4">Options for {coin.name}</Heading.h3>
            <Flex mb="4" justifyContent="space-around" textAlign="center">
              <SupplyCoin coin={coin} />
              <BorrowCoin coin={coin} />
            </Flex>
          </Box>

          <ModalBottom>
            <Button.Outline onClick={closeModal}>Close</Button.Outline>
          </ModalBottom>
        </Card>
      </Modal>
    </>
  );
};

export default CoinOptions;
