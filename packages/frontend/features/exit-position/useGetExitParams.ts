import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";

import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";

const useGetExitParams = () => {
  const { signer } = ConnectionContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();

  const getExitParams = async () => {
    const {
      etherToBorrowWeiBN,
      debtMarkets,
      collateralMarkets,
    } = await dedgeHelpers.exit.getExitPositionParameters(
      signer,
      proxy.address,
    );

    return { etherToBorrowWeiBN, debtMarkets, collateralMarkets };
  };

  return { getExitParams };
};

export default useGetExitParams;
