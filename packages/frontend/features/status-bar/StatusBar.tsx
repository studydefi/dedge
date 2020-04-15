import useScreenSize from "../layout/useScreenSize";
import MobileStatusBar from "./MobileStatusBar";
import WideStatusBar from "./WideStatusBar";

const StatusBar = () => {
  const { isMobile, isTablet } = useScreenSize();

  const statusData = {
    supplyBalance: 14242.13,
    borrowBalance: 5242.12,
    borrowPercent: 0.52, // 52%
    liquidationPrice: 123.32,
    ethPrice: 152.08,
    lastUpdated: new Date(1586928677168),
  };

  if (isMobile || isTablet) {
    return <MobileStatusBar statusData={statusData} />;
  }
  return <WideStatusBar statusData={statusData} />;
};

export default StatusBar;
