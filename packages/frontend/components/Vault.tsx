import { Card, Flex, Box, Heading, Button } from "rimble-ui";

import ContractsContainer from "../containers/Contracts";
import useVaultBalance from "../hooks/useVaultBalance";

const Vault = ({ vault }) => {
  const { contracts } = ContractsContainer.useContainer();
  const [collateral, debt] = useVaultBalance(contracts, vault.id);

  return (
    <>
      <div>
        Vault ID: {vault.id},
         Collateral: {collateral} {vault.collateral},
         Debt: {debt} DAI
      </div>
      {/* <Button size={"small"}>Transfer position to Compound</Button> */}
    </>
  );
};

export default Vault;
