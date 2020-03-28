import { useState, useEffect } from "react";
import { ethers } from "ethers";

import legos from "../../money-legos";

const useVaultBalance = (contracts, vaultId) => {
  const [collateral, setCollateral] = useState(null);
  const [debt, setDebt] = useState(null);

  const getBalance = async () => {
    const { dedgeMakerManager } = contracts;
    const { dssCdpManager } = legos.maker;

    const collateralWei = await dedgeMakerManager.getVaultCollateral(
      dssCdpManager.address,
      parseInt(vaultId),
    );
    const debtWei = await dedgeMakerManager.getVaultDebt(
      dssCdpManager.address,
      parseInt(vaultId),
    );

    const collateral = ethers.utils.formatEther(collateralWei.toString());
    const debt = ethers.utils.formatEther(debtWei.toString());

    setCollateral(collateral);
    setDebt(debt);
  };

  useEffect(() => {
    if (contracts) {
      getBalance();
    }
  }, [vaultId, contracts]);

  return [collateral, debt];
};

export default useVaultBalance;
