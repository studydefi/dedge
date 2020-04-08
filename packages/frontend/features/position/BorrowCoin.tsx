import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";
import { ethers } from "ethers";

import { Button, Loader, Box, Flex, Field, Input, Text } from "rimble-ui";

import CompoundPositions from "../../containers/CompoundPositions";
import ContractsContainer from "../../containers/Contracts";
import DACProxyContainer from "../../containers/DACProxy";
import ConnectionContainer from "../../containers/Connection";

import { useState, useEffect } from "react";

const BorrowCoin = ({ coin, hide }) => {
  const { getBalances } = CompoundPositions.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { proxy } = DACProxyContainer.useContainer();
  const { signer } = ConnectionContainer.useContainer();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

  // So we only fetch the latest data
  // and our `getNewLiquidationPrice` doesn't clobber with one another
  const [getLiquidationCallId, setGetLiquidationCallId] = useState(null);
  const [gettingNewLiquidationPrice, setGettingNewLiquidationPrice] = useState(
    false,
  );
  const [newLiquidationPrice, setNewLiquidationPrice] = useState("—");

  const getNewLiquidationPrice = async () => {
    const {
      liquidationPriceUSD,
    } = await dedgeHelpers.compound.getPostActionAccountInformationPreAction(
      signer,
      proxy.address,
      coin.cTokenEquilaventAddress,
      ethers.utils.parseUnits(amount, coin.decimals),
      dedgeHelpers.compound.CTOKEN_ACTIONS.Borrow,
    );
    setNewLiquidationPrice(liquidationPriceUSD.toFixed(2));
    setGettingNewLiquidationPrice(false);
  };

  useEffect(() => {
    if (amount !== "") {
      try {
        parseFloat(amount);
        if (getLiquidationCallId !== null) {
          clearTimeout(getLiquidationCallId);
        }
        setGettingNewLiquidationPrice(true);
        setGetLiquidationCallId(
          setTimeout(() => getNewLiquidationPrice(), 500),
        );
      } catch (e) {}
    }
  }, [amount]);

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      display={hide ? "none" : "flex"}
    >
      {/* <Heading.h5 mb="2">Supply {coin.symbol}</Heading.h5> */}
      <Box mb="1">
        <Field label={`Amount of ${coin.symbol} to Borrow`}>
          <Input
            type="number"
            required={true}
            placeholder="1337"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.toString());
            }}
          />
        </Field>
      </Box>
      <Button
        ml={3}
        disabled={loading}
        onClick={async () => {
          setLoading(true);

          const { dedgeCompoundManager } = contracts;
          const tx = await dedgeHelpers.compound.borrowThroughProxy(
            proxy,
            dedgeCompoundManager.address,
            coin.cTokenEquilaventAddress,
            ethers.utils.parseUnits(amount, coin.decimals),
          );
          window.toastProvider.addMessage(`Borrowing ${coin.symbol}...`, {
            secondaryMessage: "Check progress on Etherscan",
            actionHref: `https://etherscan.io/tx/${tx.hash}`,
            actionText: "Check",
            variant: "processing",
          });
          await tx.wait();

          window.toastProvider.addMessage(
            `Successfully borrowed ${coin.symbol}!`,
            {
              variant: "success",
            },
          );

          setLoading(false);
          getBalances();
        }}
      >
        {loading ? (
          <Flex alignItems="center">
            <span>Borrowing...</span> <Loader color="white" ml="2" />
          </Flex>
        ) : (
          "Borrow"
        )}
      </Button>

      <br />
      <br />

      <Text>
        New liqudation price:{" $ "}
        {gettingNewLiquidationPrice ? `...` : newLiquidationPrice.toString()}
      </Text>
    </Flex>
  );
};

export default BorrowCoin;
