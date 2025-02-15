"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const signer_1 = require("./signer");
const utils_1 = require("./utils");
const ethers_1 = require("ethers");
const adapters_1 = require("./adapters");
/**
 * A `Wallet` is an extension of {@link ethers.Wallet} with additional features for interacting with zkSync Era.
 * It facilitates bridging assets between different networks.
 * All transactions must originate from the address corresponding to the provided private key.
 */
class Wallet extends (0, adapters_1.AdapterL2)((0, adapters_1.AdapterL1)(ethers_1.ethers.Wallet)) {
    _providerL1() {
        if (!this.providerL1) {
            throw new Error('L1 provider missing: use `connectToL1` to specify!');
        }
        return this.providerL1;
    }
    _providerL2() {
        return this.provider;
    }
    _signerL1() {
        return this.ethWallet();
    }
    _signerL2() {
        return this;
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * console.log(`Main contract: ${await wallet.getMainContract()}`);
     */
    async getMainContract() {
        return super.getMainContract();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const l1BridgeContracts = await wallet.getL1BridgeContracts();
     */
    async getL1BridgeContracts() {
        return super.getL1BridgeContracts();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const tokenL1 = "0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be";
     *
     * console.log(`Token balance: ${await wallet.getBalanceL1(tokenL1)}`);
     */
    async getBalanceL1(token, blockTag) {
        return super.getBalanceL1(token, blockTag);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const tokenL1 = "0x5C221E77624690fff6dd741493D735a17716c26B";
     * console.log(`Token allowance: ${await wallet.getAllowanceL1(tokenL1)}`);
     */
    async getAllowanceL1(token, bridgeAddress, blockTag) {
        return super.getAllowanceL1(token, bridgeAddress, blockTag);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const tokenL1 = "0x5C221E77624690fff6dd741493D735a17716c26B";
     *
     * console.log(`Token L2 address: ${await wallet.l2TokenAddress(tokenL1)}`);
     */
    async l2TokenAddress(token) {
        return super.l2TokenAddress(token);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const tokenL1 = "0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be";
     * const txHandle = await wallet.approveERC20(tokenL1, "10000000");
     *
     * await txHandle.wait();
     */
    async approveERC20(token, amount, overrides) {
        return super.approveERC20(token, amount, overrides);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * console.log(`Base cost: ${await wallet.getBaseCost({ gasLimit: 100_000 })}`);
     */
    async getBaseCost(params) {
        return super.getBaseCost(params);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const tokenL1 = "0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be";
     * const tokenDepositHandle = await wallet.deposit({
     *   token: tokenL1,
     *   amount: "10000000",
     *   approveERC20: true,
     * });
     * // Note that we wait not only for the L1 transaction to complete but also for it to be
     * // processed by zkSync. If we want to wait only for the transaction to be processed on L1,
     * // we can use `await tokenDepositHandle.waitL1Commit()`
     * await tokenDepositHandle.wait();
     *
     * const ethDepositHandle = await wallet.deposit({
     *   token: utils.ETH_ADDRESS,
     *   amount: "10000000",
     * });
     * // Note that we wait not only for the L1 transaction to complete but also for it to be
     * // processed by zkSync. If we want to wait only for the transaction to be processed on L1,
     * // we can use `await ethDepositHandle.waitL1Commit()`
     * await ethDepositHandle.wait();
     */
    async deposit(transaction) {
        return super.deposit(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const tokenL1 = "0x5C221E77624690fff6dd741493D735a17716c26B";
     * const gas = await wallet.estimateGasDeposit({
     *   token: tokenL1,
     *   amount: "10000000",
     * });
     * console.log(`Gas: ${gas}`);
     */
    async estimateGasDeposit(transaction) {
        return super.estimateGasDeposit(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const tokenL1 = "0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be";
     * const tx = await wallet.getDepositTx({
     *   token: tokenL1,
     *   amount: "10000000",
     * });
     */
    async getDepositTx(transaction) {
        return super.getDepositTx(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const tokenL1 = "0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be";
     * const fee = await wallet.getFullRequiredDepositFee({
     *   token: tokenL1,
     *   to: await wallet.getAddress(),
     * });
     * console.log(`Fee: ${fee}`);
     */
    async getFullRequiredDepositFee(transaction) {
        return super.getFullRequiredDepositFee(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const WITHDRAWAL_HASH = "<WITHDRAWAL_TX_HASH>";
     * const params = await wallet.finalizeWithdrawalParams(WITHDRAWAL_HASH);
     */
    async finalizeWithdrawalParams(withdrawalHash, index = 0) {
        return super.finalizeWithdrawalParams(withdrawalHash, index);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const WITHDRAWAL_HASH = "<WITHDRAWAL_TX_HASH>";
     * const finalizeWithdrawHandle = await wallet.finalizeWithdrawal(WITHDRAWAL_HASH);
     */
    async finalizeWithdrawal(withdrawalHash, index = 0, overrides) {
        return super.finalizeWithdrawal(withdrawalHash, index, overrides);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const WITHDRAWAL_HASH = "<WITHDRAWAL_TX_HASH>";
     * const isFinalized = await wallet.isWithdrawalFinalized(WITHDRAWAL_HASH);
     */
    async isWithdrawalFinalized(withdrawalHash, index = 0) {
        return super.isWithdrawalFinalized(withdrawalHash, index);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const FAILED_DEPOSIT_HASH = "<FAILED_DEPOSIT_TX_HASH>";
     * const claimFailedDepositHandle = await wallet.claimFailedDeposit(FAILED_DEPOSIT_HASH);
     */
    async claimFailedDeposit(depositHash, overrides) {
        return super.claimFailedDeposit(depositHash, overrides);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     * const CONTRACT_ADDRESS = "<CONTRACT_ADDRESS>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const gasPrice = await wallet.providerL1.getGasPrice();
     *
     * // The calldata can be encoded the same way as for Ethereum.
     * // Here is an example of how to get the calldata from an ABI:
     * const abi = [
     *   {
     *     inputs: [],
     *     name: "increment",
     *     outputs: [],
     *     stateMutability: "nonpayable",
     *     type: "function",
     *   },
     * ];
     * const contractInterface = new ethers.utils.Interface(abi);
     * const calldata = contractInterface.encodeFunctionData("increment", []);
     * const l2GasLimit = 1000n;
     *
     * const txCostPrice = await wallet.getBaseCost({
     *   gasPrice,
     *   calldataLength: ethers.utils.arrayify(calldata).length,
     *   l2GasLimit,
     * });
     *
     * console.log(`Executing the transaction will cost ${ethers.utils.formatEther(txCostPrice)} ETH`);
     *
     * const executeTx = await wallet.requestExecute({
     *   contractAddress: CONTRACT_ADDRESS,
     *   calldata,
     *   l2Value: 1,
     *   l2GasLimit,
     *   overrides: {
     *     gasPrice,
     *     value: txCostPrice,
     *   },
     * });
     *
     * await executeTx.wait();
     */
    async requestExecute(transaction) {
        return super.requestExecute(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     * const CONTRACT_ADDRESS = "<CONTRACT_ADDRESS>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const gasPrice = await wallet.providerL1.getGasPrice();
     *
     * // The calldata can be encoded the same way as for Ethereum.
     * // Here is an example of how to get the calldata from an ABI:
     * const abi = [
     *   {
     *     inputs: [],
     *     name: "increment",
     *     outputs: [],
     *     stateMutability: "nonpayable",
     *     type: "function",
     *   },
     * ];
     * const contractInterface = new ethers.utils.Interface(abi);
     * const calldata = contractInterface.encodeFunctionData("increment", []);
     * const l2GasLimit = 1000n;
     *
     * const txCostPrice = await wallet.getBaseCost({
     *   gasPrice,
     *   calldataLength: ethers.utils.arrayify(calldata).length,
     *   l2GasLimit,
     * });
     *
     * console.log(`Executing the transaction will cost ${ethers.utils.formatEther(txCostPrice)} ETH`);
     *
     * const executeTx = await wallet.getRequestExecuteTx({
     *   contractAddress: CONTRACT_ADDRESS,
     *   calldata,
     *   l2Value: 1,
     *   l2GasLimit,
     *   overrides: {
     *     gasPrice,
     *     value: txCostPrice,
     *   },
     * });
     */
    async estimateGasRequestExecute(transaction) {
        return super.estimateGasRequestExecute(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     * const CONTRACT_ADDRESS = "<CONTRACT_ADDRESS>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const gasPrice = await wallet.providerL1.getGasPrice();
     *
     * // The calldata can be encoded the same way as for Ethereum.
     * // Here is an example of how to get the calldata from an ABI:
     * const abi = [
     *   {
     *     inputs: [],
     *     name: "increment",
     *     outputs: [],
     *     stateMutability: "nonpayable",
     *     type: "function",
     *   },
     * ];
     * const contractInterface = new ethers.utils.Interface(abi);
     * const calldata = contractInterface.encodeFunctionData("increment", []);
     * const l2GasLimit = 1000n;
     *
     * const txCostPrice = await wallet.getBaseCost({
     *   gasPrice,
     *   calldataLength: ethers.utils.arrayify(calldata).length,
     *   l2GasLimit,
     * });
     *
     * console.log(`Executing the transaction will cost ${ethers.utils.formatEther(txCostPrice)} ETH`);
     *
     * const executeTx = await wallet.getRequestExecuteTx({
     *   contractAddress: CONTRACT_ADDRESS,
     *   calldata,
     *   l2Value: 1,
     *   l2GasLimit,
     *   overrides: {
     *     gasPrice,
     *     value: txCostPrice,
     *   },
     * });
     */
    async getRequestExecuteTx(transaction) {
        return super.getRequestExecuteTx(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example Get ETH balance
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * console.log(`ETH balance: ${await wallet.getBalance()}`);
     *
     * @example Get token balance
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const token = "0x6a4Fb925583F7D4dF82de62d98107468aE846FD1";
     *
     * console.log(`Token balance: ${await wallet.getBalance(token)}`);
     *
     */
    async getBalance(token, blockTag = 'committed') {
        return super.getBalance(token, blockTag);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const allBalances = await wallet.getAllBalances();
     */
    async getAllBalances() {
        return super.getAllBalances();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * console.log(`Nonce: ${await wallet.getDeploymentNonce()}`);
     */
    async getDeploymentNonce() {
        return super.getDeploymentNonce();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const l2BridgeContracts = await wallet.getL2BridgeContracts();
     */
    async getL2BridgeContracts() {
        return super.getL2BridgeContracts();
    }
    /**
     * @inheritDoc
     *
     * @example Withdraw ETH
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tokenL2 = "0x6a4Fb925583F7D4dF82de62d98107468aE846FD1";
     * const tokenWithdrawHandle = await wallet.withdraw({
     *   token: tokenL2,
     *   amount: 10_000_000,
     * });
     *
     * @example Withdraw ETH using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     * const token = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * const paymaster = "0x13D0D8550769f59aa241a41897D4859c87f7Dd46"; // Paymaster for Crown token
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const tokenL2 = "0x6a4Fb925583F7D4dF82de62d98107468aE846FD1";
     * const tokenWithdrawHandle = await wallet.withdraw({
     *   token: tokenL2,
     *   amount: 10_000_000,
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: "ApprovalBased",
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     */
    async withdraw(transaction) {
        return super.withdraw(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example Transfer ETH
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const transferHandle = await wallet.transfer({
     *   to: Wallet.createRandom().address,
     *   amount: ethers.parseEther("0.01"),
     * });
     *
     * const tx = await transferHandle.wait();
     *
     * console.log(`The sum of ${tx.value} ETH was transferred to ${tx.to}`);
     *
     * @example Transfer ETH using paymaster to facilitate fee payment with an ERC20 token
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     * const token = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * const paymaster = "0x13D0D8550769f59aa241a41897D4859c87f7Dd46"; // Paymaster for Crown token
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const wallet = new Wallet(PRIVATE_KEY, provider);
     *
     * const transferHandle = await wallet.transfer({
     *   to: Wallet.createRandom().address,
     *   amount: ethers.parseEther("0.01"),
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: "ApprovalBased",
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     *
     * const tx = await transferHandle.wait();
     *
     * console.log(`The sum of ${tx.value} ETH was transferred to ${tx.to}`);
     */
    async transfer(transaction) {
        return super.transfer(transaction);
    }
    /**
     * Returns `ethers.Wallet` object with the same private key.
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const ethWallet = wallet.ethWallet();
     */
    ethWallet() {
        return new ethers_1.ethers.Wallet(this._signingKey(), this._providerL1());
    }
    /**
     * Get the number of transactions ever sent for account, which is used as the `nonce` when sending a transaction.
     *
     * @param [blockTag] The block tag to query. If provided, the transaction count is as of that block.
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const nonce = wallet.getNonce();
     */
    async getNonce(blockTag) {
        return await this.getTransactionCount(blockTag);
    }
    /**
     * Connects to the L2 network using `provider`.
     *
     * @param provider The provider instance for connecting to an L2 network.
     *
     * @see {@link connectToL1} in order to connect to L1 network.
     *
     * @example
     *
     * import { Wallet, Provider, types } from "zksync-ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     * const unconnectedWallet = new Wallet(PRIVATE_KEY);
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const wallet = unconnectedWallet.connect(provider);
     */
    connect(provider) {
        return new Wallet(this._signingKey(), provider, this.providerL1);
    }
    /**
     * Connects to the L1 network using `provider`.
     *
     * @param provider The provider instance for connecting to a L1 network.
     *
     * @see {@link connect} in order to connect to L2 network.
     *
     * @example
     *
     * import { Wallet } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     * const unconnectedWallet = new Wallet(PRIVATE_KEY);
     *
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = unconnectedWallet.connectToL1(ethProvider);
     *
     * @param provider
     */
    connectToL1(provider) {
        return new Wallet(this._signingKey(), this.provider, provider);
    }
    /**
     * Creates a new `Wallet` with the `provider` as L1 provider and a private key that is built from the mnemonic passphrase.
     *
     * @param mnemonic The mnemonic of the private key.
     * @param [path] The derivation path.
     * @param [wordlist] The wordlist used to derive the mnemonic.
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     *
     * const MNEMONIC = "stuff slice staff easily soup parent arm payment cotton hammer scatter struggle";
     *
     * const wallet = Wallet.fromMnemonic(MNEMONIC);
     */
    static fromMnemonic(mnemonic, path, wordlist) {
        const wallet = super.fromMnemonic(mnemonic, path, wordlist);
        return new Wallet(wallet._signingKey());
    }
    /**
     * Creates a new `Wallet` from encrypted json file using provided `password`.
     *
     * @param json The encrypted json file.
     * @param password The password for the encrypted json file.
     * @param [callback] If provided, it is called periodically during decryption so that any UI can be updated.
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import * as fs from "fs";
     *
     * const wallet = await Wallet.fromEncryptedJson(fs.readFileSync("wallet.json", "utf8"), "password");
     */
    static async fromEncryptedJson(json, password, callback) {
        const wallet = await super.fromEncryptedJson(json, password, callback);
        return new Wallet(wallet._signingKey());
    }
    /**
     * Creates a new `Wallet` from encrypted json file using provided `password`.
     *
     * @param json The encrypted json file.
     * @param password The password for the encrypted json file.
     *
     * @example
     *
     * import { Wallet } from "zksync-ethers";
     * import * as fs from "fs";
     *
     * const wallet = Wallet.fromEncryptedJsonSync(fs.readFileSync("tests/files/wallet.json", "utf8"), "password");
     */
    static fromEncryptedJsonSync(json, password) {
        const wallet = super.fromEncryptedJsonSync(json, password);
        return new Wallet(wallet._signingKey());
    }
    /**
     * Static methods to create Wallet instances.
     * @param options  Additional options.
     */
    static createRandom(options) {
        const wallet = super.createRandom(options);
        return new Wallet(wallet._signingKey());
    }
    /**
     *
     * @param privateKey The private key of the account.
     * @param providerL2 The provider instance for connecting to a L2 network.
     * @param providerL1 The provider instance for connecting to a L1 network.
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     */
    constructor(privateKey, providerL2, providerL1) {
        super(privateKey, providerL2);
        if (this.provider) {
            const chainId = this.getChainId();
            this.eip712 = new signer_1.EIP712Signer(this, chainId);
        }
        this.providerL1 = providerL1;
    }
    /**
     * Designed for users who prefer a simplified approach by providing only the necessary data to create a valid transaction.
     * The only required fields are `transaction.to` and either `transaction.data` or `transaction.value` (or both, if the method is payable).
     * Any other fields that are not set will be prepared by this method.
     *
     * @param transaction The transaction request that needs to be populated.
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const populatedTx = await wallet.populateTransaction({
     *   to: Wallet.createRandom().address,
     *   value: 7_000_000,
     * });
     */
    async populateTransaction(transaction) {
        var _a, _b, _c;
        if ((!transaction.type || transaction.type !== utils_1.EIP712_TX_TYPE) &&
            !transaction.customData) {
            return await super.populateTransaction(transaction);
        }
        transaction.type = utils_1.EIP712_TX_TYPE;
        const populated = await super.populateTransaction(transaction);
        populated.type = utils_1.EIP712_TX_TYPE;
        (_a = populated.value) !== null && _a !== void 0 ? _a : (populated.value = 0);
        (_b = populated.data) !== null && _b !== void 0 ? _b : (populated.data = '0x');
        populated.customData = this._fillCustomData((_c = transaction.customData) !== null && _c !== void 0 ? _c : {});
        if (!populated.maxFeePerGas && !populated.maxPriorityFeePerGas) {
            populated.gasPrice = await this.provider.getGasPrice();
        }
        return populated;
    }
    /***
     * Signs the transaction and serializes it to be ready to be broadcast to the network.
     *
     * @param transaction The transaction request that needs to be signed.
     *
     * @throws {Error} If `transaction.from` is mismatched from the private key.
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const tx = await wallet.signTransaction({
     *   type: utils.EIP712_TX_TYPE,
     *   to: Wallet.createRandom().address,
     *   value: BigNumber.from(7_000_000_000),
     * });
     */
    async signTransaction(transaction) {
        const populated = await this.populateTransaction(transaction);
        if (populated.type !== utils_1.EIP712_TX_TYPE) {
            return await super.signTransaction(populated);
        }
        populated.customData.customSignature = await this.eip712.sign(populated);
        return (0, utils_1.serialize)(populated);
    }
    /**
     * Broadcast the transaction to the network.
     *
     * @param transaction The transaction request that needs to be broadcast to the network.
     *
     * @throws {Error} If `transaction.from` is mismatched from the private key.
     *
     * @example
     *
     * import { Wallet, Provider, utils } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const PRIVATE_KEY = "<WALLET_PRIVATE_KEY>";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const wallet = new Wallet(PRIVATE_KEY, provider, ethProvider);
     *
     * const tx = await wallet.sendTransaction({
     *   to: RECEIVER,
     *   value: 7_000_000,
     *   maxFeePerGas: BigNumber.from(3_500_000_000),
     *   maxPriorityFeePerGas: BigNumber.from(2_000_000_000),
     *   customData: {
     *     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
     *   },
     * });
     * await tx.wait();
     */
    async sendTransaction(transaction) {
        return (await super.sendTransaction(transaction));
    }
}
exports.Wallet = Wallet;
//# sourceMappingURL=wallet.js.map