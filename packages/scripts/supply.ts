import { getLegos, networkIds } from "money-legos";
import {
  wallet,
  newERC20Contract,
  getTokenFromUniswapAndApproveProxyTransfer,
} from "dedge-smart-contracts/test/common";
import { dedgeHelpers } from "dedge-smart-contracts/helpers";
import { ethers } from "ethers";

import {
  dacProxyFactoryAddress,
  dedgeCompoundManagerAddress,
} from "dedge-smart-contracts/build/DeployedAddresses.json";

import dacProxyDef from "dedge-smart-contracts/build/DACProxy.json";
import dacProxyFactoryDef from "dedge-smart-contracts/build/DACProxyFactory.json";

const legos = getLegos(networkIds.mainnet);
const erc20Tokens = Object.keys(legos.erc20).filter((x) => x !== "abi");
const cTokens = Object.keys(legos.compound).filter(
  (x) => x !== "cTokenAbi" && x !== "comptroller" && x[0] === "c"
);

if (process.argv.length !== 5) {
  console.log(
    `ts-node supply.ts [${erc20Tokens.join("|")}] <amount> [${cTokens.join(
      "|"
    )}]`
  );
  process.exit(1);
}

if (!erc20Tokens.includes(process.argv[2])) {
  console.log(
    `ts-node supply.ts ${erc20Tokens.join("|")}] <amount> [${cTokens.join(
      "|"
    )}]`
  );
  process.exit(1);
}

if (!cTokens.includes(process.argv[4])) {
  console.log(
    `ts-node supply.ts ${erc20Tokens.join("|")}] <amount> [${cTokens.join(
      "|"
    )}]`
  );
  process.exit(1);
}

const token = process.argv[2];
const ctoken = process.argv[4];
const amount = process.argv[3];
const tokenAddress = legos.erc20[token].address;
const cTokenEquilavent = legos.compound[ctoken].address;

const dacProxyFactoryContract = new ethers.Contract(
  dacProxyFactoryAddress,
  dacProxyFactoryDef.abi,
  wallet
);

const main = async () => {
  console.log("Supplying....");
  let dacProxyAddress = await dacProxyFactoryContract.proxies(wallet.address);
  if (dacProxyAddress === "0x0000000000000000000000000000000000000000") {
    const cTokensToEnter = [
      legos.compound.cEther.address,
      legos.compound.cSAI.address,
      legos.compound.cDAI.address,
      legos.compound.cREP.address,
      legos.compound.cUSDC.address,
      legos.compound.cBAT.address,
      legos.compound.cZRX.address,
      legos.compound.cWBTC.address,
    ];

    console.log("Creating proxy address and entering market....");
    await dedgeHelpers.proxyFactory.buildAndEnterMarkets(
      dacProxyFactoryContract,
      dedgeCompoundManagerAddress,
      cTokensToEnter
    );
    dacProxyAddress = await dacProxyFactoryContract.proxies(wallet.address);
  }
  const dacProxyContract = new ethers.Contract(
    dacProxyAddress,
    dacProxyDef.abi,
    wallet
  );
  console.log("Getting tokens from uniswap");
  await getTokenFromUniswapAndApproveProxyTransfer(
    dacProxyAddress,
    tokenAddress,
    1
  );
  const amountWei = ethers.utils.parseUnits(amount, token === "usdc" ? 6 : 18);
  console.log("Approving erc20 transferFrom....");
  await newERC20Contract(tokenAddress).approve(
    dacProxyAddress,
    amountWei.toString(),
    {
      gasLimit: 4000000,
    }
  );
  console.log("supplying...");
  await dedgeHelpers.compound.supplyThroughProxy(
    dacProxyContract,
    dedgeCompoundManagerAddress,
    cTokenEquilavent,
    amountWei.toString()
  );
};

main();
