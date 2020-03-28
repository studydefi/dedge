import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "ethers";
import { getLegos, networkIds } from "money-legos";

import { dedgeHelpers } from "../helpers/index";

import { wallet, provider, getRandomAddress } from "./common";

import {
  dacProxyFactoryAddress,
  dedgeGeneralManagerAddress
} from "../build/DeployedAddresses.json";

import dacProxyDef from "../artifacts/DACProxy.json";
import dacProxyFactoryDef from "../artifacts/DACProxyFactory.json";

const legos = getLegos(networkIds.mainnet);

chai.use(solidity);
const { expect } = chai;

describe("DedgeGeneralManager", () => {
  const randomAddress = getRandomAddress();

  const dacProxyFactoryContract = new ethers.Contract(
    dacProxyFactoryAddress,
    dacProxyFactoryDef.abi,
    wallet
  );

  // Mainnet testing ERC20 token
  const mainnetTestErc20TokenAddress =
    "0xeEf5E2d8255E973d587217f9509B416b41CA5870";
  // Adds the "drip" functionality (to mint tokens)
  const mainnetTestErc20TokenAbi = [
    {
      constant: false,
      inputs: [],
      name: "drip",
      outputs: [],
      payable: false,
      stateMutability: "nonpayable",
      type: "function"
    }
  ];
  const mainnetTestErc20TokenContract = new ethers.Contract(
    mainnetTestErc20TokenAddress,
    legos.erc20.abi.concat(mainnetTestErc20TokenAbi),
    wallet
  );

  let dacProxyContract: ethers.Contract;

  before(async () => {
    await dacProxyFactoryContract.build();

    const dacProxyAddress = await dacProxyFactoryContract.proxies(
      wallet.address
    );

    dacProxyContract = new ethers.Contract(
      dacProxyAddress,
      dacProxyDef.abi,
      wallet
    );

    // Drip  ~1000000000000000000000 wei tokens to wallet.address
    // and sends to dacProxyContract
    await mainnetTestErc20TokenContract.drip();
    await mainnetTestErc20TokenContract.transfer(
      dacProxyContract.address,
      ethers.utils.parseEther("10.0")
    );

    // Sends some ETH to dacProxy
    await wallet.sendTransaction({
      to: dacProxyAddress,
      value: ethers.utils.parseEther("2")
    });
  });

  it("Test ERC20 Transfer", async () => {
    const initialBalance = await mainnetTestErc20TokenContract.balanceOf(
      randomAddress
    );

    // Transfers some tokens from dacProxy to target address
    const erc20Tx = await dedgeHelpers.general.transferERC20(
      dacProxyContract,
      dedgeGeneralManagerAddress,
      mainnetTestErc20TokenAddress,
      randomAddress,
      ethers.utils.parseEther("10.0")
    );
    await erc20Tx.wait();

    // Makes sure balance is gt initial
    const finalBalance = await mainnetTestErc20TokenContract.balanceOf(
      randomAddress
    );

    expect(initialBalance.lt(finalBalance)).eq(true);
  });

  it("Test ETH Transfer", async () => {
    const initialBalance = await provider.getBalance(randomAddress);

    // Transfers some ETH from dacProxy to target address
    const ethTx = await dedgeHelpers.general.transferETH(
      dacProxyContract,
      dedgeGeneralManagerAddress,
      randomAddress,
      ethers.utils.parseEther("1.0")
    );
    await ethTx.wait();

    // Makes sure balance is gt initial
    const finalBalance = await provider.getBalance(randomAddress);

    expect(initialBalance.lt(finalBalance)).eq(true);
  });
});
