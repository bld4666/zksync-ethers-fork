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
describe('L2VoidSigner', () => {
    const ADDRESS = '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049';
    const RECEIVER = '0xa61464658AfeAf65CccaaFD3a512b69A83B77618';
    const provider = src_1.Provider.getDefaultProvider();
    const signer = new src_1.L2VoidSigner(ADDRESS, provider);
    describe('#constructor()', () => {
        it('`L2VoidSigner(address, provider)` should return a `L2VoidSigner` with L2 provider', async () => {
            const signer = new src_1.L2VoidSigner(ADDRESS, provider);
            expect(signer.address).to.be.equal(ADDRESS);
            expect(signer.provider).to.be.equal(provider);
        });
        it('`L2VoidSigner(address)` should return a `L2VoidSigner` without L2 provider', async () => {
            const signer = new src_1.L2VoidSigner(ADDRESS);
            expect(signer.address).to.be.equal(ADDRESS);
            expect(signer.provider).to.be.null;
        });
    });
    describe('#getBalance()', () => {
        it('should return the `L2VoidSigner` balance', async () => {
            const result = await signer.getBalance();
            expect(result.gt(0)).to.be.true;
        });
    });
    describe('#getAllBalances()', () => {
        it('should return all balances', async () => {
            const result = await signer.getAllBalances();
            expect(Object.keys(result)).to.have.lengthOf(2);
        });
    });
    describe('#getL2BridgeContracts()', () => {
        it('should return a L2 bridge contracts', async () => {
            const result = await signer.getL2BridgeContracts();
            expect(result).not.to.be.null;
        });
    });
    describe('#getAddress()', () => {
        it('should return a `L2VoidSigner` address', async () => {
            const result = await signer.getAddress();
            expect(result).to.be.equal(ADDRESS);
        });
    });
    describe('#connect()', () => {
        it('should return a `L2VoidSigner` with provided `provider` as L2 provider', async () => {
            let signer = new src_1.L2VoidSigner(ADDRESS);
            signer = signer.connect(provider);
            expect(signer.address).to.be.equal(ADDRESS);
            expect(signer.provider).to.be.equal(provider);
        });
    });
    describe('#getDeploymentNonce()', () => {
        it('should return a deployment nonce', async () => {
            const result = await signer.getDeploymentNonce();
            expect(result).not.to.be.null;
        });
    });
    describe('#populateTransaction()', () => {
        it('should return populated transaction with default values if are omitted', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 2,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                chainId: 270,
                maxFeePerGas: ethers_1.BigNumber.from(2000000000),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(1500000000),
            };
            const result = await signer.populateTransaction({
                to: RECEIVER,
                value: 7000000,
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
        it('should return populated transaction when `maxFeePerGas` and `maxPriorityFeePerGas` and `customData` are provided', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 113,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                data: '0x',
                chainId: 270,
                maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
                customData: {
                    gasPerPubdata: src_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    factoryDeps: [],
                },
            };
            const result = await signer.populateTransaction({
                to: RECEIVER,
                value: 7000000,
                maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
                customData: {
                    gasPerPubdata: src_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    factoryDeps: [],
                },
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
        it('should return populated transaction when `maxPriorityFeePerGas` and `customData` are provided', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 113,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                data: '0x',
                chainId: 270,
                maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
                customData: {
                    gasPerPubdata: src_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    factoryDeps: [],
                },
            };
            const result = await signer.populateTransaction({
                to: RECEIVER,
                value: 7000000,
                maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
                customData: {
                    gasPerPubdata: src_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                },
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
        it('should return populated transaction when `maxFeePerGas` and `customData` are provided', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 113,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                data: '0x',
                chainId: 270,
                maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                customData: {
                    gasPerPubdata: src_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                    factoryDeps: [],
                },
            };
            const result = await signer.populateTransaction({
                to: RECEIVER,
                value: 7000000,
                maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                customData: {
                    gasPerPubdata: src_1.utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
                },
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
        it('should return populated EIP1559 transaction when `maxFeePerGas` and `maxPriorityFeePerGas` are provided', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 2,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                chainId: 270,
                maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
            };
            const result = await signer.populateTransaction({
                to: RECEIVER,
                value: 7000000,
                maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
        it('should return populated EIP1559 transaction with `maxFeePerGas` and `maxPriorityFeePerGas` same as provided `gasPrice`', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 2,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                chainId: 270,
                maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(3500000000),
            };
            const result = await signer.populateTransaction({
                to: RECEIVER,
                value: 7000000,
                gasPrice: ethers_1.BigNumber.from(3500000000),
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
        it('should return populated legacy transaction when `type = 0`', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 0,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                chainId: 270,
                gasPrice: ethers_1.BigNumber.from(250000000),
            };
            const result = await signer.populateTransaction({
                type: 0,
                to: RECEIVER,
                value: 7000000,
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
    });
    describe('#sendTransaction()', () => {
        it('should throw an error when trying to send transaction', async () => {
            try {
                await signer.sendTransaction({
                    to: RECEIVER,
                    value: 7000000,
                    maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                    maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
                });
            }
            catch (e) {
                expect(e.message).to.contain('VoidSigner cannot sign transactions');
            }
        }).timeout(10000);
    });
    describe('#withdraw()', () => {
        it('should throw an error when tyring to withdraw assets', async () => {
            try {
                await signer.withdraw({
                    token: src_1.utils.ETH_ADDRESS,
                    to: await signer.getAddress(),
                    amount: 7000000000,
                });
            }
            catch (e) {
                expect(e.message).to.contain('VoidSigner cannot sign transactions');
            }
        }).timeout(25000);
    });
    describe('#transfer()', () => {
        it('should throw an error when tyring to transfer assets', async () => {
            try {
                await signer.transfer({
                    token: src_1.utils.ETH_ADDRESS,
                    to: RECEIVER,
                    amount: 7000000000,
                });
            }
            catch (e) {
                expect(e.message).to.contain('VoidSigner cannot sign transactions');
            }
        }).timeout(25000);
    });
    describe('#signTransaction()', () => {
        it('should throw an error when trying to sign transaction', async () => {
            try {
                await signer.signTransaction({
                    type: 2,
                    to: RECEIVER,
                    value: ethers_1.BigNumber.from(7000000000),
                });
            }
            catch (e) {
                expect(e.message).to.contain('VoidSigner cannot sign transactions');
            }
        }).timeout(25000);
    });
});
describe('L1VoidSigner', () => {
    const ADDRESS = '0x36615Cf349d7F6344891B1e7CA7C72883F5dc049';
    const RECEIVER = '0xa61464658AfeAf65CccaaFD3a512b69A83B77618';
    const provider = src_1.Provider.getDefaultProvider();
    const ethProvider = ethers_1.ethers.getDefaultProvider('http://localhost:8545');
    const signer = new src_1.L1VoidSigner(ADDRESS, ethProvider, provider);
    const TOKENS_L1 = require('../tokens.json');
    const DAI_L1 = TOKENS_L1[0].address;
    describe('#constructor()', () => {
        it('`L1VoidSigner(privateKey, providerL1, providerL2)` should return a `L1VoidSigner` with L1 and L2 provider', async () => {
            const signer = new src_1.L1VoidSigner(ADDRESS, ethProvider, provider);
            expect(signer.address).to.be.equal(ADDRESS);
            expect(signer.provider).to.be.equal(ethProvider);
            expect(signer.providerL2).to.be.equal(provider);
        });
        it('`L1VoidSigner(privateKey, providerL1)` should return a `L1VoidSigner` with L1 provider', async () => {
            const signer = new src_1.L1VoidSigner(ADDRESS, ethProvider);
            expect(signer.address).to.be.equal(ADDRESS);
            expect(signer.provider).to.be.equal(ethProvider);
            expect(signer.providerL2).to.be.undefined;
        });
        it('`L1VoidSigner(privateKey)` should return a `L1VoidSigner` without providers', async () => {
            const signer = new src_1.L1VoidSigner(ADDRESS);
            expect(signer.address).to.be.equal(ADDRESS);
            expect(signer.provider).to.be.null;
            expect(signer.providerL2).to.be.undefined;
        });
    });
    describe('#getMainContract()', () => {
        it('should return the main contract', async () => {
            const result = await signer.getMainContract();
            expect(result).not.to.be.null;
        });
    });
    describe('#getL1BridgeContracts()', () => {
        it('should return a L1 bridge contracts', async () => {
            const result = await signer.getL1BridgeContracts();
            expect(result).not.to.be.null;
        });
    });
    describe('#getBalanceL1()', () => {
        it('should return a L1 balance', async () => {
            const result = await signer.getBalanceL1();
            expect(result.gt(0)).to.be.true;
        });
    });
    describe('#getAllowanceL1()', () => {
        it('should return allowance of L1 token', async () => {
            const result = await signer.getAllowanceL1(DAI_L1);
            expect(result.gte(0)).to.be.true;
        });
    });
    describe('#l2TokenAddress()', () => {
        it('should return the L2 ETH address', async () => {
            const result = await signer.l2TokenAddress(src_1.utils.ETH_ADDRESS);
            expect(result).to.be.equal(src_1.utils.ETH_ADDRESS);
        });
        it('should return the L2 DAI address', async () => {
            const result = await signer.l2TokenAddress(DAI_L1);
            expect(result).not.to.be.null;
        });
    });
    describe('#approveERC20()', () => {
        it('should throw an error when approving token', async () => {
            try {
                await signer.approveERC20(src_1.utils.ETH_ADDRESS, 5);
            }
            catch (e) {
                expect(e.message).to.be.equal("ETH token can't be approved! The address of the token does not exist on L1.");
            }
        }).timeout(10000);
    });
    describe('#getBaseCost()', () => {
        it('should return base cost of L1 transaction', async () => {
            const result = await signer.getBaseCost({ gasLimit: 100000 });
            expect(result).not.to.be.null;
        });
    });
    describe('#getBalance()', () => {
        it('should return the `L1VoidSigner` balance', async () => {
            const result = await signer.getBalance();
            expect(result.gt(0)).to.be.true;
        });
    });
    describe('#getAddress()', () => {
        it('should return a `Wallet` address', async () => {
            const result = await signer.getAddress();
            expect(result).to.be.equal(ADDRESS);
        });
    });
    describe('#connect()', () => {
        it('should return a `L1VoidSigner` with provided `provider` as L1 provider', async () => {
            let singer = new src_1.L1VoidSigner(ADDRESS);
            singer = singer.connect(ethProvider);
            expect(singer.address).to.be.equal(ADDRESS);
            expect(singer.provider).to.be.equal(ethProvider);
        });
    });
    describe('#connectL2()', () => {
        it('should return a `L1VoidSigner` with provided `provider` as L2 provider', async () => {
            let singer = new src_1.L1VoidSigner(ADDRESS);
            singer = singer.connectToL2(provider);
            expect(singer.address).to.be.equal(ADDRESS);
            expect(singer.providerL2).to.be.equal(provider);
        });
    });
    describe('#populateTransaction()', () => {
        it('should return populated transaction with default values if are omitted', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 2,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                chainId: 9,
                maxFeePerGas: ethers_1.BigNumber.from(1500000014),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(1500000000),
            };
            const result = await signer.populateTransaction({
                to: RECEIVER,
                value: 7000000,
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
        it('should return populated EIP1559 transaction when `maxFeePerGas` and `maxPriorityFeePerGas` are provided', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 2,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                chainId: 9,
                maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
            };
            const result = await signer.populateTransaction({
                to: RECEIVER,
                value: 7000000,
                maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
        it('should return populated EIP1559 transaction with `maxFeePerGas` and `maxPriorityFeePerGas` same as provided `gasPrice`', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 2,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                chainId: 9,
                maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(3500000000),
            };
            const result = await signer.populateTransaction({
                to: RECEIVER,
                value: 7000000,
                gasPrice: ethers_1.BigNumber.from(3500000000),
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
        it('should return populated legacy transaction when `type = 0`', async () => {
            const tx = {
                to: RECEIVER,
                value: 7000000,
                type: 0,
                from: ADDRESS,
                nonce: await signer.getNonce('pending'),
                chainId: 9,
                gasPrice: ethers_1.BigNumber.from(1500000007),
            };
            const result = await signer.populateTransaction({
                type: 0,
                to: RECEIVER,
                value: 7000000,
            });
            expect(result).to.be.deepEqualExcluding(tx, ['gasLimit']);
        });
    });
    describe('#sendTransaction()', () => {
        it('should throw an error when trying to send transaction', async () => {
            try {
                await signer.sendTransaction({
                    to: RECEIVER,
                    value: 7000000,
                    maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                    maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
                });
            }
            catch (e) {
                expect(e.message).to.contain('VoidSigner cannot sign transactions');
            }
        }).timeout(10000);
    });
    describe('#getDepositTx()', () => {
        it('should return ETH deposit transaction', async () => {
            const tx = {
                contractAddress: ADDRESS,
                calldata: '0x',
                l2Value: 7000000,
                l2GasLimit: ethers_1.BigNumber.from('0x08cbaa'),
                token: '0x0000000000000000000000000000000000000000',
                to: ADDRESS,
                amount: 7000000,
                refundRecipient: ADDRESS,
                operatorTip: ethers_1.BigNumber.from(0),
                overrides: {
                    maxFeePerGas: ethers_1.BigNumber.from(1500000010),
                    maxPriorityFeePerGas: ethers_1.BigNumber.from(1500000000),
                    value: ethers_1.BigNumber.from(288213007000000),
                },
                gasPerPubdataByte: 800,
            };
            const result = await signer.getDepositTx({
                token: src_1.utils.ETH_ADDRESS,
                to: await signer.getAddress(),
                amount: 7000000,
                refundRecipient: await signer.getAddress(),
            });
            expect(result).to.be.deep.equal(tx);
        });
        it('should return a deposit transaction with `tx.to == Wallet.getAddress()` when `tx.to` is not specified', async () => {
            const tx = {
                contractAddress: ADDRESS,
                calldata: '0x',
                l2Value: 7000000,
                l2GasLimit: ethers_1.BigNumber.from('0x8cbaa'),
                token: '0x0000000000000000000000000000000000000000',
                to: ADDRESS,
                amount: 7000000,
                refundRecipient: ADDRESS,
                operatorTip: ethers_1.BigNumber.from(0),
                overrides: {
                    maxFeePerGas: ethers_1.BigNumber.from(1500000010),
                    maxPriorityFeePerGas: ethers_1.BigNumber.from(1500000000),
                    value: ethers_1.BigNumber.from(288213007000000),
                },
                gasPerPubdataByte: 800,
            };
            const result = await signer.getDepositTx({
                token: src_1.utils.ETH_ADDRESS,
                amount: 7000000,
                refundRecipient: await signer.getAddress(),
            });
            expect(result).to.be.deep.equal(tx);
        });
        it('should return DAI deposit transaction', async () => {
            const tx = {
                maxFeePerGas: ethers_1.BigNumber.from(1500000010),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(1500000000),
                value: ethers_1.BigNumber.from(288992000000000),
                from: ADDRESS,
                to: (await signer.getL1BridgeContracts()).erc20.address,
            };
            const result = await signer.getDepositTx({
                token: DAI_L1,
                to: await signer.getAddress(),
                amount: 5,
                refundRecipient: await signer.getAddress(),
            });
            result.to = result.to.toLowerCase();
            expect(result).to.be.deepEqualExcluding(tx, ['data']);
        });
    });
    describe('#estimateGasDeposit()', () => {
        it('should return gas estimation for ETH deposit transaction', async () => {
            const result = await signer.estimateGasDeposit({
                token: src_1.utils.ETH_ADDRESS,
                to: await signer.getAddress(),
                amount: 5,
                refundRecipient: await signer.getAddress(),
            });
            expect(result.eq(ethers_1.BigNumber.from(132711))).to.be.true;
        });
        it('should return gas estimation for DAI deposit transaction', async () => {
            const wallet = new src_1.Wallet('0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110', provider, ethProvider);
            const tx = await wallet.approveERC20(DAI_L1, 5);
            await tx.wait();
            const result = await signer.estimateGasDeposit({
                token: DAI_L1,
                to: await signer.getAddress(),
                amount: 5,
                refundRecipient: await signer.getAddress(),
            });
            expect(result.eq(ethers_1.BigNumber.from(253418))).to.be.true;
        }).timeout(10000);
    });
    describe('#deposit()', () => {
        it('should throw an error when trying to deposit assets', async () => {
            try {
                await signer.deposit({
                    token: src_1.utils.ETH_ADDRESS,
                    to: await signer.getAddress(),
                    amount: 7000000000,
                    refundRecipient: await signer.getAddress(),
                });
            }
            catch (e) {
                expect(e.message).to.contain('VoidSigner cannot sign transactions');
            }
        }).timeout(10000);
    });
    describe('#claimFailedDeposit()', () => {
        it('should throw an error when trying to claim successful deposit', async () => {
            try {
                const response = await signer.deposit({
                    token: src_1.utils.ETH_ADDRESS,
                    to: await signer.getAddress(),
                    amount: 7000000000,
                    refundRecipient: await signer.getAddress(),
                });
                const tx = await response.waitFinalize();
                await signer.claimFailedDeposit(tx.transactionHash);
            }
            catch (e) {
                expect(e.message).to.contain('VoidSigner cannot sign transactions');
            }
        }).timeout(30000);
    });
    describe('#getFullRequiredDepositFee()', () => {
        it('should return fee for ETH token deposit', async () => {
            const feeData = {
                baseCost: ethers_1.BigNumber.from(285096500000000),
                l1GasLimit: ethers_1.BigNumber.from(132711),
                l2GasLimit: ethers_1.BigNumber.from('0x08b351'),
                maxFeePerGas: ethers_1.BigNumber.from(1500000010),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(1500000000),
            };
            const result = await signer.getFullRequiredDepositFee({
                token: src_1.utils.ETH_ADDRESS,
                to: await signer.getAddress(),
            });
            expect(result).to.be.deep.equal(feeData);
        });
        it('should throw an error when there is not enough allowance to cover the deposit', async () => {
            try {
                await signer.getFullRequiredDepositFee({
                    token: DAI_L1,
                    to: await signer.getAddress(),
                });
            }
            catch (e) {
                expect(e.message).to.be.equal('Not enough allowance to cover the deposit!');
            }
        }).timeout(10000);
        it('should return fee for DAI token deposit', async () => {
            const feeData = {
                baseCost: ethers_1.BigNumber.from(288992000000000),
                l1GasLimit: ethers_1.BigNumber.from(253177),
                l2GasLimit: ethers_1.BigNumber.from('0x08d1c0'),
                maxFeePerGas: ethers_1.BigNumber.from(1500000010),
                maxPriorityFeePerGas: ethers_1.BigNumber.from(1500000000),
            };
            // const wallet = new Wallet(
            //   "0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110",
            //   provider,
            //   ethProvider
            // );
            // const tx = await wallet.approveERC20(DAI_L1, 5);
            // await tx.wait();
            const result = await signer.getFullRequiredDepositFee({
                token: DAI_L1,
                to: await signer.getAddress(),
            });
            expect(result).to.be.deep.equal(feeData);
        }).timeout(10000);
        it('should throw an error when there is not enough balance for the deposit', async () => {
            try {
                const randomSigner = new src_1.L1VoidSigner(ethers_1.ethers.Wallet.createRandom().address, ethProvider, provider);
                await randomSigner.getFullRequiredDepositFee({
                    token: DAI_L1,
                    to: await randomSigner.getAddress(),
                });
            }
            catch (e) {
                expect(e.message).to.include('Not enough balance for deposit!');
            }
        }).timeout(10000);
    });
    describe('#getRequestExecuteTx()', () => {
        it('should return request execute transaction', async () => {
            const result = await signer.getRequestExecuteTx({
                contractAddress: await provider.getMainContractAddress(),
                calldata: '0x',
                l2Value: 7000000000,
            });
            expect(result).not.to.be.null;
        });
    });
    describe('#estimateGasRequestExecute()', () => {
        it('should return gas estimation for request execute transaction', async () => {
            const result = await signer.estimateGasRequestExecute({
                contractAddress: await provider.getMainContractAddress(),
                calldata: '0x',
                l2Value: 7000000000,
            });
            expect(result.isZero()).to.be.false;
        });
    });
    describe('#requestExecute()', () => {
        it('should request transaction execution on L2 network', async () => {
            try {
                await signer.requestExecute({
                    contractAddress: await provider.getMainContractAddress(),
                    calldata: '0x',
                    l2Value: 7000000000,
                    l2GasLimit: 900000,
                });
            }
            catch (e) {
                expect(e.message).to.contain('VoidSigner cannot sign transactions');
            }
        }).timeout(10000);
    });
    describe('#signTransaction()', () => {
        it('should throw an error when trying to send transaction', async () => {
            try {
                await signer.sendTransaction({
                    to: RECEIVER,
                    value: 7000000,
                    maxFeePerGas: ethers_1.BigNumber.from(3500000000),
                    maxPriorityFeePerGas: ethers_1.BigNumber.from(2000000000),
                });
            }
            catch (e) {
                expect(e.message).to.contain('VoidSigner cannot sign transactions');
            }
        }).timeout(10000);
    });
});
//# sourceMappingURL=signer.test.js.map