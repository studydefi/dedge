import CompoundPositions from "../../containers/CompoundPositions";

const useMaxAvailable = (
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

  const maxSwapAmount =
    thingToSwap === "debt"
      ? parseFloat(tokenBalance.borrow)
      : parseFloat(tokenBalance.supply);

  const result = parseFloat(amount) <= maxSwapAmount;

  return { isAmountAvailable: result, maxSwapAmount };
};

export default useMaxAvailable;
