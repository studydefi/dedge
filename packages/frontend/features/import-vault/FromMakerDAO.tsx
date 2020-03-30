import { ethers } from "ethers";
import { Box, Modal, Button, Heading, Card } from "rimble-ui";

import { useState } from "react";
import Select from "../../components/Select";
import { ModalBottom, ModalCloseIcon } from "../../components/Modal";
import useMakerVaults from "./useMakerVaults";
import DACProxyContainer from "../../containers/DACProxy";
import ContractsContainer from "../../containers/Contracts";
import ConnectionContainer from "../../containers/Connection";
import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";

import { legos } from "money-legos/dist";

const ImportButton = () => {
  const { address, signer } = ConnectionContainer.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { proxy, proxyAddress} = DACProxyContainer.useContainer();
  const { vaultIds } = useMakerVaults();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState(null);

  const closeModal = e => {
    e.preventDefault();
    setIsOpen(false);
  };

  const openModal = e => {
    e.preventDefault();
    setIsOpen(true);
  };

  const cdpAllow = async () => {
    const {
      makerCdpManager,
      makerProxyRegistry,
      makerProxyActions
    } = contracts;
    const userMakerdaoProxyAddress = await makerProxyRegistry.proxies(address);

    const makerDsProxyContract = new ethers.Contract(
      userMakerdaoProxyAddress,
      legos.dappsys.dsProxy.abi,
      signer
    );

    await dedgeHelpers.maker.dsProxyCdpAllowDacProxy(
      makerDsProxyContract,
      proxyAddress,
      makerCdpManager.address,
      makerProxyActions.address,
      selectedVaultId.toString(),
    );
  };

  const importVault = async () => {
    const {
      makerCdpManager,
      dedgeAddressRegistry,
      dedgeMakerManager
    } = contracts;
    const ilkBytes32 = await makerCdpManager.ilks(selectedVaultId.toString());
    const ilk = ethers.utils.parseBytes32String(ilkBytes32);

    let decimals = 18;
    let ilkJoinAddress
    let ilkCTokenEquilavent
    if (ilk === "USDC-A") {
      decimals = 6;
      ilkJoinAddress = legos.maker.ilks.usdcA.join.address[1]
      ilkCTokenEquilavent = legos.compound.cUSDC.address[1]
    } else if (ilk === "ETH-A") {
      ilkJoinAddress = legos.maker.ilks.ethA.join.address[1]
      ilkCTokenEquilavent = legos.compound.cEther.address[1]
    } else if (ilk === "BAT-A") {
      ilkJoinAddress = legos.maker.ilks.batA.join.address[1]
      ilkCTokenEquilavent = legos.compound.cBAT.address[1]
    } else {
      alert("FUCK")
    }

    await dedgeHelpers.maker.importMakerVault(
      proxy,
      dedgeMakerManager.address,
      dedgeAddressRegistry.address,
      selectedVaultId.toString(),
      ilkCTokenEquilavent,
      ilkJoinAddress,
      decimals
    )
  };

  const buttonDisabled = !proxy || vaultIds.length === 0;

  return (
    <Box>
      <Button onClick={openModal} disabled={buttonDisabled}>
        From MakerDAO
      </Button>

      <Modal isOpen={isOpen}>
        <Card width={"420px"} p={0}>
          <ModalCloseIcon onClick={closeModal} />

          <Box p={4}>
            <Heading.h3 mb="4">Import from MakerDAO</Heading.h3>

            <Box mb="4">
              <Heading.h5 mb="2">1. Select your Vault</Heading.h5>
              <Select
                onChange={x => {
                  setSelectedVaultId(x.target.value);
                }}
                value={selectedVaultId}
                required
              >
                <option value="" selected disabled hidden>
                  Choose here
                </option>
                {vaultIds.map((x: number) => {
                  return <option value={x}>Vault #{x}</option>;
                })}
              </Select>
            </Box>

            <Box>
              <Heading.h5 mb="2">2. Allow Vault transfer</Heading.h5>
              <Button onClick={cdpAllow}>Allow</Button>
            </Box>
          </Box>

          <ModalBottom>
            <Button.Outline onClick={closeModal}>Cancel</Button.Outline>
            <Button ml={3} onClick={importVault}>
              Import
            </Button>
          </ModalBottom>
        </Card>
      </Modal>
    </Box>
  );
};

export default ImportButton;
