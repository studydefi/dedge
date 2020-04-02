import { ethers } from "ethers";
import { BigNumber } from "ethers/utils/bignumber";

import dedgeCompoundManagerDef from "../artifacts/DedgeCompoundManager.json";

import { Address, EncoderFunction } from "./types";

import axios from "axios";

const IDedgeCompoundManager = new ethers.utils.Interface(
  dedgeCompoundManagerDef.abi
);

const swapOperation = (
  swapFunctionEncoder: EncoderFunction,
  dacProxy: ethers.Contract,
  dedgeCompoundManager: Address,
  addressRegistry: Address,
  oldCToken: Address,
  oldTokenUnderlyingDeltaWei: BigNumber,
  newCToken: Address,
  overrides: any = { gasLimit: 4000000 }
): Promise<any> => {
  // struct SwapOperationCalldata {
  //     address addressRegistryAddress;
  //     address oldCTokenAddress;
  //     address newCTokenAddress;
  // }

  const swapOperationStructData = ethers.utils.defaultAbiCoder.encode(
    ["address", "address", "address"],
    [addressRegistry, oldCToken, newCToken]
  );

  const executeOperationCalldataParams = swapFunctionEncoder([
    0,
    0,
    0, // Doesn't matter as the right data will be injected in later on
    swapOperationStructData
  ]);

  const swapOperationCalldata = IDedgeCompoundManager.functions.swapOperation.encode(
    [
      dedgeCompoundManager,
      dacProxy.address,
      addressRegistry,
      oldCToken,
      oldTokenUnderlyingDeltaWei.toString(),
      executeOperationCalldataParams
    ]
  );

  return dacProxy.execute(dedgeCompoundManager, swapOperationCalldata, overrides);
};

const swapDebt = (
  dacProxy: ethers.Contract,
  dedgeCompoundManager: Address,
  addressRegistry: Address,
  oldCToken: Address,
  oldTokenUnderlyingDeltaWei: BigNumber,
  newCToken: Address,
  overrides: any = { gasLimit: 4000000 }
): Promise<any> => {
  return swapOperation(
    (x: any[]): string =>
      IDedgeCompoundManager.functions.swapDebtPostLoan.encode(x),
    dacProxy,
    dedgeCompoundManager,
    addressRegistry,
    oldCToken,
    oldTokenUnderlyingDeltaWei,
    newCToken,
    overrides
  );
};

const swapCollateral = (
  dacProxy: ethers.Contract,
  dedgeCompoundManager: Address,
  addressRegistry: Address,
  oldCToken: Address,
  oldTokenUnderlyingDeltaWei: BigNumber,
  newCToken: Address,
  overrides: any = { gasLimit: 4000000 }
): Promise<any> => {
  return swapOperation(
    (x: any[]): string =>
      IDedgeCompoundManager.functions.swapCollateralPostLoan.encode(x),
    dacProxy,
    dedgeCompoundManager,
    addressRegistry,
    oldCToken,
    oldTokenUnderlyingDeltaWei,
    newCToken,
    overrides
  );
};

const getAccountInformation = async (address: Address): Promise<any> => {
  // Get account information
  const compoundResp = await axios.get(
    `https://api.compound.finance/api/v2/account?addresses[]=${address}`
  );

  // Get total borrow / supply in ETH
  const accountInformation = compoundResp.data.accounts[0];
  const borrowedValueInEth = parseFloat(
    accountInformation.total_borrow_value_in_eth.value
  );
  const supplyValueInEth = parseFloat(
    accountInformation.total_collateral_value_in_eth.value
  );

  const currentBorrowPercentage = borrowedValueInEth / supplyValueInEth;

  // Get eth price
  const coingeckoResp = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );

  const ethInUSD = parseFloat(coingeckoResp.data.ethereum.usd);

  // Convert to USD
  return {
    borrowBalanceUSD: borrowedValueInEth * ethInUSD,
    supplyBalanceUSD: supplyValueInEth * ethInUSD,
    currentBorrowPercentage,
    ethInUSD,
    liquidationPriceUSD: currentBorrowPercentage * ethInUSD
  };
};

export default {
  swapCollateral,
  swapDebt,
  getAccountInformation
};
