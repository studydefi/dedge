import { Card, Text, Box, Heading, Button } from "rimble-ui";

import VaultsContainer from "../containers/Vaults";
import EthersContainer from "../containers/Ethers";

const vaultsObjToArray = vaultsObj => {
  const result = [];
  for (const key in vaultsObj) {
    const collateral = vaultsObj[key];
    result.push({ id: key, collateral });
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
          <Text>
            Vault ID: {vault.id}, Collateral: {vault.collateral}
          </Text>
        ))}
      </Box>
      <Box>
        <Heading as="h4">Imported</Heading>
        {dedgeVaultsArr.length === 0 && <Text>No vaults found</Text>}
        {dedgeVaultsArr.map(vault => (
          <Text key={vault.id}>
            Vault ID: {vault.id}, Collateral: {vault.collateral}
          </Text>
        ))}
      </Box>
    </Card>
  );
};

export default Vaults;
