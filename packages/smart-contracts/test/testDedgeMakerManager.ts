import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";
import { getLegos, networkIds } from "money-legos";

import { dedgeHelpers } from "../helpers/index";

import { wallet, provider, sleep, tryAndWait } from "./common";

import {
  dacProxyFactoryAddress,
  dedgeMakerManagerAddress,
  addressRegistryAddress
} from "../build/DeployedAddresses.json";

import dacProxyDef from "../artifacts/DACProxy.json";
import dacProxyFactoryDef from "../artifacts/DACProxyFactory.json";

const legos = getLegos(networkIds.mainnet);

chai.use(solidity);
const { expect } = chai;

const IDssProxyActions = new ethers.utils.Interface(
  legos.maker.dssProxyActions.abi
);

const uniswapFactoryContract = new ethers.Contract(
  legos.uniswap.factory.address,
  legos.uniswap.factory.abi,
  wallet
);

// Helper functions
const newERC20Contract = (addr: string): ethers.Contract => {
  return new ethers.Contract(addr, legos.erc20.abi, wallet);
};
const newCTokenContract = (addr: string): ethers.Contract => {
  return new ethers.Contract(addr, legos.compound.cTokenAbi, wallet);
};

const cEtherContract = new ethers.Contract(
  legos.compound.cEther.address,
  legos.compound.cEther.abi,
  wallet
);

const cDaiContract = newCTokenContract(legos.compound.cDai.address);
const cBatContract = newCTokenContract(legos.compound.cBat.address);
const cUsdcContract = newCTokenContract(legos.compound.cUSDC.address);

// Uniswap helper functions
const getTokenFromUniswap = async (
  makerDsProxyAddress: string, // Approve `transferFrom` from proxyAddress
  tokenAddress: string,
  ethersToSend: number = 3
) => {
  const uniswapExchangeAddress = await uniswapFactoryContract.getExchange(
    tokenAddress
  );
  const uniswapExchangeContract = new ethers.Contract(
    uniswapExchangeAddress,
    legos.uniswap.exchange.abi,
    wallet
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
    wallet
  );

  await tokenContract.approve(
    makerDsProxyAddress,
    "0xffffffffffffffffffffffffffffffff"
  );
};

// Maker helper functions
const openVault = async (
  dsProxyContract: ethers.Contract,
  ilk: string,
  ilkJoinAddress: string,
  amount: number,
  decimalPlaces = 18
): Promise<boolean> => {
  let openVaultCalldata;
  if (ilk === legos.maker.ilks.eth_a.ilk) {
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
        ilk === legos.maker.ilks.eth_a.ilk
          ? ethers.utils.parseEther(amount.toString())
          : "0x0"
    }
  );
  await openVaultTx.wait();

  return true;
};

describe("DedgeMakerManager", () => {
  const dacProxyFactoryContract = new ethers.Contract(
    dacProxyFactoryAddress,
    dacProxyFactoryDef.abi,
    wallet
  );

  const makerProxyRegistryContract = new ethers.Contract(
    legos.maker.proxyRegistry.address,
    legos.maker.proxyRegistry.abi,
    wallet
  );

  const makerDssCdpManagerContract = new ethers.Contract(
    legos.maker.dssCdpManager.address,
    legos.maker.dssCdpManager.abi,
    wallet
  );

  let makerDsProxyContract: ethers.Contract; // MakerDAO's proxy
  let dacProxyContract: ethers.Contract; // Our proxy

  before(async () => {
    // Builds DAC Proxy
    await dacProxyFactoryContract.build();
    const dacProxyAddress = await dacProxyFactoryContract.proxies(
      wallet.address
    );
    dacProxyContract = new ethers.Contract(
      dacProxyAddress,
      dacProxyDef.abi,
      wallet
    );

    // Sleeps for 0.5 sec to avoid invalid nonce
    await sleep(500);

    // Also builds MakerDAO's proxy
    let dsProxyAddress = await makerProxyRegistryContract.proxies(
      wallet.address
    );
    if (dsProxyAddress === "0x0000000000000000000000000000000000000000") {
      await makerProxyRegistryContract.build();
      dsProxyAddress = await makerProxyRegistryContract.proxies(wallet.address);
    }
    makerDsProxyContract = new ethers.Contract(
      dsProxyAddress,
      legos.dappsys.dsProxy.abi,
      wallet
    );
  });

  it("Import MakerDAO Vault (ETH)", async () => {
    // Sleeps for 0.5 sec to avoid invalid nonce
    await sleep(500);

    const ilkJoinAddress = legos.maker.ilks.eth_a.join.address;
    const ilk = legos.maker.ilks.eth_a.ilk;
    const ilkCTokenEquilavent = legos.compound.cEther.address;

    // Get initial supply/borrow balance
    const ethCompoundSupplyInitial = await cEtherContract.balanceOfUnderlying(
      dacProxyContract.address
    );
    const daiCompoundBorrowInitial = await cDaiContract.borrowBalanceStored(
      dacProxyContract.address
    );

    // Creates a vault
    await tryAndWait(
      openVault(
        makerDsProxyContract,
        ilk,
        ilkJoinAddress,
        1 // Deposit 1 ETH
      )
    );

    const cdpId = await makerDssCdpManagerContract.last(
      makerDsProxyContract.address
    );

    // Grants user access to eth CDP
    const cdpAllowTx = await dedgeHelpers.maker.dsProxyCdpAllowDacProxy(
      makerDsProxyContract,
      dacProxyContract.address,
      legos.maker.dssCdpManager.address,
      legos.maker.dssProxyActions.address,
      cdpId
    );
    await cdpAllowTx.wait();

    // Imports vault
    await tryAndWait(
      dedgeHelpers.maker.importMakerVault(
        dacProxyContract,
        dedgeMakerManagerAddress,
        addressRegistryAddress,
        cdpId,
        ilkCTokenEquilavent,
        ilkJoinAddress
      )
    );

    // Gets final balance
    const ethCompoundSupplyFinal = await cEtherContract.balanceOfUnderlying(
      dacProxyContract.address
    );
    const daiCompoundBorrowFinal = await cDaiContract.borrowBalanceStored(
      dacProxyContract.address
    );

    // Make sure supply / borrow was gt than initial
    expect(ethCompoundSupplyFinal.gt(ethCompoundSupplyInitial)).eq(true);
    expect(daiCompoundBorrowFinal.gt(daiCompoundBorrowInitial)).eq(true);
  });
});
