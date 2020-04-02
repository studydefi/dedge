import { ethers } from "ethers";

import { dedgeHelpers } from "dedge-smart-contracts/helpers/index";

import {
  wallet,
  legos,
  tryAndWait
} from "dedge-smart-contracts/test/common";

import {
  dacProxyFactoryAddress,
  dedgeCompoundManagerAddress,
} from "dedge-smart-contracts/build/DeployedAddresses.json";

import dacProxyDef from "dedge-smart-contracts/artifacts/DACProxy.json";
import dacProxyFactoryDef from "dedge-smart-contracts/artifacts/DACProxyFactory.json";
import dedgeCompoundManagerDef from "dedge-smart-contracts/artifacts/DedgeCompoundManager.json";

const IDedgeCompoundManager = new ethers.utils.Interface(
  dedgeCompoundManagerDef.abi,
);

// Builds DAC Proxy And enters the compound market
const main = async () => {
  const dacProxyFactoryContract = new ethers.Contract(
    dacProxyFactoryAddress,
    dacProxyFactoryDef.abi,
    wallet,
  );

  let dacProxyContract: ethers.Contract; // Our proxy

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

  console.log(`Address: ${wallet.address}`)
  console.log("Creating proxy address and entering market....");
  await dedgeHelpers.proxyFactory.buildAndEnterMarkets(
    dacProxyFactoryContract,
    dedgeCompoundManagerAddress,
    cTokensToEnter,
  );

  const dacProxyAddress = await dacProxyFactoryContract.proxies(wallet.address);

  dacProxyContract = new ethers.Contract(
    dacProxyAddress,
    dacProxyDef.abi,
    wallet,
  );

  console.log(`Proxy: ${dacProxyAddress}`)

  // Supplies 10 ETH and borrows 500 DAI from compound via ds-proxy
  const ethToSupply = 10;
  const daiToBorrow = 500;
  const supplyEthAndBorrowCalldata = IDedgeCompoundManager.functions.supplyETHAndBorrow.encode(
    [
      legos.compound.cDAI.address,
      ethers.utils.parseEther(daiToBorrow.toString()),
    ],
  );

  console.log("Supplying 10 ETH and drawing 500 DAI....");
  await tryAndWait(
    dacProxyContract.execute(
      dedgeCompoundManagerAddress,
      supplyEthAndBorrowCalldata,
      {
        gasLimit: 4000000,
        value: ethers.utils.parseEther(ethToSupply.toString()),
      },
    ),
  );
  console.log("Complete");
};

main();
