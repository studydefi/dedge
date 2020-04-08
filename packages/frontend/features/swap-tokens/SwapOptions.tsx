import { Box, Flex, Button, Pill } from "rimble-ui";
import styled from "styled-components";

import { useState } from "react";

import Swap from "./Swap";
import ClearDust from "./ClearDust";

const Container = styled(Box)`
  margin-right: 16px;
  box-shadow: 2px 2px rgba(255, 0, 0, 0.5), 1px -2px rgba(0, 0, 255, 0.5),
    -1px 0px rgba(250, 180, 40, 0.5);
`;

enum SWAP_TAB_OPTIONS {
  Swap,
  ClearDust,
}

const SwapOptions = () => {
  const [selectedTab, setSelectedTab] = useState(SWAP_TAB_OPTIONS.Swap);

  return (
    <Container p="3">
      <Box m="auto">
        <Flex borderColor="#E8E8E8" justifyContent="center">
          <Box my={3} textAlign="center">
            {selectedTab === SWAP_TAB_OPTIONS.Swap ? (
              <Pill mt={2} color="primary">
                <Button.Text mainColor="#110C62">Swap</Button.Text>
              </Pill>
            ) : (
              <Button.Text
                mainColor="#988CF0"
                onClick={() => setSelectedTab(SWAP_TAB_OPTIONS.Swap)}
              >
                Swap
              </Button.Text>
            )}
            {selectedTab === SWAP_TAB_OPTIONS.ClearDust ? (
              <Pill mt={2} color="primary">
                <Button.Text mainColor="#110C62">Clear Dust</Button.Text>
              </Pill>
            ) : (
              <Button.Text
                mainColor="#988CF0"
                onClick={() => setSelectedTab(SWAP_TAB_OPTIONS.ClearDust)}
              >
                Clear Dust
              </Button.Text>
            )}
          </Box>
        </Flex>
      </Box>

      {selectedTab === SWAP_TAB_OPTIONS.Swap ? <Swap /> : null}
      {selectedTab === SWAP_TAB_OPTIONS.ClearDust ? <ClearDust /> : null}

    </Container>
  );
};
export default SwapOptions;
