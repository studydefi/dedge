import { getLegos, networkIds } from "money-legos";
import {
  wallet,
  newERC20Contract,
  getTokenFromUniswapAndApproveProxyTransfer
} from "dedge-smart-contracts/test/common";

const legos = getLegos(networkIds.mainnet);
const erc20Tokens = Object.keys(legos.erc20).filter(x => x !== 'abi')

if (process.argv.length !== 4) {
  console.log(`ts-node getERC20.ts <tokens-to-send-address> [${erc20Tokens.join('|')}]`);
  process.exit(1);
}

if (!erc20Tokens.includes(process.argv[3])) {
  console.log(`ts-node createMakerVault.ts <tokens-to-send-address> [${erc20Tokens.join('|')}]`);
  process.exit(1);
}

const token = process.argv[3]
const targetAddress = process.argv[2]
const tokenAddress = legos.erc20[token].address

const main = async () => {
  console.log('Getting tokens from uniswap')
  await getTokenFromUniswapAndApproveProxyTransfer(
    "0x0000000000000000000000000000000000000000",
    tokenAddress,
    1,
  )
  console.log('Transfering tokens')
  const erc20Contract = newERC20Contract(tokenAddress)
  const walTokenBal = await erc20Contract.balanceOf(wallet.address)
  await erc20Contract.transfer(targetAddress, walTokenBal.toString())
  const targetBal = await erc20Contract.balanceOf(targetAddress)
  console.log(`${targetAddress} has ${targetBal.toString()} ${token} (in Wei)`)
}

main()