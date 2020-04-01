import { Box, Link, Heading, Flex, MetaMaskButton } from "rimble-ui";
import styled from "styled-components";

import Logo from "../../components/Logo";
import MetaMask from "./MetaMask";
import SmartWallet from "./SmartWallet";
import DACProxyContainer from "../../containers/DACProxy";
import ConnectionContainer from "../../containers/Connection";

const Container = styled(Flex)`
  // background: yellow;
  align-items: center;
  justify-content: space-between;
`;

const Left = styled(Flex)``;
const Right = styled(Flex)``;

const Topbar = () => {
  const { address } = ConnectionContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();

  return (
    <Container px="4" py="2">
      <Left>
        <Logo />
      </Left>
      <Right>
        {proxy && <SmartWallet />}
        {address && <MetaMask />}
      </Right>
    </Container>
  );
};

export default Topbar;
