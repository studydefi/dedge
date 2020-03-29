import { Box, Link, Heading, Flex, MetaMaskButton } from "rimble-ui";
import styled from "styled-components";

import Logo from "../../components/Logo";
import Connection from "./Connection";

const Container = styled(Flex)`
  // background: yellow;
  align-items: center;
  justify-content: space-between;
`;

const Topbar = () => (
  <Container px="4" py="2">
    <Logo />
    <Connection />
  </Container>
);

export default Topbar;
