import { ethers } from "ethers";

import dedgeCompoundManagerDef from "../artifacts/DedgeCompoundManager.json";

import { Address } from "./types";

const IDedgeCompoundManager = new ethers.utils.Interface(
  dedgeCompoundManagerDef.abi
);

const buildAndEnterMarkets = (
  dacProxyFactory: ethers.Contract,
  dedgeCompoundManager: Address,
  cTokensToEnter: Address[],
  overrides: any = { gasLimit: 4000000 }
): Promise<any> => {
  const enterMarketsCallbackData = IDedgeCompoundManager.functions.enterMarkets.encode(
    [cTokensToEnter]
  );

  return dacProxyFactory["buildAndEnterMarkets(address,bytes)"](
    dedgeCompoundManager,
    enterMarketsCallbackData,
    overrides
  );
};

const buildAndEnterMarketsOwner = (
  owner: Address,
  dacProxyFactory: ethers.Contract,
  dedgeCompoundManager: Address,
  cTokensToEnter: Address[],
  overrides: any = { gasLimit: 4000000 }
): Promise<any> => {
  const enterMarketsCallbackData = IDedgeCompoundManager.functions.enterMarkets.encode(
    [cTokensToEnter]
  );

  return dacProxyFactory["buildAndEnterMarkets(address,address,bytes)"](
    owner,
    dedgeCompoundManager,
    enterMarketsCallbackData,
    overrides
  );
};

export default {
  buildAndEnterMarkets,
  buildAndEnterMarketsOwner
};
