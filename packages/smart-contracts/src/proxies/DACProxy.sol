/*
    Main contract to handle Aave flashloans on Compound Finance.
    (D)edge's (A)ave flashloans on (C)ompound finance Proxy.
*/

pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import "../lib/BytesLib.sol";

import "../lib/aave/FlashLoanReceiverBase.sol";

import "../lib/dapphub/Proxy.sol";

import "../lib/uniswap/UniswapLiteBase.sol";

import "../lib/makerdao/DssProxyActionsBase.sol";

import "../managers/makerdao/DedgeMakerManager.sol";

import "../registries/AddressRegistry.sol";
import "../registries/ActionRegistry.sol";

import "../interfaces/IERC20.sol";
import "../interfaces/compound/ICEther.sol";
import "../interfaces/compound/ICToken.sol";
import "../interfaces/makerdao/IDssProxyActions.sol";
import "../interfaces/compound/IComptroller.sol";

contract DACProxy is
    DSProxy(address(1)),
    FlashLoanReceiverBase,
    BytesLibLite
{
    // TODO: Change this value
    address payable constant protocolFeePayoutAddress = 0x56D5e01D5D2F853aA8f4ac5d2FfB4cBBCa9e2b0f;

    constructor(address _cacheAddr) public {
        setCache(_cacheAddr);
    }

    function() external payable {}

    // This is for Aave flashloans
    function executeOperation(
        address _reserve,
        uint256 _amount,
        uint256 _fee,
        bytes calldata _params
    ) external
        auth
    {
        // Assumes that once the action(s) are performed
        // we will have totalDebt would of _reserve to repay
        // aave and the protocol
        uint protocolFee = _fee.div(2);

        // Re-encodes new data 
        // Function signature should conform to:
        /* (
                // Note: for address, as abiEncoder pads it to 32 bytes our starting position is 12
                // due to addresses having 20 bytes in length
                address     - Address to call        | start: 12;  (20 bytes)
                bytes       - Function sig           | start: 32;  (4 bytes)
                uint        - Data of _amount        | start: 36;  (32 bytes)
                uint        - Data of _aaveFee       | start: 68;  (32 bytes)
                uint        - Data of _protocolFee   | start: 100; (32 bytes)
                bytes       - Data of _data          | start: 132; (dynamic length)
            )

            i.e.

            function myFunction(
                uint amount,
                uint aaveFee,
                uint protocolFee,
                bytes memory _data
            ) { ... }
        */
        address targetAddress = bytesToAddress(_params, 12);
        bytes memory fSig     = slice(_params, 32, 4);
        bytes memory data     = sliceToEnd(_params, 132);

        // Re-encodes function signature and injects new
        // _amount, _fee, and _protocolFee into _data
        bytes memory newData = abi.encodePacked(
            fSig,
            abi.encode(_amount),
            abi.encode(_fee),
            abi.encode(protocolFee),
            data
        );

        // Executes new target
        execute(targetAddress, newData);

        // Repays protocol fee
        if (_reserve == 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE) {
            protocolFeePayoutAddress.call.value(protocolFee)("");
        } else {
            IERC20(_reserve).transfer(protocolFeePayoutAddress, protocolFee);
        }

        // Repays aave
        transferFundsBackToPoolInternal(_reserve, _amount.add(_fee));
    }
}