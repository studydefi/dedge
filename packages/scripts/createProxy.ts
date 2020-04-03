import { ethers } from "ethers";

import { dedgeHelpers } from "dedge-smart-contracts/helpers/index";

import {
  wallet,
  legos,
} from "dedge-smart-contracts/test/common";

import {
  dacProxyFactoryAddress,
  dedgeCompoundManagerAddress
} from "dedge-smart-contracts/artifacts/DeployedAddresses.json";

import dacProxyFactoryDef from "dedge-smart-contracts/artifacts/DACProxyFactory.json";

if (process.argv.length !== 3) {
  console.log(
    `ts-node createProxy.ts <target-address>`
  );
  process.exit(1);
}

const targetAddress = process.argv[2];

// Builds DAC Proxy And enters the compound market
const main = async () => {
  const dacProxyFactoryContract = new ethers.Contract(
    dacProxyFactoryAddress,
    dacProxyFactoryDef.abi,
    wallet
  );

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

  console.log("Creating proxy address and entering market....");
  await dedgeHelpers.proxyFactory.buildAndEnterMarketsOwner(
    targetAddress,
    dacProxyFactoryContract,
    dedgeCompoundManagerAddress,
    cTokensToEnter
  );
  console.log("Complete");
};

main();
