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
describe('EIP712Signer', () => {
    const ADDRESS = '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049';
    const RECEIVER = '0xa61464658AfeAf65CccaaFD3a512b69A83B77618';
    describe('#getSignInput()', () => {
        it('should return a populated transaction', async () => {
            const tx = {
                txType: src_1.utils.EIP712_TX_TYPE,
                from: ADDRESS,
                to: RECEIVER,
                gasLimit: ethers_1.BigNumber.from(21000),
                gasPerPubdataByteLimit: src_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                maxFeePerGas: ethers_1.BigNumber.from(250000000),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(250000000),
                paymaster: ethers_1.ethers.constants.AddressZero,
                nonce: 0,
                value: ethers_1.BigNumber.from(7000000),
                data: '0x',
                factoryDeps: [],
                paymasterInput: '0x',
            };
            const result = src_1.EIP712Signer.getSignInput({
                type: src_1.utils.EIP712_TX_TYPE,
                to: RECEIVER,
                value: ethers_1.BigNumber.from(7000000),
                from: ADDRESS,
                nonce: 0,
                chainId: 270,
                gasPrice: ethers_1.BigNumber.from(250000000),
                gasLimit: ethers_1.BigNumber.from(21000),
                customData: {},
            });
            expect(result).to.be.deep.equal(tx);
        });
        it('should return a populated transaction with default values', async () => {
            const tx = {
                txType: src_1.utils.EIP712_TX_TYPE,
                from: ADDRESS,
                to: RECEIVER,
                gasLimit: 0,
                gasPerPubdataByteLimit: src_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                maxFeePerGas: 0,
                maxPriorityFeePerGas: 0,
                paymaster: ethers_1.ethers.constants.AddressZero,
                nonce: 0,
                value: 0,
                data: '0x',
                factoryDeps: [],
                paymasterInput: '0x',
            };
            const result = src_1.EIP712Signer.getSignInput({
                type: src_1.utils.EIP712_TX_TYPE,
                to: RECEIVER,
                from: ADDRESS,
            });
            expect(result).to.be.deep.equal(tx);
        });
    });
    describe('#getSignedDigest()', () => {
        it('should throw an error when chain ID is not specified', async () => {
            try {
                src_1.EIP712Signer.getSignedDigest({});
            }
            catch (e) {
                expect(e.message).to.be.equal("Transaction chainId isn't set!");
            }
        });
    });
});
//# sourceMappingURL=signer.test.js.map