import { ethers } from "ethers";
import legos from "../../money-legos";

const useGetCoinsFromUniswap = (contracts, proxyAddress, signer) => {
  const approveBat = async () => {
    const { bat } = contracts;
    await bat.approve(proxyAddress, "0xffffffffffffffffffffffffffffffff");
  };

  const approveUsdc = async () => {
    const { usdc } = contracts;
    await usdc.approve(proxyAddress, "0xffffffffffffffffffffffffffffffff");
  };

  const getBatTokens = async () => {
    const { bat, uniswapFactory } = contracts;
    const exchangeAddr = await uniswapFactory.getExchange(bat.address);
    const batExchange = new ethers.Contract(
      exchangeAddr,
      legos.uniswap.uniswapExchange.abi as any,
      signer,
    );
    await batExchange.ethToTokenSwapInput(1, 1900111539, {
      gasLimit: 4000000,
      value: ethers.utils.parseEther("3.0"),
    });
  };

  const getUsdcTokens = async () => {
    const { usdc, uniswapFactory } = contracts;
    const exchangeAddr = await uniswapFactory.getExchange(usdc.address);
    const usdcExchange = new ethers.Contract(
      exchangeAddr,
      legos.uniswap.uniswapExchange.abi as any,
      signer,
    );
    await usdcExchange.ethToTokenSwapInput(1, 1900111539, {
      gasLimit: 4000000,
      value: ethers.utils.parseEther("3.0"),
    });
  };

  return { approveBat, approveUsdc, getBatTokens, getUsdcTokens };
};

export default useGetCoinsFromUniswap;
