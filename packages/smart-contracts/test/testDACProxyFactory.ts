import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";

import { wallet, getRandomAddress } from "./common";

import { dacProxyFactoryAddress } from "../build/DeployedAddresses.json";

import dacProxyFactoryDef from "../artifacts/DACProxyFactory.json";

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
});
