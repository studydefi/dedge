import {
  Button,
  Modal,
  Card,
  Box,
  Flex,
  Pill,
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
import WithdrawCoin from "./WithdrawCoin";
import RepayCoin from "./RepayCoin";

enum TAB_OPTIONS {
  Borrow,
  Repay,
  Supply,
  Withdraw,
}

const CoinOptions = ({ symbol }) => {
  const { hasProxy } = DACProxyContainer.useContainer();
  const { COINS } = CoinsContainer.useContainer();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(TAB_OPTIONS.Borrow);

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
            <Box m="auto">
              <Flex px={4} mx={2} borderColor="#E8E8E8" justifyContent="center">
                <Box width={0.5} textAlign="center">
                  <Heading.h5 textAlign="center">Debt</Heading.h5>
                  {selectedTab === TAB_OPTIONS.Borrow ? (
                    <Pill mt={2} color="primary">
                      <Button.Text mainColor="#110C62">Borrow</Button.Text>
                    </Pill>
                  ) : (
                    <Button.Text
                      mainColor="#988CF0"
                      onClick={() => setSelectedTab(TAB_OPTIONS.Borrow)}
                    >
                      Borrow
                    </Button.Text>
                  )}
                  {selectedTab === TAB_OPTIONS.Repay ? (
                    <Pill mt={2} color="primary">
                      <Button.Text mainColor="#110C62">Repay</Button.Text>
                    </Pill>
                  ) : (
                    <Button.Text
                      mainColor="#988CF0"
                      onClick={() => setSelectedTab(TAB_OPTIONS.Repay)}
                    >
                      Repay
                    </Button.Text>
                  )}
                </Box>

                <Box width={0.5} textAlign="center">
                  <Heading.h5>Collateral</Heading.h5>
                  {selectedTab === TAB_OPTIONS.Supply ? (
                    <Pill mt={2} color="primary">
                      <Button.Text mainColor="#110C62">Supply</Button.Text>
                    </Pill>
                  ) : (
                    <Button.Text
                      mainColor="#988CF0"
                      onClick={() => setSelectedTab(TAB_OPTIONS.Supply)}
                    >
                      Supply
                    </Button.Text>
                  )}
                  {selectedTab === TAB_OPTIONS.Withdraw ? (
                    <Pill mt={2} color="primary">
                      <Button.Text mainColor="#110C62">Withdraw</Button.Text>
                    </Pill>
                  ) : (
                    <Button.Text
                      mainColor="#988CF0"
                      onClick={() => setSelectedTab(TAB_OPTIONS.Withdraw)}
                    >
                      Withdraw
                    </Button.Text>
                  )}
                </Box>
              </Flex>
            </Box>

            <br />

            <Flex
              justifyContent="space-around"
              textAlign="center"
              height="280px"
            >
              <BorrowCoin
                coin={coin}
                hide={selectedTab !== TAB_OPTIONS.Borrow}
              />
              <RepayCoin coin={coin} hide={selectedTab !== TAB_OPTIONS.Repay} />
              <SupplyCoin
                coin={coin}
                hide={selectedTab !== TAB_OPTIONS.Supply}
              />
              <WithdrawCoin
                coin={coin}
                hide={selectedTab !== TAB_OPTIONS.Withdraw}
              />
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
