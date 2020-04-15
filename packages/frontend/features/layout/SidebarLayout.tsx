import styled from "styled-components";
import Sidebar from "./Sidebar";

const Container = styled.div`
  width: 100%;
  height: 100vh;
  background: var(--dark-bg);
  display: flex;
`;

const StatusBar = styled.div`
  background: black;
  color: #fab127;
`;

const Main = styled.div`
  background blue;
  height: 100%;
  flex: 1;
  overflow: auto;

  display: flex;
  flex-direction: column;
`;

const Content = styled.div`
  background red;
  flex: 1;
  overflow: auto;
`;

const SidebarLayout = ({ children, activePage }) => {
  return (
    <Container>
      <Sidebar activePage={activePage} />
      <Main>
        <StatusBar>Statusbar</StatusBar>
        <Content>{children}</Content>
      </Main>
    </Container>
  );
};

export default SidebarLayout;
