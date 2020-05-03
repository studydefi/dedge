import styled from "styled-components";
import Appbar from "./Appbar";
import StatusBar from "../status-bar/StatusBar";

const Container = styled.div`
  width: 100%;
  height: 100vh;
  background: var(--dark-bg);
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  overflow: auto;
  flex: 1;
`;

const AppbarLayout = ({ children, activePage }) => {
  return (
    <Container>
      <Appbar activePage={activePage} />
      <StatusBar />
      <Content>{children}</Content>
    </Container>
  );
};

export default AppbarLayout;
