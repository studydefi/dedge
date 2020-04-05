import { Box, Card, Text, MetaMaskButton } from "rimble-ui";
import { useState } from "react";
import styled from "styled-components";
import ConnectionContainer from "../../containers/Connection";

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

const MetaMask = ({ size = "small", outline = true }) => {
  const { address, connect } = ConnectionContainer.useContainer();
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);

  const MyButton = outline ? MetaMaskButton.Outline : MetaMaskButton;

  if (!address) {
    return (
      <Container ml="2">
        <MyButton
          size={size}
          onClick={() => {
            window.analytics.track("Connect", { via: "MetaMask" });
            connect();
          }}
        >
          Connect with MetaMask
        </MyButton>
      </Container>
    );
  }

  return (
    <Container ml="2">
      <MyButton size={size} onClick={toggle}>
        Connected
      </MyButton>
      {isOpen && (
        <Popup p="2" mt="1">
          <Label mb="1">Current Account</Label>
          <Address>{address}</Address>
        </Popup>
      )}
    </Container>
  );
};

export default MetaMask;
