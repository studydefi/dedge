import { ethers } from "ethers";
import legos from "../../money-legos";

const { maker } = legos;

const IDssProxyActions = new ethers.utils.Interface(maker.dssProxyActions.abi);

const useCreateEthPosition = (dedgeProxy: ethers.Contract) => {
  const openVaultCalldata = IDssProxyActions.functions.openLockETHAndDraw.encode(
    [
      maker.dssCdpManager.address,
      maker.jug.address,
      maker.ethJoin.address,
      maker.daiJoin.address,
      ethers.utils.formatBytes32String(maker.ilks.ethA),
      ethers.utils.parseEther("20.0"), // Wanna Draw 20 DAI (minimum 20 DAI)
    ],
  );

  const createPosition = async () => {
    const openVaultTx = await dedgeProxy.execute(
      maker.dssProxyActions.address,
      openVaultCalldata,
      {
        gasLimit: 4000000,
        value: ethers.utils.parseEther("1.0"),
      },
    );
    await openVaultTx.wait();
  };
  return [createPosition];
};

export default useCreateEthPosition;
