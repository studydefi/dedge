import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";

import { dedgeHelpers } from "../helpers/index";

import { wallet, legos, newCTokenContract, sleep, tryAndWait } from "./common";

import {
  dacProxyFactoryAddress,
  dedgeMakerManagerAddress,
  addressRegistryAddress
} from "../build/DeployedAddresses.json";

import dacProxyDef from "../artifacts/DACProxy.json";
import dacProxyFactoryDef from "../artifacts/DACProxyFactory.json";

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

const cEtherContract = new ethers.Contract(
  legos.compound.cEther.address,
  legos.compound.cEther.abi,
  wallet
);

const cDaiContract = newCTokenContract(legos.compound.cDAI.address);
const cBatContract = newCTokenContract(legos.compound.cBAT.address);
const cUsdcContract = newCTokenContract(legos.compound.cUSDC.address);

// Uniswap helper functions
const getTokenFromUniswapAndApproveProxyTransfer = async (
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
  if (ilk === legos.maker.ilks.ethA.ilk) {
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
        ilk === legos.maker.ilks.ethA.ilk
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

  // Helper function
  const openAllowAndImportVault = async (
    ilk: string,
    ilkJoinAddress: string,
    ilkCTokenEquilavent: string,
    ilkCTokenContract: ethers.Contract,
    amount: number,
    decimalPlaces: number = 18
  ) => {
    // Sleeps for 0.5 sec to avoid invalid nonce
    await sleep(500);

    // Get initial supply/borrow balance
    const supplyInitial = await ilkCTokenContract.balanceOfUnderlying(
      dacProxyContract.address
    );
    const borrowInitial = await cDaiContract.borrowBalanceStored(
      dacProxyContract.address
    );

    // Creates a vault
    await tryAndWait(
      openVault(
        makerDsProxyContract,
        ilk,
        ilkJoinAddress,
        amount,
        decimalPlaces
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
        ilkJoinAddress,
        decimalPlaces
      )
    );

    // Gets final balance
    const supplyFinal = await ilkCTokenContract.balanceOfUnderlying(
      dacProxyContract.address
    );
    const borrowFinal = await cDaiContract.borrowBalanceStored(
      dacProxyContract.address
    );

    // Make sure supply / borrow was gt than initial
    expect(supplyFinal.gt(supplyInitial)).eq(true);
    expect(borrowFinal.gt(borrowInitial)).eq(true);
  };

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
    const ilkJoinAddress = legos.maker.ilks.ethA.join.address;
    const ilk = legos.maker.ilks.ethA.symbol;
    const ilkCTokenEquilavent = legos.compound.cEther.address;
    const ilkCTokenContract = cEtherContract;

    await openAllowAndImportVault(
      ilk,
      ilkJoinAddress,
      ilkCTokenEquilavent,
      ilkCTokenContract,
      1 // Deposit 1 Ether
    );
  });

  it("Import MakerDAO Vault (BAT)", async () => {
    const ilkJoinAddress = legos.maker.ilks.batA.join.address;
    const ilk = legos.maker.ilks.batA.symbol;
    const ilkCTokenEquilavent = legos.compound.cBAT.address;
    const ilkCTokenContract = cBatContract;
    const ilkCTokenUnderlying = legos.erc20.bat.address;

    await getTokenFromUniswapAndApproveProxyTransfer(
      makerDsProxyContract.address,
      ilkCTokenUnderlying,
      3 // Trade 3 ETH for BAT
    );

    // Sleeps for 0.5 sec to avoid invalid nonce
    await sleep(500);

    await openAllowAndImportVault(
      ilk,
      ilkJoinAddress,
      ilkCTokenEquilavent,
      ilkCTokenContract,
      2000 // Deposit 2000 BAT
    );

    return true;
  });

  it("Import MakerDAO Vault (USDC)", async () => {
    const ilkJoinAddress = legos.maker.ilks.usdcA.join.address;
    const ilk = legos.maker.ilks.usdcA.symbol;
    const ilkCTokenEquilavent = legos.compound.cUSDC.address;
    const ilkCTokenContract = cUsdcContract;
    const ilkCTokenUnderlying = legos.erc20.usdc.address;

    await getTokenFromUniswapAndApproveProxyTransfer(
      makerDsProxyContract.address,
      ilkCTokenUnderlying,
      3 // Trade 3 ETH for USDC
    );

    // Sleeps for 0.5 sec to avoid invalid nonce
    await sleep(500);

    await openAllowAndImportVault(
      ilk,
      ilkJoinAddress,
      ilkCTokenEquilavent,
      ilkCTokenContract,
      200, // Deposit 200 USDC
      6 // USDC decimal places
    );
  });
});
