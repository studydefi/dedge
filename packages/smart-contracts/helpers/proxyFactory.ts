import { ethers } from "ethers";

import dedgeCompoundManagerDef from "../artifacts/DedgeCompoundManager.json";

import { Address } from "./types";
import { getCustomGasPrice } from "./common";

const IDedgeCompoundManager = new ethers.utils.Interface(
  dedgeCompoundManagerDef.abi
);

const buildAndEnterMarkets = async (
  dacProxyFactory: ethers.Contract,
  dedgeCompoundManager: Address,
  cTokensToEnter: Address[],
  overrides: any = {}
): Promise<any> => {
  const gasPrice = await getCustomGasPrice(dacProxyFactory.provider);

  const enterMarketsCallbackData = IDedgeCompoundManager.functions.enterMarkets.encode(
    [cTokensToEnter]
  );

  return dacProxyFactory["buildAndEnterMarkets(address,bytes)"](
    dedgeCompoundManager,
    enterMarketsCallbackData,
    Object.assign({ gasPrice }, overrides)
  );
};

const buildAndEnterMarketsOwner = async (
  owner: Address,
  dacProxyFactory: ethers.Contract,
  dedgeCompoundManager: Address,
  cTokensToEnter: Address[],
  overrides: any = {}
): Promise<any> => {
  const gasPrice = await getCustomGasPrice(dacProxyFactory.provider);

  const enterMarketsCallbackData = IDedgeCompoundManager.functions.enterMarkets.encode(
    [cTokensToEnter]
  );

  return dacProxyFactory["buildAndEnterMarkets(address,address,bytes)"](
    owner,
    dedgeCompoundManager,
    enterMarketsCallbackData,
    Object.assign({ gasPrice }, overrides)
  );
};

export default {
  buildAndEnterMarkets,
  buildAndEnterMarketsOwner,
};
