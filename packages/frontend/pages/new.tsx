import styled from "styled-components";

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
`;

const NavBar = styled.div`
  background: var(--bg);
  text-align: right;
  // height: 100vh;
  width: 256px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Logo = styled.div`
  font-family: IBM Plex Sans, sans-serif;
  font-size: 24px;
  font-weight: 300;
  color: var(--highlight);
  text-transform: uppercase;
  letter-spacing: 4px;
  margin-right: -4px;

  margin-top: 1rem;
  margin-bottom: 2rem;
`;

const Separator = styled.hr`
  border: 1px solid #666;
  margin-top: 4rem;
  margin-bottom: 4rem;
`;

const NavItem = styled.div`
  cursor: pointer;
  color: ${(p) => (p.active ? `white` : `#666`)};
  margin-bottom: 2rem;

  &:hover {
    color: var(--highlight);
  }
`;

const Content = styled.div`
  background: var(--dark-bg);
  flex: 1;
`;

const Home = () => {
  return (
    <Container>
      <NavBar>
        <Logo>Dedge</Logo>

        <NavItem active>Dashboard</NavItem>
        <NavItem>Swap Tokens</NavItem>
        <NavItem>Import Positions</NavItem>
        <NavItem>Exit Positions</NavItem>
      </NavBar>
      <Content>
        <h1>Hello</h1>
      </Content>
    </Container>
  );
};

export default Home;
