import { ethers } from "ethers";
import { BigNumber } from "ethers/utils/bignumber";

import dedgeCompoundManagerDef from "../artifacts/DedgeCompoundManager.json";

import { Address, EncoderFunction } from "./types";

import { getLegos, networkIds } from "money-legos";

import axios from "axios";

const legos = getLegos(networkIds.mainnet);

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

  return dacProxy.execute(
    dedgeCompoundManager,
    swapOperationCalldata,
    overrides
  );
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

const getAccountInformationViaAPI = async (address: Address): Promise<any> => {
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
    liquidationPriceUSD: currentBorrowPercentage * ethInUSD / 0.75 // 75% is the collateral factor
  };
};

const getAccountInformation = async (
  signer: ethers.Wallet,
  dacProxy: Address
) => {
  const newCTokenContract = (curCToken: Address) =>
    new ethers.Contract(curCToken, legos.compound.cTokenAbi, signer);

  const comptrollerContract = new ethers.Contract(
    legos.compound.comptroller.address,
    legos.compound.comptroller.abi,
    signer
  );

  const uniswapFactoryContract = new ethers.Contract(
    legos.uniswap.factory.address,
    legos.uniswap.factory.abi,
    signer
  );
  const enteredMarkets = await comptrollerContract.getAssetsIn(dacProxy);

  const getTokenToEthPrice = async (cToken, amountWei) => {
    if (cToken === legos.compound.cEther.address) {
      return amountWei;
    }

    const tokenAddress = await newCTokenContract(cToken).underlying();

    const uniswapExchangeAddress = await uniswapFactoryContract.getExchange(
      tokenAddress
    );

    const uniswapExchangeContract = new ethers.Contract(
      uniswapExchangeAddress,
      legos.uniswap.exchange.abi,
      signer
    );

    return await uniswapExchangeContract.getEthToTokenOutputPrice(
      amountWei.toString()
    );
  };
  
  let ethersBorrowed = 0;
  let ethersSupplied = 0;

  // TODO: Parallelize this?
  // tslint:disable-next-line
  for (let i = 0; i < enteredMarkets.length; i++) {
    const curCToken = enteredMarkets[i];

    // TODO: Change this to borrowBalanceCurrent
    const curDebtBal = await newCTokenContract(curCToken).borrowBalanceStored(
      dacProxy
    );
    const curColBal = await newCTokenContract(curCToken).balanceOfUnderlying(
      dacProxy
    );

    if (curDebtBal > 0) {
      const debtInEth = await getTokenToEthPrice(curCToken, curDebtBal);
      ethersBorrowed = ethersBorrowed + debtInEth;
    }

    if (curColBal > 0) {
      const colInEth = await getTokenToEthPrice(curCToken, curColBal);
      ethersSupplied = ethersSupplied + colInEth;
    }
  }

  const currentBorrowPercentage = ethersBorrowed / ethersSupplied;

  // Get ethereum price in USD
  const coingeckoResp = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const ethInUSD = parseFloat(coingeckoResp.data.ethereum.usd);

  const wei2Float = x => parseFloat(ethers.utils.formatEther(x.toString()))

  return {
    borrowBalanceUSD: wei2Float(ethersBorrowed) * ethInUSD,
    supplyBalanceUSD: wei2Float(ethersSupplied) * ethInUSD,
    currentBorrowPercentage,
    ethInUSD,
    liquidationPriceUSD: currentBorrowPercentage * ethInUSD / 0.75 // 75% is the collateral factor
  };
};

export default {
  swapCollateral,
  swapDebt,
  getAccountInformationViaAPI,
  getAccountInformation
};
