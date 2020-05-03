import { useMedia } from "use-media";

const useScreenSize = () => {
  const isDesktop = useMedia({ minWidth: "1200px" });
  const isTablet = useMedia({ minWidth: "600px" }) && !isDesktop;
  const isMobile = !isDesktop && !isTablet;

  return { isDesktop, isTablet, isMobile };
};

export default useScreenSize;
