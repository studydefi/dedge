import { Box, Text } from "rimble-ui";

import usePreviewAmount from "./usePreviewAmount";

const PreviewAmount = ({
  thingToSwap,
  fromTokenStr,
  toTokenStr,
  amountToSwap,
}) => {
  const { amountToReceive, loading } = usePreviewAmount(
    thingToSwap,
    fromTokenStr,
    toTokenStr,
    amountToSwap,
  );

  return (
    <Box mb="3">
      {amountToReceive !== "" && (
        <Text fontWeight="bold">
          Approx. target amount:
          {loading ? (
            "..."
          ) : (
            <Text>{`${parseFloat(amountToReceive).toFixed(
              4,
            )} ${toTokenStr.toUpperCase()}`}</Text>
          )}
        </Text>
      )}
    </Box>
  );
};

export default PreviewAmount;
