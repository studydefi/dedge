pragma solidity 0.5.16;

/**
@title ILendingPoolAddressesProvider interface
@notice provides the interface to fetch the LendingPoolCore address
 */

contract ILendingPoolParametersProvider {
    function getFlashLoanFeesInBips() public view returns (uint256, uint256);
}
