import { Card, Flex, Box, Heading, Button } from "rimble-ui";

const Vault = () => (
  <>
    <div>Vault Item</div>
    <Button size={"small"}>Transfer position to Compound</Button>
  </>
);

const Vaults = () => (
  <Card width="auto" maxWidth="420px">
    <Flex justifyContent="space-between">
      <Box>
        <Heading as="h2">Vaults</Heading>
      </Box>
      <Box>
        <Button size={"small"} icon="AddCircle">
          Import Vault
        </Button>
      </Box>
    </Flex>
    <Vault />
    <Vault />
    <Vault />
  </Card>
);

export default Vaults;
