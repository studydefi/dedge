import {
  Box,
  Modal,
  Button,
  Heading,
  Card,
} from "rimble-ui";

import { useState } from "react";
import Select from "../../components/Select";
import { ModalBottom, ModalCloseIcon } from "../../components/Modal";
import useMakerVaults from "./useMakerVaults";

const ImportButton = () => {
  const { vaults } = useMakerVaults();
  const [isOpen, setIsOpen] = useState(true);

  const closeModal = e => {
    e.preventDefault();
    setIsOpen(false);
  };

  const openModal = e => {
    e.preventDefault();
    setIsOpen(true);
  };

  const importVault = () => {};

  return (
    <Box>
      <Button onClick={openModal} disabled={vaults.length !== 0}>
        From MakerDAO
      </Button>

      <Modal isOpen={isOpen}>
        <Card width={"420px"} p={0}>
          <ModalCloseIcon onClick={closeModal} />

          <Box p={4}>
            <Heading.h3 mb="4">Import from MakerDAO</Heading.h3>

            <Box mb="4">
              <Heading.h5 mb="2">1. Select your Vault</Heading.h5>
              <Select required>
                <option value="1324">Vault #1324</option>
                <option value="2532">Vault #2532</option>
              </Select>
            </Box>

            <Box>
              <Heading.h5 mb="2">2. Allow Vault transfer</Heading.h5>
              <Button>Allow</Button>
            </Box>
          </Box>

          <ModalBottom>
            <Button.Outline onClick={closeModal}>Cancel</Button.Outline>
            <Button ml={3} onClick={importVault} disabled>
              Import
            </Button>
          </ModalBottom>
        </Card>
      </Modal>
    </Box>
  );
};

export default ImportButton;
