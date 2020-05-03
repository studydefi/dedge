import styled from "styled-components";
import Sidebar from "./Sidebar";
import StatusBar from "../status-bar/StatusBar";

const Container = styled.div`
  width: 100%;
  height: 100vh;
  background: var(--dark-bg);
  display: flex;
`;

const Main = styled.div`
  height: 100%;
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  flex: 1;
  overflow: auto;
`;

const SidebarLayout = ({ children, activePage }) => {
  return (
    <Container>
      <Sidebar activePage={activePage} />
      <Main>
        <StatusBar />
        <Content>{children}</Content>
      </Main>
    </Container>
  );
};

export default SidebarLayout;
