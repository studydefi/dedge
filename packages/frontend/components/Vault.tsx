import { Card, Flex, Box, Heading, Button } from "rimble-ui";

import ContractsContainer from "../containers/Contracts";
import ProxiesContainer from "../containers/Proxies";

import useVaultBalance from "../hooks/useVaultBalance";
import useMigrateToDedge from "../hooks/useMigrateToDedge";

const Vault = ({ vault }) => {
  const { contracts } = ContractsContainer.useContainer();
  const { dedgeProxyAddr, dedgeProxy } = ProxiesContainer.useContainer();

  const [collateral, debt] = useVaultBalance(contracts, vault.id);
  const [migrate] = useMigrateToDedge(dedgeProxyAddr, dedgeProxy, vault);
  return (
    <>
      <div>
        Vault ID: {vault.id}, Collateral: {collateral} {vault.ilk}, Debt: {debt}{" "}
        DAI
      </div>
      <Button size={"small"} onClick={migrate}>
        Migrate to Dedge
      </Button>
    </>
  );
};

export default Vault;
