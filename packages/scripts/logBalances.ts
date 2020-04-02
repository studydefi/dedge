import { ethers } from "ethers";
import { getLegos, networkIds } from "money-legos";
import {
  wallet,
  newCTokenContract,
  newERC20Contract,
  getTokenFromUniswapAndApproveProxyTransfer
} from "dedge-smart-contracts/test/common";

import { dacProxyFactoryAddress } from "dedge-smart-contracts/build/DeployedAddresses.json";

import dacProxyFactoryDef from "dedge-smart-contracts/artifacts/DACProxyFactory.json";

const dacProxyFactoryContract = new ethers.Contract(
  dacProxyFactoryAddress,
  dacProxyFactoryDef.abi,
  wallet
);

const legos = getLegos(networkIds.mainnet);
const erc20Tokens = Object.keys(legos.erc20).filter(x => x !== "abi");

if (process.argv.length !== 3) {
  console.log(`ts-node logBalances.ts <address>`);
  process.exit(1);
}

const addr = process.argv[2];

const main = async () => {
  const proxy = await dacProxyFactoryContract.proxies(addr);

  const daiBorrowed = await newCTokenContract(
    legos.compound.cDAI.address
  ).borrowBalanceStored(proxy);

  const suppliedETH = await newCTokenContract(
    legos.compound.cEther.address
  ).balanceOfUnderlying(proxy);

  console.log(
    `DAI Borrowed: ${ethers.utils.formatEther(daiBorrowed.toString())}`
  );
  console.log(
    `ETH Supplied: ${ethers.utils.formatEther(suppliedETH.toString())}`
  );
};

main();
