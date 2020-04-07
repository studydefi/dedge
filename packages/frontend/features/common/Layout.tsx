import { Box } from "rimble-ui";
import styled from "styled-components";

const Container = styled(Box)`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Layout = ({ children }) => <Container>{children}</Container>;

export default Layout;
