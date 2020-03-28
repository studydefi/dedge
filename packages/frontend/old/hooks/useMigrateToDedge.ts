import { useEffect } from "react";
import legos from "../../money-legos";
import { ethers } from "ethers";

// create interface for dedge
const { dedgeMakerManager } = legos.dedge;
const IDedgeMakerManager = new ethers.utils.Interface(dedgeMakerManager.abi);

const useMigrateToDedge = (dedgeProxyAddr, dedgeProxy, vault) => {
  const migrate = async () => {
    const ilkLego = legos.maker.ilks[vault.ilk];
    const tokenAddress = ilkLego.token.address;
    const joinAddress = ilkLego.join.address;

    const importMakerVaultCallbackdata = IDedgeMakerManager.functions.importMakerVault.encode(
      [
        dedgeProxyAddr,
        dedgeMakerManager.address,
        tokenAddress,
        joinAddress,
        vault.id,
      ],
    );

    const tx = await dedgeProxy.execute(
      legos.dedge.dedgeMakerManager.address,
      importMakerVaultCallbackdata,
      {
        gasLimit: 4000000,
      },
    );

    await tx.wait();
  };

  return [migrate];
};

export default useMigrateToDedge;
