import { Box, Flex, Card, Text, Button, Tooltip, Loader } from "rimble-ui";
import { useState } from "react";
import styled from "styled-components";
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";

const Container = styled(Box)`
  position: relative;
`;

const Popup = styled(Card)`
  position: absolute;
  right: 0;
  z-index: 1;
`;

const Label = styled(Text)`
  font-weight: bold;
  font-size: 12px;
`;

const Address = styled(Text)`
  font-family: monospace;
  font-size: 12px;
`;

const SmartWallet = ({ size = "small", outline = true }) => {
  const { address } = ConnectionContainer.useContainer();
  const {
    proxy,
    proxyAddress,
    createProxy,
    loading,
    hasProxy,
  } = DACProxyContainer.useContainer();

  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  const MyButton = outline ? Button.Outline : Button;

  if (!address) {
    return (
      <Container>
        <Tooltip message="Please first connect to MetaMask" placement="bottom">
          <MyButton size={size} disabled>
            Smart Wallet: No Network
          </MyButton>
        </Tooltip>
      </Container>
    );
  }

  if (!hasProxy) {
    return (
      <Container>
        <Tooltip
          message="A smart wallet allows Dedge to execute transactions on your behalf while being non-custodial."
          placement="bottom"
        >
          {loading ? (
            <MyButton size={size} onClick={createProxy}>
              <Flex alignItems="center">
                <span>Creating Smart Wallet</span>{" "}
                <Loader color={outline ? "normal" : "white"} ml="2" />
              </Flex>
            </MyButton>
          ) : (
            <MyButton size={size} onClick={createProxy}>
              Create Smart Wallet
            </MyButton>
          )}
        </Tooltip>
      </Container>
    );
  }

  return (
    <Container>
      <MyButton size={size} onClick={toggle}>
        Smart Wallet: Connected
      </MyButton>
      {isOpen && (
        <Popup p="2" mt="1">
          <Label mb="1">Smart Wallet Proxy Address</Label>
          <Address>{proxyAddress}</Address>
        </Popup>
      )}
    </Container>
  );
};

export default SmartWallet;
