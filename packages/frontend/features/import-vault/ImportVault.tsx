import { Box, Link, Field, Heading, Flex, Button } from "rimble-ui";
import styled from "styled-components";
import FromMakerDAO from "./FromMakerDAO";
import FromInstaDapp from "./FromInstaDapp";

const Container = styled(Flex)`
  box-shadow: 2px 2px rgba(255, 0, 0, 0.5), 1px -2px rgba(0, 0, 255, 0.5),
    -1px 0px rgba(250, 180, 40, 0.5);
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
