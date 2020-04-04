import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";
import { ethers } from "ethers";

import { Button, Loader, Box, Flex, Field, Input } from "rimble-ui";

import ContractsContainer from "../../containers/Contracts";
import DACProxyContainer from "../../containers/DACProxy";

import { useState } from "react";

const SupplyCoin = ({ coin }) => {
  const { contracts } = ContractsContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();
  const [loading, setLoading] = useState(false);
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
            onChange={(e) => setAmount(e.target.value.toString())}
          />
        </Field>
      </Box>
      <Button
        ml={3}
        disabled={loading}
        onClick={async () => {
          setLoading(true);

          const { dedgeCompoundManager } = contracts;
          const tx = await dedgeHelpers.compound.supplyThroughProxy(
            proxy,
            dedgeCompoundManager.address,
            coin.cTokenEquilaventAddress,
            ethers.utils.parseUnits(amount, coin.symbol === "USDC" ? 6 : 18)
          );
          window.toastProvider.addMessage(`Supplying ${coin.symbol}...`, {
            secondaryMessage: "Check progress on Etherscan",
            actionHref: `https://etherscan.io/tx/${tx.hash}`,
            actionText: "Check",
            variant: "processing",
          });
          await tx.wait()

          window.toastProvider.addMessage(`Successfully supplied ${coin.symbol}!`, {
            variant: "success",
          });

          setLoading(false);
        }}
      >
        {loading ? (
          <Flex alignItems="center">
            <span>Supplying...</span> <Loader color="white" ml="2" />
          </Flex>
        ) : (
          "Supply"
        )}
      </Button>
    </Box>
  );
};

export default SupplyCoin;
