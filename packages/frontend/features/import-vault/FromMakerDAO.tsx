import { Box, Modal, Button, Heading, Card } from "rimble-ui";

import { useState } from "react";
import Select from "../../components/Select";
import { ModalBottom, ModalCloseIcon } from "../../components/Modal";
import DACProxyContainer from "../../containers/DACProxy";

import useMakerVaults from "./useMakerVaults";
import useAllowVaultTransfer from "./useAllowVaultTransfer";
import useImportVault from "./useImportVault";

const ImportButton = () => {
  const { proxy } = DACProxyContainer.useContainer();

  // state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState(null);

  // hooks
  const { vaultIds } = useMakerVaults();
  const { allow } = useAllowVaultTransfer(selectedVaultId);
  const { importVault } = useImportVault(selectedVaultId);

  // select first vault by default
  if (selectedVaultId === null && vaultIds.length > 0) {
    setSelectedVaultId(vaultIds[0]);
  }

  const closeModal = e => setIsOpen(false);
  const openModal = e => setIsOpen(true);

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
                {vaultIds.map((x: number) => {
                  return (
                    <option key={x} value={x}>
                      Vault #{x}
                    </option>
                  );
                })}
              </Select>
            </Box>

            <Box>
              <Heading.h5 mb="2">2. Allow Vault transfer</Heading.h5>
              <Button onClick={allow}>Allow</Button>
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
