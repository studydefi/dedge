import { Card, Flex, Box, Heading, Button } from "rimble-ui";
import useCompoundMarkets from "../hooks/useCompoundMarkets";
import useEnterCompoundMarkets from "../hooks/useEnterCompoundMarkets";

const CompoundPosition = () => {
  const [markets] = useCompoundMarkets();
  const [enterMarkets] = useEnterCompoundMarkets();
  console.log("markets", markets);

  return (
    <Card>
      <Heading as="h2">Compound Position</Heading>
      <Button onClick={enterMarkets}>Enter Markets</Button>
      <h4>Current Position</h4>
      <h4>Swap Debt</h4>
    </Card>
  );
};

export default CompoundPosition;
