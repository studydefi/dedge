import CompoundPositions from "../../containers/CompoundPositions";

const useIsAmountAvailable = (
  amount: string,
  tokenStr: string,
  thingToSwap: string,
) => {
  const { compoundPositions } = CompoundPositions.useContainer();

  const tokenBalance = compoundPositions[tokenStr];

  // balances not yet loaded
  if (!tokenBalance) {
    return { isAmountAvailable: false };
  }

  const canSwapAmount =
    thingToSwap === "debt"
      ? parseFloat(tokenBalance.borrow)
      : 0.95 * parseFloat(tokenBalance.supply);

  const result = parseFloat(amount) <= canSwapAmount;

  return { isAmountAvailable: result, canSwapAmount };
};

export default useIsAmountAvailable;
