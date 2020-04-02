import { ethers } from "ethers";
import { legos } from "money-legos/dist";
import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";

import ContractsContainer from "../../containers/Contracts";
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";
import { useState, useEffect } from "react";

const useAllowVaultTransfer = (selectedVaultId: number) => {
  const { signer, address } = ConnectionContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { proxy, proxyAddress, hasProxy } = DACProxyContainer.useContainer();

  const [loading, setLoading] = useState(false);
  const [importAllowed, setImportAllowed] = useState(false);

  const getAllowStatus = async () => {
    const { makerCdpManager } = contracts;

    const allowed = await dedgeHelpers.maker.isUserAllowedVault(
      proxy.address,
      selectedVaultId,
      makerCdpManager,
    );

    setImportAllowed(Boolean(allowed));
  };

  const allow = async () => {
    setLoading(true);
    console.log("allow", selectedVaultId);
    const {
      makerCdpManager,
      makerProxyRegistry,
      makerProxyActions,
    } = contracts;

    const userMakerdaoProxyAddress = await makerProxyRegistry.proxies(address);

    const makerDsProxyContract = new ethers.Contract(
      userMakerdaoProxyAddress,
      legos.dappsys.dsProxy.abi,
      signer,
    );

    await dedgeHelpers.maker.dsProxyCdpAllowDacProxy(
      makerDsProxyContract,
      proxyAddress,
      makerCdpManager.address,
      makerProxyActions.address,
      selectedVaultId.toString(),
    );
    setLoading(false);
    getAllowStatus();
  };

  useEffect(() => {
    if (hasProxy) {
      getAllowStatus();
    }
  }, [selectedVaultId]);

  return { allow, loading, importAllowed };
};

export default useAllowVaultTransfer;
