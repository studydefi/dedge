import ContractsContainer from "../../containers/Contracts";
import DACProxyContainer from "../../containers/DACProxy";

import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";
import { Address, Wei } from "../../types";

const useSwapOperations = () => {
  const { contracts } = ContractsContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();

  const swapDebt = async (
    fromCToken: Address,
    toCToken: Address,
    fromCTokenUnderlyingDelta: Wei,
  ) => {
    const { dedgeCompoundManager, dedgeAddressRegistry } = contracts;

    return dedgeHelpers.compound.swapDebt(
      proxy,
      dedgeCompoundManager.address,
      dedgeAddressRegistry.address,
      fromCToken,
      fromCTokenUnderlyingDelta,
      toCToken,
    );
  };

  const swapCollateral = async (
    fromCToken: Address,
    toCToken: Address,
    fromCTokenUnderlyingDelta: Wei,
  ) => {
    const { dedgeCompoundManager, dedgeAddressRegistry } = contracts;

    return dedgeHelpers.compound.swapCollateral(
      proxy,
      dedgeCompoundManager.address,
      dedgeAddressRegistry.address,
      fromCToken,
      fromCTokenUnderlyingDelta,
      toCToken,
    );
  };

  return { swapDebt, swapCollateral };
};

export default useSwapOperations;
