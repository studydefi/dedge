import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";

import ConnectionContainer from "./Connection";
import ContractsContainer from "./Contracts";

import { dedgeHelpers } from "../../smart-contracts/dist/helpers";

function useVaults() {
  const { address } = ConnectionContainer.useContainer();
  const { contracts, ready } = ContractsContainer.useContainer();
  const [vaultIds, setVaultIds] = useState([]);

  const getVaults = async () => {
    const { makerCdpManager, makerProxyRegistry } = contracts;
    const userMakerdaoProxyAddress = await makerProxyRegistry.proxies(address);

    const vaultIds = await dedgeHelpers.maker.getVaultIds(
      userMakerdaoProxyAddress,
      makerCdpManager,
    );

    setVaultIds(vaultIds);
  };

  useEffect(() => {
    if (ready) {
      getVaults();
    }
  }, [address]);

  return { vaultIds, getVaults };
}

const VaultsContainer = createContainer(useVaults);

export default VaultsContainer;
