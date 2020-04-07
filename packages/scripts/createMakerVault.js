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
var ethers_1 = require("ethers");
var money_legos_1 = require("money-legos");
var common_1 = require("dedge-smart-contracts/test/common");
var helpers_1 = require("dedge-smart-contracts/helpers");
if (process.argv.length !== 4) {
    console.log("ts-node createMakerVault.ts <owner-address> [ETH|BAT|USDC]");
    process.exit(1);
}
if (!["USDC", "BAT", "ETH"].includes(process.argv[3])) {
    console.log("ts-node createMakerVault.ts <owner-address> [ETH|BAT|USDC]");
    process.exit(1);
}
var legos = money_legos_1.getLegos(money_legos_1.networkIds.mainnet);
var vaultOwner = process.argv[2];
var vaultType = process.argv[3];
var getIlkDataFromArgs = function () {
    if (vaultType === "ETH") {
        return {
            ilk: legos.maker.ilks.ethA.symbol,
            join: legos.maker.ilks.ethA.join.address,
            erc20: null,
            amount: 1,
            decimal: 18
        };
    }
    else if (vaultType === "BAT") {
        return {
            ilk: legos.maker.ilks.batA.symbol,
            join: legos.maker.ilks.batA.join.address,
            erc20: legos.erc20.bat.address,
            amount: 300,
            decimal: 18
        };
    }
    else if (vaultType === "USDC") {
        return {
            ilk: legos.maker.ilks.usdcA.symbol,
            join: legos.maker.ilks.usdcA.join.address,
            erc20: legos.erc20.usdc.address,
            amount: 90,
            decimal: 6
        };
    }
    console.log("ts-node createMakerVault.ts <owner-address> [ETH|BAT|USDC]");
    process.exit(1);
};
var IDssProxyActions = new ethers_1.ethers.utils.Interface(legos.maker.dssProxyActions.abi);
var makerProxyRegistryContract = new ethers_1.ethers.Contract(legos.maker.proxyRegistry.address, legos.maker.proxyRegistry.abi, common_1.wallet);
var makerDssCdpManagerContract = new ethers_1.ethers.Contract(legos.maker.dssCdpManager.address, legos.maker.dssCdpManager.abi, common_1.wallet);
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var dsProxyAddress, makerDsProxyContract, dsProxyAddressVaultOwner, _a, ilk, join, erc20, amount, decimal, cdpId, giveCdpToProxyCalldata, vaultOwnerCdpIds;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                // If user doesn't have a maker ds proxy, make one
                console.log("Checking for ds-proxy for user");
                return [4 /*yield*/, makerProxyRegistryContract.proxies(common_1.wallet.address)];
            case 1:
                dsProxyAddress = _b.sent();
                if (!(dsProxyAddress === "0x0000000000000000000000000000000000000000")) return [3 /*break*/, 4];
                return [4 /*yield*/, makerProxyRegistryContract.build({ gasLimit: 4000000 })];
            case 2:
                _b.sent();
                return [4 /*yield*/, makerProxyRegistryContract.proxies(common_1.wallet.address)];
            case 3:
                dsProxyAddress = _b.sent();
                _b.label = 4;
            case 4:
                makerDsProxyContract = new ethers_1.ethers.Contract(dsProxyAddress, legos.dappsys.dsProxy.abi, common_1.wallet);
                return [4 /*yield*/, makerProxyRegistryContract.proxies(vaultOwner)];
            case 5:
                dsProxyAddressVaultOwner = _b.sent();
                if (!(dsProxyAddressVaultOwner === "0x0000000000000000000000000000000000000000")) return [3 /*break*/, 8];
                return [4 /*yield*/, makerProxyRegistryContract["build(address)"](vaultOwner, { gasLimit: 4000000 })];
            case 6:
                _b.sent();
                return [4 /*yield*/, makerProxyRegistryContract.proxies(vaultOwner)];
            case 7:
                dsProxyAddressVaultOwner = _b.sent();
                _b.label = 8;
            case 8:
                console.log("DSProxy for " + vaultOwner + " is " + dsProxyAddressVaultOwner);
                _a = getIlkDataFromArgs(), ilk = _a.ilk, join = _a.join, erc20 = _a.erc20, amount = _a.amount, decimal = _a.decimal;
                if (!(erc20 !== null)) return [3 /*break*/, 10];
                return [4 /*yield*/, common_1.getTokenFromUniswapAndApproveProxyTransfer(makerDsProxyContract.address, erc20, 1, common_1.wallet)];
            case 9:
                _b.sent();
                _b.label = 10;
            case 10:
                console.log("Opening " + vaultType + " vault");
                return [4 /*yield*/, common_1.openVault(makerDsProxyContract, ilk, join, amount, decimal)];
            case 11:
                _b.sent();
                return [4 /*yield*/, makerDssCdpManagerContract.last(makerDsProxyContract.address)];
            case 12:
                cdpId = _b.sent();
                console.log("Opened CDP, ID: " + cdpId.toString());
                console.log("Giving CDP to address: " + dsProxyAddressVaultOwner + " (Proxy of " + vaultOwner + ")");
                giveCdpToProxyCalldata = IDssProxyActions
                    .functions
                    .give
                    .encode([
                    makerDssCdpManagerContract.address,
                    cdpId.toString(),
                    dsProxyAddressVaultOwner
                ]);
                return [4 /*yield*/, makerDsProxyContract.execute(legos.maker.dssProxyActions.address, giveCdpToProxyCalldata, {
                        gasLimit: 4000000
                    })];
            case 13:
                _b.sent();
                return [4 /*yield*/, helpers_1.dedgeHelpers.maker.getVaultIds(dsProxyAddressVaultOwner, makerDssCdpManagerContract)];
            case 14:
                vaultOwnerCdpIds = _b.sent();
                console.log("CdpIds found for proxy " + dsProxyAddressVaultOwner + ":");
                console.log(vaultOwnerCdpIds);
                return [2 /*return*/];
        }
    });
}); };
main();
