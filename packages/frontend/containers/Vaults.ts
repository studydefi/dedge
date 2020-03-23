import { createContainer } from "unstated-next";
import { useState, useEffect } from "react";

import ContractsContainer from "./Contracts";
import ProxiesContainer from "./Proxies";

import { getVaults as getVaultsForProxy } from "./vaultHelpers";

function useVaults() {
  const { contracts } = ContractsContainer.useContainer() as any;
  const { makerProxyAddr, dedgeProxyAddr } = ProxiesContainer.useContainer();

  const [makerVaults, setMakerVaults] = useState(null);
  const [dedgeVaults, setDedgeVaults] = useState(null);

  const getVaults = async () => {
    const { dssCdpManager } = contracts;
    console.log("getting makerVaults...");
    const makerVaults = await getVaultsForProxy(dssCdpManager, makerProxyAddr);
    console.log("makerVaults", makerVaults);
    setMakerVaults(makerVaults);

    console.log("getting dedgeVaults...");
    const dedgeVaults = await getVaultsForProxy(dssCdpManager, dedgeProxyAddr);
    console.log("dedgeVaults", dedgeVaults);
    setDedgeVaults(dedgeVaults);
  };

  const fetchVaults = () => {
    const EMPTY_ADDR = "0x0000000000000000000000000000000000000000";
    const exists = addr => addr && addr !== EMPTY_ADDR;

    if (exists(makerProxyAddr) && exists(dedgeProxyAddr)) {
      getVaults();
    }
  };

  useEffect(() => {
    fetchVaults();
  }, [makerProxyAddr, dedgeProxyAddr]);

  return { makerVaults, dedgeVaults, fetchVaults };
}

const VaultsContainer = createContainer(useVaults);

export default VaultsContainer;
