import { useState } from "react";
import CompoundPositions from "../../containers/CompoundPositions";

import useGetExitParams from "./useGetExitParams";
import useExitPositionToEth from "./useExitPositionToEth";

import {
  handleTxException,
  showTxLoadingToast
} from '../common/txUtils'

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
      showTxLoadingToast(tx, 'exiting positions');
      await tx.wait();

      window.toastProvider.addMessage(`Exited Positions!`, {
        variant: "success",
      });
    } catch (e) {
      handleTxException(tx, 'exit positions');
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
