import { ethers } from "ethers";
import { BigNumber } from "ethers/utils/bignumber";
import { Address } from "./types";

import { getLegos, networkIds } from "money-legos";

import dedgeExitManagerDef from "../artifacts/DedgeExitManager.json";

const legos = getLegos(networkIds.mainnet);

const IDedgeExitManager = new ethers.utils.Interface(dedgeExitManagerDef.abi);

const getExitPositionParameters = async (
  signer: ethers.Wallet,
  dacProxy: Address
) => {
  const newCTokenContract = (curCToken: Address) =>
    new ethers.Contract(curCToken, legos.compound.cTokenAbi, signer);

  const comptrollerContract = new ethers.Contract(
    legos.compound.comptroller.address,
    legos.compound.comptroller.abi,
    signer
  );

  const uniswapFactoryContract = new ethers.Contract(
    legos.uniswap.factory.address,
    legos.uniswap.factory.abi,
    signer
  );

  const enteredMarkets = await comptrollerContract.getAssetsIn(dacProxy);

  const debtMarkets = [];
  const collateralMarkets = [];
  let ethersOwed = 0;

  // tslint:disable-next-line
  for (let i = 0; i < enteredMarkets.length; i++) {
    const curCToken = enteredMarkets[i];

    // TODO: Change this to borrowBalanceCurrent
    const curDebtBal = await newCTokenContract(curCToken).borrowBalanceStored(
      dacProxy
    );
    const curColBal = await newCTokenContract(curCToken).balanceOfUnderlying(
      dacProxy
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
          signer
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

      // On mainnet, we should be able to do 100% but we need to change
      // borrowBalanceStored to borrowBalanceCurrent
      collateralMarkets.push([curCToken, curColBal.mul(99).div(100)]);
    }
  }

  return {
    etherToBorrowWeiBN: ethers.utils.parseEther(
      ethers.utils.formatEther(ethersOwed.toString())
    ),
    debtMarkets,
    collateralMarkets
  };
};

const exitPositionToETH = (
  exitToUser: Address,
  etherToBorrowWei: BigNumber,
  dacProxy: ethers.Contract,
  addressRegistry: Address,
  dedgeExitManager: Address,
  debtMarkets: [Address, BigNumber][],
  collateralMarkets: [Address, BigNumber][],
  overrides: any = { gasLimit: 4000000 }
): Promise<any> => {
  const abiPrefix = ethers.utils.defaultAbiCoder.encode(["uint"], [32]);
  const abiExitUserAddress = ethers.utils.defaultAbiCoder.encode(
    ["address"],
    [exitToUser]
  );
  const abiAddressRegistryAddress = ethers.utils.defaultAbiCoder.encode(
    ["address"],
    [addressRegistry]
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
      // TODO: Change this to 100% after mainnet
      // Wanna loan 105% dacProxyinstead of 100% due to potential slippages
      etherToBorrowWei
        .mul(105)
        .div(100)
        .toString(),
      dedgeExitManager,
      dacProxy.address,
      addressRegistry,
      executeOperationCalldataParams
    ]
  );

  return dacProxy.execute(dedgeExitManager, exitPositionsCallbackdata, overrides);
};

export default {
  exitPositionToETH,
  getExitPositionParameters
};
