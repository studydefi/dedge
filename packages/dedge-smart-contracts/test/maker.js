const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const dedgeProxyDef = require("../build/DedgeProxy.json");
const dedgeProxyFactoryDef = require("../build/DedgeProxyFactory.json");
const dedgeMakerManagerDef = require("../build/DedgeMakerManager.json");
const wallet = new ethers.Wallet(
    "0x1bb4c7b8c6a37bb81780d48da0b92650bc4aa5728fb64c2bc7b0e9ffe9f97eb8",
    provider
);
const { dedgeMakerManagerAddress, dedgeProxyFactoryAddress } = require("../build/DeployedAddresses.json");
const dssCdpManagerAbi = require('./abi/DssCdpManager.json')
const proxyRegistryAbi = require('./abi/ProxyRegistry.json')
const ERC20Abi = require('./abi/ERC20.json')
const dsProxyAbi = require('./abi/DSProxy.json')
const dssProxyActionsAbi = require('./abi/DssProxyActions.json')

const addresses = {
    maker: {
        proxyRegistry: "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4",
        dssProxyActions: "0x82ecd135dce65fbc6dbdd0e4237e0af93ffd5038",
        dssCdpManager: "0x5ef30b9986345249bc32d8928B7ee64DE9435E39",
        jug: "0x19c0976f590D67707E62397C87829d896Dc0f1F1",
        ethJoin: "0x2F0b23f53734252Bda2277357e97e1517d6B042A",
        batJoin: "0x3D0B1912B66114d4096F48A8CEe3A56C231772cA",
        daiJoin: "0x9759A6Ac90977b93B58547b4A71c78317f391A28",
        ilkBatA: "BAT-A",
        ilkEthA: "ETH-A"
    },
    aave: {
        ethAddress: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
    },
    compound: {
        priceOracle: '0x1d8aedc9e924730dd3f9641cdb4d1b92b848b4bd',
        comptroller: '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b',
        cEther: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
        cDai: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
        cSai: '0xf5dce57282a584d2746faf1593d3121fcac444dc',
        cBat: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e'
    },
    tokens: {
        dai: "0x6b175474e89094c44da98b954eedeac495271d0f",
        bat: "0x0d8775f648430679a709e98d2b0cb6250d2887ef"
    },
    uniswap: {
        factory: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95'
    }
}

const main = async () => {
    const proxyRegistryContract = new ethers.Contract(
        addresses.maker.proxyRegistry,
        proxyRegistryAbi,
        wallet
    )

    const dssCdpManagerContract = new ethers.Contract(
        addresses.maker.dssCdpManager,
        dssCdpManagerAbi,
        wallet
    )

    const dedgeMakerManagerContract = new ethers.Contract(
        dedgeMakerManagerAddress,
        dedgeMakerManagerDef.abi,
        wallet
    );

    const dedgeProxyFactoryContract = new ethers.Contract(
        dedgeProxyFactoryAddress,
        dedgeProxyFactoryDef.abi,
        wallet
    )

    const daiContract = new ethers.Contract(
        addresses.tokens.dai,
        ERC20Abi,
        wallet
    )

    const IDssProxyActions = new ethers.utils.Interface(dssProxyActionsAbi)
    const IDedgeMakerManager = new ethers.utils.Interface(dedgeMakerManagerDef.abi)

    // Setup vault
    // This permission allows Oasis to interact with your ETH.
    // This has to be done once for each new collateral type

    // If user doesn't have a proxy address
    // then create one for them
    let proxyAddress = await proxyRegistryContract.proxies(wallet.address)
    if (proxyAddress === '0x0000000000000000000000000000000000000000') {
        console.log(`No ProxyRegistry found for ${wallet.address}, creating one now`)
        await proxyRegistryContract.build()

        proxyAddress = await proxyRegistryContract.proxies(wallet.address)
    }
    console.log(`Proxy address for user: ${proxyAddress}`)

    // This is our (maker)DsProxy contract
    const dsProxyContract = new ethers.Contract(
        proxyAddress,
        dsProxyAbi,
        wallet
    )

    // // Open a Vault in MakerDAO
    let cdpCountRet = await dssCdpManagerContract.count(proxyAddress)
    let cdpCount = parseInt(cdpCountRet.toString())

    console.log("Creating an ETH-A vault now with 1 ETH Collateral and 20 DAI Debt")

    const openVaultCalldata = IDssProxyActions.functions.openLockETHAndDraw.encode([
        addresses.maker.dssCdpManager,
        addresses.maker.jug,
        addresses.maker.ethJoin,
        addresses.maker.daiJoin,
        ethers.utils.formatBytes32String(addresses.maker.ilkEthA),
        ethers.utils.parseEther("20.0") // Wanna Draw 20 DAI (minimum 20 DAI)
    ])
    const openVaultTx = await dsProxyContract.execute(
        addresses.maker.dssProxyActions,
        openVaultCalldata,
        {
            gasLimit: 4000000,
            value: ethers.utils.parseEther("1.0")
        }
    )

    await openVaultTx.wait()

    cdpCountRet = await dssCdpManagerContract.count(proxyAddress)
    cdpCount = parseInt(cdpCountRet.toString())
    
    console.log(`Found ${cdpCount} Vault, retrieving them...`)

    let cdps = {}
    let lastCdpRet = await dssCdpManagerContract.last(proxyAddress)
    let lastCdp = lastCdpRet.toString()
    let lastCdpIlkRet = await dssCdpManagerContract.ilks(lastCdp)
    let lastCdpIlk = ethers.utils.parseBytes32String(lastCdpIlkRet)

    cdps[lastCdp] = lastCdpIlk

    for (let i = 1; i < cdpCount; i++) {
        let linkedListRet = await dssCdpManagerContract.list(lastCdp)
        lastCdp = linkedListRet.prev.toString()
        lastCdpIlkRet = await dssCdpManagerContract.ilks(lastCdp)
        lastCdpIlk = ethers.utils.parseBytes32String(lastCdpIlkRet)
        cdps[lastCdp] = lastCdpIlk
    }

    console.log("Found these Vaults:")
    console.log(cdps)

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

    let daiBalanceWei = await daiContract.balanceOf(dedgeProxyAddress)
    let ethBalanceWei = await provider.getBalance(dedgeProxyAddress)
    
    if (Object.keys(cdps).length > 0) {
        const lastCdpId = Object.keys(cdps)[Object.keys(cdps).length - 1]

        console.log(`Repaying CDP ${lastCdpId} debt and migrating available ETH into dedgeProxyAddress`)

        const collateralWei = await dedgeMakerManagerContract.getVaultCollateral(
            addresses.maker.dssCdpManager,
            parseInt(lastCdpId)
        )
        const debtWei = await dedgeMakerManagerContract.getVaultDebt(
            addresses.maker.dssCdpManager,
            parseInt(lastCdpId)
        )

        const collateral = ethers.utils.formatEther(collateralWei.toString())
        const debt = ethers.utils.formatEther(debtWei.toString())

        console.log(`Collateral ${collateral.toString()} ETH`)
        console.log(`Debt ${debt.toString()} DAI`)

        const importMakerVaultCallbackdata = IDedgeMakerManager
            .functions
            .importMakerVault
            .encode([
                dedgeProxyAddress,
                dedgeMakerManagerAddress,
                addresses.aave.ethAddress,
                lastCdpId
            ])

        const tx = await dsProxyContract.execute(
            dedgeMakerManagerAddress,
            importMakerVaultCallbackdata,
            {
                gasLimit: 4000000
            }
        )

        await tx.wait()

        console.log('Imported CDP, checking balance...')

        daiBalanceWei = await daiContract.balanceOf(dedgeProxyAddress)
        ethBalanceWei = await provider.getBalance(dedgeProxyAddress)
    }

    let walletDaiBalanceWei = await daiContract.balanceOf(wallet.address)

    console.log(`Dai @ Wallet (Holding): ${ethers.utils.formatEther(walletDaiBalanceWei.toString())}`)

    console.log(`Dai @ DedgeProxyAddress (Holding): ${ethers.utils.formatEther(daiBalanceWei.toString())}`)
    console.log(`ETH @ DedgeProxyAddress (Holding): ${ethers.utils.formatEther(ethBalanceWei.toString())}`)
}

main()