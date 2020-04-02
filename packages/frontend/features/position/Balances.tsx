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
          {supplyBalanceUSD ? (
            <Text>$ {supplyBalanceUSD}</Text>
          ) : (
            <Text>$ —</Text>
          )}
        </DataContainer>
        <DataContainer m="2">
          <Heading as="h4">Borrow Balance</Heading>
          {borrowBalanceUSD ? (
            <Text>$ {borrowBalanceUSD}</Text>
          ) : (
            <Text>$ —</Text>
          )}
        </DataContainer>
        <DataContainer m="2">
          <Heading as="h4">Borrow Percentage</Heading>
          {currentBorrowPercentage ? (
            <Text>$ {currentBorrowPercentage}</Text>
          ) : (
            <Text>— %</Text>
          )}
        </DataContainer>
      </Container>
      <Container mb="2">
        <DataContainer m="2">
          <Heading as="h4">ETH Price</Heading>
          {ethInUSD ? <Text>$ {ethInUSD}</Text> : <Text>$ —</Text>}
        </DataContainer>
        <DataContainer m="2">
          <Heading as="h4">Liquidation Price</Heading>
          {liquidationPriceUSD ? (
            <Text>$ {liquidationPriceUSD}</Text>
          ) : (
            <Text>$ —</Text>
          )}
        </DataContainer>
      </Container>
    </>
  );
};

export default Balances;
