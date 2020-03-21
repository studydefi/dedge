const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const wallet = new ethers.Wallet(
    "0x1bb4c7b8c6a37bb81780d48da0b92650bc4aa5728fb64c2bc7b0e9ffe9f97eb8",
    provider
);
const { dedgeGeneralManagerAddress, dedgeProxyFactoryAddress } = require("../build/DeployedAddresses.json");

const ERC20Abi = require('./abi/ERC20.json')

const dedgeProxyDef = require("../build/DedgeProxy.json");
const dedgeProxyFactoryDef = require("../build/DedgeProxyFactory.json");
const dedgeGeneralManagerDef = require("../build/DedgeGeneralManager.json");


const main = async () => {
    const dedgeProxyFactoryContract = new ethers.Contract(
        dedgeProxyFactoryAddress,
        dedgeProxyFactoryDef.abi,
        wallet
    )

    const dedgeGeneralManagerContract = new ethers.Contract(
        dedgeGeneralManagerAddress,
        dedgeGeneralManagerDef.abi,
        wallet
    )

    // Mainnet testing ERC20 token
    const mainnetTestErc20TokenAddress = "0xeEf5E2d8255E973d587217f9509B416b41CA5870"
    // Adds the "drip" functionality (to mint tokens)
    const mainnetTestErc20TokenAbi = [{"constant":false,"inputs":[],"name":"drip","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}]
    const mainnetTestErc20TokenContract = new ethers.Contract(
        mainnetTestErc20TokenAddress,
        ERC20Abi.concat(mainnetTestErc20TokenAbi),
        wallet
    )

    const IDedgeGeneralManager = new ethers.utils.Interface(dedgeGeneralManagerDef.abi)

    // User setups dedge proxy
    // Note this proxy will hold the funds for compound
    let dedgeProxyAddress = await dedgeProxyFactoryContract.proxies(wallet.address)
    if (dedgeProxyAddress === '0x0000000000000000000000000000000000000000') {
        console.log(`No DedgeProxy found for ${wallet.address}, creating one now`)
        await dedgeProxyFactoryContract.build()

        dedgeProxyAddress = await dedgeProxyFactoryContract.proxies(wallet.address)
    }
    console.log(`DedgeProxy address is at ${dedgeProxyAddress}`)
    const dedgeProxyContract = new ethers.Contract(
        dedgeProxyAddress,
        dedgeProxyDef.abi,
        wallet
    )

    console.log("Transferring 2 ETH to dedgeProxyAddress")
    await wallet.sendTransaction({
        to: dedgeProxyAddress,
        value: ethers.utils.parseEther("2")
    })

    console.log("Minting ERC20 tokens for wallet (NOT dedgeProxyAddress)")
    await mainnetTestErc20TokenContract.drip() // drip provides 1000000000000000000000 wei tokens

    console.log("Transferring ERC20 tokens to dedgeProxyAddress")
    await mainnetTestErc20TokenContract.transfer(dedgeProxyAddress, ethers.utils.parseEther("10.0"))

    let dedgeProxyAddressERC20Count = await mainnetTestErc20TokenContract.balanceOf(dedgeProxyAddress)
    let dedgeProxyAddressEthCount = await provider.getBalance(dedgeProxyAddress);

    let walletERC20Count = await mainnetTestErc20TokenContract.balanceOf(wallet.address)
    let walletEthCount = await wallet.getBalance();

    console.log(`DedgeProxyAddress balance (ETH): ${ethers.utils.formatEther(dedgeProxyAddressEthCount)}`)
    console.log(`DedgeProxyAddress balance (ERC20): ${ethers.utils.formatEther(dedgeProxyAddressERC20Count)}`)

    console.log(`Wallet balance (ETH): ${ethers.utils.formatEther(walletEthCount)}`)
    console.log(`Wallet balance (ERC20): ${ethers.utils.formatEther(walletERC20Count)}`)

    console.log("Transfering back 2 Ether and 10 ERC20 tokens back to wallet")
    const transferERC20Callback = IDedgeGeneralManager
        .functions
        .transferERC20
        .encode([
            wallet.address, mainnetTestErc20TokenAddress, ethers.utils.parseEther("10.0")
        ])
    
    const erc20Tx = await dedgeProxyContract.execute(
        dedgeGeneralManagerAddress,
        transferERC20Callback,
        {
            gasLimit: 4000000
        }
    )

    await erc20Tx.wait()

    const transferETHCallback = IDedgeGeneralManager
        .functions
        .transferETH
        .encode([
            wallet.address, ethers.utils.parseEther("2.0")
        ])
    const ethTx = await dedgeProxyContract.execute(
        dedgeGeneralManagerAddress,
        transferETHCallback,
        {
            gasLimit: 4000000,
        }
    )
    await ethTx.wait()

    dedgeProxyAddressEthCount = await provider.getBalance(dedgeProxyAddress);
    dedgeProxyAddressERC20Count = await mainnetTestErc20TokenContract.balanceOf(dedgeProxyAddress)

    walletEthCount = await provider.getBalance(wallet.address);
    walletERC20Count = await mainnetTestErc20TokenContract.balanceOf(wallet.address)

    console.log(`DedgeProxyAddress balance (ETH): ${ethers.utils.formatEther(dedgeProxyAddressEthCount)}`)
    console.log(`DedgeProxyAddress balance (ERC20): ${ethers.utils.formatEther(dedgeProxyAddressERC20Count)}`)

    console.log(`Wallet balance (ETH): ${ethers.utils.formatEther(walletEthCount)}`)
    console.log(`Wallet balance (ERC20): ${ethers.utils.formatEther(walletERC20Count)}`)
}

main()