import { Box, Link, Field, Heading, Flex, Button } from "rimble-ui";
import styled from "styled-components";
import FromMakerDAO from "./FromMakerDAO";
import FromInstaDapp from "./FromInstaDapp";

const Container = styled(Flex)`
  // background: yellow;
  align-items: center;
  justify-content: space-between;
  text-align: center;
`;

const Import = () => (
  <Container px="4" py="2" mb="3">
    <Heading as="h5">Import position</Heading>
    <FromMakerDAO />
    <FromInstaDapp />
  </Container>
);

export default Import;
