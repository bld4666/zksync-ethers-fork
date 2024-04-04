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
describe('Paymaster', () => {
    const PRIVATE_KEY = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
    const provider = src_1.Provider.getDefaultProvider(src_1.types.Network.Localhost);
    const wallet = new src_1.Wallet(PRIVATE_KEY, provider);
    const tokenPath = '../files/Token.json';
    const paymasterPath = '../files/Paymaster.json';
    describe('#ApprovalBased', () => {
        it('use ERC20 token to pay transaction fee', async () => {
            const INIT_MINT_AMOUNT = 10;
            const MINT_AMOUNT = 3;
            const MINIMAL_ALLOWANCE = 1;
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet);
            const tokenContract = (await factory.deploy('Ducat', 'Ducat', 18));
            const tokenAddress = tokenContract.address;
            // mint tokens to wallet, so it could pay fee with tokens
            await tokenContract.mint(await wallet.getAddress(), INIT_MINT_AMOUNT);
            const paymasterAbi = require(paymasterPath).abi;
            const paymasterBytecode = require(paymasterPath).bytecode;
            const accountFactory = new src_1.ContractFactory(paymasterAbi, paymasterBytecode, wallet, 'createAccount');
            const paymasterContract = await accountFactory.deploy(tokenAddress);
            const paymasterAddress = paymasterContract.address;
            // transfer ETH to paymaster so it could pay fee
            const faucetTx = await wallet.transfer({
                token: src_1.utils.ETH_ADDRESS,
                to: paymasterAddress,
                amount: ethers_1.ethers.utils.parseEther('0.01'),
            });
            await faucetTx.wait();
            const paymasterBalanceBeforeTx = await provider.getBalance(paymasterAddress);
            const paymasterTokenBalanceBeforeTx = await provider.getBalance(paymasterAddress, 'latest', tokenAddress);
            const walletBalanceBeforeTx = await wallet.getBalance();
            const walletTokenBalanceBeforeTx = await wallet.getBalance(tokenAddress);
            // perform tx using paymaster
            const tokenAbi = new ethers_1.ethers.utils.Interface(require(tokenPath).abi);
            const tx = await wallet.sendTransaction({
                to: tokenAddress,
                data: tokenAbi.encodeFunctionData('mint', [
                    await wallet.getAddress(),
                    MINT_AMOUNT,
                ]),
                customData: {
                    gasPerPubdata: src_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    paymasterParams: src_1.utils.getPaymasterParams(paymasterAddress, {
                        type: 'ApprovalBased',
                        token: tokenAddress,
                        minimalAllowance: ethers_1.BigNumber.from(MINIMAL_ALLOWANCE),
                        innerInput: new Uint8Array(),
                    }),
                },
            });
            await tx.wait();
            const paymasterBalanceAfterTx = await provider.getBalance(paymasterAddress);
            const paymasterTokenBalanceAfterTx = await provider.getBalance(paymasterAddress, 'latest', tokenAddress);
            const walletBalanceAfterTx = await wallet.getBalance();
            const walletTokenBalanceAfterTx = await wallet.getBalance(tokenAddress);
            expect(paymasterTokenBalanceBeforeTx.isZero()).to.be.true;
            expect(walletTokenBalanceBeforeTx.eq(ethers_1.BigNumber.from(INIT_MINT_AMOUNT))).to
                .be.true;
            expect(paymasterBalanceBeforeTx
                .sub(paymasterBalanceAfterTx)
                .gte(ethers_1.BigNumber.from(0))).to.be.true;
            expect(paymasterTokenBalanceAfterTx.eq(ethers_1.BigNumber.from(MINIMAL_ALLOWANCE)))
                .to.be.true;
            expect(walletBalanceBeforeTx.sub(walletBalanceAfterTx).gte(ethers_1.BigNumber.from(0))).to.be.true;
            expect(walletTokenBalanceAfterTx.eq(walletTokenBalanceBeforeTx
                .sub(ethers_1.BigNumber.from(MINIMAL_ALLOWANCE))
                .add(ethers_1.BigNumber.from(MINT_AMOUNT)))).to.be.true;
        }).timeout(30000);
    });
});
//# sourceMappingURL=paymaster.test.js.map