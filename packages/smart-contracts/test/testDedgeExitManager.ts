import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";

import { dedgeHelpers } from "../helpers/index";

import {
    wallet,
  provider,
  legos,
  sleep,
  tryAndWait,
  newCTokenContract,
  getTokenFromUniswapAndApproveProxyTransfer
} from "./common";

import {
  dacProxyFactoryAddress,
  dedgeCompoundManagerAddress,
  addressRegistryAddress,
  dedgeExitManagerAddress
} from "../build/DeployedAddresses.json";

import dacProxyDef from "../artifacts/DACProxy.json";
import dacProxyFactoryDef from "../artifacts/DACProxyFactory.json";
import dedgeCompoundManagerDef from "../artifacts/DedgeCompoundManager.json";
import dedgeExitManagerDef from "../artifacts/DedgeExitManager.json";

chai.use(solidity);
const { expect } = chai;

const IDedgeCompoundManager = new ethers.utils.Interface(
  dedgeCompoundManagerDef.abi
);

const IDedgeExitManager = new ethers.utils.Interface(dedgeExitManagerDef.abi);

describe("DedgeExitManager", () => {
  const dacProxyFactoryContract = new ethers.Contract(
    dacProxyFactoryAddress,
    dacProxyFactoryDef.abi,
    wallet
  );

  let dacProxyContract: ethers.Contract; // Our proxy

  before(async () => {
    // Builds DAC Proxy And enters the compound market
    const cTokensToEnter = [
      legos.compound.cEther.address,
      legos.compound.cSAI.address,
      legos.compound.cDAI.address,
      legos.compound.cREP.address,
      legos.compound.cUSDC.address,
      legos.compound.cBAT.address,
      legos.compound.cZRX.address,
      legos.compound.cWBTC.address
    ];

    await dedgeHelpers.proxyFactory.buildAndEnterMarkets(
      dacProxyFactoryContract,
      dedgeCompoundManagerAddress,
      cTokensToEnter
    );

    const dacProxyAddress = await dacProxyFactoryContract.proxies(
      wallet.address
    );

    dacProxyContract = new ethers.Contract(
      dacProxyAddress,
      dacProxyDef.abi,
      wallet
    );
  });

  it("Test Exit", async () => {
    // Supplies ETH and DAI
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

    // Exit Position
    // struct ExitPositionCalldata {
    //     address payable exitUserAddress;
    //     address addressRegistryAddress;
    //     address[] debtCTokens;
    //     address[] collateralCTokens;
    // }
    const exitPositionsPostLoan = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "address[]", "address[]"],
      [
        wallet.address,
        addressRegistryAddress,
        [legos.compound.cDAI.address],
        [legos.compound.cEther.address]
      ]
    );

    const executeOperationCalldataParams = IDedgeExitManager.functions.exitPositionsPostLoan.encode(
      [
        0,
        0,
        0, // Doesn't matter as the variables will be re-injected by `executeOption` anyway
        exitPositionsPostLoan
      ]
    );

    const exitPositionsCallbackdata = IDedgeExitManager.functions.exitPositions.encode(
      [
        ethers.utils.parseEther("5"),
        dedgeExitManagerAddress,
        dacProxyContract.address,
        addressRegistryAddress,
        executeOperationCalldataParams
      ]
    );

    tryAndWait(
      dacProxyContract.execute(
        dedgeExitManagerAddress,
        exitPositionsCallbackdata,
        {
          gasLimit: 4000000
        }
      )
    );
  });
});
