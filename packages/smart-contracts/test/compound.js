const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
const wallet = new ethers.Wallet(
    "0xc5cb7686c83376fa45c032bb6e1bc9a5b7447e191b2ba084db6d4064106e432e",
    provider
);
const { dedgeProxyFactoryAddress, dedgeCompoundManagerAddress } = require("../build/DeployedAddresses.json");

const CEtherAbi = require('../build/ICEther.json').abi
const CTokenAbi = require('../build/ICToken.json').abi
const ERC20Abi = require('./abi/ERC20.json')
const ComptrollerAbi = require('../build/IComptroller.json').abi

const dedgeProxyFactoryDef = require("../build/DedgeProxyFactory.json");
const dedgeCompoundManagerDef = require("../build/DedgeCompoundManager.json");
const dedgeProxyDef = require("../build/DedgeProxy.json");

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
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

const main = async () => {
    const dedgeProxyFactoryContract = new ethers.Contract(
        dedgeProxyFactoryAddress,
        dedgeProxyFactoryDef.abi,
        wallet
    )

    const cEtherContract = new ethers.Contract(
        addresses.compound.cEther,
        CEtherAbi,
        wallet
    )

    const cDaiContract = new ethers.Contract(
        addresses.compound.cDai,
        CTokenAbi,
        wallet
    )

    const cBatContract = new ethers.Contract(
        addresses.compound.cBat,
        CTokenAbi,
        wallet
    )

    const cZrxContract = new ethers.Contract(
        addresses.compound.cZRX,
        CTokenAbi,
        wallet
    )

    const cUsdcContract = new ethers.Contract(
        addresses.compound.cUSDC,
        CTokenAbi,
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

    const zrxContract = new ethers.Contract(
        addresses.tokens.zrx,
        ERC20Abi,
        wallet
    )

    const usdcContract = new ethers.Contract(
        addresses.tokens.usdc,
        ERC20Abi,
        wallet
    )

    const comptrollerContract = new ethers.Contract(
        addresses.compound.comptroller,
        ComptrollerAbi,
        wallet
    )

    const dedgeCompoundManagerContract = new ethers.Contract(
        dedgeCompoundManagerAddress,
        dedgeCompoundManagerDef.abi,
        wallet
    )

    const IDedgeCompoundManager = new ethers.utils.Interface(dedgeCompoundManagerDef.abi)

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

    console.log("Checking markets currently entered")
    let marketsEntered = await comptrollerContract.getAssetsIn(dedgeProxyAddress)
    if (marketsEntered.length < 2) {
        console.log("No markets entered, entering into Compound v2 market")

        const marketEnterCalldata = IDedgeCompoundManager
            .functions
            .enterMarketsAndApproveCTokens
            .encode([
                [ addresses.compound.cDai, addresses.compound.cEther, addresses.compound.cBat, addresses.compound.cZRX, addresses.compound.cREP, addresses.compound.cUSDC ],
            ])

        await dedgeProxyContract.execute(
            dedgeCompoundManagerAddress,
            marketEnterCalldata,
            {
                gasLimit: 4000000
            }
        )

        marketsEntered = await comptrollerContract.getAssetsIn(dedgeProxyAddress)
    }
    console.log(`Entered into ${marketsEntered.length} market`)

    let batBalanceWei = await batContract.balanceOf(dedgeProxyAddress)
    let daiBalanceWei = await daiContract.balanceOf(dedgeProxyAddress)
    let zrxBalanceWei = await zrxContract.balanceOf(dedgeProxyAddress)
    let usdcBalanceWei = await zrxContract.balanceOf(dedgeProxyAddress)
    let ethBalanceWei = await provider.getBalance(dedgeProxyAddress)

    // There's an issue with ganache where if you haven't supplied anything i.e. USDC or ETH
    // and call balanceOfUnderlying, it _will_ just hang :|
    let ethSupplyWei
    let usdcSupplyWei
    
    let daiBorrowStorage = await cDaiContract.borrowBalanceStored(dedgeProxyAddress)
    let batBorrowStorage = await cBatContract.borrowBalanceStored(dedgeProxyAddress)
    let zrxBorrowStorage = await cZrxContract.borrowBalanceStored(dedgeProxyAddress)
    let usdcBorrowStorage = await cUsdcContract.borrowBalanceStored(dedgeProxyAddress)
    let ethBorrowStorage = await cEtherContract.borrowBalanceStored(dedgeProxyAddress)

    const logBalances = async () => {
        batBalanceWei = await batContract.balanceOf(dedgeProxyAddress)
        daiBalanceWei = await daiContract.balanceOf(dedgeProxyAddress)
        zrxBalanceWei = await zrxContract.balanceOf(dedgeProxyAddress)
        usdcBalanceWei = await zrxContract.balanceOf(dedgeProxyAddress)
        ethBalanceWei = await provider.getBalance(dedgeProxyAddress)

        ethSupplyWei = await cEtherContract.balanceOfUnderlying(dedgeProxyAddress)
        usdcSupplyWei = await cUsdcContract.balanceOfUnderlying(dedgeProxyAddress)

        daiBorrowStorage = await cDaiContract.borrowBalanceStored(dedgeProxyAddress)
        batBorrowStorage = await cBatContract.borrowBalanceStored(dedgeProxyAddress)
        zrxBorrowStorage = await cZrxContract.borrowBalanceStored(dedgeProxyAddress)
        usdcBorrowStorage = await cUsdcContract.borrowBalanceStored(dedgeProxyAddress)
        ethBorrowStorage = await cEtherContract.borrowBalanceStored(dedgeProxyAddress)

        console.log(`Bat (Holding): ${ethers.utils.formatEther(batBalanceWei.toString())}`)
        console.log(`USDC (Holding): ${ethers.utils.formatUnits(usdcBalanceWei.toString(), 6)}`) // 6 decimals
        console.log(`Dai (Holding): ${ethers.utils.formatEther(daiBalanceWei.toString())}`)
        console.log(`ZRX (Holding): ${ethers.utils.formatEther(zrxBalanceWei.toString())}`)
        console.log(`ETH (Holding): ${ethers.utils.formatEther(ethBalanceWei.toString())}`)

        console.log(`ETH Supplied: ${ethers.utils.formatEther(ethSupplyWei.toString())}`)
        console.log(`USDC Supplied: ${ethers.utils.formatUnits(usdcSupplyWei.toString(), 6)}`)

        console.log(`Dai Borrowed: ${ethers.utils.formatEther(daiBorrowStorage.toString())}`)
        console.log(`USDC Borrowed: ${ethers.utils.formatUnits(usdcBorrowStorage.toString(), 6)}`)
        console.log(`Bat Borrowed: ${ethers.utils.formatEther(batBorrowStorage.toString())}`)
        console.log(`ZRX Borrowed: ${ethers.utils.formatEther(zrxBorrowStorage.toString())}`)
        console.log(`ETH Borrowed: ${ethers.utils.formatEther(ethBorrowStorage.toString())}`)
        console.log('---------------')
    }

    // await logBalances()

    let daiBalance = ethers.utils.formatEther(daiBalanceWei.toString())
    const daiToBorrow = 95
    if (parseInt(daiBalance) < 20) {
        console.log(`Attempting to supply 2 ETH and borrow ${daiToBorrow.toString()} DAI`)

        const supplyEthAndBorrowCalldata = IDedgeCompoundManager
            .functions
            .supplyETHAndBorrow
            .encode([
                addresses.compound.cDai,
                ethers.utils.parseEther(daiToBorrow.toString())
            ])
        
        const tx = await dedgeProxyContract.execute(
            dedgeCompoundManagerAddress,
            supplyEthAndBorrowCalldata,
            {
                gasLimit: 4000000,
                value: ethers.utils.parseEther("2.0")
            }
        )

        await tx.wait()

        console.log(`Supplied ETH and borrowed ${daiToBorrow} DAI`)
    }

    ethSupplyWei = await cEtherContract.balanceOfUnderlying(dedgeProxyAddress)
    const ethCollateralSwapUntil = "1.5"
    if (parseFloat(ethers.utils.formatEther(ethSupplyWei)) > 1.8) {
        console.log(`Attempting to swap collateral from ETH to USDC, want to swap ${ethCollateralSwapUntil} ETH to USDC`)

        const swapCollateralCalldata = IDedgeCompoundManager
            .functions
            .swapCollateralUntil
            .encode([
                dedgeProxyAddress,
                addresses.compound.cEther,
                ethers.utils.parseEther(ethCollateralSwapUntil).toString(),
                addresses.compound.cUSDC,
            ])

        try {
            await dedgeProxyContract.execute(
                dedgeCompoundManagerAddress,
                swapCollateralCalldata,
                {
                    gasLimit: 4000000,
                }
            )
        }
        catch(e) {
            const eStr = e.toString().toLowerCase()
            if (eStr.includes("timeout") || eStr.includes("0")) {
                await sleep(60 * 1000); // Sleep for 1 more minute after timeout
            } else {
                throw e
            }
        }

        await logBalances()
    }

    let daiBorrowed = ethers.utils.formatEther(daiBorrowStorage.toString())
    if (parseInt(daiBorrowed) == daiToBorrow) {
        console.log('Attempting to swap debt from DAI to BAT')
        const daiDebtLeft = "15"
        console.log(`Want ${daiDebtLeft} DAI debt left`)

        const idealBatAmountToBorrow = await dedgeCompoundManagerContract.calcNewTokensToBorrow(
            dedgeProxyAddress,
            addresses.compound.cDai,
            addresses.compound.cBat,
            ethers.utils.parseEther(daiDebtLeft).toString()
        )

        // Max amount of BAT compound allows us to borrow
        const maxBatToBeBorrowed = await dedgeCompoundManagerContract.maxRetrieveTokensNo(
            dedgeProxyAddress,
            addresses.compound.cBat
        )

        console.log(`Need ${ethers.utils.formatEther(idealBatAmountToBorrow.toString())} BAT to repay DAI debt`)
        console.log(`However only can borrow maximum of ${ethers.utils.formatEther(maxBatToBeBorrowed.toString())} BAT`)
        console.log('Swapping.... please wait')

        const swapDebtCallbackData = IDedgeCompoundManager
            .functions
            .swapDebtUntil
            .encode([
                dedgeProxyAddress,
                dedgeCompoundManagerAddress,
                addresses.compound.cDai,
                ethers.utils.parseEther(daiDebtLeft),  // Only want 15 DAI debt left
                addresses.compound.cBat,
            ])
        

        // SUPER hacky way to get pass timeouts (they're hardcoded in web.ts)
        // The following line takes ~2.5 minutes to complete
        // ethers.js timeouts in 2 minutes :(
        try {
            await dedgeProxyContract.execute(
                dedgeCompoundManagerAddress,
                swapDebtCallbackData,
                {
                    gasLimit: 4000000
                }
            )
        } catch(e) {
            const eStr = e.toString().toLowerCase()
            if (eStr.includes("timeout") || eStr.includes("0")) {
                await sleep(60 * 1000); // Sleep for 1 more minute after timeout
            } else {
                throw e
            }
        }

        console.log('Swapped debt from DAI to BAT')

        await logBalances()
    }

    let batBorrowStorageInt = parseInt(ethers.utils.formatEther(batBorrowStorage.toString()))
    const batDebtLeft = '125'
    if (batBorrowStorageInt > parseInt(batDebtLeft)) {
        console.log(`Swapping BAT debt to ZRX debt, want ${batDebtLeft} BAT left`)

        const swapDebtCallbackData = IDedgeCompoundManager
            .functions
            .swapDebtUntil
            .encode([
                dedgeProxyAddress,
                dedgeCompoundManagerAddress,
                addresses.compound.cBat,
                ethers.utils.parseEther(batDebtLeft),  // Only want 125 bat debt left
                addresses.compound.cZRX,
            ])
        
        // SUPER hacky way to get pass timeouts (they're hardcoded in web.ts)
        // The following line takes ~2.5 minutes to complete
        // ethers.js timeouts in 2 minutes :(
        try {
            await dedgeProxyContract.execute(
                dedgeCompoundManagerAddress,
                swapDebtCallbackData,
                {
                    gasLimit: 4000000
                }
            )
        } catch(e) {
            const eStr = e.toString().toLowerCase()
            if (eStr.includes("timeout") || eStr.includes("0")) {
                await sleep(60 * 1000); // Sleep for 1 more minute after timeout
            } else {
                throw e
            }
        }
        console.log("Swapped debt")

        await logBalances()
    }

    let zrxBorrowStorageInt = parseInt(ethers.utils.formatEther(zrxBorrowStorage.toString()))
    const zrxDebtLeft = '100'
    if (zrxBorrowStorageInt > parseInt(zrxDebtLeft)) {
        console.log(`Swapping ZRX debt to Ether debt, want ${zrxDebtLeft} ZRX debt remaining`)

        const swapDebtCallbackData = IDedgeCompoundManager
            .functions
            .swapDebtUntil
            .encode([
                dedgeProxyAddress,
                dedgeCompoundManagerAddress,
                addresses.compound.cZRX,
                ethers.utils.parseEther(zrxDebtLeft),  // Only want 125 ZRX debt left
                addresses.compound.cEther,
            ])
        
        // SUPER hacky way to get pass timeouts (they're hardcoded in web.ts)
        // The following line takes ~2.5 minutes to complete
        // ethers.js timeouts in 2 minutes :(
        try {
            await dedgeProxyContract.execute(
                dedgeCompoundManagerAddress,
                swapDebtCallbackData,
                {
                    gasLimit: 4000000
                }
            )
        } catch(e) {
            const eStr = e.toString().toLowerCase()
            if (eStr.includes("timeout") || eStr.includes("0")) {
                await sleep(60 * 1000); // Sleep for 1 more minute after timeout
            } else {
                throw e
            }
        }
        console.log("Swapped debt")

        await logBalances()
    }

    let ethBorrowStorageFloat = parseFloat(ethers.utils.formatEther(ethBorrowStorage.toString()))
    const ethDebtLeft = '0.1'
    if (ethBorrowStorageFloat > parseFloat(ethDebtLeft)) {
        console.log(`Swapping Ether debt to DAI debt, want ${ethDebtLeft} ETH debt remaining`)

        const swapDebtCallbackData = IDedgeCompoundManager
            .functions
            .swapDebtUntil
            .encode([
                dedgeProxyAddress,
                dedgeCompoundManagerAddress,
                addresses.compound.cEther,
                ethers.utils.parseEther(ethDebtLeft),  // Only want 125 ZRX debt left
                addresses.compound.cDai,
            ])
        
        // SUPER hacky way to get pass timeouts (they're hardcoded in web.ts)
        // The following line takes ~2.5 minutes to complete
        // ethers.js timeouts in 2 minutes :(
        try {
            await dedgeProxyContract.execute(
                dedgeCompoundManagerAddress,
                swapDebtCallbackData,
                {
                    gasLimit: 4000000
                }
            )
        } catch(e) {
            const eStr = e.toString().toLowerCase()
            if (eStr.includes("timeout") || eStr.includes("0")) {
                await sleep(60 * 1000); // Sleep for 1 more minute after timeout
            } else {
                throw e
            }
        }
        console.log("Swapped debt")

        await logBalances()
    }
    

    let payoutFeeAddress = await provider.getBalance("0x56D5e01D5D2F853aA8f4ac5d2FfB4cBBCa9e2b0f");
    console.log(`Payout Address ETH (should be >0): ${ethers.utils.formatEther(payoutFeeAddress.toString())}`)
}


main()
