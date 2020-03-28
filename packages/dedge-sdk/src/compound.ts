import { ethers } from 'ethers';

import dedgeCompoundManagerDef from 'dedge-smart-contracts/artifacts/DedgeCompoundManager.json'

import { Address, EncoderFunction } from './types'

const IDedgeCompoundManager = new ethers.utils.Interface(dedgeCompoundManagerDef.abi)

const swapOperation = (
    swapFunctionEncoder: EncoderFunction,
    dacProxy: ethers.Contract,
    dedgeCompoundManager: Address,
    addressRegistry: Address,
    oldCToken: Address,
    oldTokenUnderlyingDeltaWei: Number,
    newCToken: Address,
    gasLimit: Number = 4000000
): Promise<any> => {

    // struct SwapOperationCalldata {
    //     address addressRegistryAddress;
    //     address oldCTokenAddress;
    //     address newCTokenAddress;
    // }

    const swapOperationStructData = ethers.utils.defaultAbiCoder.encode(
        [ "address", "address", "address" ],
        [ addressRegistry, oldCToken, newCToken ]
    )

    const executeOperationCalldataParams = swapFunctionEncoder([
        0, 0, 0,    // Doesn't matter as the right data will be injected in later on
        swapOperationStructData
    ])
    
    const swapOperationCalldata = IDedgeCompoundManager
        .functions
        .swapOperation
        .encode([
            dedgeCompoundManager,
            dacProxy.address,
            addressRegistry,
            oldCToken,
            oldTokenUnderlyingDeltaWei.toString(),
            newCToken,
            executeOperationCalldataParams
        ])
    
    return dacProxy.execute(
        dedgeCompoundManager,
        swapOperationCalldata,
        { gasLimit }
    )
}

const swapDebt = (
    dacProxy: ethers.Contract,
    dedgeCompoundManager: Address,
    addressRegistry: Address,
    oldCToken: Address,
    oldTokenUnderlyingDeltaWei: Number,
    newCToken: Address,
    gasLimit: Number = 4000000
): Promise<any> => {
    return swapOperation(
        IDedgeCompoundManager.functions.swapDebtPostLoan.encode,
        dacProxy,
        dedgeCompoundManager,
        addressRegistry,
        oldCToken,
        oldTokenUnderlyingDeltaWei,
        newCToken,
        gasLimit,
    )
}

const swapCollateral = (
    dacProxy: ethers.Contract,
    dedgeCompoundManager: Address,
    addressRegistry: Address,
    oldCToken: Address,
    oldTokenUnderlyingDeltaWei: Number,
    newCToken: Address,
    gasLimit: Number = 4000000
): Promise<any> => {
    return swapOperation(
        IDedgeCompoundManager.functions.swapCollateralPostLoan.encode,
        dacProxy,
        dedgeCompoundManager,
        addressRegistry,
        oldCToken,
        oldTokenUnderlyingDeltaWei,
        newCToken,
        gasLimit,
    )
}

export default {
    swapCollateral,
    swapDebt
}