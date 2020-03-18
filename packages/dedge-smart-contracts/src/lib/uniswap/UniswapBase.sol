pragma solidity 0.5.16;

import "../../interfaces/uniswap/IUniswapExchange.sol";
import "../../interfaces/uniswap/IUniswapFactory.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract UniswapBase {
    // Uniswap Mainnet factory address
    address constant UniswapFactoryAddress = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;

    function _getUniswapExchange(address tokenAddress) internal view returns (address) {
        return IUniswapFactory(UniswapFactoryAddress).getExchange(tokenAddress);
    }

    function _buyTokensWithEthFromUniswap(address tokenAddress, uint ethAmount) internal returns (uint) {
        return IUniswapExchange(_getUniswapExchange(tokenAddress))
            .ethToTokenSwapInput.value(ethAmount)(uint(1), uint(now + 60));
    }

    function _buyTokensWithEthFromUniswap(address tokenAddress, uint ethAmount, uint minAmount) internal returns (uint) {
        return IUniswapExchange(_getUniswapExchange(tokenAddress))
            .ethToTokenSwapInput.value(ethAmount)(minAmount, uint(now + 60));
    }

    function _sellTokensForEthFromUniswap(address tokenAddress, uint tokenAmount) internal returns (uint) {
        address exchange = _getUniswapExchange(tokenAddress);

        IERC20(tokenAddress).approve(exchange, tokenAmount);

        return IUniswapExchange(exchange)
            .tokenToEthSwapInput(tokenAmount, uint(1), uint(now + 60));
    }

    function getTokenToEthInputPriceFromUniswap(address tokenAddress, uint tokenAmount) public view returns (uint) {
        return IUniswapExchange(_getUniswapExchange(tokenAddress)).getTokenToEthInputPrice(tokenAmount);
    }

    function getEthToTokenInputPriceFromUniswap(address tokenAddress, uint ethAmount) public view returns (uint) {
        return IUniswapExchange(_getUniswapExchange(tokenAddress)).getEthToTokenInputPrice(ethAmount);
    }

    function getTokenToTokenPriceFromUniswap(address from, address to, uint fromAmount) public view returns (uint) {
        uint ethAmount = getTokenToEthInputPriceFromUniswap(from, fromAmount);
        return getEthToTokenInputPriceFromUniswap(to, ethAmount);
    }
}