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
describe('utils', () => {
    const ADDRESS = '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049';
    const PRIVATE_KEY = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
    const provider = src_1.Provider.getDefaultProvider(src_1.types.Network.Localhost);
    describe('#isMessageSignatureCorrect()', () => {
        it('should return true for a valid message signature', async () => {
            const message = 'Hello, world!';
            const signature = await new ethers_1.ethers.Wallet(PRIVATE_KEY).signMessage(message);
            const result = await src_1.utils.isMessageSignatureCorrect(provider, ADDRESS, message, signature);
            expect(result).to.be.true;
        });
        it('should return false for an invalid message signature', async () => {
            const message = 'Hello!';
            const invalidSignature = '0xb04f825363596418c630425916f73447d636094a75e47b45e2eb59d8a6c7d5035355f03b903b84700376f0efa23f3b095815776c5c6daf2b371a0a61b5f703451b';
            const result = await src_1.utils.isMessageSignatureCorrect(provider, ADDRESS, message, invalidSignature);
            expect(result).to.be.false;
        });
    });
    describe('#isTypedDataSignatureCorrect()', () => {
        it('should return true for a valid typed data signature', async () => {
            const tx = {
                type: 113,
                chainId: 270,
                from: ADDRESS,
                to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
                value: ethers_1.BigNumber.from(7000000),
            };
            const eip712Signer = new src_1.EIP712Signer(new ethers_1.ethers.Wallet(PRIVATE_KEY), Number((await provider.getNetwork()).chainId));
            const signature = await eip712Signer.sign(tx);
            const result = await src_1.utils.isTypedDataSignatureCorrect(provider, ADDRESS, await eip712Signer.getDomain(), src_1.utils.EIP712_TYPES, src_1.EIP712Signer.getSignInput(tx), signature);
            expect(result).to.be.true;
        });
        it('should return false for an invalid typed data signature', async () => {
            const invalidSignature = '0x5ea12f3d54a1624d7e7f5161dbf6ab746c3335e643b2966264e740cf8e10e9b64b0251fb79d9a5b11730387085a0d58f105926f72e20242ecb274639991939ca1b';
            const tx = {
                type: 113,
                chainId: 270,
                from: ADDRESS,
                to: '0xa61464658AfeAf65CccaaFD3a512b69A83B77618',
                value: ethers_1.BigNumber.from(1000000),
            };
            const eip712Signer = new src_1.EIP712Signer(new ethers_1.ethers.Wallet(PRIVATE_KEY), Number((await provider.getNetwork()).chainId));
            const result = await src_1.utils.isTypedDataSignatureCorrect(provider, ADDRESS, await eip712Signer.getDomain(), src_1.utils.EIP712_TYPES, src_1.EIP712Signer.getSignInput(tx), invalidSignature);
            expect(result).to.be.false;
        });
    });
});
//# sourceMappingURL=utils.test.js.map