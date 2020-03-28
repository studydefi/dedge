import { useState, useEffect } from "react";

import EthersContainer from "../containers/Ethers";
import ContractsContainer from "../containers/Contracts";
import ProxiesContainer from "../containers/Proxies";

const useCompoundMarkets = () => {
  const { signer } = EthersContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { dedgeProxyAddr } = ProxiesContainer.useContainer();

  const [markets, setMarkets] = useState(null);

  const getMarketsEntered = async () => {
    const { compoundComptroller } = contracts;
    const markets = await compoundComptroller.getAssetsIn(dedgeProxyAddr);
    setMarkets(markets);
  };

  useEffect(() => {
    if (signer && contracts) {
      getMarketsEntered();
    }
  }, [dedgeProxyAddr]);
  return [markets, contracts, signer];
};

export default useCompoundMarkets;
