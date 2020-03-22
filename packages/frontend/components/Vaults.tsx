import { Card, Flex, Box, Heading, Button } from "rimble-ui";

// import Vault from "./Vault";

const Vaults = () => {
  // const { address } = Ethers.useContainer();
  // const { proxyRegistry } = Contracts.useContainer();


  return (
    <Card width="auto" maxWidth="420px">
      <Flex justifyContent="space-between">
        <Box>
          <Heading as="h2">Vaults</Heading>
        </Box>
        {/* <Box>
          <Button size={"small"} icon="AddCircle">
            Import Vault
          </Button>
        </Box> */}
      </Flex>
      <Box>
        {/* <Heading as="h3">Proxies</Heading>
        <Heading as="h4">MakerDAO</Heading>
        {proxyAddress}

         <Heading as="h4">Dedge</Heading> */}
      </Box>
    </Card>
  );
};

export default Vaults;
