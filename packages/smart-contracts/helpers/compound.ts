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
    swapOperationStructData,
  ]);

  const swapOperationCalldata = IDedgeCompoundManager.functions.swapOperation.encode(
    [
      dedgeCompoundManager,
      dacProxy.address,
      addressRegistry,
      oldCToken,
      oldTokenUnderlyingDeltaWei.toString(),
      executeOperationCalldataParams,
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
    liquidationPriceUSD: (currentBorrowPercentage * ethInUSD) / 0.75, // 75% is the collateral factor
  };
};

const getAccountSnapshot = async (
  signer: ethers.Signer,
  cToken: Address,
  owner: Address
) => {
  const newCTokenContract = (curCToken: Address) =>
    new ethers.Contract(curCToken, legos.compound.cTokenAbi, signer);

  const [
    err,
    cTokenBalance,
    borrowBalance,
    exchangeRateMantissa,
  ] = await newCTokenContract(cToken).getAccountSnapshot(owner);

  const expScale = new BigNumber(10).pow(18);

  if (err.toString() !== "0") {
    throw new Error(
      `Error on getAccountSnapshot: ${err}, go to https://compound.finance/docs/ctokens#ctoken-error-codes for more info`
    );
  }

  return {
    balanceOfUnderlying: cTokenBalance.mul(exchangeRateMantissa).div(expScale),
    borrowBalance,
  };
};

const getCTokenBalanceOfUnderlying = async (
  signer: ethers.Signer,
  cToken: Address,
  owner: Address
) => {
  const { balanceOfUnderlying } = await getAccountSnapshot(
    signer,
    cToken,
    owner
  );
  return balanceOfUnderlying;
};

const getCTokenBorrowBalance = async (
  signer: ethers.Signer,
  cToken: Address,
  owner: Address
) => {
  const { borrowBalance } = await getAccountSnapshot(signer, cToken, owner);
  return borrowBalance;
};

const getAccountInformation = async (
  signer: ethers.Signer,
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

  const debtCollateralInTokens: [
    Address,
    BigNumber,
    BigNumber
  ][] = await Promise.all(
    enteredMarkets.map(async (x: Address) => {
      const { balanceOfUnderlying, borrowBalance } = await getAccountSnapshot(
        signer,
        x,
        dacProxy
      );

      return [x, borrowBalance, balanceOfUnderlying];
    })
  );

  const debtsInEth = await Promise.all(
    debtCollateralInTokens
      .filter((x: [Address, BigNumber, BigNumber]) => x[1] > new BigNumber(0))
      .map((x: [Address, BigNumber, BigNumber]) =>
        getTokenToEthPrice(x[0], x[1])
      )
  );

  const collateralInEth = await Promise.all(
    debtCollateralInTokens
      .filter((x: [Address, BigNumber, BigNumber]) => x[2] > new BigNumber(0))
      .map((x: [Address, BigNumber, BigNumber]) =>
        getTokenToEthPrice(x[0], x[2])
      )
  );

  const ethersBorrowed = debtsInEth.reduce(
    (a, b) => a.add(b),
    new BigNumber(0)
  );
  const ethersSupplied = collateralInEth.reduce(
    (a, b) => a.add(b),
    new BigNumber(0)
  );

  const currentBorrowPercentage = ethersBorrowed / ethersSupplied;

  // Get ethereum price in USD
  const coingeckoResp = await axios.get(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
  );
  const ethInUSD = parseFloat(coingeckoResp.data.ethereum.usd);

  const wei2Float = (x) => parseFloat(ethers.utils.formatEther(x.toString()));

  return {
    borrowBalanceUSD: wei2Float(ethersBorrowed) * ethInUSD,
    supplyBalanceUSD: wei2Float(ethersSupplied) * ethInUSD,
    currentBorrowPercentage,
    ethInUSD,
    liquidationPriceUSD: (currentBorrowPercentage * ethInUSD) / 0.75, // 75% is the collateral factor
  };
};

const supplyThroughProxy = async (
  dacProxy: ethers.Contract,
  dedgeCompoundManager: Address,
  cToken: Address,
  amountWei: string,
  overrides: any = { gasLimit: 4000000 }
) => {
  const calldata = IDedgeCompoundManager.functions.supplyThroughProxy.encode([
    cToken,
    amountWei,
  ]);

  // If its ether we need to send it via overrides
  if (cToken === legos.compound.cEther.address) {
    return dacProxy.execute(
      dedgeCompoundManager,
      calldata,
      Object.assign(overrides, {
        value: amountWei,
      })
    );
  }

  return dacProxy.execute(
    dedgeCompoundManager,
    calldata,
    overrides
  );
};

const borrowThroughProxy = async (
  dacProxy: ethers.Contract,
  dedgeCompoundManager: Address,
  cToken: Address,
  amountWei: string,
  overrides: any = { gasLimit: 4000000 }
) => {
  const calldata = IDedgeCompoundManager.functions.borrowThroughProxy.encode([
    cToken,
    amountWei,
  ]);

  return dacProxy.execute(
    dedgeCompoundManager,
    calldata,
    overrides
  );
};

<<<<<<< HEAD
const withdrawThroughProxy = async (
  dacProxy: ethers.Contract,
  dedgeCompoundManager: Address,
  cToken: Address,
  amountWei: string,
  overrides: any = { gasLimit: 4000000 }
) => {
  const calldata = IDedgeCompoundManager.functions.redeemUnderlyingThroughProxy.encode([
    cToken,
    amountWei,
  ]);

  return dacProxy.execute(
    dedgeCompoundManager,
    calldata,
    overrides
  );
};

const repayThroughProxy = async (
  dacProxy: ethers.Contract,
  dedgeCompoundManager: Address,
  cToken: Address,
  amountWei: string,
  overrides: any = { gasLimit: 4000000 }
) => {
  const calldata = IDedgeCompoundManager.functions.repayBorrowThroughProxy.encode([
    cToken,
    amountWei,
  ]);

  // If its ether we need to send it via overrides
  if (cToken === legos.compound.cEther.address) {
    return dacProxy.execute(
      dedgeCompoundManager,
      calldata,
      Object.assign(overrides, {
        value: amountWei,
      })
    );
  }

  return dacProxy.execute(
    dedgeCompoundManager,
    calldata,
    overrides
  );
};


=======
>>>>>>> e6b9f81eae54c37754658e776c184e1158cb1cac
export default {
  swapCollateral,
  swapDebt,
  getAccountInformationViaAPI,
  getAccountInformation,
  getAccountSnapshot,
  getCTokenBalanceOfUnderlying,
  getCTokenBorrowBalance,
  supplyThroughProxy,
<<<<<<< HEAD
  borrowThroughProxy,
  withdrawThroughProxy,
  repayThroughProxy
=======
  borrowThroughProxy
>>>>>>> e6b9f81eae54c37754658e776c184e1158cb1cac
};
