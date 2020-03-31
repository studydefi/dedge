import useSwapOperation from "./useSwapOperation";
import ContractsContainer from "../../containers/Contracts";
import { ethers } from "ethers";
import { Wei } from "../../types";

const inWei = (x: string, u = 18): Wei => ethers.utils.parseUnits(x, u);

const useSwap = (thingToSwap, fromTokenStr, toTokenStr, amountToSwap) => {
  const { contracts } = ContractsContainer.useContainer();
  const { swapDebt, swapCollateral } = useSwapOperation();

  const swapFunction = async () => {
    const { cEther, cDai, cBat, cUsdc, cRep, cZrx, cWbtc } = contracts;

    const amount: Wei =
      fromTokenStr === "usdc" ? inWei(amountToSwap, 6) : inWei(amountToSwap);

    const ADDRESS_MAP = {
      eth: cEther.address,
      bat: cBat.address,
      dai: cDai.address,
      usdc: cUsdc.address,
      rep: cRep.address,
      zrx: cZrx.address,
      wbtc: cWbtc.address,
    };

    // perform swap debt
    if (thingToSwap === "debt") {
      const tx = await swapDebt(
        ADDRESS_MAP[fromTokenStr],
        ADDRESS_MAP[toTokenStr],
        amount,
      );
      console.log("Transaction Hash", tx.hash);
      await tx.wait();
      return;
    }

    // perform swap collateral
    const tx = await swapCollateral(
      ADDRESS_MAP[fromTokenStr],
      ADDRESS_MAP[toTokenStr],
      amount,
    );
    console.log("Transaction Hash", tx.hash);
    await tx.wait();
  };

  return { swapFunction };
};

export default useSwap;
