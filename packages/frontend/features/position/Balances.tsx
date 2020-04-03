import { Box, Text, Heading, Card } from "rimble-ui";
import styled from "styled-components";
import CompoundPositions from "../../containers/CompoundPositions";

const Container = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: space-around;
`;

const DataContainer = styled(Box)`
  text-align: center;
`;

const displayDollar = value => {
  if (typeof value === "undefined" || Number.isNaN(value)) {
    return <Text>$ —</Text>;
  }
  return <Text title={`$${value}`}>$ {value.toFixed(2)}</Text>;
};

const displayPercent = value => {
  if (typeof value === "undefined" || Number.isNaN(value)) {
    return <Text>— %</Text>;
  }
  return <Text title={`${value}`}>{value.toFixed(2)} %</Text>;
};

const Balances = () => {
  const { totals } = CompoundPositions.useContainer();
  const {
    supplyBalanceUSD,
    borrowBalanceUSD,
    currentBorrowPercentage,
    ethInUSD,
    liquidationPriceUSD,
  } = totals as any;
  return (
    <>
      <Container mb="2">
        <DataContainer m="2">
          <Heading as="h4">Supply Balance</Heading>
          {displayDollar(supplyBalanceUSD)}
        </DataContainer>
        <DataContainer m="2">
          <Heading as="h4">Borrow Balance</Heading>
          {displayDollar(borrowBalanceUSD)}
        </DataContainer>
        <DataContainer m="2">
          <Heading as="h4">Borrow Percentage</Heading>
          {displayPercent(currentBorrowPercentage * 100)}
        </DataContainer>
      </Container>
      <Container mb="2">
        <DataContainer m="2">
          <Heading as="h4">ETH Price</Heading>
          {displayDollar(ethInUSD)}
        </DataContainer>
        <DataContainer m="2">
          <Heading as="h4">Liquidation Price</Heading>
          {displayDollar(liquidationPriceUSD)}
        </DataContainer>
      </Container>
    </>
  );
};

export default Balances;
