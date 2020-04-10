import { ethers } from "ethers";

import getReceivedWei from "./getReceivedWei";

const getPreviewAmount = async (
  signer: ethers.Signer,
  uniswapFactory: ethers.Contract,
  thingToSwap: string,
  fromToken: { address: string; decimals: number },
  amountToSwap: string,
  toToken: { address: string; decimals: number }
) => {
  const amountWei = ethers.utils.parseUnits(amountToSwap, fromToken.decimals);

  const receivedWei = await getReceivedWei(
    signer,
    uniswapFactory,
    fromToken.address,
    toToken.address,
    amountWei
  );

  // Minus 0.135% in fees if colalteral, else add 0.135%
  const receivedFixed =
    thingToSwap === "debt"
      ? receivedWei.mul(100135).div(100000)
      : receivedWei.mul(99865).div(100000);

  const received = ethers.utils.formatUnits(
    receivedFixed.toString(),
    toToken.decimals
  );

  return received;
};

export default getPreviewAmount;
