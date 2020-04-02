import { ethers } from "ethers";
import { BigNumber } from "ethers/utils/bignumber";
import { Address } from "./types";

import dedgeExitManagerDef from "../artifacts/DedgeExitManager.json";

const IDedgeExitManager = new ethers.utils.Interface(dedgeExitManagerDef.abi);

const getExitPositionParameters = async (
    dacProxy: Address
) => {
  const enteredMarkets = await comptrollerContract.getAssetsIn(
    dacProxy
  );

  const debtMarkets = [];
  const collateralMarkets = [];
  let ethersOwed = 0;

  for (let i = 0; i < enteredMarkets.length; i++) {
    const curCToken = enteredMarkets[i];

    // TODO: Change to borrowBalanceCurrent
    const curDebtBal = await newCTokenContract(curCToken).borrowBalanceStored(
        dacProxy
    );
    const curColBal = await newCTokenContract(curCToken).balanceOfUnderlying(
        dacProxy
    );

    if (curDebtBal > 0) {
      debtMarkets.push(curCToken);

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
          wallet
        );

        const ethOwedAmount = await uniswapExchangeContract.getEthToTokenOutputPrice(
          curDebtBal.toString()
        );

        ethersOwed = ethersOwed + ethOwedAmount;
      }
    }

    if (curColBal > 0) {
      collateralMarkets.push(curCToken);
    }
  }
};

const exitPositionToETH = (
  dacProxy: ethers.Contract,
  dedgeGeneralManager: Address,
  target: Address,
  amountWei: BigNumber,
  gasLimit: Number = 4000000
): Promise<any> => {
  const transferETHCallback = IDedgeGeneralManager.functions.transferETH.encode(
    [target, amountWei.toString()]
  );
  return dacProxy.execute(dedgeGeneralManager, transferETHCallback, {
    gasLimit
  });
};

export default {
  exitPositionToETH,
  transferETH
};
