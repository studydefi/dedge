const { ethers } = require("ethers");
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");

const wallet = new ethers.Wallet(
    "0x1bb4c7b8c6a37bb81780d48da0b92650bc4aa5728fb64c2bc7b0e9ffe9f97eb8",
    provider
);
const {
    dedgeMakerManagerAddress,
    dacProxyFactoryAddress,
    addressRegistryAddress
} = require("../build/DeployedAddresses.json");


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

const dacProxyDef = require("../build/DACProxy.json");
const addressRegistryDef = require("../build/AddressRegistry.json");
const dedgeMakerManagerDef = require("../build/DedgeMakerManager.json");
const dacProxyFactoryDef = require("../build/DACProxyFactory.json");

const dssCdpManagerAbi = require('./abi/DssCdpManager.json')
const proxyRegistryAbi = require('./abi/ProxyRegistry.json')
const ERC20Abi = require('./abi/ERC20.json')
const dsProxyAbi = require('./abi/DSProxy.json')
const dssProxyActionsAbi = require('./abi/DssProxyActions.json')

const CEtherAbi = require('../build/ICEther.json').abi
const CTokenAbi = require('../build/ICToken.json').abi
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
        cBat: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e',
        cUSDC: '0x39aa39c021dfbae8fac545936693ac917d5e7563',
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

const newERC20Contract = addr => new ethers.Contract(addr, ERC20Abi, wallet)
const newCTokenContract = addr => new ethers.Contract(addr, CTokenAbi, wallet)

const dacProxyFactoryContract = new ethers.Contract(
    dacProxyFactoryAddress,
    dacProxyFactoryDef.abi,
    wallet
)

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

const dssProxyActionsContract = new ethers.Contract(
    addresses.maker.dssProxyActions,
    dssProxyActionsAbi,
    wallet
)

const dedgeMakerManagerContract = new ethers.Contract(
    dedgeMakerManagerAddress,
    dedgeMakerManagerDef.abi,
    wallet
);

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

const cEtherContract = new ethers.Contract(
    addresses.compound.cEther,
    CEtherAbi,
    wallet
)

const cDaiContract = newCTokenContract(addresses.compound.cDai)
const cBatContract = newCTokenContract(addresses.compound.cBat)
const cUsdcContract = newCTokenContract(addresses.compound.cUSDC)

const IDssProxyActions = new ethers.utils.Interface(dssProxyActionsAbi)
const IDssCdpManager = new ethers.utils.Interface(dssCdpManagerAbi)
const IDedgeMakerManager = new ethers.utils.Interface(dedgeMakerManagerDef.abi)


const main = async () => {
    // MakerDAO proxy address
    let dsProxyAddress = await proxyRegistryContract.proxies(wallet.address)
    if (dsProxyAddress === '0x0000000000000000000000000000000000000000') {
        console.log(`No MakerDAO Proxy found for ${wallet.address}, creating one now`)
        await proxyRegistryContract.build()

        dsProxyAddress = await proxyRegistryContract.proxies(wallet.address)
    }
    console.log(`MakerDAO Proxy address for user: ${dsProxyAddress}`)
    let dsProxyContract = new ethers.Contract(
        dsProxyAddress,
        dsProxyAbi,
        wallet
    )

    // This is our smart wallet address
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

    // Logs balances
    let walletDaiBalanceWei = await daiContract.balanceOf(wallet.address)
    let walletBatBalanceWei = await batContract.balanceOf(wallet.address)
    let walletUsdcBalanceWei = await usdcContract.balanceOf(wallet.address)

    let daiBalanceWei = await daiContract.balanceOf(dacProxyAddress)
    let usdcBalanceWei = await usdcContract.balanceOf(dacProxyAddress)
    let batBalanceWei = await batContract.balanceOf(dacProxyAddress)
    let ethBalanceWei = await provider.getBalance(dacProxyAddress)

    const logBalances = async () => {
        walletDaiBalanceWei = await daiContract.balanceOf(wallet.address)
        walletBatBalanceWei = await batContract.balanceOf(wallet.address)
        walletUsdcBalanceWei = await usdcContract.balanceOf(wallet.address)

        daiBalanceWei = await daiContract.balanceOf(dacProxyAddress)
        usdcBalanceWei = await usdcContract.balanceOf(dacProxyAddress)
        batBalanceWei = await batContract.balanceOf(dacProxyAddress)
        ethBalanceWei = await provider.getBalance(dacProxyAddress)

        cDaiBorrowed = await cDaiContract.borrowBalanceStored(dacProxyAddress)

        ethSupplyWei = await cEtherContract.balanceOfUnderlying(dacProxyAddress)
        batSupplyWei = await cBatContract.balanceOfUnderlying(dacProxyAddress)
        usdcSupplyWei = await cUsdcContract.balanceOfUnderlying(dacProxyAddress)

        console.log(`Dai @ Wallet (Holding): ${ethers.utils.formatEther(walletDaiBalanceWei.toString())}`)
        console.log(`Bat @ Wallet (Holding): ${ethers.utils.formatEther(walletBatBalanceWei.toString())}`)
        console.log(`USDC @ Wallet (Holding): ${ethers.utils.formatUnits(walletUsdcBalanceWei.toString(), 6)}`) // USDC 6 decimals

        console.log(`Dai @ dacProxyAddress (Holding): ${ethers.utils.formatEther(daiBalanceWei.toString())}`)
        console.log(`USDC @ dacProxyAddress (Holding): ${ethers.utils.formatUnits(usdcBalanceWei.toString(), 6)}`)
        console.log(`BAT @ dacProxyAddress (Holding): ${ethers.utils.formatEther(batBalanceWei.toString())}`)
        console.log(`ETH @ dacProxyAddress (Holding): ${ethers.utils.formatEther(ethBalanceWei.toString())}`)

        console.log(`Dai borrowed from Compound: ${ethers.utils.formatEther(cDaiBorrowed.toString())}`)

        console.log(`ETH supplied to Compound: ${ethers.utils.formatEther(ethSupplyWei.toString())}`)
        console.log(`BAT supplied to Compound: ${ethers.utils.formatEther(batSupplyWei.toString())}`)
        console.log(`USDC supplied to Compound: ${ethers.utils.formatUnits(usdcSupplyWei.toString(), 6)}`)
        console.log('---------')
    }

    // Helper functions
    const getTokenFromUniswap = async (tokenName, tokenAddress, decimalPlaces=18) => {
        console.log(`Swapping 2 ETH for ${tokenName} @ uniswap`)
        const uniswapExchangeAddress = await uniswapFactoryContract.getExchange(tokenAddress)
        const uniswapExchangeContract = new ethers.Contract(
            uniswapExchangeAddress,
            uniswapExchangeAbi,
            wallet
        )
        await uniswapExchangeContract.ethToTokenSwapInput(
            1,          // min amount
            1900111539, // random timestamp in the future
            {
                gasLimit: 4000000,
                value: ethers.utils.parseEther("3.0")
            }
        )
        const tokenContract = new ethers.Contract(
            tokenAddress,
            ERC20Abi,
            wallet
        )

        console.log(`Approving dsProxyAddress to call transferFrom ${tokenName}`)
        await tokenContract.approve(
            dsProxyAddress,
            "0xffffffffffffffffffffffffffffffff",
        )

        const walletToken = await tokenContract.balanceOf(wallet.address)
        console.log(`Got ${ethers.utils.formatUnits(walletToken.toString(), decimalPlaces)} ${tokenName}`)
    }

    const openVaultAndGetId = async (ilk, ilkJoinAddress, amount, decimalPlaces=18) => {
        let openVaultCalldata
        if (ilk === addresses.maker.ilkEthA) {
            openVaultCalldata = IDssProxyActions.functions.openLockETHAndDraw.encode([
                addresses.maker.dssCdpManager,
                addresses.maker.jug,
                ilkJoinAddress,
                addresses.maker.daiJoin,
                ethers.utils.formatBytes32String(ilk),
                ethers.utils.parseEther("20.0") // Wanna Draw 20 DAI (minimum 20 DAI)
            ])
        } else {
            // Open Vault with ERC-20 collateral
            openVaultCalldata = IDssProxyActions.functions.openLockGemAndDraw.encode([
                addresses.maker.dssCdpManager,
                addresses.maker.jug,
                ilkJoinAddress,
                addresses.maker.daiJoin,
                ethers.utils.formatBytes32String(ilk),
                ethers.utils.parseUnits(amount.toString(), decimalPlaces),
                ethers.utils.parseEther("20.0"), // Wanna Draw 20 DAI (minimum 20 DAI)
                true
            ])
        }

        console.log(`Opening Vault ${ilk}...`)
        const openVaultTx = await dsProxyContract.execute(
            addresses.maker.dssProxyActions,
            openVaultCalldata,
            {
                gasLimit: 4000000,
                value: ilk === addresses.maker.ilkEthA ? ethers.utils.parseEther(amount.toString()) : '0x0'
            }
        )
        console.log(`Opened vault`)
        await openVaultTx.wait()

        return await dssCdpManagerContract.last(dsProxyAddress)
    }

    // Opens vault and gets opened id
    const openAndImportVault = async (
        ilk,
        joinAddress,
        amount,
        ilkCTokenEquilavent,
        decimalPlaces=18
    ) => {
        const cdpId = await openVaultAndGetId(
            ilk,
            joinAddress,
            amount,
            decimalPlaces
        )
        console.log(`Allowing dacProxy to access CDP ${cdpId.toString()}...`)
        const allowDacProxyCallback = IDssProxyActions
            .functions
            .cdpAllow
            .encode([
                addresses.maker.dssCdpManager,
                cdpId.toString(),
                dacProxyAddress,
                '1'
            ])
        const allowTx = await dsProxyContract.execute(
            addresses.maker.dssProxyActions,
            allowDacProxyCallback,
            {
                gasLimit: 4000000
            }
        )
        await allowTx.wait()
        console.log(`DACProxy granted access to CDP`)

        console.log(`Importing CDP ${cdpId.toString()}....`)

        
        // struct ImportMakerVaultCallData {
        //     address addressRegistryAddress;
        //     uint cdpId;
        //     address collateralCTokenAddress;
        //     address collateralJoinAddress;
        //     uint8 collateralDecimals;
        // }

        const importMakerVaultPostLoanData = ethers
            .utils
            .defaultAbiCoder
            .encode(
                ["address", "uint", "address", "address", "uint8"],
                [
                    addressRegistryAddress,
                    cdpId.toString(),
                    ilkCTokenEquilavent,
                    joinAddress,
                    decimalPlaces.toString()
                ]
            )
        
        const executeOperationCalldataParams = IDedgeMakerManager
            .functions
            .importMakerVaultPostLoan
            .encode([
                0, 0, 0, // Doesn't matter as the variables will be re-injected by `executeOption` anyway
                importMakerVaultPostLoanData
            ])

        const importMakerVaultCallbackdata = IDedgeMakerManager
            .functions
            .importMakerVault
            .encode([
                dedgeMakerManagerAddress,
                dacProxyAddress,
                addressRegistryAddress,
                cdpId,
                executeOperationCalldataParams
            ])

        await tryAndWait(
            dacProxyContract.execute(
                dedgeMakerManagerAddress,
                importMakerVaultCallbackdata,
                {
                    gasLimit: 4000000
                }
            )
        )
        console.log('CDP Imported')
    }

    // Gets tokens needed
    await getTokenFromUniswap("BAT", addresses.tokens.bat)
    await getTokenFromUniswap("USDC", addresses.tokens.usdc, 6)
    
    await logBalances()

    await openAndImportVault(
        addresses.maker.ilkEthA,
        addresses.maker.ethJoin,
        2,
        addresses.compound.cEther,
    )

    await logBalances()

    await openAndImportVault(
        addresses.maker.ilkBatA,
        addresses.maker.batJoin,
        2000,
        addresses.compound.cBat,
    )

    await logBalances()

    await openAndImportVault(
        addresses.maker.ilkUsdcA,
        addresses.maker.usdcJoin,
        200,
        addresses.compound.cUSDC,
        6
    )

    await logBalances()
}

main()