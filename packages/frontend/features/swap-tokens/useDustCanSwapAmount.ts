import { ethers } from "ethers";

const useDustCanSwapAmount = async (
  thingToClear: string,
  proxyAddress: string,
  cTokenAddress: string,
  tokenBalance: string,
  decimals: number,
  compoundComptroller: ethers.Contract,
  compoundPriceOracle: ethers.Contract
): Promise<any> => {
  // Calculate MAX borrowing supply
  const accountLiquidity = await compoundComptroller.getAccountLiquidity(
    proxyAddress
  );
  const liquidity = accountLiquidity[1];

  if (liquidity.lte(0)) {
    return { canSwapAmount: 0 };
  }

  const cTokenPrice = await compoundPriceOracle.getUnderlyingPrice(
    cTokenAddress
  );

  const wei18 = ethers.utils.parseEther("1");
  const maxBorrowAmountWei = liquidity.mul(wei18).div(cTokenPrice);

  // Swapping debt should be done 100% via flashloans
  // However, you can only swap 95% of your debt because of slippages
  const maxBorrowAmountWeiFixed =
    thingToClear === "debt"
      ? maxBorrowAmountWei.mul(95).div(100)
      : maxBorrowAmountWei;
    
  const maxBorrowAmount = ethers.utils.formatUnits(maxBorrowAmountWeiFixed, decimals)

  const canSwapAmount = parseFloat(maxBorrowAmount) > parseFloat(tokenBalance)
    ? tokenBalance
    : maxBorrowAmount;

  return { canSwapAmount };
};

export default useDustCanSwapAmount;
