import { ethers } from "ethers";
import { BigNumber } from "ethers/utils/bignumber";

export const getCustomGasPrice = async (
  provider: ethers.providers.Provider
): Promise<BigNumber> => {
  const gasPrice = await provider.getGasPrice();
  return gasPrice.mul(110).div(100);
};
