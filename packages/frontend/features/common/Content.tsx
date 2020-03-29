import { Box } from "rimble-ui";
import styled from "styled-components";

const Container = styled(Box)`
  height: 100%;
`;

const Content = ({ children }) => <Container>{children}</Container>;

export default Content;
