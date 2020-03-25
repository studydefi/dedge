pragma solidity 0.5.16;

contract IAddressRegistry {
    function AaveLendingPoolAddressProviderAddress() external returns (address);
    function AaveEthAddress() external returns (address);
    function UniswapFactoryAddress() external returns (address);
    function CompoundPriceOracleAddress() external returns (address);
    function CompoundComptrollerAddress() external returns (address);
    function CEtherAddress() external returns (address);
    function CUSDCAddress() external returns (address);
    function CDaiAddress() external returns (address);
    function CSaiAddress() external returns (address);
    function DaiAddress() external returns (address);
    function BatAddress() external returns (address);
    function UsdcAddress() external returns (address);
    function EthJoinAddress() external returns (address);
    function UsdcJoinAddress() external returns (address);
    function BatJoinAddress() external returns (address);
    function DaiJoinAddress() external returns (address);
    function JugAddress() external returns (address);
    function DssProxyActionsAddress() external returns (address);
    function DssCdpManagerAddress() external returns (address);
}