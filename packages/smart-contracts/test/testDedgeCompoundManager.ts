import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";

import { dedgeHelpers } from "../helpers/index";

import { wallet, legos, sleep, tryAndWait, newCTokenContract } from "./common";

import {
  dacProxyFactoryAddress,
  dedgeCompoundManagerAddress,
  addressRegistryAddress
} from "../build/DeployedAddresses.json";

import dacProxyDef from "../artifacts/DACProxy.json";
import dacProxyFactoryDef from "../artifacts/DACProxyFactory.json";
import dedgeCompoundManagerDef from "../artifacts/DedgeCompoundManager.json";

chai.use(solidity);
const { expect } = chai;

const IDedgeCompoundManager = new ethers.utils.Interface(
  dedgeCompoundManagerDef.abi
);

describe("DedgeCompoundManager", () => {
  const dacProxyFactoryContract = new ethers.Contract(
    dacProxyFactoryAddress,
    dacProxyFactoryDef.abi,
    wallet
  );

  let dacProxyContract: ethers.Contract; // Our proxy

  // Helper function to swap debt
  const swapDebt = async (
    oldCTokenAddress: string,
    newCTokenAddress: string
  ) => {
    const initialOldBorrow = await newCTokenContract(
      oldCTokenAddress
    ).borrowBalanceStored(dacProxyContract.address);
    const initialNewBorrow = await newCTokenContract(
      newCTokenAddress
    ).borrowBalanceStored(dacProxyContract.address);

    await tryAndWait(
      dedgeHelpers.compound.swapDebt(
        dacProxyContract,
        dedgeCompoundManagerAddress,
        addressRegistryAddress,
        oldCTokenAddress,
        initialOldBorrow, // Swap out 100%
        newCTokenAddress
      )
    );

    const finalOldBorrow = await newCTokenContract(
      oldCTokenAddress
    ).borrowBalanceStored(dacProxyContract.address);
    const finalNewBorrow = await newCTokenContract(
      newCTokenAddress
    ).borrowBalanceStored(dacProxyContract.address);

    expect(finalOldBorrow.lt(initialOldBorrow)).eq(true);
    expect(finalNewBorrow.gt(initialNewBorrow)).eq(true);
  };

  const swapCollateral = async (
    oldCTokenAddress: string,
    newCTokenAddress: string
  ) => {
    const initialOldSupply = await newCTokenContract(
      oldCTokenAddress
    ).balanceOfUnderlying(dacProxyContract.address);
    const initialNewSupply = await newCTokenContract(
      newCTokenAddress
    ).balanceOfUnderlying(dacProxyContract.address);

    await tryAndWait(
      dedgeHelpers.compound.swapCollateral(
        dacProxyContract,
        dedgeCompoundManagerAddress,
        addressRegistryAddress,
        oldCTokenAddress,
        initialOldSupply.mul(90).div(100), // Swap out 90% for collateral
        newCTokenAddress
      )
    );

    const finalOldSupply = await newCTokenContract(
      oldCTokenAddress
    ).balanceOfUnderlying(dacProxyContract.address);
    const finalNewSupply = await newCTokenContract(
      newCTokenAddress
    ).balanceOfUnderlying(dacProxyContract.address);

    expect(finalOldSupply.lt(initialOldSupply)).eq(true);
    expect(finalNewSupply.gt(initialNewSupply)).eq(true);
  };

  const clearDustCollateral = async (
    oldCTokenAddress: string,
    newCTokenAddress: string
  ) => {
    const initialOldSupply = await newCTokenContract(
      oldCTokenAddress
    ).balanceOfUnderlying(dacProxyContract.address);
    const initialNewSupply = await newCTokenContract(
      newCTokenAddress
    ).balanceOfUnderlying(dacProxyContract.address);

    const clearDustCollateralCallback = IDedgeCompoundManager.functions.clearCollateralDust.encode(
      [
        addressRegistryAddress,
        oldCTokenAddress,
        initialOldSupply,
        newCTokenAddress
      ]
    );

    await tryAndWait(
      dacProxyContract.execute(
        dedgeCompoundManagerAddress,
        clearDustCollateralCallback,
        {
          gasLimit: 4000000
        }
      )
    );

    const finalOldSupply = await newCTokenContract(
      oldCTokenAddress
    ).balanceOfUnderlying(dacProxyContract.address);
    const finalNewSupply = await newCTokenContract(
      newCTokenAddress
    ).balanceOfUnderlying(dacProxyContract.address);

    expect(finalOldSupply.lt(initialOldSupply)).eq(true);
    expect(finalNewSupply.gt(initialNewSupply)).eq(true);
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

    // Enters the market
    const marketEnterCalldata = IDedgeCompoundManager.functions.enterMarketsAndApproveCTokens.encode(
      [
        [
          legos.compound.cDAI.address,
          legos.compound.cEther.address,
          legos.compound.cUSDC.address,
          legos.compound.cREP.address,
          legos.compound.cZRX.address,
          legos.compound.cBAT.address
        ]
      ]
    );

    await tryAndWait(
      dacProxyContract.execute(
        dedgeCompoundManagerAddress,
        marketEnterCalldata,
        {
          gasLimit: 4000000
        }
      )
    );

    // Supplies 10 ETH and borrows 500 DAI from compound via ds-proxy
    await sleep(500);

    const ethToSupply = 10;
    const daiToBorrow = 500;
    const supplyEthAndBorrowCalldata = IDedgeCompoundManager.functions.supplyETHAndBorrow.encode(
      [
        legos.compound.cDAI.address,
        ethers.utils.parseEther(daiToBorrow.toString())
      ]
    );
    await tryAndWait(
      dacProxyContract.execute(
        dedgeCompoundManagerAddress,
        supplyEthAndBorrowCalldata,
        {
          gasLimit: 4000000,
          value: ethers.utils.parseEther(ethToSupply.toString())
        }
      )
    );
  });

  it("Swapping Debt (Borrow) DAI -> BAT", async () => {
    await sleep(500);

    const oldCTokenAddress = legos.compound.cDAI.address;
    const newCTokenAddress = legos.compound.cBAT.address;

    await swapDebt(oldCTokenAddress, newCTokenAddress);
  });

  it("Swapping Debt (Borrow) BAT -> ETH", async () => {
    await sleep(500);

    const oldCTokenAddress = legos.compound.cBAT.address;
    const newCTokenAddress = legos.compound.cEther.address;

    await swapDebt(oldCTokenAddress, newCTokenAddress);
  });

  it("Swapping Debt (Borrow) ETH -> DAI", async () => {
    await sleep(500);

    const oldCTokenAddress = legos.compound.cEther.address;
    const newCTokenAddress = legos.compound.cDAI.address;

    await swapDebt(oldCTokenAddress, newCTokenAddress);
  });

  it("Swapping Collateral (Supply) ETH -> USDC", async () => {
    await sleep(500);

    const oldCTokenAddress = legos.compound.cEther.address;
    const newCTokenAddress = legos.compound.cUSDC.address;

    await swapCollateral(oldCTokenAddress, newCTokenAddress);
  });

  it("Swapping Collateral (Supply) USDC -> REP", async () => {
    await sleep(500);

    const oldCTokenAddress = legos.compound.cUSDC.address;
    const newCTokenAddress = legos.compound.cREP.address;

    await swapCollateral(oldCTokenAddress, newCTokenAddress);
  });

  it("Swapping Collateral (Supply) REP -> ETHER", async () => {
    await sleep(500);

    const oldCTokenAddress = legos.compound.cREP.address;
    const newCTokenAddress = legos.compound.cEther.address;

    await swapCollateral(oldCTokenAddress, newCTokenAddress);
  });

  it("Clearing Collateral (Supply) Dust USDC -> ETHER", async () => {
    await sleep(500);

    const oldCTokenAddress = legos.compound.cUSDC.address;
    const newCTokenAddress = legos.compound.cEther.address;

    await clearDustCollateral(oldCTokenAddress, newCTokenAddress);
  });

  it("Clearing Collateral (Supply) Dust REP -> ETHER", async () => {
    await sleep(500);

    const oldCTokenAddress = legos.compound.cREP.address;
    const newCTokenAddress = legos.compound.cEther.address;

    await clearDustCollateral(oldCTokenAddress, newCTokenAddress);
  });
});
