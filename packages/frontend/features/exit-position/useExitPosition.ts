import { useState } from "react";
import CompoundPositions from "../../containers/CompoundPositions";
import useGetExitParams from "./useGetExitParams";
import useExitPositionToEth from "./useExitPositionToEth";

const useExitPosition = () => {
  const [loading, setLoading] = useState(false);
  const { getBalances } = CompoundPositions.useContainer();
  const { getExitParams } = useGetExitParams();
  const { exitPositionToEth } = useExitPositionToEth();

  const exitPosition = async () => {
    window.analytics.track("Exit Positions Start");
    setLoading(true);

    const {
      etherToBorrowWeiBN,
      debtMarkets,
      collateralMarkets,
    } = await getExitParams();

    let tx = null;
    try {
      tx = await exitPositionToEth(
        etherToBorrowWeiBN,
        debtMarkets,
        collateralMarkets,
      );
      showLoadingToast(tx);
      await tx.wait();

      window.toastProvider.addMessage(`Exited Positions!`, {
        variant: "success",
      });
    } catch (e) {
      handleTxError(tx);
      setLoading(false);
      return;
    }

    window.analytics.track("Exit Positions Success");
    setLoading(false);
    getBalances();
  };

  return { exitPosition, loading };
};

export default useExitPosition;

function showLoadingToast(tx) {
  window.toastProvider.addMessage(`Exiting positions...`, {
    secondaryMessage: "Check progress on Etherscan",
    actionHref: `https://etherscan.io/tx/${tx.hash}`,
    actionText: "Check",
    variant: "processing",
  });
}

function handleTxError(tx) {
  if (tx === null) {
    window.toastProvider.addMessage(`Transaction cancelled`, {
      variant: "failure",
    });
  } else {
    window.toastProvider.addMessage(`Failed to exit poisitions...`, {
      secondaryMessage: "Check reason on Etherscan",
      actionHref: `https://etherscan.io/tx/${tx.hash}`,
      actionText: "Check",
      variant: "failure",
    });
  }
}
