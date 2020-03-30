import { Box, Link, Heading, Flex, MetaMaskButton } from "rimble-ui";
import styled from "styled-components";

import Logo from "../../components/Logo";
import MetaMask from "./MetaMask";
import SmartWallet from "./SmartWallet";

const Container = styled(Flex)`
  // background: yellow;
  align-items: center;
  justify-content: space-between;
`;

const Left = styled(Flex)``;
const Right = styled(Flex)``;

const Topbar = () => (
  <Container px="4" py="2">
    <Left>
      <Logo />
    </Left>
    <Right>
      <SmartWallet />
      <MetaMask />
    </Right>
  </Container>
);

export default Topbar;
