import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";

import { dedgeHelpers } from "../helpers/index";

import {
  provider,
  legos,
  tryAndWait,
} from "./common";

import {
  dacProxyFactoryAddress,
  dedgeCompoundManagerAddress,
  addressRegistryAddress,
  dedgeExitManagerAddress
} from "../build/DeployedAddresses.json";

import dacProxyDef from "../build/DACProxy.json";
import dacProxyFactoryDef from "../build/DACProxyFactory.json";
import dedgeCompoundManagerDef from "../build/DedgeCompoundManager.json";
import dedgeExitManagerDef from "../build/DedgeExitManager.json";

chai.use(solidity);
const { expect } = chai;

const wallet = new ethers.Wallet(
  "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
  provider
);

const IDedgeCompoundManager = new ethers.utils.Interface(
  dedgeCompoundManagerDef.abi
);

const IDedgeExitManager = new ethers.utils.Interface(dedgeExitManagerDef.abi);

const comptrollerContract = new ethers.Contract(
  legos.compound.comptroller.address,
  legos.compound.comptroller.abi,
  wallet
);

const dedgeExitManagerContract = new ethers.Contract(
  dedgeExitManagerAddress,
  dedgeExitManagerDef.abi,
  wallet
);

const uniswapFactoryContract = new ethers.Contract(
  legos.uniswap.factory.address,
  legos.uniswap.factory.abi,
  wallet
);

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

    // Supplies 10 ETH and borrows 500 DAI from compound via ds-proxy
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

  it("Test Exit Positions", async () => {
    const initialEthAmount = await wallet.getBalance();

    const {
      etherToBorrowWeiBN,
      debtMarkets,
      collateralMarkets
    } = await dedgeHelpers.exit.getExitPositionParameters(
      wallet,
      dacProxyContract.address
    );

    await tryAndWait(
      dedgeHelpers.exit.exitPositionToETH(
        wallet.address,
        etherToBorrowWeiBN,
        dacProxyContract,
        addressRegistryAddress,
        dedgeExitManagerAddress,
        debtMarkets,
        collateralMarkets
      )
    );

    const finalEthAmount = await wallet.getBalance();

    expect(finalEthAmount.gt(initialEthAmount)).eq(true);
  });
});
