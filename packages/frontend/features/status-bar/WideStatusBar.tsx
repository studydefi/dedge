import styled from "styled-components";

const Container = styled.div`
  width: 100%;
  height: 120px;
  background: black;
  position: relative;
`;

const Content = styled.div`
  width: 100%;
  max-width: 1200px;
  height: 100%;
  margin: auto;
  padding: 12px;
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const StatusItem = styled.div`
  height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  flex: 1;
`;
const Value = styled.div`
  color: white;
  font-size: 24px;
`;
const Label = styled.div`
  color: var(--highlight);
  font-size: 12px;
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

const WideStatusBar = ({ statusData }) => {
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
      <Content>
        <Status label="Supply Balance" value={supplyBalance} />
        <Status label="Borrow Balance" value={borrowBalance} />

        <Status label="Borrow Percent" value={borrowPercent} percent />
        <Status label="Liquidation Price" value={liquidationPrice} />

        <Status label="ETH Price" value={ethPrice} />
        <LastUpdate lastUpdated={lastUpdated} />
      </Content>
    </Container>
  );
};

export default WideStatusBar;
