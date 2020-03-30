import { Box, Card, Text, Button, Tooltip } from "rimble-ui";
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
`;

const Label = styled(Text)`
  font-weight: bold;
  font-size: 12px;
`;

const Address = styled(Text)`
  font-family: monospace;
  font-size: 12px;
`;

const SmartWallet = () => {
  const { address } = ConnectionContainer.useContainer();
  const { proxy, proxyAddress, createProxy } = DACProxyContainer.useContainer();

  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  if (!address) {
    return (
      <Container>
        <Tooltip message="Please first connect to MetaMask" placement="bottom">
          <Button.Outline size="small" disabled>
            Smart Wallet: No Network
          </Button.Outline>
        </Tooltip>
      </Container>
    );
  }

  if (!proxy || proxyAddress === "0x0000000000000000000000000000000000000000") {
    return (
      <Container>
        <Tooltip
          message="A smart wallet allows Dedge to execute transactions on your behalf while being non-custodial."
          placement="bottom"
        >
          <Button size="small" onClick={createProxy}>
            Create Smart Wallet
          </Button>
        </Tooltip>
      </Container>
    );
  }

  return (
    <Container>
      <Button.Outline size="small" onClick={toggle}>
        Smart Wallet: Connected
      </Button.Outline>
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
