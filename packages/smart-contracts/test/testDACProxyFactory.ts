import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";

import { wallet, getRandomAddress, legos } from "./common";

import {
  dacProxyFactoryAddress,
  dedgeCompoundManagerAddress
} from "../build/DeployedAddresses.json";

import dacProxyFactoryDef from "../artifacts/DACProxyFactory.json";

import { dedgeHelpers } from "../helpers/index";

chai.use(solidity);
const { expect } = chai;

describe("DACProxyFactory", () => {
  const dacProxyFactoryContract = new ethers.Contract(
    dacProxyFactoryAddress,
    dacProxyFactoryDef.abi,
    wallet
  );

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  it("Test Proxy Creation", async () => {
    const targetAddress = getRandomAddress();
    // Should never have a proxy by default
    const noDacProxyAddress = await dacProxyFactoryContract.proxies(
      targetAddress
    );
    expect(noDacProxyAddress).to.eq(ZERO_ADDRESS);

    // Builds the proxy
    await dacProxyFactoryContract["build(address)"](targetAddress);

    // Make sure its not zero
    const dacProxyAddress = await dacProxyFactoryContract.proxies(
      targetAddress
    );
    expect(dacProxyAddress).to.not.eq(ZERO_ADDRESS);
  });

  it("Test Proxy Creation And Enter Markets", async () => {
    const targetAddress = getRandomAddress();
    // Should never have a proxy by default
    const noDacProxyAddress = await dacProxyFactoryContract.proxies(
      targetAddress
    );
    expect(noDacProxyAddress).to.eq(ZERO_ADDRESS);

    // CTokens to enter
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

    // Builds the proxy and enters the compound market
    await dedgeHelpers.proxyFactory.buildAndEnterMarketsOwner(
      targetAddress,
      dacProxyFactoryContract,
      dedgeCompoundManagerAddress,
      cTokensToEnter
    );

    // Make sure its not zero
    const dacProxyAddress = await dacProxyFactoryContract.proxies(
      targetAddress
    );

    expect(dacProxyAddress).to.not.eq(ZERO_ADDRESS);
  });
});
