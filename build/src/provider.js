"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Provider = exports.Provider = void 0;
const ethers_1 = require("ethers");
const web_1 = require("@ethersproject/web");
const Ierc20Factory_1 = require("../typechain/Ierc20Factory");
const IEthTokenFactory_1 = require("../typechain/IEthTokenFactory");
const Il2BridgeFactory_1 = require("../typechain/Il2BridgeFactory");
const types_1 = require("./types");
const utils_1 = require("./utils");
const signer_1 = require("./signer");
var Formatter = ethers_1.providers.Formatter;
let defaultFormatter = null;
/**
 * A `Provider` extends {@link ethers.providers.JsonRpcProvider} and includes additional features for interacting with zkSync Era.
 * It supports RPC endpoints within the `zks` namespace.
 */
class Provider extends ethers_1.ethers.providers.JsonRpcProvider {
    // NOTE: this is almost a complete copy-paste of the parent poll method
    // https://github.com/ethers-io/ethers.js/blob/v5.7.2/packages/providers/src.ts/base-provider.ts#L977
    // The only difference is that we handle transaction receipts with `blockNumber: null` differently here.
    async poll() {
        const pollId = Provider._nextPollId++;
        // Track all running promises, so we can trigger a post-poll once they are complete
        const runners = [];
        let blockNumber;
        try {
            blockNumber = await this._getInternalBlockNumber(100 + this.pollingInterval / 2);
        }
        catch (error) {
            this.emit('error', error);
            return;
        }
        this._setFastBlockNumber(blockNumber);
        // Emit a poll event after we have the latest (fast) block number
        this.emit('poll', pollId, blockNumber);
        // If the block has not changed, meh.
        if (blockNumber === this._lastBlockNumber) {
            this.emit('didPoll', pollId);
            return;
        }
        // First polling cycle, trigger a "block" events
        if (this._emitted.block === -2) {
            this._emitted.block = blockNumber - 1;
        }
        if (Math.abs(this._emitted.block - blockNumber) > 1000) {
            console.warn(`network block skew detected; skipping block events (emitted=${this._emitted.block} blockNumber=${blockNumber})`);
            this.emit('error', {
                blockNumber: blockNumber,
                event: 'blockSkew',
                previousBlockNumber: this._emitted.block,
            });
            this.emit('block', blockNumber);
        }
        else {
            // Notify all listener for each block that has passed
            for (let i = this._emitted.block + 1; i <= blockNumber; i++) {
                this.emit('block', i);
            }
        }
        // The emitted block was updated, check for obsolete events
        if (this._emitted.block !== blockNumber) {
            this._emitted.block = blockNumber;
            Object.keys(this._emitted).forEach(key => {
                // The block event does not expire
                if (key === 'block') {
                    return;
                }
                // The block we were at when we emitted this event
                const eventBlockNumber = this._emitted[key];
                // We cannot garbage collect pending transactions or blocks here
                // They should be garbage collected by the Provider when setting
                // "pending" events
                if (eventBlockNumber === 'pending') {
                    return;
                }
                // Evict any transaction hashes or block hashes over 12 blocks
                // old, since they should not return null anyway
                if (blockNumber - eventBlockNumber > 12) {
                    delete this._emitted[key];
                }
            });
        }
        // First polling cycle
        if (this._lastBlockNumber === -2) {
            this._lastBlockNumber = blockNumber - 1;
        }
        // Find all transaction hashes we are waiting on
        this._events.forEach(event => {
            switch (event.type) {
                case 'tx': {
                    const hash = event.hash;
                    const runner = this.getTransactionReceipt(hash)
                        .then(receipt => {
                        if (!receipt) {
                            return null;
                        }
                        // NOTE: receipts with blockNumber == null are OK.
                        // this means they were rejected in state-keeper or replaced in mempool.
                        // But we still check that they were actually rejected.
                        if (!receipt.blockNumber &&
                            !(receipt.status && ethers_1.BigNumber.from(receipt.status).isZero())) {
                            return null;
                        }
                        this._emitted['t:' + hash] = receipt.blockNumber;
                        this.emit(hash, receipt);
                        return null;
                    })
                        .catch((error) => {
                        this.emit('error', error);
                    });
                    runners.push(runner);
                    break;
                }
                case 'filter': {
                    // We only allow a single getLogs to be in-flight at a time
                    if (!event._inflight) {
                        event._inflight = true;
                        // This is the first filter for this event, so we want to
                        // restrict events to events that happened no earlier than now
                        if (event._lastBlockNumber === -2) {
                            event._lastBlockNumber = blockNumber - 1;
                        }
                        // Filter from the last *known* event; due to load-balancing
                        // and some nodes returning updated block numbers before
                        // indexing events, a logs result with 0 entries cannot be
                        // trusted, and we must retry a range which includes it again
                        const filter = event.filter;
                        filter.fromBlock = event._lastBlockNumber + 1;
                        filter.toBlock = blockNumber;
                        // Prevent file ranges from growing too wild, since it is quite
                        // likely there just haven't been any events to move the lastBlockNumber.
                        const minFromBlock = filter.toBlock - this._maxFilterBlockRange;
                        if (minFromBlock > filter.fromBlock) {
                            filter.fromBlock = minFromBlock;
                        }
                        if (filter.fromBlock < 0) {
                            filter.fromBlock = 0;
                        }
                        const runner = this.getLogs(filter)
                            .then(logs => {
                            // Allow the next getLogs
                            event._inflight = false;
                            if (logs.length === 0) {
                                return;
                            }
                            logs.forEach((log) => {
                                // Only when we get an event for a given block number
                                // can we trust the events are indexed
                                if (log.blockNumber > event._lastBlockNumber) {
                                    event._lastBlockNumber = log.blockNumber;
                                }
                                // Make sure we stall requests to fetch blocks and txs
                                this._emitted['b:' + log.blockHash] = log.blockNumber;
                                this._emitted['t:' + log.transactionHash] = log.blockNumber;
                                this.emit(filter, log);
                            });
                        })
                            .catch((error) => {
                            this.emit('error', error);
                            // Allow another getLogs (the range was not updated)
                            event._inflight = false;
                        });
                        runners.push(runner);
                    }
                    break;
                }
            }
        });
        this._lastBlockNumber = blockNumber;
        // Once all events for this loop have been processed, emit "didPoll"
        Promise.all(runners)
            .then(() => {
            this.emit('didPoll', pollId);
        })
            .catch(error => {
            this.emit('error', error);
        });
        return;
    }
    /**
     * Resolves to the transaction receipt for `transactionHash`, if mined.
     *
     * @param transactionHash The hash of the transaction.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const TX_HASH = "<YOUR_TX_HASH_ADDRESS>";
     * console.log(`Transaction receipt: ${utils.toJSON(await provider.getTransactionReceipt(TX_HASH))}`);
     */
    async getTransactionReceipt(transactionHash) {
        await this.getNetwork();
        transactionHash = await transactionHash;
        const params = {
            transactionHash: this.formatter.hash(transactionHash, true),
        };
        return (0, web_1.poll)(async () => {
            const result = await this.perform('getTransactionReceipt', params);
            if (!result) {
                if (this._emitted['t:' + transactionHash] === undefined) {
                    return null;
                }
                return undefined;
            }
            if (!result.blockNumber &&
                result.status &&
                ethers_1.BigNumber.from(result.status).isZero()) {
                // transaction is rejected in the state-keeper
                return {
                    ...this.formatter.receipt({
                        ...result,
                        confirmations: 1,
                        blockNumber: 0,
                        blockHash: ethers_1.ethers.constants.HashZero,
                    }),
                    blockNumber: null,
                    blockHash: null,
                    l1BatchNumber: null,
                    l1BatchTxIndex: null,
                };
            }
            if (!result.blockHash) {
                // receipt is not ready
                return undefined;
            }
            else {
                const receipt = this.formatter.receipt(result);
                if (!receipt.blockNumber) {
                    receipt.confirmations = 0;
                }
                else if (!receipt.confirmations) {
                    const blockNumber = await this._getInternalBlockNumber(100 + 2 * this.pollingInterval);
                    // Add the confirmations using the fast block number (pessimistic)
                    let confirmations = blockNumber - receipt.blockNumber + 1;
                    if (confirmations <= 0) {
                        confirmations = 1;
                    }
                    receipt.confirmations = confirmations;
                }
                return receipt;
            }
        }, { oncePoll: this });
    }
    /**
     * Resolves to the block for `blockHashOrBlockTag`.
     *
     * @param blockHashOrBlockTag The hash or tag of the block to retrieve.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`Block: ${utils.toJSON(await provider.getBlock("latest", true))}`);
     */
    async getBlock(blockHashOrBlockTag) {
        return this._getBlock(blockHashOrBlockTag, false);
    }
    /**
     * Resolves to the block for `blockHashOrBlockTag`.
     * All transactions will be included and the `Block` object will not
     * need to make remote calls for getting transactions.
     *
     * @param blockHashOrBlockTag The hash or tag of the block to retrieve.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`Block: ${utils.toJSON(await provider.getBlockWithTransactions("latest", true))}`);
     */
    async getBlockWithTransactions(blockHashOrBlockTag) {
        return (this._getBlock(blockHashOrBlockTag, true));
    }
    /**  Retrieves the formatter used to format responses from the network. */
    static getFormatter() {
        if (!defaultFormatter) {
            defaultFormatter = new Formatter();
            const number = defaultFormatter.number.bind(defaultFormatter);
            const boolean = defaultFormatter.boolean.bind(defaultFormatter);
            const hash = defaultFormatter.hash.bind(defaultFormatter);
            const address = defaultFormatter.address.bind(defaultFormatter);
            defaultFormatter.formats.receiptLog.l1BatchNumber =
                Formatter.allowNull(number);
            defaultFormatter.formats.l2Tol1Log = {
                blockNumber: number,
                blockHash: hash,
                l1BatchNumber: Formatter.allowNull(number),
                transactionIndex: number,
                shardId: number,
                isService: boolean,
                sender: address,
                key: hash,
                value: hash,
                transactionHash: hash,
                txIndexInL1Batch: Formatter.allowNull(number),
                logIndex: number,
            };
            defaultFormatter.formats.receipt.l1BatchNumber =
                Formatter.allowNull(number);
            defaultFormatter.formats.receipt.l1BatchTxIndex =
                Formatter.allowNull(number);
            defaultFormatter.formats.receipt.l2ToL1Logs = Formatter.arrayOf(value => Formatter.check(defaultFormatter.formats.l2Tol1Log, value));
            defaultFormatter.formats.block.l1BatchNumber =
                Formatter.allowNull(number);
            defaultFormatter.formats.block.l1BatchTimestamp =
                Formatter.allowNull(number);
            defaultFormatter.formats.blockWithTransactions.l1BatchNumber =
                Formatter.allowNull(number);
            defaultFormatter.formats.blockWithTransactions.l1BatchTimestamp =
                Formatter.allowNull(number);
            defaultFormatter.formats.transaction.l1BatchNumber =
                Formatter.allowNull(number);
            defaultFormatter.formats.transaction.l1BatchTxIndex =
                Formatter.allowNull(number);
            defaultFormatter.formats.filterLog.l1BatchNumber =
                Formatter.allowNull(number);
        }
        return defaultFormatter;
    }
    /**
     * Returns the account balance  for the specified account `address`, `blockTag`, and `tokenAddress`.
     * If `blockTag` and `tokenAddress` are not provided, the balance for the latest committed block and ETH token
     * is returned by default.
     *
     * @param address The account address for which the balance is retrieved.
     * @param [blockTag] The block tag for getting the balance on. Latest committed block is the default.
     * @param [tokenAddress] The token address. ETH is the default token.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const account = "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049";
     * const tokenAddress = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * console.log(`ETH balance: ${await provider.getBalance(account)}`);
     * console.log(`Token balance: ${await provider.getBalance(account, "latest", tokenAddress)}`);
     */
    async getBalance(address, blockTag, tokenAddress) {
        const tag = this.formatter.blockTag(blockTag);
        if (!tokenAddress || (0, utils_1.isETH)(tokenAddress)) {
            // requesting ETH balance
            return await super.getBalance(address, tag);
        }
        else {
            try {
                const token = Ierc20Factory_1.Ierc20Factory.connect(tokenAddress, this);
                return await token.balanceOf(address, { blockTag: tag });
            }
            catch {
                return ethers_1.BigNumber.from(0);
            }
        }
    }
    /**
     * Returns the L2 token address equivalent for a L1 token address as they are not equal.
     * ETH address is set to zero address.
     *
     * @remarks Only works for tokens bridged on default zkSync Era bridges.
     *
     * @param token The address of the token on L1.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`L2 token address: ${await provider.l2TokenAddress("0x5C221E77624690fff6dd741493D735a17716c26B")}`);
     */
    async l2TokenAddress(token) {
        if (token === utils_1.ETH_ADDRESS) {
            return utils_1.ETH_ADDRESS;
        }
        const bridgeAddresses = await this.getDefaultBridgeAddresses();
        const l2WethBridge = Il2BridgeFactory_1.Il2BridgeFactory.connect(bridgeAddresses.wethL2, this);
        try {
            const l2WethToken = await l2WethBridge.l2TokenAddress(token);
            // If the token is Wrapped Ether, return its L2 token address
            if (l2WethToken !== ethers_1.ethers.constants.AddressZero) {
                return l2WethToken;
            }
        }
        catch (e) {
            // skip
        }
        const l2Erc20Bridge = Il2BridgeFactory_1.Il2BridgeFactory.connect(bridgeAddresses.erc20L2, this);
        return await l2Erc20Bridge.l2TokenAddress(token);
    }
    /**
     * Returns the L1 token address equivalent for a L2 token address as they are not equal.
     * ETH address is set to zero address.
     *
     * @remarks Only works for tokens bridged on default zkSync Era bridges.
     *
     * @param token The address of the token on L2.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`L1 token address: ${await provider.l1TokenAddress("0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b")}`);
     */
    async l1TokenAddress(token) {
        if (token === utils_1.ETH_ADDRESS) {
            return utils_1.ETH_ADDRESS;
        }
        const bridgeAddresses = await this.getDefaultBridgeAddresses();
        const l2WethBridge = Il2BridgeFactory_1.Il2BridgeFactory.connect(bridgeAddresses.wethL2, this);
        try {
            const l1WethToken = await l2WethBridge.l1TokenAddress(token);
            // If the token is Wrapped Ether, return its L1 token address
            if (l1WethToken !== ethers_1.ethers.constants.AddressZero) {
                return l1WethToken;
            }
        }
        catch (e) {
            // skip
        }
        const erc20Bridge = Il2BridgeFactory_1.Il2BridgeFactory.connect(bridgeAddresses.erc20L2, this);
        return await erc20Bridge.l1TokenAddress(token);
    }
    /**
     * This function is used when formatting requests for `eth_call` and `eth_estimateGas`. We override it here
     * because we have extra stuff to serialize (customData).
     * This function is for internal use only.
     *
     * @param transaction The transaction request to be serialized.
     * @param [allowExtra] Extra properties are allowed in the transaction.
     */
    static hexlifyTransaction(transaction, allowExtra) {
        var _a;
        const result = ethers_1.ethers.providers.JsonRpcProvider.hexlifyTransaction(transaction, {
            ...allowExtra,
            customData: true,
            from: true,
        });
        if (!transaction.customData) {
            return result;
        }
        result.eip712Meta = {
            gasPerPubdata: ethers_1.utils.hexValue((_a = transaction.customData.gasPerPubdata) !== null && _a !== void 0 ? _a : 0),
        };
        transaction.type = utils_1.EIP712_TX_TYPE;
        if (transaction.customData.factoryDeps) {
            result.eip712Meta.factoryDeps = transaction.customData.factoryDeps.map((dep) => 
            // TODO (SMA-1605): we arraify instead of hexlifying because server expects Vec<u8>.
            //  We should change deserialization there.
            Array.from(ethers_1.utils.arrayify(dep)));
        }
        if (transaction.customData.paymasterParams) {
            result.eip712Meta.paymasterParams = {
                paymaster: ethers_1.utils.hexlify(transaction.customData.paymasterParams.paymaster),
                paymasterInput: Array.from(ethers_1.utils.arrayify(transaction.customData.paymasterParams.paymasterInput)),
            };
        }
        return result;
    }
    /**
     * Estimates the amount of gas required to execute `transaction`.
     *
     * @param transaction The transaction for which to estimate gas.
     */
    async estimateGas(transaction) {
        await this.getNetwork();
        const params = (await ethers_1.utils.resolveProperties({
            transaction: this._getTransactionRequest(transaction),
        }));
        if (transaction.customData) {
            params.transaction.customData = transaction.customData;
        }
        const result = await this.perform('estimateGas', params);
        try {
            return ethers_1.BigNumber.from(result);
        }
        catch (error) {
            throw new Error(`Bad result from backend (estimateGas): ${result}!`);
        }
    }
    /**
     * Returns an estimate of the amount of gas required to submit a transaction from L1 to L2.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-estimategasl1tol2 zks_estimateL1ToL2} JSON-RPC method.
     *
     * @param transaction The transaction request.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const gasL1 = await provider.estimateGasL1({
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   to: await provider.getMainContractAddress(),
     *   value: 7_000_000_000,
     *   customData: {
     *     gasPerPubdata: 800,
     *   },
     * });
     * console.log(`L1 gas: ${gasL1}`);
     */
    async estimateGasL1(transaction) {
        await this.getNetwork();
        const params = await ethers_1.utils.resolveProperties({
            transaction: this._getTransactionRequest(transaction),
        });
        if (transaction.customData) {
            params.transaction.customData = transaction.customData;
        }
        const result = await this.send('zks_estimateGasL1ToL2', [
            Provider.hexlifyTransaction(params.transaction, {
                from: true,
            }),
        ]);
        try {
            return ethers_1.BigNumber.from(result);
        }
        catch (error) {
            throw new Error(`Bad result from backend (zks_estimateGasL1ToL2): ${result}!`);
        }
    }
    /**
     * Returns an estimated {@link Fee} for requested transaction.
     *
     * @param transaction The transaction request.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const fee = await provider.estimateFee({
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   to: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
     *   value: BigNumber.from(7_000_000_000).toHexString(),
     * });
     * console.log(`Fee: ${utils.toJSON(fee)}`);
     */
    async estimateFee(transaction) {
        return await this.send('zks_estimateFee', [transaction]);
    }
    /**
     * Returns an estimate (best guess) of the gas price to use in a transaction.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`Gas price: ${await provider.getGasPrice()}`);
     */
    async getGasPrice(token) {
        const params = token ? [token] : [];
        try {
            const price = await this.send('eth_gasPrice', params);
            return ethers_1.BigNumber.from(price);
        } catch(e) {
            return ethers_1.BigNumber.from("10000000000");
        }
    }
    /**
     * Creates a new `Provider` instance for connecting to an L2 network.
     * @param [url] The network RPC URL. Defaults to the local network.
     * @param [network] The network name, chain ID, or object with network details.
     */
    constructor(url, network) {
        super(url, network);
        this.pollingInterval = 500;
        const blockTag = this.formatter.blockTag.bind(this.formatter);
        this.formatter.blockTag = (tag) => {
            if (tag === 'committed' || tag === 'finalized') {
                return tag;
            }
            return blockTag(tag);
        };
        this.contractAddresses = {};
        this.formatter.transaction = utils_1.parseTransaction;
    }
    /**
     * Returns the proof for a transaction's L2 to L1 log sent via the `L1Messenger` system contract.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getl2tol1logproof zks_getL2ToL1LogProof} JSON-RPC method.
     *
     * @param txHash The hash of the L2 transaction the L2 to L1 log was produced within.
     * @param [index] The index of the L2 to L1 log in the transaction.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * // Any L2 -> L1 transaction can be used.
     * // In this case, withdrawal transaction is used.
     * const tx = "0x2a1c6c74b184965c0cb015aae9ea134fd96215d2e4f4979cfec12563295f610e";
     * console.log(`Log ${utils.toJSON(await provider.getLogProof(tx, 0))}`);
     */
    async getLogProof(txHash, index) {
        return await this.send('zks_getL2ToL1LogProof', [
            ethers_1.ethers.utils.hexlify(txHash),
            index,
        ]);
    }
    /**
     * Returns the range of blocks contained within a batch given by batch number.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getl1batchblockrange zks_getL1BatchBlockRange} JSON-RPC method.
     *
     * @param l1BatchNumber The L1 batch number.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const l1BatchNumber = await provider.getL1BatchNumber();
     * console.log(`L1 batch block range: ${utils.toJSON(await provider.getL1BatchBlockRange(l1BatchNumber))}`);
     */
    async getL1BatchBlockRange(l1BatchNumber) {
        const range = await this.send('zks_getL1BatchBlockRange', [l1BatchNumber]);
        if (!range) {
            return null;
        }
        return [parseInt(range[0], 16), parseInt(range[1], 16)];
    }
    /**
     * Returns the main zkSync Era smart contract address.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getmaincontract zks_getMainContract} JSON-RPC method.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     */
    async getMainContractAddress() {
        if (!this.contractAddresses.mainContract) {
            this.contractAddresses.mainContract = await this.send('zks_getMainContract', []);
        }
        return this.contractAddresses.mainContract;
    }
    /**
     * Returns the testnet {@link https://docs.zksync.io/build/developer-reference/account-abstraction.html#paymasters paymaster address}
     * if available, or `null`.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-gettestnetpaymaster zks_getTestnetPaymaster} JSON-RPC method.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`Testnet paymaster: ${await provider.getTestnetPaymasterAddress()}`);
     */
    async getTestnetPaymasterAddress() {
        // Unlike contract's addresses, the testnet paymaster is not cached, since it can be trivially changed
        // on the fly by the server and should not be relied on to be constant
        return await this.send('zks_getTestnetPaymaster', []);
    }
    /**
     * Returns the addresses of the default zkSync Era bridge contracts on both L1 and L2.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getbridgecontracts zks_getBridgeContracts} JSON-RPC method.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`Default bridges: ${utils.toJSON(await provider.getDefaultBridgeAddresses())}`);
     */
    async getDefaultBridgeAddresses() {
        if (!this.contractAddresses.erc20BridgeL1) {
            const addresses = await this.send('zks_getBridgeContracts', []);
            this.contractAddresses.erc20BridgeL1 = addresses.l1Erc20DefaultBridge;
            this.contractAddresses.erc20BridgeL2 = addresses.l2Erc20DefaultBridge;
            this.contractAddresses.wethBridgeL1 = addresses.l1WethBridge;
            this.contractAddresses.wethBridgeL2 = addresses.l2WethBridge;
        }
        return {
            erc20L1: this.contractAddresses.erc20BridgeL1,
            erc20L2: this.contractAddresses.erc20BridgeL2,
            wethL1: this.contractAddresses.wethBridgeL1,
            wethL2: this.contractAddresses.wethBridgeL2,
        };
    }
    /**
     * Returns all balances for confirmed tokens given by an account address.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getallaccountbalances zks_getAllAccountBalances} JSON-RPC method.
     *
     * @param address The account address.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const balances = await provider.getAllAccountBalances("0x36615Cf349d7F6344891B1e7CA7C72883F5dc049");
     * console.log(`All balances: ${utils.toJSON(balances)}`);
     */
    async getAllAccountBalances(address) {
        const balances = await this.send('zks_getAllAccountBalances', [address]);
        for (const token in balances) {
            balances[token] = ethers_1.BigNumber.from(balances[token]);
        }
        return balances;
    }
    /**
     * Returns the L1 chain ID.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-l1chainid zks_L1ChainId} JSON-RPC method.
     *
     * @example
     *
     * import { Provider, types} from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const l1ChainId = await provider.l1ChainId();
     * console.log(`All balances: ${l1ChainId}`);
     */
    async l1ChainId() {
        const res = await this.send('zks_L1ChainId', []);
        return ethers_1.BigNumber.from(res).toNumber();
    }
    /**
     /**
     * Returns the latest L1 batch number.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-l1batchnumber zks_L1BatchNumber}  JSON-RPC method.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`L1 batch number: ${await provider.getL1BatchNumber()}`);
     */
    async getL1BatchNumber() {
        const number = await this.send('zks_L1BatchNumber', []);
        return ethers_1.BigNumber.from(number).toNumber();
    }
    /**
     * Returns data pertaining to a given batch.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getl1batchdetails zks_getL1BatchDetails} JSON-RPC method.
     *
     * @param number The L1 batch number.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`Block details: ${utils.toJSON(await provider.getBlockDetails(90_000))}`);
     */
    async getL1BatchDetails(number) {
        return await this.send('zks_getL1BatchDetails', [number]);
    }
    /**
     * Returns additional zkSync-specific information about the L2 block.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getblockdetails zks_getBlockDetails}  JSON-RPC method.
     *
     * @param number The block number.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`Block details: ${utils.toJSON(await provider.getBlockDetails(90_000))}`);
     */
    async getBlockDetails(number) {
        return await this.send('zks_getBlockDetails', [number]);
    }
    /**
     * Returns data from a specific transaction given by the transaction hash.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-gettransactiondetails zks_getTransactionDetails} JSON-RPC method.
     *
     * @param txHash The transaction hash.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     *
     * const TX_HASH = "<YOUR_TX_HASH_ADDRESS>";
     * console.log(`Transaction details: ${utils.toJSON(await provider.getTransactionDetails(TX_HASH))}`);
     */
    async getTransactionDetails(txHash) {
        return await this.send('zks_getTransactionDetails', [txHash]);
    }
    /**
     * Returns bytecode of a contract given by its hash.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getbytecodebyhash zks_getBytecodeByHash} JSON-RPC method.
     *
     * @param bytecodeHash The bytecode hash.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * // Bytecode hash can be computed by following these steps:
     * // const testnetPaymasterBytecode = await provider.getCode(await provider.getTestnetPaymasterAddress());
     * // const testnetPaymasterBytecodeHash = ethers.utils.hexlify(utils.hashBytecode(testnetPaymasterBytecode));
     *
     * const testnetPaymasterBytecodeHash = "0x010000f16d2b10ddeb1c32f2c9d222eb1aea0f638ec94a81d4e916c627720e30";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Goerli);
     * console.log(`Bytecode: ${await provider.getBytecodeByHash(testnetPaymasterBytecodeHash)}`);
     */
    async getBytecodeByHash(bytecodeHash) {
        return await this.send('zks_getBytecodeByHash', [bytecodeHash]);
    }
    /**
     * Returns data of transactions in a block.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getrawblocktransactions zks_getRawBlockTransactions}  JSON-RPC method.
     *
     * @param number The block number.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Goerli);
     * console.log(`Raw block transactions: ${utils.toJSON(await provider.getRawBlockTransactions(90_000))}`);
     */
    async getRawBlockTransactions(number) {
        return await this.send('zks_getRawBlockTransactions', [number]);
    }
    /**
     * Returns Merkle proofs for one or more storage values at the specified account along with a Merkle proof
     * of their authenticity.
     *
     * Calls the {@link https://docs.zksync.io/build/api.html#zks-getproof zks_getProof} JSON-RPC method.
     *
     * @param address The account to fetch storage values and proofs for.
     * @param keys The vector of storage keys in the account.
     * @param l1BatchNumber The number of the L1 batch specifying the point in time at which the requested values are returned.
  
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const address = "0x082b1BB53fE43810f646dDd71AA2AB201b4C6b04";
     *
     * // Fetching the storage proof for rawNonces storage slot in NonceHolder system contract.
     * // mapping(uint256 => uint256) internal rawNonces;
     *
     * // Ensure the address is a 256-bit number by padding it
     * // because rawNonces slot uses uint256 for mapping addresses and their nonces.
     * const addressPadded =  ethers.utils.hexZeroPad(address, 32);
     *
     * // Convert the slot number to a hex string and pad it to 32 bytes.
     * const slotPadded =  ethers.utils.hexZeroPad(ethers.utils.hexlify(0), 32);
     *
     * // Concatenate the padded address and slot number.
     * const concatenated = addressPadded + slotPadded.slice(2); // slice to remove '0x' from the slotPadded
     *
     * // Hash the concatenated string using Keccak-256.
     * const storageKey = ethers.utils.keccak256(concatenated);
     *
     * const l1BatchNumber = await provider.getL1BatchNumber();
     * const storageProof = await provider.getProof(utils.NONCE_HOLDER_ADDRESS, [storageKey], l1BatchNumber);
     * console.log(`Storage proof: ${utils.toJSON(storageProof)}`);
     */
    async getProof(address, keys, l1BatchNumber) {
        return await this.send('zks_getProof', [address, keys, l1BatchNumber]);
    }
    /**
     * Returns the populated withdrawal transaction.
     *
     * @param transaction The transaction details.
     * @param transaction.token The token address.
     * @param transaction.amount The amount of token.
     * @param [transaction.from] The sender's address.
     * @param [transaction.to] The recipient's address.
     * @param [transaction.bridgeAddress] The bridge address.
     * @param [transaction.paymasterParams] Paymaster parameters.
     * @param [transaction.overrides] Transaction overrides including `gasLimit`, `gasPrice`, and `value`.
     *
     * @example Retrieve populated ETH withdrawal transactions.
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     *
     * const tx = await provider.getWithdrawTx({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000_000,
     *   to: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     * });
     * console.log(`Withdrawal tx: ${tx}`);
     *
     * @example Retrieve populated ETH withdrawal transaction using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const token = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * const paymaster = "0x13D0D8550769f59aa241a41897D4859c87f7Dd46"; // Paymaster for Crown token
     *
     * const tx = await provider.getWithdrawTx({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000_000,
     *   to: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: "ApprovalBased",
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     * console.log(`Withdrawal tx: ${tx}`);
     */
    async getWithdrawTx(transaction) {
        var _a, _b, _c;
        var _d;
        const { ...tx } = transaction;
        if (!tx.to && !tx.from) {
            throw new Error('Withdrawal target address is undefined!');
        }
        (_a = tx.to) !== null && _a !== void 0 ? _a : (tx.to = tx.from);
        (_b = tx.overrides) !== null && _b !== void 0 ? _b : (tx.overrides = {});
        (_c = (_d = tx.overrides).from) !== null && _c !== void 0 ? _c : (_d.from = tx.from);
        if ((0, utils_1.isETH)(tx.token)) {
            if (!tx.overrides.value) {
                tx.overrides.value = tx.amount;
            }
            const passedValue = ethers_1.BigNumber.from(tx.overrides.value);
            if (!passedValue.eq(tx.amount)) {
                // To avoid users shooting themselves into the foot, we will always use the amount to withdraw
                // as the value
                throw new Error('The tx.value is not equal to the value withdrawn!');
            }
            const ethL2Token = IEthTokenFactory_1.IEthTokenFactory.connect(utils_1.L2_ETH_TOKEN_ADDRESS, this);
            const populatedTx = await ethL2Token.populateTransaction.withdraw(tx.to, tx.overrides);
            if (tx.paymasterParams) {
                return {
                    ...populatedTx,
                    customData: {
                        paymasterParams: tx.paymasterParams,
                    },
                };
            }
            return populatedTx;
        }
        if (!tx.bridgeAddress) {
            const bridgeAddresses = await this.getDefaultBridgeAddresses();
            const l2WethBridge = Il2BridgeFactory_1.Il2BridgeFactory.connect(bridgeAddresses.wethL2, this);
            let l1WethToken = ethers_1.ethers.constants.AddressZero;
            try {
                l1WethToken = await l2WethBridge.l1TokenAddress(tx.token);
            }
            catch (e) {
                // skip
            }
            tx.bridgeAddress =
                l1WethToken !== ethers_1.ethers.constants.AddressZero
                    ? bridgeAddresses.wethL2
                    : bridgeAddresses.erc20L2;
        }
        const bridge = Il2BridgeFactory_1.Il2BridgeFactory.connect(tx.bridgeAddress, this);
        const populatedTx = await bridge.populateTransaction.withdraw(tx.to, tx.token, tx.amount, tx.overrides);
        if (tx.paymasterParams) {
            return {
                ...populatedTx,
                customData: {
                    paymasterParams: tx.paymasterParams,
                },
            };
        }
        return populatedTx;
    }
    /**
     * Returns the gas estimation for a withdrawal transaction.
     *
     * @param transaction The transaction details.
     * @param transaction.token The token address.
     * @param transaction.amount The amount of token.
     * @param [transaction.from] The sender's address.
     * @param [transaction.to] The recipient's address.
     * @param [transaction.bridgeAddress] The bridge address.
     * @param [transaction.paymasterParams] Paymaster parameters.
     * @param [transaction.overrides] Transaction overrides including `gasLimit`, `gasPrice`, and `value`.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const gasWithdraw = await provider.estimateGasWithdraw({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000,
     *   to: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     * });
     * console.log(`Gas for withdrawal tx: ${gasWithdraw}`);
     */
    async estimateGasWithdraw(transaction) {
        const withdrawTx = await this.getWithdrawTx(transaction);
        return await this.estimateGas(withdrawTx);
    }
    /**
     * Returns the populated transfer transaction.
     *
     * @param transaction Transfer transaction request.
     * @param transaction.to The address of the recipient.
     * @param transaction.amount The amount of the token to transfer.
     * @param [transaction.token] The address of the token. Defaults to ETH.
     * @param [transaction.paymasterParams] Paymaster parameters.
     * @param [transaction.overrides] Transaction's overrides which may be used to pass L2 `gasLimit`, `gasPrice`, `value`, etc.
     *
     * @example Retrieve populated ETH transfer transaction.
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     *
     * const tx = await provider.getTransferTx({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000_000,
     *   to: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     * });
     * console.log(`Transfer tx: ${tx}`);
     *
     * @example Retrieve populated ETH transfer transaction using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const token = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * const paymaster = "0x13D0D8550769f59aa241a41897D4859c87f7Dd46"; // Paymaster for Crown token
     *
     * const tx = await provider.getTransferTx({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000_000,
     *   to: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: "ApprovalBased",
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     * console.log(`Transfer tx: ${tx}`);
     */
    async getTransferTx(transaction) {
        var _a, _b;
        var _c;
        const { ...tx } = transaction;
        (_a = tx.overrides) !== null && _a !== void 0 ? _a : (tx.overrides = {});
        (_b = (_c = tx.overrides).from) !== null && _b !== void 0 ? _b : (_c.from = tx.from);
        if (!tx.token || tx.token === utils_1.ETH_ADDRESS) {
            if (tx.paymasterParams) {
                return {
                    ...(await ethers_1.ethers.utils.resolveProperties(tx.overrides)),
                    type: utils_1.EIP712_TX_TYPE,
                    to: tx.to,
                    value: tx.amount,
                    customData: {
                        paymasterParams: tx.paymasterParams,
                    },
                };
            }
            return {
                ...(await ethers_1.ethers.utils.resolveProperties(tx.overrides)),
                to: tx.to,
                value: tx.amount,
            };
        }
        else {
            const token = Ierc20Factory_1.Ierc20Factory.connect(tx.token, this);
            const populatedTx = await token.populateTransaction.transfer(tx.to, tx.amount, tx.overrides);
            if (tx.paymasterParams) {
                return {
                    ...populatedTx,
                    customData: {
                        paymasterParams: tx.paymasterParams,
                    },
                };
            }
            return populatedTx;
        }
    }
    /**
     * Returns the gas estimation for a transfer transaction.
     *
     * @param transaction Transfer transaction request.
     * @param transaction.to The address of the recipient.
     * @param transaction.amount The amount of the token to transfer.
     * @param [transaction.token] The address of the token. Defaults to ETH.
     * @param [transaction.paymasterParams] Paymaster parameters.
     * @param [transaction.overrides] Transaction's overrides which may be used to pass L2 `gasLimit`, `gasPrice`, `value`, etc.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const gasTransfer = await provider.estimateGasTransfer({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000_000,
     *   to: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     * });
     * console.log(`Gas for transfer tx: ${gasTransfer}`);
     */
    async estimateGasTransfer(transaction) {
        const transferTx = await this.getTransferTx(transaction);
        return await this.estimateGas(transferTx);
    }
    /**
     * Creates a new `Provider` from provided URL or network name.
     * The URL can be configured using `ZKSYNC_WEB3_API_URL` environment variable.
     * @param zksyncNetwork The type of zkSync network.
     */
    static getDefaultProvider(zksyncNetwork = types_1.Network.Localhost) {
        if (process.env.ZKSYNC_WEB3_API_URL) {
            return new Provider(process.env.ZKSYNC_WEB3_API_URL);
        }
        switch (zksyncNetwork) {
            case types_1.Network.Localhost:
                return new Provider('http://localhost:3050');
            case types_1.Network.Goerli:
                return new Provider('https://zksync2-testnet.zksync.dev');
            case types_1.Network.Sepolia:
                return new Provider('https://sepolia.era.zksync.dev');
            case types_1.Network.Mainnet:
                return new Provider('https://mainnet.era.zksync.io');
            default:
                return new Provider('http://localhost:3050');
        }
    }
    /**
     * Returns a new filter by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_newFilter}
     * and passing a filter object.
     *
     * @param filter The filter query to apply.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(
     *   `New filter: ${await provider.newFilter({
     *     fromBlock: 0,
     *     toBlock: 5,
     *     address: utils.L2_ETH_TOKEN_ADDRESS,
     *   })}`
     * );
     */
    async newFilter(filter) {
        filter = await filter;
        const id = await this.send('eth_newFilter', [this._prepareFilter(filter)]);
        return ethers_1.BigNumber.from(id);
    }
    /**
     * Returns a new block filter by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_newBlockFilter}.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`New block filter: ${await provider.newBlockFilter()}`);
     */
    async newBlockFilter() {
        const id = await this.send('eth_newBlockFilter', []);
        return ethers_1.BigNumber.from(id);
    }
    /**
     * Returns a new pending transaction filter by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_newPendingTransactionFilter}.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`New pending transaction filter: ${await provider.newPendingTransactionsFilter()}`);
     */
    async newPendingTransactionsFilter() {
        const id = await this.send('eth_newPendingTransactionFilter', []);
        return ethers_1.BigNumber.from(id);
    }
    /**
     * Returns an array of logs by calling {@link https://ethereum.github.io/execution-apis/api-documentation/ eth_getFilterChanges}.
     *
     * @param idx The filter index.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const filter = await provider.newFilter({
     *   address: utils.L2_ETH_TOKEN_ADDRESS,
     *   topics: [ethers.id("Transfer(address,address,uint256)")],
     * });
     * const result = await provider.getFilterChanges(filter);
     */
    async getFilterChanges(idx) {
        const logs = await this.send('eth_getFilterChanges', [idx.toHexString()]);
        return typeof logs[0] === 'string' ? logs : this._parseLogs(logs);
    }
    /**
     * Resolves to the list of Logs that match `filter`.
     *
     * @param filter The filter criteria to apply.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * console.log(`Logs: ${utils.toJSON(await provider.getLogs({ fromBlock: 0, toBlock: 5, address: utils.L2_ETH_TOKEN_ADDRESS }))}`);
     */
    async getLogs(filter = {}) {
        filter = await filter;
        const logs = await this.send('eth_getLogs', [this._prepareFilter(filter)]);
        return this._parseLogs(logs);
    }
    _parseLogs(logs) {
        return Formatter.arrayOf(this.formatter.filterLog.bind(this.formatter))(logs);
    }
    _prepareFilter(filter) {
        return {
            ...filter,
            fromBlock: filter.fromBlock
                ? this.formatter.blockTag(filter.fromBlock)
                : null,
            toBlock: filter.fromBlock
                ? this.formatter.blockTag(filter.toBlock)
                : null,
        };
    }
    _wrapTransaction(tx, hash) {
        const response = super._wrapTransaction(tx, hash);
        response.waitFinalize = async () => {
            const receipt = await response.wait();
            // eslint-disable-next-line no-constant-condition
            while (true) {
                const block = await this.getBlock('finalized');
                if (receipt.blockNumber <= block.number) {
                    return await this.getTransactionReceipt(receipt.transactionHash);
                }
                else {
                    await (0, utils_1.sleep)(this.pollingInterval);
                }
            }
        };
        return response;
    }
    /**
     * Returns the status of a specified transaction.
     *
     * @param txHash The hash of the transaction.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     *
     * const TX_HASH = "<YOUR_TX_HASH_ADDRESS>";
     * console.log(`Transaction status: ${utils.toJSON(await provider.getTransactionStatus(TX_HASH))}`);
     */
    // This is inefficient. Status should probably be indicated in the transaction receipt.
    async getTransactionStatus(txHash) {
        const tx = await this.getTransaction(txHash);
        if (!tx) {
            return types_1.TransactionStatus.NotFound;
        }
        if (!tx.blockNumber) {
            return types_1.TransactionStatus.Processing;
        }
        const verifiedBlock = await this.getBlock('finalized');
        if (tx.blockNumber <= verifiedBlock.number) {
            return types_1.TransactionStatus.Finalized;
        }
        return types_1.TransactionStatus.Committed;
    }
    /**
     * Resolves to the transaction for `hash`.
     * If the transaction is unknown or on pruning nodes which discard old transactions this resolves to `null`.
     *
     * @param [hash] The hash of the transaction.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     *
     * const TX_HASH = "<YOUR_TX_HASH_ADDRESS>";
     * const txHandle = await provider.getTransaction(TX_HASH);
     *
     * // Wait until the transaction is processed by the server.
     * await txHandle.wait();
     * // Wait until the transaction is finalized.
     * await txHandle.waitFinalize();
     */
    async getTransaction(hash) {
        hash = await hash;
        const tx = await super.getTransaction(hash);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return tx ? this._wrapTransaction(tx, hash) : null;
    }
    /**
     * Broadcasts the `transaction` to the network, adding it to the memory pool of any node for which the transaction
     * meets the rebroadcast requirements.
     *
     * @param transaction The signed transaction that needs to be broadcasted.
     * @returns A promise that resolves with the transaction response.
     */
    async sendTransaction(transaction) {
        return (await super.sendTransaction(transaction));
    }
    /**
     * Returns a L2 transaction response from L1 transaction response.
     *
     * @param l1TxResponse The L1 transaction response.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const l1Tx = "0xcca5411f3e514052f4a4ae1c2020badec6e0998adb52c09959c5f5ff15fba3a8";
     * const l1TxResponse = await ethProvider.getTransaction(l1Tx);
     * if (l1TxResponse) {
     *   console.log(`Tx: ${utils.toJSON(await provider.getL2TransactionFromPriorityOp(l1TxResponse))}`);
     * }
     */
    async getL2TransactionFromPriorityOp(l1TxResponse) {
        const receipt = await l1TxResponse.wait();
        const l2Hash = (0, utils_1.getL2HashFromPriorityOp)(receipt, await this.getMainContractAddress());
        let status = null;
        do {
            status = await this.getTransactionStatus(l2Hash);
            await (0, utils_1.sleep)(this.pollingInterval);
        } while (status === types_1.TransactionStatus.NotFound);
        return await this.getTransaction(l2Hash);
    }
    /**
     * Returns a {@link PriorityOpResponse} from L1 transaction response.
     *
     * @param l1TxResponse The L1 transaction response.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const l1Tx = "0xcca5411f3e514052f4a4ae1c2020badec6e0998adb52c09959c5f5ff15fba3a8";
     * const l1TxResponse = await ethProvider.getTransaction(l1Tx);
     * if (l1TxResponse) {
     *   console.log(`Tx: ${utils.toJSON(await provider.getPriorityOpResponse(l1TxResponse))}`);
     * }
     */
    async getPriorityOpResponse(l1TxResponse) {
        const l2Response = { ...l1TxResponse };
        l2Response.waitL1Commit = l2Response.wait;
        l2Response.wait = async () => {
            const l2Tx = await this.getL2TransactionFromPriorityOp(l1TxResponse);
            return await l2Tx.wait();
        };
        l2Response.waitFinalize = async () => {
            const l2Tx = await this.getL2TransactionFromPriorityOp(l1TxResponse);
            return await l2Tx.waitFinalize();
        };
        return l2Response;
    }
    /**
     * Returns the version of the supported account abstraction and nonce ordering from a given contract address.
     *
     * @param address The contract address.
     *
     * @example
     *
     * import { Provider, types, utils } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const tokenAddress = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * console.log(`Contract account info: ${utils.toJSON(await provider.getContractAccountInfo(tokenAddress))}`);
     */
    async getContractAccountInfo(address) {
        const deployerContract = new ethers_1.Contract(utils_1.CONTRACT_DEPLOYER_ADDRESS, utils_1.CONTRACT_DEPLOYER, this);
        const data = await deployerContract.getAccountInfo(address);
        return {
            supportedAAVersion: data.supportedAAVersion,
            nonceOrdering: data.nonceOrdering,
        };
    }
    /**
     * Returns gas estimation for an L1 to L2 execute operation.
     *
     * @param transaction The transaction details.
     * @param transaction.contractAddress The address of the contract.
     * @param transaction.calldata The transaction call data.
     * @param [transaction.caller] The caller's address.
     * @param [transaction.l2Value] The current L2 gas value.
     * @param [transaction.factoryDeps] An array of bytes containing contract bytecode.
     * @param [transaction.gasPerPubdataByte] The current gas per byte value.
     * @param [transaction.overrides] Transaction overrides including `gasLimit`, `gasPrice`, and `value`.
     *
     * @example
     *
     * import { Provider, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const gasL1ToL2 = await provider.estimateL1ToL2Execute({
     *   contractAddress: await provider.getMainContractAddress(),
     *   calldata: "0x",
     *   caller: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   l2Value: 7_000_000_000,
     * });
     * console.log(`Gas L1 to L2: ${gasL1ToL2}`);
     */
    // TODO (EVM-3): support refundRecipient for fee estimation
    async estimateL1ToL2Execute(transaction) {
        var _a, _b;
        (_a = transaction.gasPerPubdataByte) !== null && _a !== void 0 ? _a : (transaction.gasPerPubdataByte = utils_1.REQUIRED_L1_TO_L2_GAS_PER_PUBDATA_LIMIT);
        // If the `from` address is not provided, we use a random address, because
        // due to storage slot aggregation, the gas estimation will depend on the address
        // and so estimation for the zero address may be smaller than for the sender.
        (_b = transaction.caller) !== null && _b !== void 0 ? _b : (transaction.caller = ethers_1.ethers.Wallet.createRandom().address);
        const customData = {
            gasPerPubdataByte: transaction.gasPerPubdataByte,
        };
        if (transaction.factoryDeps) {
            Object.assign(customData, { factoryDeps: transaction.factoryDeps });
        }
        return await this.estimateGasL1({
            from: transaction.caller,
            data: transaction.calldata,
            to: transaction.contractAddress,
            value: transaction.l2Value,
            customData,
        });
    }
}
exports.Provider = Provider;
Provider._nextPollId = 1;
/* c8 ignore start */
/**
 * A `Web3Provider` extends {@link ExternalProvider} and includes additional features for interacting with zkSync Era.
 * It supports RPC endpoints within the `zks` namespace.
 * This provider is designed for frontend use in a browser environment and integration for browser wallets
 * (e.g., MetaMask, WalletConnect).
 */
class Web3Provider extends Provider {
    /**
     * Connects to the `ethereum` provider, optionally forcing the `network`.
     *
     * @param provider The provider injected from the browser. For instance, Metamask is `window.ethereum`.
     * @param [network] The network name, chain ID, or object with network details.
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     */
    constructor(provider, network) {
        if (!provider) {
            throw new Error('Missing provider!');
        }
        if (!provider.request) {
            throw new Error('Provider must implement eip-1193!');
        }
        const path = provider.host ||
            provider.path ||
            (provider.isMetaMask ? 'metamask' : 'eip-1193:');
        super(path, network);
        this.provider = provider;
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const TX_HASH = "<YOUR_TX_HASH_ADDRESS>";
     * console.log(`Transaction receipt: ${utils.toJSON(await provider.getTransactionReceipt(TX_HASH))}`);
     */
    async getTransactionReceipt(txHash) {
        return super.getTransactionReceipt(txHash);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     *
     * const TX_HASH = "<YOUR_TX_HASH_ADDRESS>";
     * const txHandle = await provider.getTransaction(TX_HASH);
     *
     * // Wait until the transaction is processed by the server.
     * await txHandle.wait();
     * // Wait until the transaction is finalized.
     * await txHandle.waitFinalize();
     */
    async getTransaction(txHash) {
        return super.getTransaction(txHash);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`Block: ${utils.toJSON(await provider.getBlock("latest", true))}`);
     */
    async getBlock(blockHashOrBlockTag) {
        return super.getBlock(blockHashOrBlockTag);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`Block: ${utils.toJSON(await provider.getBlockWithTransactions("latest", true))}`);
     */
    async getBlockWithTransactions(blockHashOrBlockTag) {
        return super.getBlockWithTransactions(blockHashOrBlockTag);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`Logs: ${utils.toJSON(await provider.getLogs({ fromBlock: 0, toBlock: 5, address: utils.L2_ETH_TOKEN_ADDRESS }))}`);
     */
    async getLogs(filter = {}) {
        return super.getLogs(filter);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const account = "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049";
     * const tokenAddress = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * console.log(`ETH balance: ${await provider.getBalance(account)}`);
     * console.log(`Token balance: ${await provider.getBalance(account, "latest", tokenAddress)}`);
     */
    async getBalance(address, blockTag, tokenAddress) {
        return super.getBalance(address, blockTag, tokenAddress);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`L2 token address: ${await provider.l2TokenAddress("0x5C221E77624690fff6dd741493D735a17716c26B")}`);
     */
    async l2TokenAddress(token) {
        return super.l2TokenAddress(token);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`L1 token address: ${await provider.l1TokenAddress("0x3e7676937A7E96CFB7616f255b9AD9FF47363D4b")}`);
     */
    async l1TokenAddress(token) {
        return super.l1TokenAddress(token);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const gasL1 = await provider.estimateGasL1({
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   to: await provider.getMainContractAddress(),
     *   value: 7_000_000_000,
     *   customData: {
     *     gasPerPubdata: 800,
     *   },
     * });
     * console.log(`L1 gas: ${gasL1}`);
     */
    async estimateGasL1(transaction) {
        return super.estimateGasL1(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const fee = await provider.estimateFee({
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   to: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
     *   value: BigNumber.from(7_000_000_000).toHexString(),
     * });
     * console.log(`Fee: ${utils.toJSON(fee)}`);
     */
    async estimateFee(transaction) {
        return super.estimateFee(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`Gas price: ${await provider.getGasPrice()}`);
     */
    async getGasPrice() {
        return super.getGasPrice();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * // Any L2 -> L1 transaction can be used.
     * // In this case, withdrawal transaction is used.
     * const tx = "0x2a1c6c74b184965c0cb015aae9ea134fd96215d2e4f4979cfec12563295f610e";
     * console.log(`Log ${utils.toJSON(await provider.getLogProof(tx, 0))}`);
     */
    async getLogProof(txHash, index) {
        return super.getLogProof(txHash, index);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const l1BatchNumber = await provider.getL1BatchNumber();
     * console.log(`L1 batch block range: ${utils.toJSON(await provider.getL1BatchBlockRange(l1BatchNumber))}`);
     */
    async getL1BatchBlockRange(l1BatchNumber) {
        return super.getL1BatchBlockRange(l1BatchNumber);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`Main contract: ${await provider.getMainContractAddress()}`);
     */
    async getMainContractAddress() {
        return super.getMainContractAddress();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`Testnet paymaster: ${await provider.getTestnetPaymasterAddress()}`);
     */
    async getTestnetPaymasterAddress() {
        return super.getTestnetPaymasterAddress();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const balances = await provider.getAllAccountBalances("0x36615Cf349d7F6344891B1e7CA7C72883F5dc049");
     * console.log(`All balances: ${utils.toJSON(balances)}`);
     */
    async getAllAccountBalances(address) {
        return super.getAllAccountBalances(address);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const l1ChainId = await provider.l1ChainId();
     * console.log(`All balances: ${l1ChainId}`);
     */
    async l1ChainId() {
        return super.l1ChainId();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`L1 batch number: ${await provider.getL1BatchNumber()}`);
     */
    async getL1BatchNumber() {
        return super.getL1BatchNumber();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const l1BatchNumber = await provider.getL1BatchNumber();
     * console.log(`L1 batch details: ${utils.toJSON(await provider.getL1BatchDetails(l1BatchNumber))}`);
     */
    async getL1BatchDetails(number) {
        return super.getL1BatchDetails(number);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`Block details: ${utils.toJSON(await provider.getBlockDetails(90_000))}`);
     */
    async getBlockDetails(number) {
        return super.getBlockDetails(number);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     *
     * const TX_HASH = "<YOUR_TX_HASH_ADDRESS>";
     * console.log(`Transaction details: ${utils.toJSON(await provider.getTransactionDetails(TX_HASH))}`);
     */
    async getTransactionDetails(txHash) {
        return super.getTransactionDetails(txHash);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * // Bytecode hash can be computed by following these steps:
     * // const testnetPaymasterBytecode = await provider.getCode(await provider.getTestnetPaymasterAddress());
     * // const testnetPaymasterBytecodeHash = ethers.utils.hexlify(utils.hashBytecode(testnetPaymasterBytecode));
     *
     * const testnetPaymasterBytecodeHash = "0x010000f16d2b10ddeb1c32f2c9d222eb1aea0f638ec94a81d4e916c627720e30";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`Bytecode: ${await provider.getBytecodeByHash(testnetPaymasterBytecodeHash)}`);
     */
    async getBytecodeByHash(bytecodeHash) {
        return super.getBytecodeByHash(bytecodeHash);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`Raw block transactions: ${utils.toJSON(await provider.getRawBlockTransactions(90_000))}`);
     */
    async getRawBlockTransactions(number) {
        return super.getRawBlockTransactions(number);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const address = "0x082b1BB53fE43810f646dDd71AA2AB201b4C6b04";
     *
     * // Fetching the storage proof for rawNonces storage slot in NonceHolder system contract.
     * // mapping(uint256 => uint256) internal rawNonces;
     *
     * // Ensure the address is a 256-bit number by padding it
     * // because rawNonces slot uses uint256 for mapping addresses and their nonces.
     * const addressPadded =  ethers.utils.hexZeroPad(address, 32);
     *
     * // Convert the slot number to a hex string and pad it to 32 bytes.
     * const slotPadded =  ethers.utils.hexZeroPad(ethers.utils.hexlify(0), 32);
     *
     * // Concatenate the padded address and slot number.
     * const concatenated = addressPadded + slotPadded.slice(2); // slice to remove '0x' from the slotPadded
     *
     * // Hash the concatenated string using Keccak-256.
     * const storageKey = ethers.utils.keccak256(concatenated);
     *
     * const l1BatchNumber = await provider.getL1BatchNumber();
     * const storageProof = await provider.getProof(utils.NONCE_HOLDER_ADDRESS, [storageKey], l1BatchNumber);
     * console.log(`Storage proof: ${utils.toJSON(storageProof)}`);
     */
    async getProof(address, keys, l1BatchNumber) {
        return super.getProof(address, keys, l1BatchNumber);
    }
    /**
     * @inheritDoc
     *
     * @example Retrieve populated ETH withdrawal transactions.
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     *
     * const tx = await provider.getWithdrawTx({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000_000,
     *   to: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     * });
     * console.log(`Withdrawal tx: ${tx}`);
     *
     * @example Retrieve populated ETH withdrawal transaction using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const token = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * const paymaster = "0x13D0D8550769f59aa241a41897D4859c87f7Dd46"; // Paymaster for Crown token
     *
     * const tx = await provider.getWithdrawTx({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000_000,
     *   to: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: "ApprovalBased",
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     * console.log(`Withdrawal tx: ${tx}`);
     */
    async getWithdrawTx(transaction) {
        return super.getWithdrawTx(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const gasWithdraw = await provider.estimateGasWithdraw({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000,
     *   to: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     * });
     * console.log(`Gas for withdrawal tx: ${gasWithdraw}`);
     */
    async estimateGasWithdraw(transaction) {
        return super.estimateGasWithdraw(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example Retrieve populated ETH transfer transaction.
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     *
     * const tx = await provider.getTransferTx({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000_000,
     *   to: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     * });
     * console.log(`Transfer tx: ${tx}`);
     *
     * @example Retrieve populated ETH transfer transaction using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const token = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * const paymaster = "0x13D0D8550769f59aa241a41897D4859c87f7Dd46"; // Paymaster for Crown token
     *
     * const tx = await provider.getTransferTx({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000_000,
     *   to: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   paymasterParams: utils.getPaymasterParams(paymaster, {
     *     type: "ApprovalBased",
     *     token: token,
     *     minimalAllowance: 1,
     *     innerInput: new Uint8Array(),
     *   }),
     * });
     * console.log(`Transfer tx: ${tx}`);
     */
    async getTransferTx(transaction) {
        return super.getTransferTx(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const gasTransfer = await provider.estimateGasTransfer({
     *   token: utils.ETH_ADDRESS,
     *   amount: 7_000_000_000,
     *   to: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     * });
     * console.log(`Gas for transfer tx: ${gasTransfer}`);
     */
    async estimateGasTransfer(transaction) {
        return super.estimateGasTransfer(transaction);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(
     *   `New filter: ${await provider.newFilter({
     *     fromBlock: 0,
     *     toBlock: 5,
     *     address: utils.L2_ETH_TOKEN_ADDRESS,
     *   })}`
     * );
     */
    async newFilter(filter) {
        return super.newFilter(filter);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`New block filter: ${await provider.newBlockFilter()}`);
     */
    async newBlockFilter() {
        return super.newBlockFilter();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * console.log(`New pending transaction filter: ${await provider.newPendingTransactionsFilter()}`);
     */
    async newPendingTransactionsFilter() {
        return super.newPendingTransactionsFilter();
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const filter = await provider.newFilter({
     *   address: utils.L2_ETH_TOKEN_ADDRESS,
     *   topics: [ethers.utils.id("Transfer(address,address,uint256)")],
     * });
     * const result = await provider.getFilterChanges(filter);
     */
    async getFilterChanges(idx) {
        return super.getFilterChanges(idx);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     *
     * const TX_HASH = "<YOUR_TX_HASH_ADDRESS>";
     * console.log(`Transaction status: ${utils.toJSON(await provider.getTransactionStatus(TX_HASH))}`);
     */
    async getTransactionStatus(txHash) {
        return super.getTransactionStatus(txHash);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const l1Tx = "0xcca5411f3e514052f4a4ae1c2020badec6e0998adb52c09959c5f5ff15fba3a8";
     * const l1TxResponse = await ethProvider.getTransaction(l1Tx);
     * if (l1TxResponse) {
     *   console.log(`Tx: ${utils.toJSON(await provider.getL2TransactionFromPriorityOp(l1TxResponse))}`);
     * }
     */
    async getL2TransactionFromPriorityOp(l1TxResponse) {
        return super.getL2TransactionFromPriorityOp(l1TxResponse);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const l1Tx = "0xcca5411f3e514052f4a4ae1c2020badec6e0998adb52c09959c5f5ff15fba3a8";
     * const l1TxResponse = await ethProvider.getTransaction(l1Tx);
     * if (l1TxResponse) {
     *   console.log(`Tx: ${utils.toJSON(await provider.getPriorityOpResponse(l1TxResponse))}`);
     * }
     */
    async getPriorityOpResponse(l1TxResponse) {
        return super.getPriorityOpResponse(l1TxResponse);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider, utils } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const tokenAddress = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * console.log(`Contract account info: ${utils.toJSON(await provider.getContractAccountInfo(tokenAddress))}`);
     */
    async getContractAccountInfo(address) {
        return super.getContractAccountInfo(address);
    }
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const gasL1ToL2 = await provider.estimateL1ToL2Execute({
     *   contractAddress: await provider.getMainContractAddress(),
     *   calldata: "0x",
     *   caller: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   l2Value: 7_000_000_000,
     * });
     * console.log(`Gas L1 to L2: ${gasL1ToL2}`);
     */
    async estimateL1ToL2Execute(transaction) {
        return super.estimateL1ToL2Execute(transaction);
    }
    async send(method, params) {
        params !== null && params !== void 0 ? params : (params = []);
        // Metamask complains about eth_sign (and on some versions hangs)
        if (method === 'eth_sign' &&
            (this.provider.isMetaMask || this.provider.isStatus)) {
            // https://github.com/ethereum/go-ethereum/wiki/Management-APIs#personal_sign
            method = 'personal_sign';
            params = [params[1], params[0]];
        }
        return await this.provider.request({ method, params });
    }
    /**
     * Resolves to the `Signer` account for `address` managed by the client.
     * If the `address` is a number, it is used as an index in the accounts from `listAccounts`.
     * This can only be used on clients which manage accounts (e.g. MetaMask).
     *
     * @param addressOrIndex The address or index of the account to retrieve the signer for.
     *
     * @throws {Error} If the account doesn't exist.
     */
    getSigner(addressOrIndex) {
        return signer_1.Signer.from(super.getSigner(addressOrIndex));
    }
    async estimateGas(transaction) {
        const gas = await super.estimateGas(transaction);
        const metamaskMinimum = ethers_1.BigNumber.from(21000);
        const isEIP712 = transaction.customData || transaction.type === utils_1.EIP712_TX_TYPE;
        return gas.gt(metamaskMinimum) || isEIP712 ? gas : metamaskMinimum;
    }
}
exports.Web3Provider = Web3Provider;
/* c8 ignore stop */
//# sourceMappingURL=provider.js.map