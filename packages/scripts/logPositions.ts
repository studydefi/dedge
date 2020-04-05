import { ethers } from "ethers";
import { getLegos, networkIds } from "money-legos";
import { wallet, newERC20Contract, newCTokenContract } from "dedge-smart-contracts/test/common";

import { dacProxyFactoryAddress } from "dedge-smart-contracts/artifacts/DeployedAddresses.json";
import { dedgeHelpers } from "dedge-smart-contracts/helpers";

import dacProxyFactoryDef from "dedge-smart-contracts/artifacts/DACProxyFactory.json";

const dacProxyFactoryContract = new ethers.Contract(
  dacProxyFactoryAddress,
  dacProxyFactoryDef.abi,
  wallet
);

if (process.argv.length !== 3) {
  console.log(`ts-node logBalances.ts <address>`);
  process.exit(1);
}

const addr = process.argv[2];

const legos = getLegos(networkIds.mainnet)

const main = async () => {
  // const {
  //   borrowBalanceUSD,
  //   supplyBalanceUSD,
  //   currentBorrowPercentage,
  //   ethInUSD,
  //   liquidationPriceUSD
  // } = await dedgeHelpers.compound.getAccountInformation(
  //   wallet,
  //   addr
  // )

  // console.log(`Borrow balance: ${borrowBalanceUSD}`)
  // console.log(`Supply balance: ${supplyBalanceUSD}`)
  // console.log(`Borrow %: ${currentBorrowPercentage}`)
  // console.log(`ETH USD: ${ethInUSD}`)
  // console.log(`Liquidation price: ${liquidationPriceUSD}`)
  const amount = await dedgeHelpers.compound.getCTokenBorrowBalance(
    wallet,
    legos.compound.cWBTC.address,
    addr
  )

  console.log(`Borrowed WBTC: ${ethers.utils.formatUnits(amount.toString(), 8)}`)
};

main();
