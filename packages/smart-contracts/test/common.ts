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

export const openVault = async (
  dsProxyContract: ethers.Contract,
  ilk: string,
  ilkJoinAddress: string,
  amount: number,
  decimalPlaces = 18
): Promise<boolean> => {
  const IDssProxyActions = new ethers.utils.Interface(
    legos.maker.dssProxyActions.abi
  );
  
  let openVaultCalldata;
  
  if (ilk === legos.maker.ilks.ethA.symbol) {
    openVaultCalldata = IDssProxyActions.functions.openLockETHAndDraw.encode([
      legos.maker.dssCdpManager.address,
      legos.maker.jug.address,
      ilkJoinAddress,
      legos.maker.daiJoin.address,
      ethers.utils.formatBytes32String(ilk),
      ethers.utils.parseEther("20.0") // Wanna Draw 20 DAI (minimum 20 DAI)
    ]);
  } else {
    // Open Vault with ERC-20 collateral
    openVaultCalldata = IDssProxyActions.functions.openLockGemAndDraw.encode([
      legos.maker.dssCdpManager.address,
      legos.maker.jug.address,
      ilkJoinAddress,
      legos.maker.daiJoin.address,
      ethers.utils.formatBytes32String(ilk),
      ethers.utils.parseUnits(amount.toString(), decimalPlaces),
      ethers.utils.parseEther("20.0"), // Wanna Draw 20 DAI (minimum 20 DAI)
      true
    ]);
  }

  const openVaultTx = await dsProxyContract.execute(
    legos.maker.dssProxyActions.address,
    openVaultCalldata,
    {
      gasLimit: 4000000,
      value:
        ilk === legos.maker.ilks.ethA.symbol
          ? ethers.utils.parseEther(amount.toString())
          : "0x0"
    }
  );
  await openVaultTx.wait();

  return true;
};

export const allCTokens = [
  legos.compound.cEther.address,
  legos.compound.cSAI.address,
  legos.compound.cDAI.address,
  legos.compound.cREP.address,
  legos.compound.cUSDC.address,
  legos.compound.cBAT.address,
  legos.compound.cZRX.address,
  legos.compound.cWBTC.address
];