import { ethers } from "ethers";

import dedgeMakerManagerDef from "../artifacts/DedgeMakerManager.json";
import { legos } from "money-legos";

import { Address } from "./types";

const IDssProxyActions = new ethers.utils.Interface(
  legos.maker.dssProxyActions.abi
);
const IDedgeMakerManager = new ethers.utils.Interface(dedgeMakerManagerDef.abi);

const importMakerVault = (
  dacProxy: ethers.Contract,
  dedgeMakerManager: Address,
  addressRegistry: Address,
  cdpId: number,
  ilkCTokenEquilavent: Address,
  ilkJoinAddress: Address,
  decimalPlaces: number = 18,
  gasLimit: number = 4000000
): Promise<any> => {
  // struct ImportMakerVaultCallData {
  //     address addressRegistryAddress;
  //     uint cdpId;
  //     address collateralCTokenAddress;
  //     address collateralJoinAddress;
  //     uint8 collateralDecimals;
  // }

  const importMakerVaultPostLoanData = ethers.utils.defaultAbiCoder.encode(
    ["address", "uint", "address", "address", "uint8"],
    [
      addressRegistry,
      cdpId.toString(),
      ilkCTokenEquilavent,
      ilkJoinAddress,
      decimalPlaces.toString()
    ]
  );

  const executeOperationCalldataParams = IDedgeMakerManager.functions.importMakerVaultPostLoan.encode(
    [
      0,
      0,
      0, // Doesn't matter as the variables will be re-injected by `executeOption` anyway
      importMakerVaultPostLoanData
    ]
  );

  const importMakerVaultCallbackdata = IDedgeMakerManager.functions.importMakerVault.encode(
    [
      dedgeMakerManager,
      dacProxy.address,
      addressRegistry,
      cdpId,
      executeOperationCalldataParams
    ]
  );

  return dacProxy.execute(dedgeMakerManager, importMakerVaultCallbackdata, {
    gasLimit
  });
};

const dsProxyCdpAllowDacProxy = (
  dsProxy: ethers.Contract, // MakerDAO's proxy contract
  dacProxy: Address, // Dedge's proxy contract
  dssCdpManager: Address, // DssCdpManager's address,
  dssProxyActions: Address, // Dss-ProxyAction's address
  cdpId: number
): Promise<any> => {
  const allowDacProxyCallback = IDssProxyActions.functions.cdpAllow.encode([
    dssCdpManager,
    cdpId.toString(),
    dacProxy,
    "1"
  ]);

  return dsProxy.execute(dssProxyActions, allowDacProxyCallback, {
    gasLimit: 4000000
  });
};

export default {
  importMakerVault,
  dsProxyCdpAllowDacProxy
};
