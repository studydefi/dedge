import Router from "next/router";
import styled from "styled-components";
import { useState } from "react";
import { pages } from "../../pages/PAGES";

const Container = styled.div`
  color: white;
  background: var(--bg);
  height: 72px;
  box-shadow: 0 6px 6px 0px rgba(0, 0, 0, 0.3);
  z-index: 1;
  position: relative;
`;

const LogoText = styled.div`
  color: var(--highlight);
  text-shadow: 0px 0px 12px rgba(254, 146, 31, 0.4);

  font-family: IBM Plex Sans, Roboto, Sans-Serif;
  font-size: 32px;
  font-weight: 200;
  text-transform: uppercase;
  letter-spacing: 4px;

  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(calc(-50% + 4px), -50%);
`;

const MenuButton = styled.div`
  color: #aaa;
  font-size: 24px;
  padding: 12px;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate(-12px, -50%);
  cursor: pointer;
`;

const Menu = styled.div`
  width: 90%;
  height: 100vh;
  background: var(--dark-bg);
  position: fixed;
  z-index: 1;
  left: ${(p) => (p.isOpen ? `0` : `-100%`)};
  transition: left 200ms ease-in-out;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Overlay = styled.div`
  pointer-events: ${(p) => (p.show ? `unset` : `none`)};
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  position: fixed;
  z-index: 1;
  opacity: ${(p) => (p.show ? `1` : `0`)};
  transition: opacity 200ms ease-in-out;
`;

const CloseButton = styled.div`
  color: white;
  font-size: 24px;
  padding: 12px 16px;
  position: absolute;
  right: 12px;
  top: 12px;
  cursor: pointer;
`;

const MenuItem = styled.div`
  font-family: IBM Plex Sans;
  text-transform: uppercase;
  font-weight: 200;
  letter-spacing: 4px;
  color: ${(p) => (p.active ? `var(--highlight)` : `#999`)};
  text-align: center;
  margin-bottom: 3rem;
  font-size: 18px;
  cursor: pointer;
`;

const Appbar = ({ activePage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const openMenu = () => setIsOpen(true);
  const closeMenu = () => setIsOpen(false);
  return (
    <>
      <Container>
        <LogoText>Dedge</LogoText>
        <MenuButton onClick={openMenu}>☰</MenuButton>
      </Container>
      <Overlay show={isOpen} onClick={closeMenu} />
      <Menu isOpen={isOpen}>
        <CloseButton onClick={closeMenu}>✕</CloseButton>
        {pages.map((page) => (
          <MenuItem
            key={page.id}
            active={page.path === activePage}
            onClick={() => Router.push(page.path)}
          >
            {page.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default Appbar;
