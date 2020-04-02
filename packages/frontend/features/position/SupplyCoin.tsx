import {
  Button,
  Modal,
  Card,
  Box,
  Text,
  Field,
  Input,
  Heading,
} from "rimble-ui";
import DACProxyContainer from "../../containers/DACProxy";
import { useState } from "react";

const SupplyCoin = ({ coin }) => {
  const [amount, setAmount] = useState("");
  return (
    <Box>
      {/* <Heading.h5 mb="2">Supply {coin.symbol}</Heading.h5> */}
      <Box mb="1">
        <Field label={`Amount of ${coin.symbol} to supply`}>
          <Input
            type="number"
            required={true}
            placeholder="1337"
            value={amount}
            onChange={e => setAmount(e.target.value.toString())}
          />
        </Field>
      </Box>
      <Button>Supply</Button>
    </Box>
  );
};

export default SupplyCoin;
