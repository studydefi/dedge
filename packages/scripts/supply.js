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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var money_legos_1 = require("money-legos");
var common_1 = require("dedge-smart-contracts/test/common");
var helpers_1 = require("dedge-smart-contracts/helpers");
var ethers_1 = require("ethers");
var DeployedAddresses_json_1 = require("dedge-smart-contracts/build/DeployedAddresses.json");
var DACProxy_json_1 = __importDefault(require("dedge-smart-contracts/build/DACProxy.json"));
var DACProxyFactory_json_1 = __importDefault(require("dedge-smart-contracts/build/DACProxyFactory.json"));
var legos = money_legos_1.getLegos(money_legos_1.networkIds.mainnet);
var erc20Tokens = Object.keys(legos.erc20).filter(function (x) { return x !== "abi"; });
var cTokens = Object.keys(legos.compound).filter(function (x) { return x !== "cTokenAbi" && x !== "comptroller" && x[0] === "c"; });
if (process.argv.length !== 5) {
    console.log("ts-node supply.ts [" + erc20Tokens.join("|") + "] <amount> [" + cTokens.join("|") + "]");
    process.exit(1);
}
if (!erc20Tokens.includes(process.argv[2])) {
    console.log("ts-node supply.ts " + erc20Tokens.join("|") + "] <amount> [" + cTokens.join("|") + "]");
    process.exit(1);
}
if (!cTokens.includes(process.argv[4])) {
    console.log("ts-node supply.ts " + erc20Tokens.join("|") + "] <amount> [" + cTokens.join("|") + "]");
    process.exit(1);
}
var token = process.argv[2];
var ctoken = process.argv[4];
var amount = process.argv[3];
var tokenAddress = legos.erc20[token].address;
var cTokenEquilavent = legos.compound[ctoken].address;
var dacProxyFactoryContract = new ethers_1.ethers.Contract(DeployedAddresses_json_1.dacProxyFactoryAddress, DACProxyFactory_json_1.default.abi, common_1.wallet);
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var dacProxyAddress, cTokensToEnter, dacProxyContract, amountWei;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Supplying....");
                return [4 /*yield*/, dacProxyFactoryContract.proxies(common_1.wallet.address)];
            case 1:
                dacProxyAddress = _a.sent();
                if (!(dacProxyAddress === "0x0000000000000000000000000000000000000000")) return [3 /*break*/, 4];
                cTokensToEnter = [
                    legos.compound.cEther.address,
                    legos.compound.cSAI.address,
                    legos.compound.cDAI.address,
                    legos.compound.cREP.address,
                    legos.compound.cUSDC.address,
                    legos.compound.cBAT.address,
                    legos.compound.cZRX.address,
                    legos.compound.cWBTC.address,
                ];
                console.log("Creating proxy address and entering market....");
                return [4 /*yield*/, helpers_1.dedgeHelpers.proxyFactory.buildAndEnterMarkets(dacProxyFactoryContract, DeployedAddresses_json_1.dedgeCompoundManagerAddress, cTokensToEnter)];
            case 2:
                _a.sent();
                return [4 /*yield*/, dacProxyFactoryContract.proxies(common_1.wallet.address)];
            case 3:
                dacProxyAddress = _a.sent();
                _a.label = 4;
            case 4:
                dacProxyContract = new ethers_1.ethers.Contract(dacProxyAddress, DACProxy_json_1.default.abi, common_1.wallet);
                console.log("Getting tokens from uniswap");
                return [4 /*yield*/, common_1.getTokenFromUniswapAndApproveProxyTransfer(dacProxyAddress, tokenAddress, 1)];
            case 5:
                _a.sent();
                amountWei = ethers_1.ethers.utils.parseUnits(amount, token === "usdc" ? 6 : 18);
                console.log("Approving erc20 transferFrom....");
                return [4 /*yield*/, common_1.newERC20Contract(tokenAddress).approve(dacProxyAddress, amountWei.toString(), {
                        gasLimit: 4000000,
                    })];
            case 6:
                _a.sent();
                console.log("supplying...");
                return [4 /*yield*/, helpers_1.dedgeHelpers.compound.supplyThroughProxy(dacProxyContract, DeployedAddresses_json_1.dedgeCompoundManagerAddress, cTokenEquilavent, amountWei.toString())];
            case 7:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
main();
