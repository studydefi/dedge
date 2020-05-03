import React from "react";
import useScreenSize from "./useScreenSize";
import AppbarLayout from "./AppbarLayout";
import SidebarLayout from "./SidebarLayout";

const Layout = ({ children, activePage }) => {
  const { isMobile } = useScreenSize();
  if (isMobile) {
    return <AppbarLayout activePage={activePage}>{children}</AppbarLayout>;
  }
  return <SidebarLayout activePage={activePage}>{children}</SidebarLayout>;
};

export default Layout;
