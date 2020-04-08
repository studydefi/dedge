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

    setImportAllowed(false);

    const allowed = await dedgeHelpers.maker.isUserAllowedVault(
      proxy.address,
      selectedVaultId,
      makerCdpManager,
    );

    setImportAllowed(Boolean(allowed));
  };

  const allow = async () => {
    window.analytics.track("Allow Vault Start", { selectedVaultId });
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

    const tx = await dedgeHelpers.maker.dsProxyCdpAllowDacProxy(
      makerDsProxyContract,
      proxyAddress,
      makerCdpManager.address,
      makerProxyActions.address,
      selectedVaultId.toString(),
    );

    window.toastProvider.addMessage(`Allowing vault #${selectedVaultId}...`, {
      secondaryMessage: "Check progress on Etherscan",
      actionHref: `https://etherscan.io/tx/${tx.hash}`,
      actionText: "Check",
      variant: "processing",
    });

    await tx.wait();

    window.toastProvider.addMessage(
      `Vault #${selectedVaultId} allowance approved`,
      { variant: "success" },
    );
    window.analytics.track("Allow Vault Success", { selectedVaultId });

    setLoading(false);
    getAllowStatus();
  };

  useEffect(() => {
    if (hasProxy && selectedVaultId !== null) {
      getAllowStatus();
    }
  }, [selectedVaultId]);

  return { allow, loading, importAllowed };
};

export default useAllowVaultTransfer;
