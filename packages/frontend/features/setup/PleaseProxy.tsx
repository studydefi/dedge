import { Flex, Box, Card, Text, Heading, Button } from "rimble-ui";
import styled from "styled-components";

import { LogoText } from "../../components/Logo";
import DACProxy from "../../containers/DACProxy";

const Container = styled(Flex)`
  justify-content: center;
`;

const CardContainer = styled(Card)`
  max-width: 420px;
  text-align: center;
`;

const Logo = styled(LogoText)`
  font-size: 72px;
`;

const PleaseProxy = () => {
  const { createProxy } = DACProxy.useContainer();
  return (
    <Container pt="1">
      <CardContainer>
        <Logo>DEDGE</Logo>
        <Text mb="5" fontWeight="bold">
          Swap debt and collateral at will
        </Text>

        <Box mb="4">
          <Heading as="h3" mb="2">
            Setup Smart Wallet
          </Heading>
          <Text mb="3">
            In order to get started, you must have a smart wallet with us so we
            could execute transactions on your behalf while being non-custodial.
          </Text>
          <Button onClick={createProxy}>Create Dedge Smart Wallet</Button>
        </Box>
      </CardContainer>
    </Container>
  );
};

export default PleaseProxy;
