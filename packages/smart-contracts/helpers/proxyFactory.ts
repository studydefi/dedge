import { ethers } from "ethers";

import dedgeCompoundManagerDef from "../artifacts/DedgeCompoundManager.json";

import { Address } from "./types";

const IDedgeCompoundManager = new ethers.utils.Interface(
  dedgeCompoundManagerDef.abi
);

const buildAndEnterMarkets = (
  dacProxyFactory: ethers.Contract,
  dedgeCompoundManager: Address,
  cTokensToEnter: Address[]
): Promise<any> => {
  const enterMarketsCallbackData = IDedgeCompoundManager.functions.enterMarkets.encode(
    [cTokensToEnter]
  );

  return dacProxyFactory["buildAndEnterMarkets(address,bytes)"](
    dedgeCompoundManager,
    enterMarketsCallbackData
  );
};

const buildAndEnterMarketsOwner = (
  owner: Address,
  dacProxyFactory: ethers.Contract,
  dedgeCompoundManager: Address,
  cTokensToEnter: Address[]
): Promise<any> => {
  const enterMarketsCallbackData = IDedgeCompoundManager.functions.enterMarkets.encode(
    [cTokensToEnter]
  );

  return dacProxyFactory["buildAndEnterMarkets(address,address,bytes)"](
    owner,
    dedgeCompoundManager,
    enterMarketsCallbackData
  );
};

export default {
  buildAndEnterMarkets,
  buildAndEnterMarketsOwner
};
