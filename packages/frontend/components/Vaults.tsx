import { Card, Flex, Box, Heading, Button } from "rimble-ui";

import ContractsContainer from "../containers/Contracts"
// import Vault from "./Vault";

const Vaults = () => {
  // const { address } = Ethers.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  console.log(contracts)

  return (
    <Card>
      <Heading as="h2">MakerDAO Vaults</Heading>
      {/* <Box>
          <Button size={"small"} icon="AddCircle">
            Import Vault
          </Button>
        </Box> */}
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
