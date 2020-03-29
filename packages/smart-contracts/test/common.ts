import { ethers } from "ethers";
import { getLegos, networkIds } from "money-legos";

export const legos = getLegos(networkIds.mainnet);

export const newERC20Contract = (addr: string): ethers.Contract =>
  new ethers.Contract(addr, legos.erc20.abi, wallet);

export const newCTokenContract = (addr: string): ethers.Contract => {
  return new ethers.Contract(addr, legos.compound.cTokenAbi, wallet);
};

export const provider = new ethers.providers.JsonRpcProvider(
  process.env.PROVIDER_URL || "http://localhost:8545"
);

export const wallet = new ethers.Wallet(
  "0xb0057716d5917badaf911b193b12b910811c1497b5bada8d7711f758981c3773", // Default private key for ganache-cli -d
  provider
);

export const getRandomAddress = (): string => {
  const w = ethers.Wallet.createRandom();
  return w.address;
};

export const sleep = (ms: any) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Hacky way to wait for ganache
// so ethers doesn't timeout (2mins)
export const tryAndWait = async (f: any) => {
  try {
    const tx = await f;

    // @ts-ignore
    try {
      await tx.wait();
    } catch {
      // @ts-ignore
    }
  } catch (e) {
    const eStr = e.toString().toLowerCase();
    if (eStr.includes("timeout") || eStr.includes("invalid response - 0")) {
      await sleep(1 * 60 * 1000); // Sleep for 1 more minute after timeout
    } else {
      throw e;
    }
  }
};

export const getTokenFromUniswapAndApproveProxyTransfer = async (
  proxyAddress: string, // Approve `transferFrom` from proxyAddress
  tokenAddress: string,
  ethersToSend: number = 3,
  selectedWallet: ethers.Wallet = wallet
) => {
  const uniswapFactoryContract = new ethers.Contract(
    legos.uniswap.factory.address,
    legos.uniswap.factory.abi,
    selectedWallet
  );

  const uniswapExchangeAddress = await uniswapFactoryContract.getExchange(
    tokenAddress
  );
  const uniswapExchangeContract = new ethers.Contract(
    uniswapExchangeAddress,
    legos.uniswap.exchange.abi,
    selectedWallet
  );

  await uniswapExchangeContract.ethToTokenSwapInput(
    1, // min token retrieve amount
    2525644800, // random timestamp in the future (year 2050)
    {
      gasLimit: 4000000,
      value: ethers.utils.parseEther(ethersToSend.toString())
    }
  );

  const tokenContract = new ethers.Contract(
    tokenAddress,
    legos.erc20.abi,
    selectedWallet
  );

  await tokenContract.approve(
    proxyAddress,
    "0xffffffffffffffffffffffffffffffff"
  );
};