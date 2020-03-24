import { Card, Flex, Box, Heading, Button } from "rimble-ui";

const Vault = ({ vault }) => (
  <>
    <div>Vault ID: {vault.id}, Collateral: {vault.collateral}</div>
    {/* <Button size={"small"}>Transfer position to Compound</Button> */}
  </>
);

export default Vault;
