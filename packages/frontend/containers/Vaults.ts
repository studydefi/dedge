import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

import ContractsContainer from "./Contracts";
import ProxiesContainer from "./Proxies";

import { getVaults } from "./vaultHelpers";

type Vaults = Record<string, string>;

function useVaults() {
  const { contracts } = ContractsContainer.useContainer();
  const { makerProxyAddr, dedgeProxyAddr } = ProxiesContainer.useContainer();

  const [makerVaults, setMakerVaults] = useState<Vaults | null>(null);
  const [dedgeVaults, setDedgeVaults] = useState<Vaults | null>(null);

  const fetchVaults = async () => {
    const EMPTY_ADDR = "0x0000000000000000000000000000000000000000";
    const exists = addr => addr && addr !== EMPTY_ADDR;

    if (exists(makerProxyAddr) && exists(dedgeProxyAddr)) {
      const { dssCdpManager } = contracts;

      const makerVaults = await getVaults(dssCdpManager, makerProxyAddr);
      const dedgeVaults = await getVaults(dssCdpManager, dedgeProxyAddr);

      setMakerVaults(makerVaults);
      setDedgeVaults(dedgeVaults);
    }
  };

  useEffect(() => {
    fetchVaults();
  }, [makerProxyAddr, dedgeProxyAddr]);

  return { makerVaults, dedgeVaults, fetchVaults };
}

const VaultsContainer = createContainer(useVaults);

export default VaultsContainer;
