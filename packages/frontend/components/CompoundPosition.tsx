import { Card, Flex, Box, Heading, Button } from "rimble-ui";
import useCompoundMarkets from "../hooks/useCompoundMarkets";
import useEnterCompoundMarkets from "../hooks/useEnterCompoundMarkets";
import useCompoundPosition from "../hooks/useCompoundPosition";
import EthersContainer from "../containers/Ethers";

const CompoundPosition = () => {
  const { signer } = EthersContainer.useContainer();

  const [markets] = useCompoundMarkets();
  const [enterMarkets] = useEnterCompoundMarkets();
  const [supplied, borrowed] = useCompoundPosition();

  if (!markets || markets.length < 2) {
    return (
      <Card>
        <Heading as="h2">Compound Position</Heading>
        {signer && markets === [] ? (
          <Button onClick={enterMarkets}>Enter Markets</Button>
        ) : (
          <div>Please connect to MetaMask</div>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <Heading as="h2">Compound Position</Heading>

      <Heading as="h2">Supplied</Heading>
      {supplied && <pre>{JSON.stringify(supplied, null, 4)}</pre>}

      <Heading as="h2">Borrowed</Heading>
      {borrowed && <pre>{JSON.stringify(borrowed, null, 4)}</pre>}

      <h4>Swap Debt</h4>
    </Card>
  );
};

export default CompoundPosition;
