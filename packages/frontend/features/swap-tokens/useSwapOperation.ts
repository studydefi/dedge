import ContractsContainer from "../../containers/Contracts";
import DACProxyContainer from "../../containers/DACProxy";
import { useEffect } from "react";

import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";

const useSwapOperation = () => {
  const { contracts } = ContractsContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();

  const swapDebt = async (fromCToken, toCToken, fromCTokenUnderlyingDelta) => {
    const { dedgeCompoundManager, dedgeAddressRegistry } = contracts;

    await dedgeHelpers.compound.swapDebt(
      proxy,
      dedgeCompoundManager.address,
      dedgeAddressRegistry.address,
      fromCToken,
      fromCTokenUnderlyingDelta,
      toCToken,
    );
  };

  // useEffect(() => {
  //   console.log("contracts", contracts);
  //   if (proxy) {
  //   }
  // }, [proxy, contracts]);

  return { swapDebt };
};

export default useSwapOperation;
