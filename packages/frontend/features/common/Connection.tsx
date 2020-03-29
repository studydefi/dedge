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
`;

const Label = styled(Text)`
  font-weight: bold;
  font-size: 12px;
`;

const Address = styled(Text)`
  font-family: monospace;
  font-size: 12px;
`;

const Connection = () => {
  const { address } = ConnectionContainer.useContainer();
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(!isOpen);
  return (
    <Container>
      <MetaMaskButton.Outline size="small" onClick={toggle}>
        Connected
      </MetaMaskButton.Outline>
      {isOpen && (
        <Popup p="2" mt="1">
          <Label mb="1">Current Account</Label>
          <Address>{address}</Address>
        </Popup>
      )}
    </Container>
  );
};

export default Connection;
