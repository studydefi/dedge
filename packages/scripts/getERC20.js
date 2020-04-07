"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var money_legos_1 = require("money-legos");
var common_1 = require("dedge-smart-contracts/test/common");
var legos = money_legos_1.getLegos(money_legos_1.networkIds.mainnet);
var erc20Tokens = Object.keys(legos.erc20).filter(function (x) { return x !== 'abi'; });
if (process.argv.length !== 4) {
    console.log("ts-node getERC20.ts <tokens-to-send-address> [" + erc20Tokens.join('|') + "]");
    process.exit(1);
}
if (!erc20Tokens.includes(process.argv[3])) {
    console.log("ts-node createMakerVault.ts <tokens-to-send-address> [" + erc20Tokens.join('|') + "]");
    process.exit(1);
}
var token = process.argv[3];
var targetAddress = process.argv[2];
var tokenAddress = legos.erc20[token].address;
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var erc20Contract, walTokenBal, targetBal;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Getting tokens from uniswap');
                return [4 /*yield*/, common_1.getTokenFromUniswapAndApproveProxyTransfer("0x0000000000000000000000000000000000000000", tokenAddress, 1)];
            case 1:
                _a.sent();
                console.log('Transfering tokens');
                erc20Contract = common_1.newERC20Contract(tokenAddress);
                return [4 /*yield*/, erc20Contract.balanceOf(common_1.wallet.address)];
            case 2:
                walTokenBal = _a.sent();
                return [4 /*yield*/, erc20Contract.transfer(targetAddress, walTokenBal.toString())];
            case 3:
                _a.sent();
                return [4 /*yield*/, erc20Contract.balanceOf(targetAddress)];
            case 4:
                targetBal = _a.sent();
                console.log(targetAddress + " has " + targetBal.toString() + " " + token + " (in Wei)");
                return [2 /*return*/];
        }
    });
}); };
main();
