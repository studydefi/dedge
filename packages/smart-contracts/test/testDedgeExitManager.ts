import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";

import { dedgeHelpers } from "../helpers/index";

import {
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

const wallet = new ethers.Wallet(
  "0x646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a7913",
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

  it("Test Exit Positions", async () => {
    // Get exit positions data
    const enteredMarkets = await comptrollerContract.getAssetsIn(
      dacProxyContract.address
    );

    const debtMarkets = [];
    const collateralMarkets = [];
    let ethersOwed = 0;

    for (let i = 0; i < enteredMarkets.length; i++) {
      const curCToken = enteredMarkets[i];

      // TODO: Change this to borrowBalanceCurrent
      const curDebtBal = await newCTokenContract(curCToken).borrowBalanceStored(
        dacProxyContract.address
      );
      const curColBal = await newCTokenContract(curCToken).balanceOfUnderlying(
        dacProxyContract.address
      );

      if (curDebtBal > 0) {
        debtMarkets.push([curCToken, curDebtBal]);

        if (curCToken === legos.compound.cEther.address) {
          ethersOwed = ethersOwed + curDebtBal;
        } else {
          const tokenAddress = await newCTokenContract(curCToken).underlying();

          const uniswapExchangeAddress = await uniswapFactoryContract.getExchange(
            tokenAddress
          );

          const uniswapExchangeContract = new ethers.Contract(
            uniswapExchangeAddress,
            legos.uniswap.exchange.abi,
            wallet
          );

          const ethOwedAmount = await uniswapExchangeContract.getEthToTokenOutputPrice(
            curDebtBal.toString()
          );

          ethersOwed = ethersOwed + ethOwedAmount;
        }
      }

      if (curColBal > 0) {
        // Take out 99% instead of 100%, this is because we can't execute borrowBalanceStored
        // on ganache for whatever reason :|

        // On mainnet, we should be able to do 100% but we need to
        collateralMarkets.push([curCToken, curColBal.mul(99).div(100)]);
      }
    }

    // Exit Position
    // struct DebtMarket {
    //   address cToken;
    //   uint amount;
    // }

    // struct CollateralMarket {
    //     address cToken;
    //     uint amount;
    // }

    // struct ExitPositionCalldata {
    //     address payable exitUserAddress;
    //     address addressRegistryAddress;
    //     DebtMarket[] debtMarket;
    //     CollateralMarket[] collateralMarket;
    // }

    // Start of first arg
    const abiPrefix = ethers.utils.defaultAbiCoder.encode(["uint"], [32]);
    const abiExitUserAddress = ethers.utils.defaultAbiCoder.encode(
      ["address"],
      [wallet.address]
    );
    const abiAddressRegistryAddress = ethers.utils.defaultAbiCoder.encode(
      ["address"],
      [addressRegistryAddress]
    );

    // Remove uint(32) prefix
    const abiDebtMarkets = ethers.utils.defaultAbiCoder
      .encode(["tuple(address,uint)[]"], [debtMarkets])
      .slice(66);

    const abiCollateralMarkets = ethers.utils.defaultAbiCoder
      .encode(["tuple(address,uint)[]"], [collateralMarkets])
      .slice(66);

    // debtCTokens positioning (always starts at 128)
    // address (padded) 32 +
    // address (padded) 32 +
    // start of 1st dynamic array (padded) 32 +
    // start of 2nd dynamic array (padded) 32
    const abiDebtCTokensStartPosition = ethers.utils.defaultAbiCoder.encode(
      ["uint"],
      [128]
    );

    // Collateral CTokens position (starts at 128 + 32 + (2 * 32* debtCToken.length))
    // the extra 32 is the storage of the length of abiDebtCTokens
    const abiCollateralCTokensStartPosition = ethers.utils.defaultAbiCoder.encode(
      ["uint"],
      [128 + 32 + 2 * 32 * debtMarkets.length]
    );

    const exitPositionsPostLoan =
      "0x" +
      (
        abiPrefix +
        abiExitUserAddress +
        abiAddressRegistryAddress +
        abiDebtCTokensStartPosition +
        abiCollateralCTokensStartPosition +
        abiDebtMarkets +
        abiCollateralMarkets
      )
        .split("0x")
        .join("");

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
        ethers.utils
          .parseEther(ethers.utils.formatEther(ethersOwed.toString()))
          .mul(105)
          .div(100)
          .toString(),
        dedgeExitManagerAddress,
        dacProxyContract.address,
        addressRegistryAddress,
        executeOperationCalldataParams
      ]
    );

    await tryAndWait(
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
