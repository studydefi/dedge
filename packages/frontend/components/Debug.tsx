import { Card, Flex, Box, Heading, Button } from "rimble-ui";

import ContractsContainer from "../containers/Contracts";
import EthersContainer from "../containers/Ethers";
import ProxiesContainer from "../containers/Proxies";

import useCreateEthPosition from "../hooks/useCreateEthPosition";
import useGetCoinsFromUniswap from "../hooks/useGetCoinsFromUniswap";

import useBalances from "../hooks/useBalances";

const Debug = () => {
  const { provider, signer, address } = EthersContainer.useContainer();
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

  const {
    approveBat,
    approveUsdc,
    getBatTokens,
    getUsdcTokens,
  } = useGetCoinsFromUniswap(contracts, dedgeProxyAddr, signer);

  const getBalances = () => {
    getWalletBalances();
    getDedgeBalances();
  };
  return (
    <Card>
      <Heading mb="3">Debug</Heading>
      <Heading as="h3" mt="3" mb="3">
        Current Balances
        {address && (
          <Button.Text size="small" onClick={getBalances}>
            refresh
          </Button.Text>
        )}
      </Heading>

      {signer ? (
        <>
          <Heading as="h5" mb="3">
            In Wallet
          </Heading>
          {walletBalances && (
            <pre>{JSON.stringify(walletBalances, null, 4)}</pre>
          )}

          <Heading as="h5" mb="3">
            In Dedge Smart Wallet
          </Heading>
          {dedgeBalances && <pre>{JSON.stringify(dedgeBalances, null, 4)}</pre>}
        </>
      ) : (
        <div>Please connect to MetaMask</div>
      )}

      <Heading as="h3" mt="3" mb="3">
        Get tokens from Uniswap (w/ ETH)
      </Heading>
      <Button size="small" onClick={approveBat} mb="1" mr="1">
        Approve BAT
      </Button>
      <Button size="small" onClick={approveUsdc} mb="1" mr="1">
        Approve USDC
      </Button>
      <Button size="small" onClick={getBatTokens} mb="1" mr="1">
        Get BAT
      </Button>
      <Button size="small" onClick={getUsdcTokens} mb="1" mr="1">
        Get USDC
      </Button>

      <Heading as="h3" mt="3" mb="3">
        Create Vault Positions
      </Heading>
      <Button size="small" onClick={createPosition} mb="1" mr="1">
        w/ ETH collateral
      </Button>
      <Button size="small" onClick={createPosition} mb="1" mr="1">
        w/ BAT collateral
      </Button>
      <Button size="small" onClick={createPosition} mb="1" mr="1">
        w/ USDC collateral
      </Button>
    </Card>
  );
};

export default Debug;
