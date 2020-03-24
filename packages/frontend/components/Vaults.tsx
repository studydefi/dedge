import { Card, Text, Box, Heading, Button } from "rimble-ui";

import VaultsContainer from "../containers/Vaults";
import EthersContainer from "../containers/Ethers";

import Vault from "./Vault";

const vaultsObjToArray = vaultsObj => {
  const result = [];
  for (const key in vaultsObj) {
    const collateral = vaultsObj[key];
    result.push({ id: key, ilk: collateral });
  }
  return result;
};

const Vaults = () => {
  const { signer } = EthersContainer.useContainer();
  const {
    makerVaults,
    dedgeVaults,
    fetchVaults,
  } = VaultsContainer.useContainer();

  // console.log("makerVaults", makerVaults);
  // console.log("dedgeVaults", dedgeVaults);

  const makerVaultsArr = vaultsObjToArray(makerVaults);
  const dedgeVaultsArr = vaultsObjToArray(dedgeVaults);

  return (
    <Card>
      <Heading as="h2" mb="3">
        Vaults
        {signer && (
          <Button.Text size="small" onClick={fetchVaults}>
            refresh
          </Button.Text>
        )}
      </Heading>
      <Box>
        <Heading as="h4">Unimported</Heading>
        {makerVaultsArr.length === 0 && <Text>No vaults found</Text>}

        {makerVaultsArr.map(vault => (
          <Vault key={vault.id} vault={vault} />
        ))}
      </Box>
      <Box>
        <Heading as="h4">Imported</Heading>
        {dedgeVaultsArr.length === 0 && <Text>No vaults found</Text>}

        {dedgeVaultsArr.map(vault => (
          <Vault key={vault.id} vault={vault} />
        ))}
      </Box>
    </Card>
  );
};

export default Vaults;
