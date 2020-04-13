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
  margin-right: -6px;
  text-shadow: 0px 0px 12px rgba(254, 146, 31, 0.4);

  margin-top: 1rem;
  margin-bottom: 2rem;
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

const PositionStatus = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 2rem;
  background: #0a0d10;
`;

const Status = ({ label, percent = false, value }) => {
  const valText = percent ? `${value}%` : `$${value}`;
  return (
    <div style={{ color: `white`, width: `120px` }}>
      <div style={{  fontSize: "2rem", textAlign: `right` }}>{valText}</div>
      <div style={{ textTransform: `uppercase`,color: `var(--highlight)`, textAlign: `right`, fontSize: `12px` }}>{label}</div>
    </div>
  );
};

const Home = () => {
  return (
    <Container>
      <NavBar>
        <Logo>Dedge</Logo>

        <NavItem active>Dashboard</NavItem>
        <NavItem>Automate</NavItem>
        <NavItem>Swap Tokens</NavItem>
        <NavItem>Import Positions</NavItem>
        <NavItem>Exit Positions</NavItem>
        <NavItem>Info</NavItem>
      </NavBar>
      <Content>
        <PositionStatus>
          <Status label="Supply Balance" value="123.00" />
          <Status label="Borrow Balance" value="123.00" />
          <Status label="Borrow Percent" value="123" percent />
          <Status label="ETH Price" value="123.00" />
          <Status label="Liquidation Price" value="123.00" />
        </PositionStatus>

        <table style={{ width: `100%` }}>
          <tr>
            <th>Firstname</th>
            <th>Lastname</th>
            <th>Age</th>
          </tr>
          <tr>
            <td>Jill</td>
            <td>Smith</td>
            <td>50</td>
          </tr>
          <tr>
            <td>Eve</td>
            <td>Jackson</td>
            <td>94</td>
          </tr>
        </table>
      </Content>
    </Container>
  );
};

export default Home;
