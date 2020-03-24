import { ethers } from "ethers";
import legos from "../../money-legos";

const { maker } = legos;

const IDssProxyActions = new ethers.utils.Interface(maker.dssProxyActions.abi);

const useCreateErc20Position = (dedgeProxy: ethers.Contract) => {
  const openWithBat = async () => {
    const collateralAmount = ethers.utils.parseEther("1000"); // lock 1000 BAT
    const debtAmount = ethers.utils.parseEther("20.0"); // draw 20 DAI (minimum 20 DAI)

    const openVaultCalldata = IDssProxyActions.functions.openLockGemAndDraw.encode(
      [
        maker.dssCdpManager.address,
        maker.jug.address,
        maker.ilks["BAT-A"].join.address,
        maker.daiJoin.address,
        ethers.utils.formatBytes32String("BAT-A"),
        collateralAmount,
        debtAmount,
        true,
      ],
    );

    const openVaultTx = await dedgeProxy.execute(
      maker.dssProxyActions.address,
      openVaultCalldata,
      {
        gasLimit: 4000000,
      },
    );
    await openVaultTx.wait();
  };

  const openWithUsdc = async () => {
    const collateralAmount = ethers.utils.parseUnits("150", 6); // lock 150 USDC
    const debtAmount = ethers.utils.parseEther("20.0"); // draw 20 DAI (minimum 20 DAI)

    const openVaultCalldata = IDssProxyActions.functions.openLockGemAndDraw.encode(
      [
        maker.dssCdpManager.address,
        maker.jug.address,
        maker.ilks["USDC-A"].join.address,
        maker.daiJoin.address,
        ethers.utils.formatBytes32String("USDC-A"),
        collateralAmount,
        debtAmount,
        true,
      ],
    );

    const openVaultTx = await dedgeProxy.execute(
      maker.dssProxyActions.address,
      openVaultCalldata,
      {
        gasLimit: 4000000,
      },
    );
    await openVaultTx.wait();
  };

  return [openWithBat, openWithUsdc];
};

export default useCreateErc20Position;
