import { ethers } from "ethers";

import legos from "../../money-legos";

import ContractsContainer from "../containers/Contracts";
import EthersContainer from "../containers/Ethers";
import ProxiesContainer from "../containers/Proxies";

const useEnterCompoundMarkets = () => {
  const { signer } = EthersContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { dedgeProxy } = ProxiesContainer.useContainer();

  const enterMarkets = async () => {
    if (signer && contracts && dedgeProxy) {
      const { dedge, compound } = legos;
      const IDedgeCompoundManager = new ethers.utils.Interface(
        dedge.dedgeCompoundManager.abi,
      );

      const marketEnterCalldata = IDedgeCompoundManager.functions.enterMarketsAndApproveCTokens.encode(
        [
          [
            compound.cDai.address,
            compound.cEther.address,
            compound.cBat.address,
            compound.cZRX.address,
            compound.cREP.address,
            compound.cUSDC.address,
          ],
        ],
      );

      await dedgeProxy.execute(
        dedge.dedgeCompoundManager.address,
        marketEnterCalldata,
        {
          gasLimit: 4000000,
        },
      );
    }
  };

  return [enterMarkets];
};

export default useEnterCompoundMarkets;
