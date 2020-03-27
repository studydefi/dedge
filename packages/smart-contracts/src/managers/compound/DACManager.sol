/*
    Dedge's Aave and Compound manager
*/

pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;


import "../../lib/compound/CompoundBase.sol";

import "../../lib/dapphub/Guard.sol";

import "../../lib/uniswap/UniswapLiteBase.sol";

import "../../interfaces/aave/ILendingPoolAddressesProvider.sol";
import "../../interfaces/aave/ILendingPool.sol";
import "../../interfaces/aave/ILendingPoolParametersProvider.sol";

import "../../interfaces/compound/ICompoundPriceOracle.sol";
import "../../interfaces/compound/IComptroller.sol";
import "../../interfaces/compound/ICEther.sol";
import "../../interfaces/compound/ICToken.sol";

import "../../interfaces/IERC20.sol";

import "../../registries/AddressRegistry.sol";
import "../../registries/ActionRegistry.sol";

import "../../proxies/DACProxy.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";

contract DACManager is UniswapLiteBase, CompoundBase {
    using SafeMath for uint;

    struct SwapOperationCalldata {
        address addressRegistryAddress;
        address oldCTokenAddress;
        address newCTokenAddress;
    }

    function _proxyGuardPermit(address payable proxyAddress, address src) internal {
        address g = address(DACProxy(proxyAddress).authority());

        DSGuard(g).permit(
            bytes32(bytes20(address(src))),
            DSGuard(g).ANY(),
            DSGuard(g).ANY()
        );
    }

    function _proxyGuardForbid(address payable proxyAddress, address src) internal {
        address g = address(DACProxy(proxyAddress).authority());

        DSGuard(g).forbid(
            bytes32(bytes20(address(src))),
            DSGuard(g).ANY(),
            DSGuard(g).ANY()
        );
    }

    function swapDebtPostLoan(
        uint _loanAmount,
        uint _aaveFee,
        uint _protocolFee,
        bytes calldata _data
    ) external {
        SwapOperationCalldata memory soCalldata = abi.decode(_data, (SwapOperationCalldata));

        AddressRegistry addressRegistry = AddressRegistry(soCalldata.addressRegistryAddress);

        address oldCTokenAddress = soCalldata.oldCTokenAddress;
        address newCTokenAddress = soCalldata.newCTokenAddress;

        uint debtAmount = _loanAmount.add(_aaveFee).add(_protocolFee);

        // Note: debtAmount = loanAmount + fees
        // 1. Has ETH from Aave flashloan
        // 2. Converts ETH to oldCToken underlying
        // 3. Repays oldCToken underlying
        // 4. Calculates new amount to borrow from new token to repay debtAmount
        // 5. Borrows from new token
        // 6. Convert new token to ETH

        // Steps 2 + 3
        // Converts ETH to oldCToken underlying and repay
        // Unless old target underlying is already ether
        if (oldCTokenAddress == addressRegistry.CEtherAddress()) {
            repayBorrow(oldCTokenAddress, _loanAmount);
        } else {
            // Gets old token underlying and amount
            address oldTokenUnderlying = ICToken(oldCTokenAddress).underlying();

            uint oldTokenUnderlyingAmount = _ethToToken(
                oldTokenUnderlying,
                _loanAmount
            );

            // Approves CToken proxy and repays them
            IERC20(oldTokenUnderlying)
                .approve(oldCTokenAddress, oldTokenUnderlyingAmount);

            // Repays CToken
            repayBorrow(oldCTokenAddress, oldTokenUnderlyingAmount);
        }

        // Steps 4, 5, 6
        // Calculates new debt amount to borrow
        // Unless new target underlying is already ether
        if (newCTokenAddress == addressRegistry.CEtherAddress()) {
            borrow(newCTokenAddress, debtAmount);
        } else {
            // Gets new token underlying
            address newTokenUnderlying = ICToken(newCTokenAddress).underlying();

            // Calculates amount of old token underlying that needs to be borrowed
            // to repay debts
            uint newTokenUnderlyingAmount = _getTokenToEthOutput(
                newTokenUnderlying,
                debtAmount
            );

            // Borrows new debt
            borrow(newCTokenAddress, newTokenUnderlyingAmount);

            // Converts to ether
            // Note this part is a bit more strict as we need to have
            // enough ETH to repay Aave
            _tokenToEth(newTokenUnderlying, newTokenUnderlyingAmount, debtAmount);
        }
    }

    function swapCollateralPostLoan(
        uint _loanAmount,
        uint _aaveFee,
        uint _protocolFee,
        bytes calldata _data
    ) external {
        SwapOperationCalldata memory soCalldata = abi.decode(_data, (SwapOperationCalldata));

        AddressRegistry addressRegistry = AddressRegistry(soCalldata.addressRegistryAddress);

        address oldCTokenAddress = soCalldata.oldCTokenAddress;
        address newCTokenAddress = soCalldata.newCTokenAddress;

        // 1. Has ETH from Aave flashloan
        // 2. Converts ETH into newCToken underlying
        // 3. Supplies newCToken underlying
        // 4. Redeems oldCToken underlying
        // 5. Converts outCToken underlying to ETH
        // 6. Borrow <fee> ETH to repay aave

        // Steps 2 + 3
        // Converts ETH to newCToken underlying and supply
        // Unless old target underlying is already ether
        uint repayAmount = _loanAmount.sub(_aaveFee).sub(_protocolFee);

        if (newCTokenAddress == addressRegistry.CEtherAddress()) {
            supply(newCTokenAddress, repayAmount);
        } else {
            // Gets new token underlying and converts ETH into newCToken underlying
            address newTokenUnderlying = ICToken(newCTokenAddress).underlying();
            uint newTokenUnderlyingAmount = _ethToToken(
                newTokenUnderlying,
                repayAmount
            );

            // Supplies new CTokens
            supply(newCTokenAddress, newTokenUnderlyingAmount);
        }

        // Steps 4, 5
        // Redeem CToken underlying
        if (oldCTokenAddress == addressRegistry.CEtherAddress()) {
            redeemUnderlying(oldCTokenAddress, _loanAmount);
        } else {
            // Gets old token underlying and amount to redeem (based on uniswap)
            address oldTokenUnderlying = ICToken(oldCTokenAddress).underlying();
            uint oldTokenUnderlyingAmount = _getTokenToEthOutput(oldTokenUnderlying, _loanAmount);

            // Redeems them
            redeemUnderlying(oldCTokenAddress, oldTokenUnderlyingAmount);

            // Converts them into ETH
            _tokenToEth(oldTokenUnderlying, oldTokenUnderlyingAmount, _loanAmount);
        }
    }

    /*
    Main entry point for swapping collateral / debt

    @params:

        dedgeCompoundManagerAddress: Dedge Compound Manager address
        dacProxyAddress: User's proxy address
        addressRegistryAddress: AddressRegistry's Address
        oldCTokenAddress: oldCToken address
        oldTokenUnderlyingDelta: Amount of tokens to swap from old c token's underlying
        executeOperationCalldataParams:
            Abi-encoded `data` used by User's proxy's `execute(address, <data>)` function.
            Used to delegatecall to another contract (i.e. this contract) in the context
            of the proxy. This allows us to decouple the logic of handling flashloans
            from the proxy contract. In this specific case, it is expecting the results
            from: (from JS)

            ```
                const IDedgeCompoundManager = ethers.utils.Interface(DedgeCompoundManager.abi)

                const executeOperationCalldataParams = IDedgeCompoundManager
                    .functions
                    .swapDebt OR .swapCollateral
                    .encode([
                        <parameters>
                    ])
            ```
    */
    function swapOperation(
        address dedgeCompoundManagerAddress,
        address payable dacProxyAddress,
        address addressRegistryAddress,
        address oldCTokenAddress,            // Old CToken address for [debt|collateral]
        uint oldTokenUnderlyingDelta,        // Amount of old tokens to swap to new tokens
        bytes calldata executeOperationCalldataParams
    ) external {
        // Calling from dacProxy context (msg.sender is dacProxy)
        // 1. Get amount of ETH obtained by selling that from Uniswap
        // 2. Flashloans ETH to dacProxy

        // Gets registries
        AddressRegistry addressRegistry = AddressRegistry(addressRegistryAddress);

        // 1. Get amount of ETH needed
        // If the old target is ether than the ethDebtAmount is just the delta
        uint ethDebtAmount;

        if (oldCTokenAddress == addressRegistry.CEtherAddress()) {
            ethDebtAmount = oldTokenUnderlyingDelta;
        } else {
            // Otherwise calculate it from the exchange
            ethDebtAmount = _getEthToTokenOutput(
                ICToken(oldCTokenAddress).underlying(),
                oldTokenUnderlyingDelta
            );
        }

        // Injects the target address into calldataParams
        // so user proxy know which address it'll be calling `calldataParams` on
        bytes memory addressAndExecuteOperationCalldataParams = abi.encodePacked(
            abi.encode(dedgeCompoundManagerAddress),
            executeOperationCalldataParams
        );

        ILendingPool lendingPool = ILendingPool(
            ILendingPoolAddressesProvider(
                addressRegistry.AaveLendingPoolAddressProviderAddress()
            ).getLendingPool()
        );

        // Approve lendingPool to call proxy
        _proxyGuardPermit(dacProxyAddress, address(lendingPool));

        // 3. Flashloan ETH with relevant data
        lendingPool.flashLoan(
            dacProxyAddress,
            addressRegistry.AaveEthAddress(),
            ethDebtAmount,
            addressAndExecuteOperationCalldataParams
        );

        // Forbids lendingPool to call proxy
        _proxyGuardForbid(dacProxyAddress, address(lendingPool));
    }

    // Clears dust debt by swapping old debt into new debt
    function clearDebtDust(
        address addressRegistryAddress,
        address oldCTokenAddress,
        uint oldTokenUnderlyingDustAmount,
        address newCTokenAddress
    ) public payable {
        // i.e. Has 0.1 ETH (oldCToken) debt 900 DAI (newCToken)
        // wants to have it all in DAI

        // 0. Calculates 0.1 ETH equilavent in DAI
        // 1. Borrows out 0.1 ETH equilavent in DAI (~10 DAI as of march 2020)
        // 2. Convert 10 DAI into 0.1 ETH
        // 3. Repay 0.1 ETH

        require(oldCTokenAddress != newCTokenAddress, "clear-debt-same-address");

        AddressRegistry addressRegistry = AddressRegistry(addressRegistryAddress);

        uint borrowAmount;
        address oldTokenUnderlying;
        address newTokenUnderlying;

        if (oldCTokenAddress == addressRegistry.CEtherAddress()) {
            // ETH -> Token
            newTokenUnderlying = ICToken(newCTokenAddress).underlying();

            // Calculates ETH equilavent in token
            borrowAmount = _getTokenToEthOutput(newTokenUnderlying, oldTokenUnderlyingDustAmount);

            // Borrows out equilavent token
            borrow(newCTokenAddress, borrowAmount);

            // Converts token to ETH
            _tokenToEth(newTokenUnderlying, borrowAmount, oldTokenUnderlyingDustAmount);
        } else if (newCTokenAddress == addressRegistry.CEtherAddress()) {
            // Token -> ETH
            oldTokenUnderlying = ICToken(oldCTokenAddress).underlying();

            // Calculates token equilavent in ETH
            borrowAmount = _getEthToTokenOutput(oldTokenUnderlying, oldTokenUnderlyingDustAmount);

            // Borrows out equilavent ETH
            borrow(newCTokenAddress, borrowAmount);

            // Converts ETH to token
            _ethToToken(oldTokenUnderlying, borrowAmount, oldTokenUnderlyingDustAmount);
        } else {
            // token -> token
            oldTokenUnderlying = ICToken(oldCTokenAddress).underlying();
            newTokenUnderlying = ICToken(newCTokenAddress).underlying();

            // Calculates eth borrow amount
            uint ethAmount = _getEthToTokenOutput(oldTokenUnderlying, oldTokenUnderlyingDustAmount);

            // Calculates token borrow amount
            borrowAmount = _getTokenToEthOutput(newTokenUnderlying, ethAmount);

            // Borrows out equilavent token
            borrow(newCTokenAddress, borrowAmount);

            // Converts old token to target token
            _tokenToEth(newTokenUnderlying, borrowAmount, ethAmount);
            _ethToToken(oldTokenUnderlying, ethAmount, oldTokenUnderlyingDustAmount);
        }

        // Repays borrowed
        repayBorrow(oldCTokenAddress, oldTokenUnderlyingDustAmount);
    }

    function clearCollateralDust(
        address addressRegistryAddress,
        address oldCTokenAddress,
        uint oldTokenUnderlyingAmount,
        address newCTokenAddress
    ) public payable {
        // i.e. Has 10 ETH collateral and 10 DAI collateral
        // wants to have it all in ETH

        // 1. Redeems 10 DAI collateral
        // 2. Converts it to ETH
        // 3. Puts it into ETH

        // More abstractly,
        // 1. Redeems tokens
        // 2. Convert it to other token
        // 3. Put other token in

        require(oldCTokenAddress != newCTokenAddress, "clear-collateral-same-address");

        uint supplyAmount;
        AddressRegistry addressRegistry = AddressRegistry(addressRegistryAddress);

        // Redeems collateral
        redeemUnderlying(oldCTokenAddress, oldTokenUnderlyingAmount);

        if (oldCTokenAddress == addressRegistry.CEtherAddress()) {
            // ETH -> Token
            supplyAmount = _ethToToken(
                ICToken(newCTokenAddress).underlying(),
                oldTokenUnderlyingAmount
            );
        } else if (newCTokenAddress == addressRegistry.CEtherAddress()) {
            // Token -> ETH
            supplyAmount = _tokenToEth(
                ICToken(oldCTokenAddress).underlying(),
                oldTokenUnderlyingAmount
            );
        } else {
            // Token -> Token
            supplyAmount = _tokenToToken(
                ICToken(oldCTokenAddress).underlying(),
                ICToken(newCTokenAddress).underlying(),
                oldTokenUnderlyingAmount
            );
        }

        // Supplies collateral
        supply(newCTokenAddress, supplyAmount);
    }
}
