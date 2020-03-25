import { Card, Flex, Box, Heading, Button } from "rimble-ui";
import useCompoundMarkets from "../hooks/useCompoundMarkets";

const CompoundPosition = () => {
  const [markets] = useCompoundMarkets();
  console.log("markets", markets);
  return (
    <Card>
      <Heading as="h2">Compound Position</Heading>
      <h4>Current Position</h4>
      <h4>Swap Debt</h4>
    </Card>
  );
};

export default CompoundPosition;
