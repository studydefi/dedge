const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const wallet = new ethers.Wallet(
    "0xc5cb7686c83376fa45c032bb6e1bc9a5b7447e191b2ba084db6d4064106e432e",
    provider
);

const CEtherAbi = require('../build/ICEther.json').abi
const CTokenAbi = require('../build/ICToken.json').abi
const ERC20Abi = require('./abi/ERC20.json')
const ComptrollerAbi = require('../build/IComptroller.json').abi

const { 
    dacProxyFactoryAddress,
    dacManagerAddress,
    addressRegistryAddress,
    actionRegistryAddress
} = require("../build/DeployedAddresses.json");

const dacProxyDef = require("../build/DACProxy.json");
const dacManagerDef = require("../build/DACManager.json");
const addressRegistryDef = require("../build/AddressRegistry.json");
const actionRegistryDef = require("../build/ActionRegistry.json");
const dacProxyFactoryDef = require("../build/DACProxyFactory.json");

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Hacky way to wait for ganache
// so ethers doesn't timeout (2mins)
const tryAndWait = async (f) => {
    try {
        const tx = await f

        // Lmao
        try { await tx.wait() } catch {}
    } catch (e) {
        const eStr = e.toString().toLowerCase()
        if (eStr.includes("timeout") || eStr.includes("0")) {
            await sleep(60 * 1000); // Sleep for 1 more minute after timeout
        } else {
            throw e
        }   
    }
}

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
        cBat: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e',
        cZRX: '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407',
        cUSDC: '0x39aa39c021dfbae8fac545936693ac917d5e7563',
        cREP: '0x158079ee67fce2f58472a96584a73c7ab9ac95c1'
    },
    tokens: {
        dai: "0x6b175474e89094c44da98b954eedeac495271d0f",
        bat: "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
        zrx: '0xE41d2489571d322189246DaFA5ebDe1F4699F498',
        usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    },
    uniswap: {
        factory: '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95'
    }
}

const newERC20Contract = addr => new ethers.Contract(addr, ERC20Abi, wallet)
const newCTokenContract = addr => new ethers.Contract(addr, CTokenAbi, wallet)

const dacProxyFactoryContract = new ethers.Contract(
    dacProxyFactoryAddress,
    dacProxyFactoryDef.abi,
    wallet
)

const dacManagerContract = new ethers.Contract(
    dacManagerAddress,
    dacManagerDef.abi,
    wallet
)

const addressRegistryContract = new ethers.Contract(
    addressRegistryAddress,
    addressRegistryDef.abi,
    wallet
)

const actionRegistryContract = new ethers.Contract(
    actionRegistryAddress,
    actionRegistryDef.abi,
    wallet
)

const comptrollerContract = new ethers.Contract(
    addresses.compound.comptroller,
    ComptrollerAbi,
    wallet
)

const cEtherContract = new ethers.Contract(
    addresses.compound.cEther,
    CEtherAbi,
    wallet
)

const cDaiContract = newCTokenContract(addresses.compound.cDai)
const cBatContract = newCTokenContract(addresses.compound.cBat)
const cZrxContract = newCTokenContract(addresses.compound.cZRX)
const cUsdcContract = newCTokenContract(addresses.compound.cUSDC)
const cRepContract = newCTokenContract(addresses.compound.cREP)

const daiContract = newERC20Contract(addresses.tokens.dai)
const batContract = newERC20Contract(addresses.tokens.bat)
const zrxContract = newERC20Contract(addresses.tokens.zrx)
const usdcContract = newERC20Contract(addresses.tokens.usdc)

const IDACManager = new ethers.utils.Interface(dacManagerDef.abi)

const main = async () => {
    // Get/Create DACProxy
    let dacProxyAddress = await dacProxyFactoryContract.proxies(wallet.address)
    if (dacProxyAddress === '0x0000000000000000000000000000000000000000') {
        console.log(`No DACProxy found for ${wallet.address}, creating one now`)
        await dacProxyFactoryContract.build()

        dacProxyAddress = await dacProxyFactoryContract.proxies(wallet.address)
    }
    console.log(`DACProxy address is at ${dacProxyAddress}`)
    const dacProxyContract = new ethers.Contract(
        dacProxyAddress,
        dacProxyDef.abi,
        wallet
    )

    // Checking out wallet balances
    let batBalanceWei = await batContract.balanceOf(dacProxyAddress)
    let daiBalanceWei = await daiContract.balanceOf(dacProxyAddress)
    let zrxBalanceWei = await zrxContract.balanceOf(dacProxyAddress)
    let usdcBalanceWei = await zrxContract.balanceOf(dacProxyAddress)
    let ethBalanceWei = await provider.getBalance(dacProxyAddress)

    // There's an issue with ganache where if you haven't supplied anything i.e. USDC or ETH
    // and call balanceOfUnderlying, it _will_ just hang :|
    let ethSupplyWei
    let usdcSupplyWei
    let repSupplyWei
    let daiSupplyWei
    let zrxSupplyWei
    
    let daiBorrowStorage = await cDaiContract.borrowBalanceStored(dacProxyAddress)
    let batBorrowStorage = await cBatContract.borrowBalanceStored(dacProxyAddress)
    let zrxBorrowStorage = await cZrxContract.borrowBalanceStored(dacProxyAddress)
    let usdcBorrowStorage = await cUsdcContract.borrowBalanceStored(dacProxyAddress)
    let ethBorrowStorage = await cEtherContract.borrowBalanceStored(dacProxyAddress)

    const logBalances = async () => {
        batBalanceWei = await batContract.balanceOf(dacProxyAddress)
        daiBalanceWei = await daiContract.balanceOf(dacProxyAddress)
        zrxBalanceWei = await zrxContract.balanceOf(dacProxyAddress)
        usdcBalanceWei = await zrxContract.balanceOf(dacProxyAddress)
        ethBalanceWei = await provider.getBalance(dacProxyAddress)

        daiBorrowStorage = await cDaiContract.borrowBalanceStored(dacProxyAddress)
        batBorrowStorage = await cBatContract.borrowBalanceStored(dacProxyAddress)
        zrxBorrowStorage = await cZrxContract.borrowBalanceStored(dacProxyAddress)
        usdcBorrowStorage = await cUsdcContract.borrowBalanceStored(dacProxyAddress)
        ethBorrowStorage = await cEtherContract.borrowBalanceStored(dacProxyAddress)

        console.log(`Bat (Holding): ${ethers.utils.formatEther(batBalanceWei.toString())}`)
        console.log(`USDC (Holding): ${ethers.utils.formatUnits(usdcBalanceWei.toString(), 6)}`) // 6 decimals
        console.log(`Dai (Holding): ${ethers.utils.formatEther(daiBalanceWei.toString())}`)
        console.log(`ZRX (Holding): ${ethers.utils.formatEther(zrxBalanceWei.toString())}`)
        console.log(`ETH (Holding): ${ethers.utils.formatEther(ethBalanceWei.toString())}`)

        console.log(`Dai Borrowed: ${ethers.utils.formatEther(daiBorrowStorage.toString())}`)
        console.log(`USDC Borrowed: ${ethers.utils.formatUnits(usdcBorrowStorage.toString(), 6)}`)
        console.log(`Bat Borrowed: ${ethers.utils.formatEther(batBorrowStorage.toString())}`)
        console.log(`ZRX Borrowed: ${ethers.utils.formatEther(zrxBorrowStorage.toString())}`)
        console.log(`ETH Borrowed: ${ethers.utils.formatEther(ethBorrowStorage.toString())}`)
        console.log('---------------')
    }

    // Have this here separately cause calling balanceOfUnderlying w/o any underlying balance
    // freezes ganache
    const logUnderlyingBalances = async () => {
        ethSupplyWei = await cEtherContract.balanceOfUnderlying(dacProxyAddress)
        usdcSupplyWei = await cUsdcContract.balanceOfUnderlying(dacProxyAddress)
        repSupplyWei = await cRepContract.balanceOfUnderlying(dacProxyAddress)
        daiSupplyWei = await cDaiContract.balanceOfUnderlying(dacProxyAddress)
        zrxSupplyWei = await cZrxContract.balanceOfUnderlying(dacProxyAddress)

        console.log(`ETH Supplied: ${ethers.utils.formatEther(ethSupplyWei.toString())}`)
        console.log(`USDC Supplied: ${ethers.utils.formatUnits(usdcSupplyWei.toString(), 6)}`)
        console.log(`REP Supplied: ${ethers.utils.formatEther(repSupplyWei.toString())}`)
        console.log(`DAI Supplied: ${ethers.utils.formatEther(daiSupplyWei.toString())}`)
        console.log(`ZRX Supplied: ${ethers.utils.formatEther(zrxSupplyWei.toString())}`)
        console.log('---------------')
    }

    // Enters markets for proxy
    console.log("Checking markets currently entered")
    let marketsEntered = await comptrollerContract.getAssetsIn(dacProxyAddress)
    if (marketsEntered.length == 0) {
        console.log("No markets entered, entering into Compound v2 market")

        const marketEnterCalldata = IDACManager
            .functions
            .enterMarketsAndApproveCTokens
            .encode([
                [ 
                    addresses.compound.cDai,
                    addresses.compound.cEther,
                    addresses.compound.cBat,
                    addresses.compound.cZRX,
                    addresses.compound.cREP,
                    addresses.compound.cUSDC
                ],
            ])

        await tryAndWait(
            dacProxyContract.execute(
                dacManagerAddress,
                marketEnterCalldata,
                {
                    gasLimit: 4000000
                }
            )
        )

        marketsEntered = await comptrollerContract.getAssetsIn(dacProxyAddress)
    }
    console.log(`Entered into ${marketsEntered.length} market`)

    const ethToSupply = 10
    const daiToBorrow = 500
    if (parseInt(ethers.utils.formatEther(daiBalanceWei.toString())) < daiToBorrow) {
        console.log(`Attempting to supply ${ethToSupply} ETH and borrow ${daiToBorrow.toString()} DAI`)

        const supplyEthAndBorrowCalldata = IDACManager
            .functions
            .supplyETHAndBorrow
            .encode([
                addresses.compound.cDai,
                ethers.utils.parseEther(daiToBorrow.toString())
            ])
        
        await tryAndWait(
            dacProxyContract.execute(
                dacManagerAddress,
                supplyEthAndBorrowCalldata,
                {
                    gasLimit: 4000000,
                    value: ethers.utils.parseEther(ethToSupply.toString())
                }
            )   
        )

        console.log(`Supplied ETH and borrowed ${daiToBorrow} DAI`)
        await logBalances()
    }

    // Helper functions
    const swapDebt = async (fromToken, toToken, fromAddress, toAddress, debtLeft, decimalPlaces=18) => {
        console.log(`Attempting to swap debt from ${fromToken} to ${toToken}`)
        console.log(`Want ${debtLeft} ${fromToken} debt left`)

        const CTokenContract = new ethers.Contract(
            fromAddress,
            CTokenAbi,
            wallet
        )

        // TODO: Change to borrowBalanceCurrent
        const tokenBorrowWei = await CTokenContract.borrowBalanceStored(dacProxyAddress)
        const tokenDelta = tokenBorrowWei.sub(ethers.utils.parseUnits(debtLeft.toString(), decimalPlaces))

        const swapDebtCallbackData = IDACManager
            .functions
            .swapDebt
            .encode([
                actionRegistryAddress,
                addressRegistryAddress,
                dacProxyAddress,
                fromAddress,
                tokenDelta.toString(),
                toAddress
            ])

        await tryAndWait(
            dacProxyContract.execute(
                dacManagerAddress,
                swapDebtCallbackData,
                {
                    gasLimit: 4000000,
                }
            )
        )

        console.log(`Swapped debt from ${fromToken} to ${toToken}`)
        await logBalances()
    }

    const swapCollateral = async (fromToken, toToken, fromAddress, toAddress, collateralLeft, decimalPlaces=18) => {
        console.log(`Attempting to swap collateral from ${fromToken} to ${toToken}`)
        console.log(`Want ${collateralLeft} ${fromToken} left`)

        const CTokenContract = new ethers.Contract(
            fromAddress,
            CTokenAbi,
            wallet
        )
        const tokenSupplyWei = await CTokenContract.balanceOfUnderlying(dacProxyAddress)
        const tokenDelta = tokenSupplyWei - ethers.utils.parseUnits(collateralLeft.toString(), decimalPlaces)

        const swapCollateralCallbackData = IDACManager
            .functions
            .swapCollateral
            .encode([
                actionRegistryAddress,
                addressRegistryAddress,
                dacProxyAddress,
                fromAddress,
                tokenDelta.toString(),
                toAddress
            ])

        await tryAndWait(
            dacProxyContract.execute(
                dacManagerAddress,
                swapCollateralCallbackData,
                {
                    gasLimit: 4000000,
                }
            )
        )

        console.log(`Swapped collateral from ${fromToken} to ${toToken}`)

        await logUnderlyingBalances()
    }

    const clearDebtDust = async (fromToken, toToken, fromAddress, toAddress, clearAmount, decimalPlaces=18) => {
        console.log(`Attempting to clear debt dust from ${fromToken} to ${toToken}`)
        console.log(`Want to move ${clearAmount} ${fromToken} to ${toToken}`)

        const clearDustDebtCallback = IDACManager
            .functions
            .clearDebtDust
            .encode([
                addressRegistryAddress,
                fromAddress,
                ethers.utils.parseUnits(clearAmount.toString(), decimalPlaces),
                toAddress,
            ])

        await tryAndWait(
            dacProxyContract.execute(
                dacManagerAddress,
                clearDustDebtCallback,
                {
                    gasLimit: 4000000
                }
            )
        )
            
        await logBalances()
    }

    const clearCollateralDust = async (fromToken, toToken, fromAddress, toAddress, clearAmount, decimalPlaces=18) => {
        console.log(`Attempting to clear collateral dust from ${fromToken} to ${toToken}`)
        console.log(`Want to move ${clearAmount} ${fromToken} to ${toToken}`)

        const clearDustCollateralCallback = IDACManager
            .functions
            .clearCollateralDust
            .encode([
                addressRegistryAddress,
                fromAddress,
                ethers.utils.parseUnits(clearAmount.toString(), decimalPlaces),
                toAddress,
            ])

        await tryAndWait(
            dacProxyContract.execute(
                dacManagerAddress,
                clearDustCollateralCallback,
                {
                    gasLimit: 4000000
                }
            )
        )
            
        await logUnderlyingBalances()
    }

    // Swapping begins here

    await logBalances()
    await logUnderlyingBalances()

    // Clearing "dust" for debt
    // await clearDebtDust(
    //     'DAI',
    //     'BAT',
    //     addresses.compound.cDai,
    //     addresses.compound.cBat,
    //     10
    // )

    // await clearDebtDust(
    //     'DAI',
    //     'ETH',
    //     addresses.compound.cDai,
    //     addresses.compound.cEther,
    //     100
    // )

    // await clearDebtDust(
    //     'ETH',
    //     'BAT',
    //     addresses.compound.cEther,
    //     addresses.compound.cBat,
    //     0.25
    // )

    // Clearing "dust" for collateral
    // await clearCollateralDust(
    //     'ETH',
    //     'DAI',
    //     addresses.compound.cEther,
    //     addresses.compound.cDai,
    //     0.5
    // )

    // await clearCollateralDust(
    //     'DAI',
    //     'ZRX',
    //     addresses.compound.cDai,
    //     addresses.compound.cZRX,
    //     10
    // )

    // await clearCollateralDust(
    //     'DAI',
    //     'ETH',
    //     addresses.compound.cDai,
    //     addresses.compound.cEther,
    //     10
    // )

    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
    console.log('Due to AMM slippages, we recommend only swapping a maximum of ~97% of your portfolio')
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!')


    // Swap debt
    let daiBorrowed = ethers.utils.formatEther(daiBorrowStorage.toString())
    const daiDebtLeft = 15
    if (parseInt(daiBorrowed)=== parseInt(daiToBorrow)) {
        await swapDebt(
            'DAI',
            'BAT',
            addresses.compound.cDai,
            addresses.compound.cBat,
            daiDebtLeft
        )
    }

    // Swap Collateral
    ethSupplyWei = await cEtherContract.balanceOfUnderlying(dacProxyAddress)
    const ethCollateralLeft = 0.1
    if (parseInt(ethers.utils.formatEther(ethSupplyWei.toString())) === ethToSupply) {
        await swapCollateral(
            'ETH',
            'USDC',
            addresses.compound.cEther,
            addresses.compound.cUSDC,
            ethCollateralLeft
        )
    }

    usdcSupplyWei = await cUsdcContract.balanceOfUnderlying(dacProxyAddress)
    const usdcCollateralLeft = 30
    if (parseInt(ethers.utils.formatEther(usdcSupplyWei.toString())) !== usdcCollateralLeft) {
        await swapCollateral(
            'USDC',
            'REP',
            addresses.compound.cUSDC,
            addresses.compound.cREP,
            usdcCollateralLeft,
            6
        )
    }

    repSupplyWei = await cRepContract.balanceOfUnderlying(dacProxyAddress)
    const repCollateralLeft = 10
    if (parseInt(ethers.utils.formatEther(repSupplyWei.toString())) !== repCollateralLeft) {
        await swapCollateral(
            'REP',
            'ETHER',
            addresses.compound.cREP,
            addresses.compound.cEther,
            repCollateralLeft
        )
    }

    // Going back to swapping debt
    let batBorrowed = ethers.utils.formatEther(batBorrowStorage.toString())
    const batDebtLeft = 10
    if (parseInt(batBorrowed) !== parseInt(batDebtLeft)) {
        await swapDebt(
            'BAT',
            'ETH',
            addresses.compound.cBat,
            addresses.compound.cEther,
            batDebtLeft
        )
    }

    let ethBorrowed = ethers.utils.formatEther(ethBorrowStorage.toString())
    const ethDebtLeft = '0.1'
    if (parseFloat(ethBorrowed) > parseFloat(ethDebtLeft) + 0.1) {
        await swapDebt(
            'ETH',
            'ZRX',
            addresses.compound.cEther,
            addresses.compound.cZRX,
            ethDebtLeft
        )
    }

    let zrxBorrowed = ethers.utils.formatEther(zrxBorrowStorage.toString())
    const zrxDebtLeft = '50'
    if (parseInt(zrxBorrowed) !== parseInt(zrxDebtLeft)) {
        await swapDebt(
            'ZRX',
            'DAI',
            addresses.compound.cZRX,
            addresses.compound.cDai,
            zrxDebtLeft
        )
    }
}

main()