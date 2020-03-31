import {
  Box,
  Field,
  Flex,
  Modal,
  Button,
  Text,
  Heading,
  Card,
} from "rimble-ui";
import styled from "styled-components";
import { useState } from "react";
import Select from "../../components/Select";

const Container = styled(Flex)`
  // background: yellow;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

const FromInstaDapp = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box>
      <Button disabled>
        From InstaDapp
      </Button>
    </Box>
  );
};

export default FromInstaDapp;
