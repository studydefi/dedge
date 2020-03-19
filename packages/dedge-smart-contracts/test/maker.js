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

const uniswapFactoryAbi = require('../build/IUniswapFactory.json').abi
const uniswapExchangeAbi = require('../build/IUniswapExchange.json').abi

const addresses = {
    maker: {
        proxyRegistry: "0x4678f0a6958e4D2Bc4F1BAF7Bc52E8F3564f3fE4",
        dssProxyActions: "0x82ecd135dce65fbc6dbdd0e4237e0af93ffd5038",
        dssCdpManager: "0x5ef30b9986345249bc32d8928B7ee64DE9435E39",
        jug: "0x19c0976f590D67707E62397C87829d896Dc0f1F1",
        ethJoin: "0x2F0b23f53734252Bda2277357e97e1517d6B042A",
        batJoin: "0x3D0B1912B66114d4096F48A8CEe3A56C231772cA",
        daiJoin: "0x9759A6Ac90977b93B58547b4A71c78317f391A28",
        usdcJoin: "0xA191e578a6736167326d05c119CE0c90849E84B7",
        ilkBatA: "BAT-A",
        ilkEthA: "ETH-A",
        ilkUsdcA: "USDC-A"
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
        bat: "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
        usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
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

    const batContract = new ethers.Contract(
        addresses.tokens.bat,
        ERC20Abi,
        wallet
    )

    const usdcContract = new ethers.Contract(
        addresses.tokens.usdc,
        ERC20Abi,
        wallet
    )

    const uniswapFactoryContract = new ethers.Contract(
        addresses.uniswap.factory,
        uniswapFactoryAbi,
        wallet
    )

    const IDssProxyActions = new ethers.utils.Interface(dssProxyActionsAbi)
    const IDedgeMakerManager = new ethers.utils.Interface(dedgeMakerManagerDef.abi)

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
    let dsProxyContract = new ethers.Contract(
        proxyAddress,
        dsProxyAbi,
        wallet
    )

    // This is our smart wallet address
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

    const listOfIlks = [
        // [ addresses.maker.ilkUsdcA, addresses.maker.usdcJoin, addresses.tokens.usdc ], // USDC not supported yet sorry
        [ addresses.maker.ilkBatA, addresses.maker.batJoin, addresses.tokens.bat ],
        [ addresses.maker.ilkEthA, addresses.maker.ethJoin, addresses.aave.ethAddress ],
    ]

    for (let i = 0; i < listOfIlks.length; i++) {
        const curIlk = listOfIlks[i][0]
        const curIlkJoinAddress = listOfIlks[i][1]
        const curTokenAddress = listOfIlks[i][2]

        // Get some tokens from uniswap, if not funding ether
        if (curIlk !== addresses.maker.ilkEthA) {           
            // Approve Proxy Address to access funds
            // ERC 20 token contract
            console.log(`Approving dsproxy to access funds for ${curIlk}`)
            const curTokenContract = new ethers.Contract(
                curTokenAddress,
                ERC20Abi,
                wallet
            )
            
            await curTokenContract.approve(
                proxyAddress,
                "0xffffffffffffffffffffffffffffffff",
            )

            console.log("Getting the tokens from uniswap")
            let uniswapExchangeAddress = await uniswapFactoryContract.getExchange(curTokenAddress)
            let uniswapExchangeContract = new ethers.Contract(
                uniswapExchangeAddress,
                uniswapExchangeAbi,
                wallet
            )
            await uniswapExchangeContract.ethToTokenSwapInput(
                1,
                1900111539,
                {
                    gasLimit: 4000000,
                    value: ethers.utils.parseEther("3.0")
                }
            )

            const walletToken = await curTokenContract.balanceOf(wallet.address)
            console.log(`Got ${ethers.utils.formatUnits(walletToken.toString(), curIlk === addresses.maker.ilkBatA ? 18 : 6)} ${curIlk}`)
        }


        // Open a Vault in MakerDAO
        let cdpCountRet = await dssCdpManagerContract.count(proxyAddress)
        let cdpCount = parseInt(cdpCountRet.toString())

        console.log(`Creating an ${curIlk} vault now and drawing 20 DAI Debt`)

        // Open vault with ETH Collateral
        if (curIlk === addresses.maker.ilkEthA) {
            const openVaultCalldata = IDssProxyActions.functions.openLockETHAndDraw.encode([
                addresses.maker.dssCdpManager,
                addresses.maker.jug,
                curIlkJoinAddress,
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
        } else {
            // Open with ERC20 colalteral
            const wadC = curIlk === addresses.maker.ilkBatA ? 
                ethers.utils.parseEther("1000") :
                ethers.utils.parseUnits("150", 6) // USDC has 6 decimals
            // Open Vault with ERC-20 collateral
            const openVaultCalldata = IDssProxyActions.functions.openLockGemAndDraw.encode([
                addresses.maker.dssCdpManager,
                addresses.maker.jug,
                curIlkJoinAddress,
                addresses.maker.daiJoin,
                ethers.utils.formatBytes32String(curIlk),
                wadC,
                ethers.utils.parseEther("20.0"), // Wanna Draw 20 DAI (minimum 20 DAI)
                true
            ])
            const openVaultTx = await dsProxyContract.execute(
                addresses.maker.dssProxyActions,
                openVaultCalldata,
                {
                    gasLimit: 4000000,
                }
            )
            await openVaultTx.wait()
        }

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

        let daiBalanceWei = await daiContract.balanceOf(dedgeProxyAddress)
        let ethBalanceWei = await provider.getBalance(dedgeProxyAddress)
        
        if (Object.keys(cdps).length > 0) {
            const lastCdpId = Object.keys(cdps).reduce((a, b) => parseInt(a) > parseInt(b) ? a : b);

            console.log(`Repaying CDP ${lastCdpId} debt and migrating available ${curIlk} into dedgeProxyAddress`)

            let collateralWei = await dedgeMakerManagerContract.getVaultCollateral(
                addresses.maker.dssCdpManager,
                parseInt(lastCdpId)
            )
            let debtWei = await dedgeMakerManagerContract.getVaultDebt(
                addresses.maker.dssCdpManager,
                parseInt(lastCdpId)
            )

            let collateral = ethers.utils.formatEther(collateralWei.toString())
            let debt = ethers.utils.formatEther(debtWei.toString())

            console.log(`Collateral ${collateral.toString()} ${curIlk}`)
            console.log(`Debt ${debt.toString()} DAI`)

            console.log('Importing CDP....')

            const importMakerVaultCallbackdata = IDedgeMakerManager
                .functions
                .importMakerVault
                .encode([
                    dedgeProxyAddress,
                    dedgeMakerManagerAddress,
                    curTokenAddress,
                    curIlkJoinAddress,
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

            collateralWei = await dedgeMakerManagerContract.getVaultCollateral(
                addresses.maker.dssCdpManager,
                parseInt(lastCdpId)
            )
            debtWei = await dedgeMakerManagerContract.getVaultDebt(
                addresses.maker.dssCdpManager,
                parseInt(lastCdpId)
            )

            collateral = ethers.utils.formatEther(collateralWei.toString())
            debt = ethers.utils.formatEther(debtWei.toString())

            console.log(`Collateral ${collateral.toString()} ${curIlk}`)
            console.log(`Debt ${debt.toString()} DAI`)

            console.log('----------')

            let walletDaiBalanceWei = await daiContract.balanceOf(wallet.address)
            let walletBatBalanceWei = await batContract.balanceOf(wallet.address)
            let walletUsdcBalanceWei = await usdcContract.balanceOf(wallet.address)

            daiBalanceWei = await daiContract.balanceOf(dedgeProxyAddress)
            usdcBalanceWei = await usdcContract.balanceOf(dedgeProxyAddress)
            batBalanceWei = await batContract.balanceOf(dedgeProxyAddress)
            ethBalanceWei = await provider.getBalance(dedgeProxyAddress)
            
            console.log(`Dai @ Wallet (Holding): ${ethers.utils.formatEther(walletDaiBalanceWei.toString())}`)
            console.log(`Bat @ Wallet (Holding): ${ethers.utils.formatEther(walletBatBalanceWei.toString())}`)
            console.log(`USDC @ Wallet (Holding): ${ethers.utils.formatUnits(walletUsdcBalanceWei.toString(), 6)}`) // USDC 6 decimals

            console.log(`Dai @ DedgeProxyAddress (Holding): ${ethers.utils.formatEther(daiBalanceWei.toString())}`)
            console.log(`USDC @ DedgeProxyAddress (Holding): ${ethers.utils.formatUnits(usdcBalanceWei.toString(), 6)}`)
            console.log(`BAT @ DedgeProxyAddress (Holding): ${ethers.utils.formatEther(batBalanceWei.toString())}`)
            console.log(`ETH @ DedgeProxyAddress (Holding): ${ethers.utils.formatEther(ethBalanceWei.toString())}`)

            console.log('---------')
        }
    }
}

main()