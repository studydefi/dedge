import { Flex, Card, Text, Heading, MetaMaskButton } from "rimble-ui";
import styled from "styled-components";

import { LogoText } from "../../components/Logo";

const Container = styled(Flex)`
  justify-content: center;
`;

const CardContainer = styled(Card)`
  max-width: 420px;
  text-align: center;
  `;

const Logo = styled(LogoText)`
  font-size: 72px;
`

const ErrorText = styled(Text)`
  color: red;
`;


const PleaseConnect = ({ connect, error }) => {
  return (
    <Container pt="6">
      <CardContainer>
        <Logo>DEDGE</Logo>
        <Text mb="5" fontWeight="bold">Swap debt and collateral at will</Text>
        <MetaMaskButton.Outline onClick={connect} mb="2">
          Connect with MetaMask
        </MetaMaskButton.Outline>
        {error && <ErrorText>{error.message}</ErrorText>}
      </CardContainer>
    </Container>
  );
};

export default PleaseConnect;
