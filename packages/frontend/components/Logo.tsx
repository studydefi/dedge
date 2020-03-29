import { Box, Link, Heading, Flex, MetaMaskButton } from "rimble-ui";
import styled from "styled-components";

const Container = styled(Link)`
  color: inherit;
  text-decoration: inherit;

  &:hover {
    color: inherit;
    text-decoration: inherit;
  }
`;

export const LogoText = styled(Heading)`
  color: white;
  text-shadow: 2px 2px rgba(255, 0, 0, 0.5), 1px -2px rgba(0, 0, 255, 0.5), -1px 0px rgba(250, 180, 40, 0.5);
`;

const TextContainer = styled(Box)``;

const Logo = () => (
  <Container href="/">
    <TextContainer py="2">
      <LogoText as="h4">DEDGE</LogoText>
    </TextContainer>
  </Container>
);

export default Logo;
