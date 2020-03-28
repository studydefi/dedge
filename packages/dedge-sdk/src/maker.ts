import { ethers } from 'ethers';

import dedgeMakerManagerDef from 'dedge-smart-contracts/artifacts/DedgeMakerManager.json'
import moneyLegos from 'money-legos'

import { Address } from './types'

const IDssProxyActions = new ethers.utils.Interface(moneyLegos.maker.dssProxyActions.abi)
const IDedgeMakerManager = new ethers.utils.Interface(dedgeMakerManagerDef.abi)

const importMakerVault = (
    dacProxyContract: ethers.Contract,
    dacUserProxy: Address,
    dedgeMakerManager: Address,
    addressRegistry: Address,
    cdpId: Number,
    ilkCTokenEquilavent: Address,
    ilkJoinAddress: Address,
    decimalPlaces: Number = 18,
    gasLimit: Number = 4000000
): Promise<any> => {
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
                addressRegistry,
                cdpId.toString(),
                ilkCTokenEquilavent,
                ilkJoinAddress,
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
            dedgeMakerManager,
            dacUserProxy,
            addressRegistry,
            cdpId,
            executeOperationCalldataParams
        ])

    return dacProxyContract.execute(
        dedgeMakerManager,
        importMakerVaultCallbackdata,
        { gasLimit }
    )
}

const dsProxyCdpAllowDacProxy = (
    dsProxy: ethers.Contract, // MakerDAO's proxy contract
    dacProxy: Address, // Dedge's proxy contract
    dssCdpManager: Address, // DssCdpManager's address,
    dssProxyActions: Address, // Dss-ProxyAction's address
    cdpId: Number
): Promise<any> => {

    const allowDacProxyCallback = IDssProxyActions
        .functions
        .cdpAllow
        .encode([
            dssCdpManager,
            cdpId.toString(),
            dacProxy,
            '1'
        ])

    return dsProxy.execute(
        dssProxyActions,
        allowDacProxyCallback,
        {
            gasLimit: 4000000
        }
    )
}

export default {
    importMakerVault,
    dsProxyCdpAllowDacProxy
}