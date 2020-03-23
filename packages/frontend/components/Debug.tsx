import { Card, Flex, Box, Heading, Button } from "rimble-ui";

import ContractsContainer from "../containers/Contracts";
import ProxiesContainer from "../containers/Proxies";

import useCreateEthPosition from "../hooks/useCreateEthPosition";

const Debug = () => {
  const { contracts } = ContractsContainer.useContainer();
  const { dedgeProxyAddr, dedgeProxy } = ProxiesContainer.useContainer();

  const [createPosition] = useCreateEthPosition(dedgeProxy);

  return (
    <>
      <div>Vault Item</div>
      <Button size={"small"}>Transfer position to Compound</Button>
      <Button size={"small"} onClick={createPosition}>create position</Button>
    </>
  );
};

export default Debug;
