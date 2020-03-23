import { Card, Flex, Box, Heading, Button } from "rimble-ui";

import ContractsContainer from "../containers/Contracts";
import EthersContainer from "../containers/Ethers";
import ProxiesContainer from "../containers/Proxies";

import useCreateEthPosition from "../hooks/useCreateEthPosition";

import useBalances from "../hooks/useBalances";

const Debug = () => {
  const { provider, address } = EthersContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { dedgeProxy, dedgeProxyAddr } = ProxiesContainer.useContainer();

  const [createPosition] = useCreateEthPosition(dedgeProxy);

  const [walletBalances, getWalletBalances] = useBalances(
    contracts,
    provider,
    address,
  );
  const [dedgeBalances, getDedgeBalances] = useBalances(
    contracts,
    provider,
    dedgeProxyAddr,
  );

  const getBalances = () => {
    getWalletBalances();
    getDedgeBalances();
  };
  return (
    <Card>
      <Heading mb="3">Debug</Heading>
      <Heading as="h3" mb="3">
        Current Balances
        {address && (
          <Button.Text size="small" onClick={getBalances}>
            refresh
          </Button.Text>
        )}
      </Heading>

      <Heading as="h5" mb="3">
        In Wallet
      </Heading>
      {walletBalances && <pre>{JSON.stringify(walletBalances, null, 4)}</pre>}

      <Heading as="h5" mb="3">
        In Dedge Smart Wallet
      </Heading>
      {dedgeBalances && <pre>{JSON.stringify(dedgeBalances, null, 4)}</pre>}

      <Heading as="h3" mb="3">
        Create Vault Positions
      </Heading>
      <Button
        size={"small"}
        onClick={createPosition}
        mb="1"
        style={{ display: "block" }}
      >
        Create position with ETH collateral
      </Button>
      <Button
        size={"small"}
        onClick={createPosition}
        mb="1"
        style={{ display: "block" }}
      >
        Create position with BAT collateral
      </Button>
      <Button
        size={"small"}
        onClick={createPosition}
        mb="1"
        style={{ display: "block" }}
      >
        Create position with USDC collateral
      </Button>
    </Card>
  );
};

export default Debug;
