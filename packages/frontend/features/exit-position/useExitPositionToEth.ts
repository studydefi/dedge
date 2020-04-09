import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";
import ContractsContainer from "../../containers/Contracts";

import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";

const useExitPositionToEth = () => {
  const { address } = ConnectionContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();

  const { dedgeAddressRegistry, dedgeExitManager } = contracts;

  const exitPositionToEth = async (
    etherToBorrowWeiBN,
    debtMarkets,
    collateralMarkets,
  ) => {
    const tx = await dedgeHelpers.exit.exitPositionToETH(
      address,
      etherToBorrowWeiBN,
      proxy,
      dedgeAddressRegistry.address,
      dedgeExitManager.address,
      debtMarkets,
      collateralMarkets,
    );

    return tx;
  };

  return { exitPositionToEth };
};

export default useExitPositionToEth;
