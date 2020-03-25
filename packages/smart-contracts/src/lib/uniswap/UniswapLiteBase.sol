pragma solidity 0.5.16;

import "../../interfaces/uniswap/IUniswapExchange.sol";
import "../../interfaces/uniswap/IUniswapFactory.sol";

import "../../interfaces/IERC20.sol";


contract UniswapLiteBase {
    // Uniswap Mainnet factory address
    address constant UniswapFactoryAddress = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;

    function _getUniswapExchange(address tokenAddress) internal view returns (address) {
        return IUniswapFactory(UniswapFactoryAddress).getExchange(tokenAddress);
    }

    function _ethToToken(address tokenAddress, uint ethAmount)
        internal returns (uint) {
        return IUniswapExchange(_getUniswapExchange(tokenAddress))
            .ethToTokenSwapInput.value(ethAmount)(uint(1), uint(now + 60));
    }

    function _tokenToEth(address tokenAddress, uint tokenAmount) internal returns (uint) {
        address exchange = _getUniswapExchange(tokenAddress);

        IERC20(tokenAddress).approve(exchange, tokenAmount);

        return IUniswapExchange(exchange)
            .tokenToEthSwapInput(tokenAmount, uint(1), uint(now + 60));
    }

    function _tokenToEth(address tokenAddress, uint tokenAmount, uint minEthAmount) internal returns (uint) {
        address exchange = _getUniswapExchange(tokenAddress);

        IERC20(tokenAddress).approve(exchange, tokenAmount);

        return IUniswapExchange(exchange)
            .tokenToEthSwapInput(tokenAmount, minEthAmount, uint(now + 60));
    }

    function _tokenToToken(address from, address to, uint tokenAmount) internal returns (uint) {
        uint ethAmount = _tokenToEth(from, tokenAmount);
        return _ethToToken(to, ethAmount);
    }

    function _getTokenToEthInput(address tokenAddress, uint tokenAmount) internal view returns (uint) {
        return IUniswapExchange(_getUniswapExchange(tokenAddress)).getTokenToEthInputPrice(tokenAmount);
    }

    function _getEthToTokenInput(address tokenAddress, uint ethAmount) internal view returns (uint) {
        return IUniswapExchange(_getUniswapExchange(tokenAddress)).getEthToTokenInputPrice(ethAmount);
    }

    function _getTokenToEthOutput(address tokenAddress, uint ethAmount) internal view returns (uint) {
        return IUniswapExchange(_getUniswapExchange(tokenAddress)).getTokenToEthOutputPrice(ethAmount);
    }

    function _getEthToTokenOutput(address tokenAddress, uint tokenAmount) internal view returns (uint) {
        return IUniswapExchange(_getUniswapExchange(tokenAddress)).getEthToTokenOutputPrice(tokenAmount);
    }

    function _getTokenToTokenInput(address from, address to, uint fromAmount) internal view returns (uint) {
        uint ethAmount = _getTokenToEthInput(from, fromAmount);
        return _getEthToTokenInput(to, ethAmount);
    }
}
