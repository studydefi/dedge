import { ethers } from "ethers";

import { legos } from "money-legos/dist";
import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";

import ContractsContainer from "../../containers/Contracts";
import DACProxyContainer from "../../containers/DACProxy";

const useImportVault = selectedVaultId => {
  const { contracts } = ContractsContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();

  const importVault = async () => {
    const {
      makerCdpManager,
      dedgeAddressRegistry,
      dedgeMakerManager,
    } = contracts;

    const ilkBytes32 = await makerCdpManager.ilks(selectedVaultId.toString());
    const ilk = ethers.utils.parseBytes32String(ilkBytes32);

    let decimals = 18;
    let ilkJoinAddress;
    let ilkCTokenEquilavent;
    if (ilk === "USDC-A") {
      decimals = 6;
      ilkJoinAddress = legos.maker.ilks.usdcA.join.address[1];
      ilkCTokenEquilavent = legos.compound.cUSDC.address[1];
    } else if (ilk === "ETH-A") {
      ilkJoinAddress = legos.maker.ilks.ethA.join.address[1];
      ilkCTokenEquilavent = legos.compound.cEther.address[1];
    } else if (ilk === "BAT-A") {
      ilkJoinAddress = legos.maker.ilks.batA.join.address[1];
      ilkCTokenEquilavent = legos.compound.cBAT.address[1];
    } else {
      console.error("Invalid ilk", ilk);
    }

    await dedgeHelpers.maker.importMakerVault(
      proxy,
      dedgeMakerManager.address,
      dedgeAddressRegistry.address,
      selectedVaultId.toString(),
      ilkCTokenEquilavent,
      ilkJoinAddress,
      decimals,
    );
  };

  return { importVault };
};

export default useImportVault;
