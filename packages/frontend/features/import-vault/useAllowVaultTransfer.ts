import { ethers } from "ethers";
import { legos } from "money-legos/dist";
import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";

import ContractsContainer from "../../containers/Contracts";
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";

const useAllowVaultTransfer = (selectedVaultId: number) => {
  const { signer, address } = ConnectionContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { proxyAddress } = DACProxyContainer.useContainer();

  const allow = async () => {
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
  };

  return { allow };
};

export default useAllowVaultTransfer;
