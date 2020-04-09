import ContractsContainer from "../../containers/Contracts";
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";
import CompoundPositions from "../../containers/CompoundPositions";

import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";
import { useState } from "react";

const useExitPosition = () => {
  const { address, signer } = ConnectionContainer.useContainer();
  const { getBalances } = CompoundPositions.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();

  const [loading, setLoading] = useState(false);

  const exitPosition = async () => {
    window.analytics.track("Exit Positions Start");
    setLoading(true);

    const { dedgeAddressRegistry, dedgeExitManager } = contracts;

    const {
      etherToBorrowWeiBN,
      debtMarkets,
      collateralMarkets,
    } = await dedgeHelpers.exit.getExitPositionParameters(
      signer,
      proxy.address,
    );

    let tx = null;
    try {
      tx = await dedgeHelpers.exit.exitPositionToETH(
        address,
        etherToBorrowWeiBN,
        proxy,
        dedgeAddressRegistry.address,
        dedgeExitManager.address,
        debtMarkets,
        collateralMarkets,
      );
      window.toastProvider.addMessage(`Exiting positions...`, {
        secondaryMessage: "Check progress on Etherscan",
        actionHref: `https://etherscan.io/tx/${tx.hash}`,
        actionText: "Check",
        variant: "processing",
      });
      await tx.wait();

      window.toastProvider.addMessage(`Exited Positions!`, {
        variant: "success",
      });
    } catch (e) {
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
