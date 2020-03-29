import { Box, Field, Flex, Modal, Button, Text, Heading, Card } from "rimble-ui";
import styled from "styled-components";
import { useState } from "react";
import Select from "../../components/Select";

const Container = styled(Flex)`
  // background: yellow;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const ImportButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = e => {
    e.preventDefault();
    setIsOpen(false);
  };

  const openModal = e => {
    e.preventDefault();
    setIsOpen(true);
  };

  return (
    <Box>
      <Button onClick={openModal}>
        From MakerDAO
      </Button>

      <Modal isOpen={isOpen}>
        <Card width={"420px"} p={0}>
          <Button.Text
            icononly
            icon={"Close"}
            color={"moon-gray"}
            position={"absolute"}
            top={0}
            right={0}
            mt={3}
            mr={3}
            onClick={closeModal}
          />

          <Box p={4} mb={3}>
            <Heading.h3>Import from MakerDAO</Heading.h3>
            <Box>
              <Field label="Your MakerDAO Vaults (2)">
              <Select required>
                <option value="1324">Vault #1324</option>
                <option value="2532">Vault #2532</option>
              </Select>
              </Field>
            </Box>
          </Box>

          <Flex
            px={4}
            py={3}
            borderTop={1}
            borderColor={"#E8E8E8"}
            justifyContent={"flex-end"}
          >
            <Button.Outline onClick={closeModal}>Cancel</Button.Outline>
            <Button ml={3}>Confirm</Button>
          </Flex>
        </Card>
      </Modal>
    </Box>
  );
};

export default ImportButton;
