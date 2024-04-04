"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai = __importStar(require("chai"));
require("../custom-matchers");
const src_1 = require("../../src");
const ethers_1 = require("ethers");
const { expect } = chai;
describe('getPaymasterParams()', () => {
    it('should return encoded parameters for the general paymaster', async () => {
        const params = {
            paymaster: '0x0a67078A35745947A37A552174aFe724D8180c25',
            paymasterInput: '0x8c5a344500000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000',
        };
        const result = src_1.utils.getPaymasterParams('0x0a67078A35745947A37A552174aFe724D8180c25', {
            type: 'General',
            innerInput: new Uint8Array(),
        });
        expect(result).to.be.deep.equal(params);
    });
    it('should return encoded parameters for the general paymaster', async () => {
        const params = {
            paymaster: '0x0a67078A35745947A37A552174aFe724D8180c25',
            paymasterInput: '0x949431dc00000000000000000000000065c899b5fb8eb9ae4da51d67e1fc417c7cb7e964000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000',
        };
        const result = src_1.utils.getPaymasterParams('0x0a67078A35745947A37A552174aFe724D8180c25', {
            type: 'ApprovalBased',
            token: '0x65C899B5fb8Eb9ae4da51D67E1fc417c7CB7e964',
            minimalAllowance: ethers_1.BigNumber.from(1),
            innerInput: new Uint8Array(),
        });
        expect(result).to.be.deep.equal(params);
    });
});
//# sourceMappingURL=paymaster.test.js.map