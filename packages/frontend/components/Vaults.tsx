import { Card, Flex, Box, Heading, Button } from "rimble-ui";

// import ContractsContainer from "../containers/Contracts"
// import ProxiesContainer from "../containers/Proxies";
import VaultsContainer from "../containers/Vaults";

const Vaults = () => {
  const { makerVaults, dedgeVaults } = VaultsContainer.useContainer();

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
