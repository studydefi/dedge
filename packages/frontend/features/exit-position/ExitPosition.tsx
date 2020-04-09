import { useState } from "react";
import { Box, Button } from "rimble-ui";

import ExitPositionModal from "./ExitPositionModal";

const ExitPositionsButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  return (
    <Box>
      <Button
        onClick={() => {
          window.analytics.track("Exit Positions Modal Click");
          openModal();
        }}
      >
        Exit Positions
      </Button>

      <ExitPositionModal isOpen={isOpen} closeModal={closeModal} />
    </Box>
  );
};

export default ExitPositionsButton;
