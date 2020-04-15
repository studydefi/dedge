import styled from "styled-components";
import { useState } from "react";

const Container = styled.div`
  width: 100%;
  height: 72px;
  background: black;
  position: relative;
`;

const Content = styled.div`
  background black;
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: ${(p) => (p.isOpen ? `216px` : `72px`)};
  overflow: hidden;
  transition: height 200ms ease-in-out;
  position: relative;
`;

const StatusItem = styled.div`
  height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
`;
const Value = styled.div`
  color: white;
`;
const Label = styled.div`
  color: var(--highlight);
  font-size: 12px;
`;

const TriangleIndicator = styled.div`
  position: absolute;
  bottom: 4px;
  left: 50%;
  color: rgba(255, 255, 255, 0.15);
  font-size: 24px;
  transform: ${(p) =>
    p.invert ? "rotate(-180deg) translateX(50%)" : "translateX(-50%)"};
`;

const Status = ({ label, value, percent = false }) => {
  const valueStr = percent
    ? `${parseFloat(value).toFixed(2)}%`
    : `$${parseFloat(value).toFixed(2)}`;
  return (
    <StatusItem>
      <Value>{valueStr}</Value>
      <Label>{label}</Label>
    </StatusItem>
  );
};

const LastUpdate = ({ lastUpdated }) => {
  const valueStr = "23 seconds ago";
  return (
    <StatusItem>
      <Value>{valueStr}</Value>
      <Label>Last Updated</Label>
    </StatusItem>
  );
};

const MobileStatusBar = ({ statusData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => setIsOpen(!isOpen);

  const {
    supplyBalance,
    borrowBalance,
    borrowPercent,
    liquidationPrice,
    ethPrice,
    lastUpdated,
  } = statusData;
  return (
    <Container>
      <Content isOpen={isOpen} onClick={toggleOpen}>
        <Status label="Supply Balance" value={supplyBalance} />
        <Status label="Borrow Balance" value={borrowBalance} />

        <Status label="Borrow Percent" value={borrowPercent} percent />
        <Status label="Liquidation Price" value={liquidationPrice} />

        <Status label="ETH Price" value={ethPrice} />
        <LastUpdate lastUpdated={lastUpdated} />

        <TriangleIndicator invert={isOpen}>▾</TriangleIndicator>
      </Content>
    </Container>
  );
};

export default MobileStatusBar;
