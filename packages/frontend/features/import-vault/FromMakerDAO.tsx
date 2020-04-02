import { useState } from "react";
import {
  Box,
  Flex,
  Loader,
  Modal,
  Text,
  Button,
  Heading,
  Card,
  EthAddress,
} from "rimble-ui";

// components
import Select from "../../components/Select";
import { ModalBottom, ModalCloseIcon } from "../../components/Modal";

// containers
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";

// hooks
import useAllowVaultTransfer from "./useAllowVaultTransfer";
import useImportVault from "./useImportVault";
import VaultsContainer from "../../containers/Vaults";

const ImportButton = () => {
  const { address } = ConnectionContainer.useContainer();
  const { hasProxy } = DACProxyContainer.useContainer();
  const { vaultIds } = VaultsContainer.useContainer();

  // state
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState(null);

  // hooks
  const { allow, loading: loadingAllow, importAllowed } = useAllowVaultTransfer(
    selectedVaultId,
  );
  const { importVault, loading: loadingImport } = useImportVault(
    selectedVaultId,
  );

  // select first vault by default
  if (selectedVaultId === null && vaultIds.length > 0) {
    setSelectedVaultId(vaultIds[0]);
  }

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  // case 1: not connected
  if (!hasProxy) {
    return (
      <Button.Outline disabled>Import position from MakerDAO</Button.Outline>
    );
  }

  // case 2: no vaults found on MakerDAO for this address
  if (vaultIds.length === 0) {
    return (
      <Box>
        <Button onClick={openModal}>Import position from MakerDAO</Button>

        <Modal isOpen={isOpen}>
          <Card width={"640px"} p={0}>
            <ModalCloseIcon onClick={closeModal} />

            <Box p={4}>
              <Heading.h3 mb="4">Import Vault from MakerDAO</Heading.h3>

              <Text mb="3">
                No Vaults were found on MakerDAO under your current address:
              </Text>
              <EthAddress address={address} />
            </Box>
            <ModalBottom>
              <Button.Outline onClick={closeModal}>Close</Button.Outline>
            </ModalBottom>
          </Card>
        </Modal>
      </Box>
    );
  }

  // case 3: vaults are found
  return (
    <Box>
      <Button onClick={openModal}>Import position from MakerDAO</Button>

      <Modal isOpen={isOpen}>
        <Card width={"640px"} p={0}>
          <ModalCloseIcon onClick={closeModal} />

          <Box p={4}>
            <Heading.h3 mb="4">Import from MakerDAO</Heading.h3>

            <Box mb="4">
              <Heading.h5 mb="2">1. Select your Vault</Heading.h5>
              <Select
                onChange={x => setSelectedVaultId(x.target.value)}
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
              {importAllowed ? (
                <Text>Import Approved</Text>
              ) : (
                <Button onClick={allow}>
                  {loadingAllow ? (
                    <Flex alignItems="center">
                      <span>Allowing...</span> <Loader color="white" ml="2" />
                    </Flex>
                  ) : (
                    "Allow Import"
                  )}
                </Button>
              )}
            </Box>
          </Box>

          <ModalBottom>
            <Button.Outline onClick={closeModal}>Close</Button.Outline>
            <Button
              disabled={!importAllowed || loadingImport}
              ml={3}
              onClick={importVault}
            >
              {loadingImport ? (
                <Flex alignItems="center">
                  <span>Importing...</span> <Loader color="white" ml="2" />
                </Flex>
              ) : (
                "Import Vault"
              )}
            </Button>
          </ModalBottom>
        </Card>
      </Modal>
    </Box>
  );
};

export default ImportButton;
