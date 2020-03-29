import { ethers } from "ethers";
import { BigNumber } from "ethers/utils/bignumber";
import { Address } from "./types";

import dedgeGeneralManagerDef from "../artifacts/DedgeGeneralManager.json";

const IDedgeGeneralManager = new ethers.utils.Interface(
  dedgeGeneralManagerDef.abi
);

const transferETH = (
  dacProxy: ethers.Contract,
  dedgeGeneralManager: Address,
  target: Address,
  amountWei: BigNumber,
  gasLimit: Number = 4000000
): Promise<any> => {
  const transferETHCallback = IDedgeGeneralManager.functions.transferETH.encode(
    [target, amountWei.toString()]
  );
  return dacProxy.execute(dedgeGeneralManager, transferETHCallback, {
    gasLimit
  });
};

const transferERC20 = (
  dacProxy: ethers.Contract,
  dedgeGeneralManager: Address,
  erc20: Address,
  target: Address,
  amountWei: BigNumber,
  gasLimit: Number = 4000000
): Promise<any> => {
  const transferERC20Callback = IDedgeGeneralManager.functions.transferERC20.encode(
    [target, erc20, amountWei.toString()]
  );

  return dacProxy.execute(dedgeGeneralManager, transferERC20Callback, {
    gasLimit
  });
};

export default {
  transferERC20,
  transferETH
};
