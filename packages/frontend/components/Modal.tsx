import { Button, Flex } from "rimble-ui";

export const ModalBottom = ({ children }) => (
  <Flex
    px={4}
    py={3}
    borderTop={1}
    borderColor={"#E8E8E8"}
    justifyContent={"flex-end"}
  >
    {children}
  </Flex>
);

export const ModalCloseIcon = ({ onClick }) => (
  <Button.Text
    icononly
    icon={"Close"}
    color={"moon-gray"}
    position={"absolute"}
    top={0}
    right={0}
    mt={3}
    mr={3}
    onClick={onClick}
  />
);
