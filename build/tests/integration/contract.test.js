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
describe('ContractFactory', () => {
    const PRIVATE_KEY = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110';
    const provider = src_1.Provider.getDefaultProvider(src_1.types.Network.Localhost);
    const wallet = new src_1.Wallet(PRIVATE_KEY, provider);
    const tokenPath = '../files/Token.json';
    const paymasterPath = '../files/Paymaster.json';
    const storagePath = '../files/Storage.json';
    const demoPath = '../files/Demo.json';
    const TOKENS_L1 = require('../tokens.json');
    const DAI_L1 = TOKENS_L1[0].address;
    describe('#constructor()', () => {
        it('`ContractFactory(abi, bytecode, runner)` should return a `ContractFactory` with `create` deployment', async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet);
            expect(factory.deploymentType).to.be.equal('create');
        });
        it("`ContractFactory(abi, bytecode, runner, 'createAccount')` should return a `ContractFactory` with `createAccount` deployment", async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet, 'createAccount');
            expect(factory.deploymentType).to.be.equal('createAccount');
        });
        it("`ContractFactory(abi, bytecode, runner, 'create2')` should return a `ContractFactory` with `create2` deployment", async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet, 'create2');
            expect(factory.deploymentType).to.be.equal('create2');
        });
        it("`ContractFactory(abi, bytecode, runner, 'create2Account')` should return a `ContractFactory` with `create2Account` deployment", async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet, 'create2Account');
            expect(factory.deploymentType).to.be.equal('create2Account');
        });
        it("`ContractFactory(abi, bytecode, runner, '')` should throw an error when invalid deployment type is specified", async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            try {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                new src_1.ContractFactory(abi, bytecode, wallet, 'null');
            }
            catch (e) {
                expect(e.message).to.be.equal('Unsupported deployment type null');
            }
        });
    });
    describe('#deploy()', () => {
        it('should deploy a contract without constructor using CREATE opcode', async () => {
            const abi = require(storagePath).contracts['Storage.sol:Storage'].abi;
            const bytecode = require(storagePath).contracts['Storage.sol:Storage'].bin;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet);
            const contract = await factory.deploy();
            const code = await provider.getCode(contract.address);
            expect(code).not.to.be.null;
        }).timeout(10000);
        it('should deploy a contract with a constructor using CREATE opcode', async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet);
            const contract = await factory.deploy('Ducat', 'Ducat', 18);
            const code = await provider.getCode(contract.address);
            expect(code).not.to.be.null;
        }).timeout(10000);
        it('should deploy a contract with dependencies using CREATE opcode', async () => {
            const abi = require(demoPath).contracts['Demo.sol:Demo'].abi;
            const bytecode = require(demoPath).contracts['Demo.sol:Demo'].bin;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet);
            const contract = (await factory.deploy({
                customData: {
                    factoryDeps: [require(demoPath).contracts['Foo.sol:Foo'].bin],
                },
            }));
            const code = await provider.getCode(contract.address);
            expect(code).not.to.be.null;
        }).timeout(10000);
        it('should deploy an account using CREATE opcode', async () => {
            const paymasterAbi = require(paymasterPath).abi;
            const paymasterBytecode = require(paymasterPath).bytecode;
            const accountFactory = new src_1.ContractFactory(paymasterAbi, paymasterBytecode, wallet, 'createAccount');
            const paymasterContract = await accountFactory.deploy(await provider.l2TokenAddress(DAI_L1));
            const code = await provider.getCode(paymasterContract.address);
            expect(code).not.to.be.null;
        }).timeout(10000);
        it('should deploy a contract without a constructor using CREATE2 opcode', async () => {
            const abi = require(storagePath).contracts['Storage.sol:Storage'].abi;
            const bytecode = require(storagePath).contracts['Storage.sol:Storage'].bin;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet, 'create2');
            const contract = await factory.deploy({
                customData: { salt: ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.randomBytes(32)) },
            });
            const code = await provider.getCode(contract.address);
            expect(code).not.to.be.null;
        }).timeout(10000);
        it('should deploy a contract with a constructor using CREATE2 opcode', async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet, 'create2');
            const contract = await factory.deploy('Ducat', 'Ducat', 18, {
                customData: { salt: ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.randomBytes(32)) },
            });
            const code = await provider.getCode(contract.address);
            const deploymentTx = contract.deployTransaction;
            expect(code).not.to.be.null;
            expect(deploymentTx).not.to.be.null;
        }).timeout(10000);
        it('should deploy a contract with dependencies using CREATE2 opcode', async () => {
            const abi = require(demoPath).contracts['Demo.sol:Demo'].abi;
            const bytecode = require(demoPath).contracts['Demo.sol:Demo'].bin;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet, 'create2');
            const contract = (await factory.deploy({
                customData: {
                    salt: ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.randomBytes(32)),
                    factoryDeps: [require(demoPath).contracts['Foo.sol:Foo'].bin],
                },
            }));
            const code = await provider.getCode(contract.address);
            expect(code).not.to.be.null;
        }).timeout(10000);
        it('should deploy an account using CREATE2 opcode', async () => {
            const paymasterAbi = require(paymasterPath).abi;
            const paymasterBytecode = require(paymasterPath).bytecode;
            const accountFactory = new src_1.ContractFactory(paymasterAbi, paymasterBytecode, wallet, 'create2Account');
            const paymasterContract = await accountFactory.deploy(await provider.l2TokenAddress(DAI_L1), { customData: { salt: ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.randomBytes(32)) } });
            const code = await provider.getCode(paymasterContract.address);
            expect(code).not.to.be.null;
        }).timeout(10000);
    });
    describe('getDeployTransaction()', () => {
        it('should return a deployment transaction', async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet);
            const result = factory.getDeployTransaction('Ducat', 'Ducat', 18);
            expect(result).not.to.be.null;
        }).timeout(10000);
        it('should throw an error when salt is not provided in CRATE2 deployment', async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet, 'create2');
            try {
                factory.getDeployTransaction('Ducat', 'Ducat', 18);
            }
            catch (e) {
                expect(e.message).to.be.equal('Salt is required for CREATE2 deployment!');
            }
        }).timeout(10000);
        it('should throw an error when salt is not provided in hexadecimal format in CRATE2 deployment', async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet, 'create2');
            try {
                factory.getDeployTransaction('Ducat', 'Ducat', 18, {
                    customData: { salt: '0000' },
                });
            }
            catch (e) {
                expect(e.message).to.be.equal('Invalid salt provided!');
            }
        }).timeout(10000);
        it('should throw an error when invalid salt length is provided in CRATE2 deployment', async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet, 'create2');
            try {
                factory.getDeployTransaction('Ducat', 'Ducat', 18, {
                    customData: { salt: '0x000' },
                });
            }
            catch (e) {
                expect(e.message).to.be.equal('Invalid salt provided!');
            }
        }).timeout(10000);
        it('should throw an error when invalid factory deps are provided in CRATE2 deployment', async () => {
            const abi = require(tokenPath).abi;
            const bytecode = require(tokenPath).bytecode;
            const factory = new src_1.ContractFactory(abi, bytecode, wallet, 'create2');
            try {
                factory.getDeployTransaction('Ducat', 'Ducat', 18, {
                    customData: {
                        salt: ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.randomBytes(32)),
                        factoryDeps: '0',
                    },
                });
            }
            catch (e) {
                expect(e.message).to.be.equal("Invalid 'factoryDeps' format! It should be an array of bytecodes.");
            }
            try {
                factory.getDeployTransaction('Ducat', 'Ducat', 18, {
                    customData: {
                        salt: ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.randomBytes(32)),
                        factoryDeps: '',
                    },
                });
            }
            catch (e) {
                expect(e.message).to.be.equal("Invalid 'factoryDeps' format! It should be an array of bytecodes.");
            }
        }).timeout(10000);
    });
});
//# sourceMappingURL=contract.test.js.map