import { Card, Flex, Box, Heading, Button } from "rimble-ui";

import ContractsContainer from "../containers/Contracts";
import ProxiesContainer from "../containers/Proxies";

import useCreateEthPosition from "../hooks/useCreateEthPosition";

const Debug = () => {
  const { dedgeProxy } = ProxiesContainer.useContainer();
  const [createPosition] = useCreateEthPosition(dedgeProxy);

  return (
    <Card>
      <Heading>Debug</Heading>
      <Button size={"small"} onClick={createPosition}>
        Create ETH position
      </Button>
    </Card>
  );
};

export default Debug;
