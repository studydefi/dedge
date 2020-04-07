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
var ethers_1 = require("ethers");
var index_1 = require("dedge-smart-contracts/helpers/index");
var common_1 = require("dedge-smart-contracts/test/common");
var DeployedAddresses_json_1 = require("dedge-smart-contracts/artifacts/DeployedAddresses.json");
var DACProxy_json_1 = __importDefault(require("dedge-smart-contracts/artifacts/DACProxy.json"));
var DACProxyFactory_json_1 = __importDefault(require("dedge-smart-contracts/artifacts/DACProxyFactory.json"));
var DedgeCompoundManager_json_1 = __importDefault(require("dedge-smart-contracts/artifacts/DedgeCompoundManager.json"));
var IDedgeCompoundManager = new ethers_1.ethers.utils.Interface(DedgeCompoundManager_json_1.default.abi);
// Builds DAC Proxy And enters the compound market
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var dacProxyFactoryContract, dacProxyContract, cTokensToEnter, dacProxyAddress, ethToSupply, daiToBorrow, supplyEthAndBorrowCalldata;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                dacProxyFactoryContract = new ethers_1.ethers.Contract(DeployedAddresses_json_1.dacProxyFactoryAddress, DACProxyFactory_json_1.default.abi, common_1.wallet);
                cTokensToEnter = [
                    common_1.legos.compound.cEther.address,
                    common_1.legos.compound.cSAI.address,
                    common_1.legos.compound.cDAI.address,
                    common_1.legos.compound.cREP.address,
                    common_1.legos.compound.cUSDC.address,
                    common_1.legos.compound.cBAT.address,
                    common_1.legos.compound.cZRX.address,
                    common_1.legos.compound.cWBTC.address,
                ];
                console.log("Address: " + common_1.wallet.address);
                console.log("Creating proxy address and entering market....");
                return [4 /*yield*/, index_1.dedgeHelpers.proxyFactory.buildAndEnterMarkets(dacProxyFactoryContract, DeployedAddresses_json_1.dedgeCompoundManagerAddress, cTokensToEnter)];
            case 1:
                _a.sent();
                return [4 /*yield*/, dacProxyFactoryContract.proxies(common_1.wallet.address)];
            case 2:
                dacProxyAddress = _a.sent();
                dacProxyContract = new ethers_1.ethers.Contract(dacProxyAddress, DACProxy_json_1.default.abi, common_1.wallet);
                console.log("Proxy: " + dacProxyAddress);
                ethToSupply = 10;
                daiToBorrow = 500;
                supplyEthAndBorrowCalldata = IDedgeCompoundManager.functions.supplyETHAndBorrow.encode([
                    common_1.legos.compound.cDAI.address,
                    ethers_1.ethers.utils.parseEther(daiToBorrow.toString()),
                ]);
                console.log("Supplying 10 ETH and drawing 500 DAI....");
                return [4 /*yield*/, common_1.tryAndWait(dacProxyContract.execute(DeployedAddresses_json_1.dedgeCompoundManagerAddress, supplyEthAndBorrowCalldata, {
                        gasLimit: 4000000,
                        value: ethers_1.ethers.utils.parseEther(ethToSupply.toString()),
                    }))];
            case 3:
                _a.sent();
                console.log("Complete");
                return [2 /*return*/];
        }
    });
}); };
main();
