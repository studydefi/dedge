import ContractsContainer from "../../containers/Contracts";
import DACProxyContainer from "../../containers/DACProxy";

import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";
import { Address, Wei } from "../../types";

const useClearDustOperation = () => {
  const { contracts } = ContractsContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();

  const clearDustCollateral = async (
    fromCToken: Address,
    toCToken: Address,
    fromCTokenUnderlyingDelta: Wei,
  ) => {
    const { dedgeCompoundManager, dedgeAddressRegistry } = contracts;

    return dedgeHelpers.compound.clearDustCollateral(
      proxy,
      dedgeCompoundManager.address,
      dedgeAddressRegistry.address,
      fromCToken,
      fromCTokenUnderlyingDelta,
      toCToken,
    );
  };

  const clearDustDebt = async (
    fromCToken: Address,
    toCToken: Address,
    fromCTokenUnderlyingDelta: Wei,
  ) => {
    const { dedgeCompoundManager, dedgeAddressRegistry } = contracts;

    return dedgeHelpers.compound.clearDustDebt(
      proxy,
      dedgeCompoundManager.address,
      dedgeAddressRegistry.address,
      fromCToken,
      fromCTokenUnderlyingDelta,
      toCToken,
    );
  };

  return { clearDustDebt, clearDustCollateral };
};

export default useClearDustOperation;
