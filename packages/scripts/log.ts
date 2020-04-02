import { ethers } from "ethers";
import { getLegos, networkIds } from "money-legos";
import { wallet } from "dedge-smart-contracts/test/common";

import { dacProxyFactoryAddress } from "dedge-smart-contracts/build/DeployedAddresses.json";
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

const legos = getLegos(networkIds.mainnet);

const main = async () => {
  const gg = await dedgeHelpers.compound.getAccountSnapshot(
    wallet,
    legos.compound.cEther.address,
    addr
  );

  console.log(gg);
};

main();
