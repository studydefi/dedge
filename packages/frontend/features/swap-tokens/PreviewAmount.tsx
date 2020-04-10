import { Box, Text, Field, Input, Link, Tooltip } from "rimble-ui";

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
      <Field
        mb="0"
        label={`Converted to ${toTokenStr.toLocaleUpperCase()} (approx)`}
      >
        <Input
          readOnly
          required={true}
          placeholder="1337"
          value={loading ? "..." : amountToReceive}
        />
      </Field>
    </Box>
  );
};

export default PreviewAmount;
