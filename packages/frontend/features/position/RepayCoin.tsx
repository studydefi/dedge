import { dedgeHelpers } from "../../../smart-contracts/dist/helpers";
import { ethers } from "ethers";
import { legos } from "money-legos/dist";

import { Button, Loader, Text, Box, Flex, Field, Input } from "rimble-ui";

import CompoundPositions from "../../containers/CompoundPositions";
import ContractsContainer from "../../containers/Contracts";
import ConnectionContainer from "../../containers/Connection";
import DACProxyContainer from "../../containers/DACProxy";

import { useState, useEffect } from "react";

const RepayCoin = ({ coin, hide }) => {
  const { getBalances } = CompoundPositions.useContainer();
  const { contracts } = ContractsContainer.useContainer();
  const { signer, address } = ConnectionContainer.useContainer();
  const { hasProxy, proxy, proxyAddress } = DACProxyContainer.useContainer();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

  const [transferLoading, setTransferLoading] = useState(false);
  const [canTransfer, setCanTransfer] = useState(null);

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
      dedgeHelpers.compound.CTOKEN_ACTIONS.Repay,
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

  const getCanTransfer = async () => {
    if (coin.symbol === "ETH") {
      setCanTransfer(true);
      return;
    }

    const tokenContract = new ethers.Contract(
      coin.address,
      legos.erc20.abi,
      signer,
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
    <Flex
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      display={hide ? "none" : "flex"}
    >
      {/* <Heading.h5 mb="2">Supply {coin.symbol}</Heading.h5> */}
      <Box mb="1">
        <Field required={true} label={`Amount of ${coin.symbol} to Repay`}>
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
                signer,
              );

<<<<<<< HEAD
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
                },
              );
=======
              let tx = null;
              try {
                tx = await tokenContract.approve(proxyAddress, maxUINT);
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
              } catch (e) {
                if (tx === null) {
                  window.toastProvider.addMessage(`Tx cancelled`, {
                    variant: "failure",
                  });
                } else {
                  window.toastProvider.addMessage(`Failed to approve ${coin.symbol}...`, {
                    secondaryMessage: "Check reason on Etherscan",
                    actionHref: `https://etherscan.io/tx/${tx.hash}`,
                    actionText: "Check",
                    variant: "failure",
                  });
                }
                setTransferLoading(false);
                return;
              }
>>>>>>> handle logic if tx fails or if user cancels tx

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
              let tx = null;

              try {
                tx = await dedgeHelpers.compound.repayThroughProxy(
                  proxy,
                  dedgeCompoundManager.address,
                  coin.cTokenEquilaventAddress,
                  ethers.utils.parseUnits(amount, coin.decimals)
                );
                window.toastProvider.addMessage(`Repaying ${coin.symbol}...`, {
                  secondaryMessage: "Check progress on Etherscan",
                  actionHref: `https://etherscan.io/tx/${tx.hash}`,
                  actionText: "Check",
                  variant: "processing",
                });
                await tx.wait();

                window.toastProvider.addMessage(
                  `Successfully repayed ${coin.symbol}!`,
                  {
                    variant: "success",
                  }
                );
              } catch (e) {
                if (tx === null) {
                  window.toastProvider.addMessage(`Transaction cancelled`, {
                    variant: "failure",
                  });
                } else {
                  window.toastProvider.addMessage(
                    `Failed to repay...`,
                    {
                      secondaryMessage: "Check reason on Etherscan",
                      actionHref: `https://etherscan.io/tx/${tx.hash}`,
                      actionText: "Check",
                      variant: "failure",
                    }
                  );
                }
                setLoading(false);
                return;
              }

              setLoading(false);
              getBalances();
            }}
          >
            {loading ? (
              <Flex alignItems="center">
                <span>Repaying...</span> <Loader color="white" ml="2" />
              </Flex>
            ) : (
              "Repay"
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
    </Flex>
  );
};

export default RepayCoin;
