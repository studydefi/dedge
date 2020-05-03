import Router from "next/router";
import styled from "styled-components";
import useScreenSize from "./useScreenSize";
import { pages } from "../../PAGES";

const Container = styled.div`
  background: var(--bg);
  width: ${(p) => p.width};
  height: 100%;

  text-align: right;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const LogoText = styled.div`
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

const Sidebar = ({ activePage }) => {
  const { isTablet } = useScreenSize();
  return (
    <Container width={isTablet ? `180px` : `256px`}>
      <LogoText>Dedge</LogoText>

      {pages.map((page) => (
        <NavItem
          key={page.id}
          active={activePage === page.path}
          onClick={() => Router.push(page.path)}
        >
          {page.label}
        </NavItem>
      ))}
    </Container>
  );
};

export default Sidebar;
