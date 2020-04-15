import styled from "styled-components";
import Appbar from "./Appbar";

const Container = styled.div`
  width: 100%;
  height: 100vh;
  background: var(--dark-bg);
  display: flex;
  flex-direction: column;
`;

const StatusBar = styled.div`
  background: black;
  color: #fab127;
`;

const Content = styled.div`
  background red;
  overflow: auto;
  flex: 1;
`;

const AppbarLayout = ({ children, activePage }) => {
  return (
    <Container>
      <Appbar activePage={activePage} />
      <StatusBar>status bar</StatusBar>
      <Content>{children}</Content>
    </Container>
  );
};

export default AppbarLayout;
