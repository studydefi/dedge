import DACProxyContainer from "../../containers/DACProxy";
import useMaxAvailable from "./useMaxAvailable";

const useAllowConfirm = (
  amountToSwap,
  fromTokenStr,
  toTokenStr,
  thingToSwap,
) => {
  const { hasProxy } = DACProxyContainer.useContainer();

  const { isAmountAvailable } = useMaxAvailable(
    amountToSwap,
    fromTokenStr,
    thingToSwap,
  );

  const disableConfirm =
    !hasProxy || // must be connected to smart wallet
    fromTokenStr === toTokenStr || // must not be same token
    !isAmountAvailable || // must have enough to swap
    amountToSwap === "" || // must have an amount specified
    amountToSwap === "0";

  return { confirmAllowed: !disableConfirm };
};

export default useAllowConfirm;
