import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";
import { ethers } from "ethers";
import { legos } from "money-legos/dist";

import { Button, Text, Loader, Box, Flex, Field, Input } from "rimble-ui";

import CompoundPositions from "../../containers/CompoundPositions";
import ContractsContainer from "../../containers/Contracts";
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";

import { useState, useEffect } from "react";

const SupplyCoin = ({ coin }) => {
  const { getBalances } = CompoundPositions.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { signer, address } = ConnectionContainer.useContainer();
  const { hasProxy, proxy, proxyAddress } = DACProxyContainer.useContainer();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

  const [transferLoading, setTransferLoading] = useState(false);
  const [canTransfer, setCanTransfer] = useState(null);

  const [gettingNewLiquidationPrice, setGettingNewLiquidationPrice] = useState(
    false
  );
  const [newLiquidationPrice, setNewLiquidationPrice] = useState("—");

  const getNewLiquidationPrice = async () => {
    setGettingNewLiquidationPrice(true);
    const {
      liquidationPriceUSD,
    } = await dedgeHelpers.compound.getPostActionAccountInformationPreAction(
      signer,
      proxy.address,
      coin.cTokenEquilaventAddress,
      ethers.utils.parseUnits(amount, coin.decimals),
      dedgeHelpers.compound.CTOKEN_ACTIONS.Supply
    );
    setNewLiquidationPrice(liquidationPriceUSD.toFixed(2));
    setGettingNewLiquidationPrice(false);
  };

  const getCanTransfer = async () => {
    if (coin.symbol === "ETH") {
      setCanTransfer(true);
      return;
    }

    const tokenContract = new ethers.Contract(
      coin.address,
      legos.erc20.abi,
      signer
    );

    const allowance = await tokenContract.allowance(address, proxyAddress);

    if (allowance.toString() === "0") {
      setCanTransfer(false);
      return;
    }

    setCanTransfer(true);
  };

  useEffect(() => {
    if (hasProxy) {
      getCanTransfer();
    }
  }, [proxy]);

  useEffect(() => {
    if (amount !== "") {
      try {
        parseFloat(amount);
        getNewLiquidationPrice();
      } catch (e) {}
    }
  }, [amount]);

  return (
    <Box>
      {/* <Heading.h5 mb="2">Supply {coin.symbol}</Heading.h5> */}
      <Box mb="1">
        <Field required={true} label={`Amount of ${coin.symbol} to Supply`}>
          {canTransfer === false || canTransfer === null ? (
            <Input required={true} type="hidden" />
          ) : (
            <Input
              type="number"
              required={true}
              placeholder="1337"
              value={amount}
              onChange={(e) => setAmount(e.target.value.toString())}
            />
          )}
        </Field>
      </Box>
      {canTransfer === false || canTransfer === null ? (
        <>
          <Text>This action must be approved first:</Text>
          <Button
            ml={3}
            disabled={canTransfer || canTransfer === null}
            onClick={async () => {
              const maxUINT =
                "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
              setTransferLoading(true);

              const tokenContract = new ethers.Contract(
                coin.address,
                legos.erc20.abi,
                signer
              );

              const tx = await tokenContract.approve(proxyAddress, maxUINT);
              window.toastProvider.addMessage(`Approving ${coin.symbol}...`, {
                secondaryMessage: "Check progress on Etherscan",
                actionHref: `https://etherscan.io/tx/${tx.hash}`,
                actionText: "Check",
                variant: "processing",
              });
              await tx.wait();

              window.toastProvider.addMessage(
                `Successfully approved ${coin.symbol}!`,
                {
                  variant: "success",
                }
              );

              setTransferLoading(false);

              getCanTransfer();
            }}
          >
            {canTransfer === null ? (
              <Flex alignItems="center">
                <span>Checking...</span> <Loader color="white" ml="2" />
              </Flex>
            ) : transferLoading ? (
              <Flex alignItems="center">
                <span>Approving...</span> <Loader color="white" ml="2" />
              </Flex>
            ) : (
              "Allow Action"
            )}
          </Button>
        </>
      ) : (
        <>
          <Button
            ml={3}
            disabled={loading || !canTransfer}
            onClick={async () => {
              setLoading(true);

              const { dedgeCompoundManager } = contracts;
              const tx = await dedgeHelpers.compound.supplyThroughProxy(
                proxy,
                dedgeCompoundManager.address,
                coin.cTokenEquilaventAddress,
                ethers.utils.parseUnits(amount, coin.decimals)
              );
              window.toastProvider.addMessage(`Supplying ${coin.symbol}...`, {
                secondaryMessage: "Check progress on Etherscan",
                actionHref: `https://etherscan.io/tx/${tx.hash}`,
                actionText: "Check",
                variant: "processing",
              });
              await tx.wait();

              window.toastProvider.addMessage(
                `Successfully supplied ${coin.symbol}!`,
                {
                  variant: "success",
                }
              );

              setLoading(false);
              getBalances();
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

          <br />
          <br />

          <Text>
            New liqudation price:{" $ "}
            {gettingNewLiquidationPrice
              ? `...`
              : newLiquidationPrice.toString()}
          </Text>
        </>
      )}
    </Box>
  );
};

export default SupplyCoin;
