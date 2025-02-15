import { BigNumber, BigNumberish, BytesLike, ethers, Overrides } from 'ethers';
import { Provider } from './provider';
import { Address, BalancesMap, BlockTag, FinalizeWithdrawalParams, FullDepositFee, PaymasterParams, PriorityOpResponse, Signature, TransactionRequest, TransactionResponse } from './types';
import { TypedDataSigner } from '@ethersproject/abstract-signer';
import { Il2Bridge } from '../typechain/Il2Bridge';
import { IZkSync } from '../typechain/IZkSync';
import { Il1Bridge } from '../typechain/Il1Bridge';
/**
 * All typed data conforming to the EIP712 standard within zkSync Era.
 */
export declare const EIP712_TYPES: {
    Transaction: {
        name: string;
        type: string;
    }[];
};
/**
 * A `EIP712Signer` provides support for signing EIP712-typed zkSync Era transactions.
 */
export declare class EIP712Signer {
    private ethSigner;
    private eip712Domain;
    constructor(ethSigner: ethers.Signer & TypedDataSigner, chainId: number | Promise<number>);
    /**
     * Generates the EIP712 typed data from provided transaction. Optional fields are populated by zero values.
     *
     * @param transaction The transaction request that needs to be populated.
     *
     * @example
     *
     * const tx = EIP712Signer.getSignInput({
     *   type: utils.EIP712_TX_TYPE,
     *   to: "0xa61464658AfeAf65CccaaFD3a512b69A83B77618",
     *   value: BigNumber.from(7_000_000),
     *   from: "0x36615Cf349d7F6344891B1e7CA7C72883F5dc049",
     *   nonce: 0,
     *   chainId: 270,
     *   gasPrice: BigNumber.from(250_000_000),
     *   gasLimit: BigNumber.from(21_000),
     *   customData: {},
     * });
     */
    static getSignInput(transaction: TransactionRequest): {
        txType: number | undefined;
        from: string | undefined;
        to: string | undefined;
        gasLimit: BigNumberish;
        gasPerPubdataByteLimit: BigNumberish;
        maxFeePerGas: BigNumberish;
        maxPriorityFeePerGas: BigNumberish;
        paymaster: string;
        nonce: BigNumberish;
        value: BigNumberish;
        data: BytesLike;
        factoryDeps: Uint8Array[];
        paymasterInput: BytesLike;
    };
    /**
     * Signs a transaction request using EIP712
     *
     * @param transaction The transaction request that needs to be signed.
     * @returns A promise that resolves to the signature of the transaction.
     */
    sign(transaction: TransactionRequest): Promise<Signature>;
    /**
     * Hashes the transaction request using EIP712.
     *
     * @param transaction The transaction request that needs to be hashed.
     * @returns A hash (digest) of the transaction request.
     *
     * @throws {Error} If `transaction.chainId` is not set.
     */
    static getSignedDigest(transaction: TransactionRequest): ethers.BytesLike;
    /**
     * Returns zkSync Era EIP712 domain.
     */
    getDomain(): Promise<ethers.TypedDataDomain>;
}
declare const Signer_base: {
    new (...args: any[]): {
        _providerL2(): Provider;
        _signerL2(): ethers.Signer;
        getBalance(token?: string | undefined, blockTag?: BlockTag): Promise<BigNumber>;
        getAllBalances(): Promise<BalancesMap>;
        getDeploymentNonce(): Promise<BigNumber>;
        getL2BridgeContracts(): Promise<{
            erc20: Il2Bridge;
            weth: Il2Bridge;
        }>;
        _fillCustomData(data: import("./types").Eip712Meta): import("./types").Eip712Meta;
        withdraw(transaction: {
            token: string;
            amount: BigNumberish;
            to?: string | undefined;
            bridgeAddress?: string | undefined;
            paymasterParams?: PaymasterParams | undefined;
            overrides?: ethers.Overrides | undefined;
        }): Promise<TransactionResponse>;
        transfer(transaction: {
            to: string;
            amount: BigNumberish;
            token?: string | undefined;
            paymasterParams?: PaymasterParams | undefined;
            overrides?: ethers.Overrides | undefined;
        }): Promise<TransactionResponse>;
        sendTransaction(tx: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse>;
        getAddress(): Promise<string>;
    };
} & typeof ethers.providers.JsonRpcSigner;
/**
 * A `Signer` is designed for frontend use with browser wallet injection (e.g., MetaMask),
 * providing only L2 operations.
 *
 * @see {@link L1Signer} for L1 operations.
 *
 */
export declare class Signer extends Signer_base {
    provider: Provider;
    eip712: EIP712Signer;
    _signerL2(): this;
    _providerL2(): Provider;
    /**
     * @inheritDoc
     *
     * @example Get ETH balance
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const signer = provider.getSigner();
     *
     * console.log(`ETH balance: ${await signer.getBalance()}`);
     *
     * @example Get token balance
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const signer = provider.getSigner();
     *
     * const token = "0x6a4Fb925583F7D4dF82de62d98107468aE846FD1";
     *
     * console.log(`Token balance: ${await signer.getBalance(token)}`);
     */
    getBalance(token?: Address, blockTag?: BlockTag): Promise<BigNumber>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const signer = provider.getSigner();
     *
     * const allBalances = await signer.getAllBalances();
     */
    getAllBalances(): Promise<BalancesMap>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const signer = provider.getSigner();
     *
     * console.log(`Nonce: ${await signer.getDeploymentNonce()}`);
     */
    getDeploymentNonce(): Promise<BigNumber>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const signer = provider.getSigner();
     *
     * const l2BridgeContracts = await signer.getL2BridgeContracts();
     */
    getL2BridgeContracts(): Promise<{
        erc20: Il2Bridge;
        weth: Il2Bridge;
    }>;
    /**
     * @inheritDoc
     *
     * @example Withdraw ETH
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const signer = provider.getSigner();
     *
     * const tokenL2 = "0x6a4Fb925583F7D4dF82de62d98107468aE846FD1";
     * const tokenWithdrawHandle = await signer.withdraw({
     *   token: tokenL2,
     *   amount: 10_000_000,
     * });
     *
     * @example Withdraw ETH using paymaster to facilitate fee payment with an ERC20 token.
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const token = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * const paymaster = "0x13D0D8550769f59aa241a41897D4859c87f7Dd46"; // Paymaster for Crown token
     *
     * const provider = new Web3Provider(window.ethereum);
     * const signer = provider.getSigner();
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
    withdraw(transaction: {
        token: Address;
        amount: BigNumberish;
        to?: Address;
        bridgeAddress?: Address;
        paymasterParams?: PaymasterParams;
        overrides?: Overrides;
    }): Promise<TransactionResponse>;
    /**
     * @inheritDoc
     *
     * @example Transfer ETH
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const signer = provider.getSigner();
     *
     * const transferHandle = signer.transfer({
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
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const token = "0x927488F48ffbc32112F1fF721759649A89721F8F"; // Crown token which can be minted for free
     * const paymaster = "0x13D0D8550769f59aa241a41897D4859c87f7Dd46"; // Paymaster for Crown token
     *
     * const provider = new Web3Provider(window.ethereum);
     * const signer = provider.getSigner();
     *
     * const transferHandle = signer.transfer({
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
    transfer(transaction: {
        to: Address;
        amount: BigNumberish;
        token?: Address;
        paymasterParams?: PaymasterParams;
        overrides?: Overrides;
    }): Promise<TransactionResponse>;
    /**
     * Creates a new Singer with provided `signer`.
     *
     * @param signer  The signer from browser wallet.
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const signer = Signer.from(provider.getSigner() as any);
     */
    static from(signer: ethers.providers.JsonRpcSigner & {
        provider: Provider;
    }): Signer;
    /**
     * Get the number of transactions ever sent for account, which is used as the `nonce` when sending a transaction.
     *
     * @param [blockTag] The block tag to query. If provided, the transaction count is as of that block.
     *
     * @example
     *
     * import { Web3Provider } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new Web3Provider(window.ethereum);
     * const signer = provider.getSigner();
     *
     * const nonce = await signer.getNonce();
     */
    getNonce(blockTag?: BlockTag): Promise<number>;
    /**
     * Broadcast the transaction to the network.
     *
     * @param transaction The transaction request that needs to be broadcast to the network.
     *
     * @throws {Error} If `transaction.from` is mismatched from the private key.
     */
    sendTransaction(transaction: TransactionRequest): Promise<TransactionResponse>;
}
declare const L1Signer_base: {
    new (...args: any[]): {
        _providerL2(): Provider;
        _providerL1(): ethers.providers.Provider;
        _signerL1(): ethers.Signer;
        getMainContract(): Promise<IZkSync>;
        getL1BridgeContracts(): Promise<{
            erc20: Il1Bridge;
            weth: Il1Bridge;
        }>;
        getBalanceL1(token?: string | undefined, blockTag?: ethers.providers.BlockTag | undefined): Promise<BigNumber>;
        getAllowanceL1(token: string, bridgeAddress?: string | undefined, blockTag?: ethers.providers.BlockTag | undefined): Promise<BigNumber>;
        l2TokenAddress(token: string): Promise<string>;
        /**
         * @inheritDoc
         *
         * @example
         *
         * import { Web3Provider } from "zksync-ethers";
         * import { ethers } from "ethers";
         *
         * const provider = new Web3Provider(window.ethereum);
         * const signer = provider.getSigner();
         *
         * const allBalances = await signer.getAllBalances();
         */
        approveERC20(token: string, amount: BigNumberish, overrides?: (ethers.Overrides & {
            bridgeAddress?: string | undefined;
        }) | undefined): Promise<ethers.providers.TransactionResponse>;
        getBaseCost(params: {
            gasLimit: BigNumberish;
            gasPerPubdataByte?: BigNumberish | undefined;
            gasPrice?: BigNumberish | undefined;
        }): Promise<BigNumber>;
        deposit(transaction: {
            token: string;
            amount: BigNumberish;
            to?: string | undefined;
            operatorTip?: BigNumberish | undefined;
            bridgeAddress?: string | undefined;
            approveERC20?: boolean | undefined;
            l2GasLimit?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
            approveOverrides?: ethers.Overrides | undefined;
            customBridgeData?: BytesLike | undefined;
        }): Promise<PriorityOpResponse>;
        estimateGasDeposit(transaction: {
            token: string;
            amount: BigNumberish;
            to?: string | undefined;
            operatorTip?: BigNumberish | undefined;
            bridgeAddress?: string | undefined;
            customBridgeData?: BytesLike | undefined;
            l2GasLimit?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<BigNumber>;
        getDepositTx(transaction: {
            token: string;
            amount: BigNumberish;
            to?: string | undefined;
            operatorTip?: BigNumberish | undefined;
            bridgeAddress?: string | undefined;
            l2GasLimit?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            customBridgeData?: BytesLike | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<any>;
        getFullRequiredDepositFee(transaction: {
            token: string;
            to?: string | undefined;
            bridgeAddress?: string | undefined;
            customBridgeData?: BytesLike | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<FullDepositFee>;
        _getWithdrawalLog(withdrawalHash: BytesLike, index?: number): Promise<{
            log: import("./types").Log;
            l1BatchTxId: number;
        }>;
        _getWithdrawalL2ToL1Log(withdrawalHash: BytesLike, index?: number): Promise<{
            l2ToL1LogIndex: number;
            l2ToL1Log: import("./types").L2ToL1Log;
        }>;
        finalizeWithdrawalParams(withdrawalHash: BytesLike, index?: number): Promise<FinalizeWithdrawalParams>;
        finalizeWithdrawal(withdrawalHash: BytesLike, index?: number, overrides?: ethers.Overrides | undefined): Promise<ethers.ContractTransaction>;
        isWithdrawalFinalized(withdrawalHash: BytesLike, index?: number): Promise<boolean>;
        claimFailedDeposit(depositHash: BytesLike, overrides?: ethers.Overrides | undefined): Promise<ethers.ContractTransaction>;
        requestExecute(transaction: {
            contractAddress: string;
            calldata: BytesLike;
            l2GasLimit?: BigNumberish | undefined;
            l2Value?: BigNumberish | undefined;
            factoryDeps?: BytesLike[] | undefined;
            operatorTip?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<PriorityOpResponse>;
        estimateGasRequestExecute(transaction: {
            contractAddress: string;
            calldata: BytesLike;
            l2GasLimit?: BigNumberish | undefined;
            l2Value?: BigNumberish | undefined;
            factoryDeps?: BytesLike[] | undefined;
            operatorTip?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<BigNumber>;
        getRequestExecuteTx(transaction: {
            contractAddress: string;
            calldata: BytesLike;
            /**
             * Get the number of transactions ever sent for account, which is used as the `nonce` when sending a transaction.
             *
             * @param [blockTag] The block tag to query. If provided, the transaction count is as of that block.
             *
             * @example
             *
             * import { L1VoidSigner } from "zksync-ethers";
             * import { ethers } from "ethers";
             *
             * const ethProvider = ethers.getDefaultProvider("sepolia");
             * const signer = new L1VoidSigner("<ADDRESS>", ethProvider);
             *
             * const nonce = await signer.getNonce();
             */
            l2GasLimit?: BigNumberish | undefined;
            l2Value?: BigNumberish | undefined;
            factoryDeps?: BytesLike[] | undefined;
            operatorTip?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<ethers.PopulatedTransaction>;
        sendTransaction(tx: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse>;
        getAddress(): Promise<string>;
    };
} & typeof ethers.providers.JsonRpcSigner;
/**
 * A `L1Signer` is designed for frontend use with browser wallet injection (e.g., MetaMask),
 * providing only L1 operations.
 *
 * @see {@link Signer} for L2 operations.
 */
export declare class L1Signer extends L1Signer_base {
    providerL2: Provider;
    _providerL2(): Provider;
    _providerL1(): ethers.providers.JsonRpcProvider;
    _signerL1(): this;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const mainContract = await signer.getMainContract();
     * console.log(mainContract.address);
     */
    getMainContract(): Promise<IZkSync>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const l1BridgeContracts = await signer.getL1BridgeContracts();
     */
    getL1BridgeContracts(): Promise<{
        erc20: Il1Bridge;
        weth: Il1Bridge;
    }>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const tokenL1 = "0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be";
     *
     * // Getting token balance
     * console.log(await signer.getBalanceL1(tokenL1));
     *
     * // Getting ETH balance
     * console.log(await signer.getBalanceL1());
     */
    getBalanceL1(token?: Address, blockTag?: BlockTag): Promise<BigNumber>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const tokenL1 = "0x5C221E77624690fff6dd741493D735a17716c26B";
     * console.log(`Token allowance: ${await signer.getAllowanceL1(tokenL1)}`);
     */
    getAllowanceL1(token: Address, bridgeAddress?: Address, blockTag?: BlockTag): Promise<BigNumber>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const tokenL1 = "0x5C221E77624690fff6dd741493D735a17716c26B";
     *
     * console.log(`Token L2 address: ${await signer.l2TokenAddress(tokenL1)}`);
     */
    l2TokenAddress(token: Address): Promise<string>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * console.log(`Base cost: ${await signer.getBaseCost({ gasLimit: 100_000 })}`);
     */
    approveERC20(token: Address, amount: BigNumberish, overrides?: Overrides & {
        bridgeAddress?: Address;
    }): Promise<ethers.providers.TransactionResponse>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * console.log(`Base cost: ${await signer.getBaseCost({ gasLimit: 100_000 })}`);
     */
    getBaseCost(params: {
        gasLimit: BigNumberish;
        gasPerPubdataByte?: BigNumberish;
        gasPrice?: BigNumberish;
    }): Promise<BigNumber>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const tokenL1 = "0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be";
     * const tokenDepositHandle = await signer.deposit({
     *   token: tokenL1,
     *   amount: "10000000",
     *   approveERC20: true,
     * });
     * // Note that we wait not only for the L1 transaction to complete but also for it to be
     * // processed by zkSync. If we want to wait only for the transaction to be processed on L1,
     * // we can use `await tokenDepositHandle.waitL1Commit()`
     * await tokenDepositHandle.wait();
     *
     * const ethDepositHandle = await signer.deposit({
     *   token: utils.ETH_ADDRESS,
     *   amount: "10000000",
     * });
     * // Note that we wait not only for the L1 transaction to complete but also for it to be
     * // processed by zkSync. If we want to wait only for the transaction to be processed on L1,
     * // we can use `await ethDepositHandle.waitL1Commit()`
     * await ethDepositHandle.wait();
     */
    deposit(transaction: {
        token: Address;
        amount: BigNumberish;
        to?: Address;
        operatorTip?: BigNumberish;
        bridgeAddress?: Address;
        approveERC20?: boolean;
        l2GasLimit?: BigNumberish;
        gasPerPubdataByte?: BigNumberish;
        refundRecipient?: Address;
        overrides?: Overrides;
        approveOverrides?: Overrides;
        customBridgeData?: BytesLike;
    }): Promise<PriorityOpResponse>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const tokenL1 = "0x5C221E77624690fff6dd741493D735a17716c26B";
     * const gas = await signer.estimateGasDeposit({
     *   token: tokenL1,
     *   amount: "10000000",
     * });
     * console.log(`Gas: ${gas}`);
     */
    estimateGasDeposit(transaction: {
        token: Address;
        amount: BigNumberish;
        to?: Address;
        operatorTip?: BigNumberish;
        bridgeAddress?: Address;
        customBridgeData?: BytesLike;
        l2GasLimit?: BigNumberish;
        gasPerPubdataByte?: BigNumberish;
        refundRecipient?: Address;
        overrides?: Overrides;
    }): Promise<BigNumber>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const tokenL1 = "0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be";
     * const tx = await signer.getDepositTx({
     *   token: tokenL1,
     *   amount: "10000000",
     * });
     */
    getDepositTx(transaction: {
        token: Address;
        amount: BigNumberish;
        to?: Address;
        operatorTip?: BigNumberish;
        bridgeAddress?: Address;
        l2GasLimit?: BigNumberish;
        gasPerPubdataByte?: BigNumberish;
        customBridgeData?: BytesLike;
        refundRecipient?: Address;
        overrides?: Overrides;
    }): Promise<any>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const tokenL1 = "0x56E69Fa1BB0d1402c89E3A4E3417882DeA6B14Be";
     * const fee = await signer.getFullRequiredDepositFee({
     *   token: tokenL1,
     *   to: await wallet.getAddress(),
     * });
     * console.log(`Fee: ${fee}`);
     */
    getFullRequiredDepositFee(transaction: {
        token: Address;
        to?: Address;
        bridgeAddress?: Address;
        customBridgeData?: BytesLike;
        gasPerPubdataByte?: BigNumberish;
        overrides?: Overrides;
    }): Promise<FullDepositFee>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const CONTRACT_ADDRESS = "<CONTRACT_ADDRESS>";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const gasPrice = await signer.providerL1.getGasPrice();
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
     * const txCostPrice = await signer.getBaseCost({
     *   gasPrice,
     *   calldataLength: ethers.utils.arrayify(calldata).length,
     *   l2GasLimit,
     * });
     *
     * console.log(`Executing the transaction will cost ${ethers.utils.formatEther(txCostPrice)} ETH`);
     *
     * const executeTx = await signer.requestExecute({
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
    finalizeWithdrawalParams(withdrawalHash: BytesLike, index?: number): Promise<FinalizeWithdrawalParams>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const WITHDRAWAL_HASH = "<WITHDRAWAL_TX_HASH>";
     * const finalizeWithdrawHandle = await signer.finalizeWithdrawal(WITHDRAWAL_HASH);
     */
    finalizeWithdrawal(withdrawalHash: BytesLike, index?: number, overrides?: Overrides): Promise<ethers.ContractTransaction>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const WITHDRAWAL_HASH = "<WITHDRAWAL_TX_HASH>";
     * const isFinalized = await signer.isWithdrawalFinalized(WITHDRAWAL_HASH);
     */
    isWithdrawalFinalized(withdrawalHash: BytesLike, index?: number): Promise<boolean>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const FAILED_DEPOSIT_HASH = "<FAILED_DEPOSIT_TX_HASH>";
     * const claimFailedDepositHandle = await signer.claimFailedDeposit(FAILED_DEPOSIT_HASH);
     */
    claimFailedDeposit(depositHash: BytesLike, overrides?: Overrides): Promise<ethers.ContractTransaction>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const CONTRACT_ADDRESS = "<CONTRACT_ADDRESS>";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const gasPrice = await signer.providerL1.getGasPrice();
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
     * const txCostPrice = await signer.getBaseCost({
     *   gasPrice,
     *   calldataLength: ethers.utils.arrayify(calldata).length,
     *   l2GasLimit,
     * });
     *
     * console.log(`Executing the transaction will cost ${ethers.utils.formatEther(txCostPrice)} ETH`);
     *
     * const executeTx = await signer.requestExecute({
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
    requestExecute(transaction: {
        contractAddress: Address;
        calldata: string;
        l2GasLimit: BigNumberish;
        l2Value?: BigNumberish;
        factoryDeps?: BytesLike[];
        operatorTip?: BigNumberish;
        gasPerPubdataByte?: BigNumberish;
        refundRecipient?: Address;
        overrides?: Overrides;
    }): Promise<PriorityOpResponse>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const CONTRACT_ADDRESS = "<CONTRACT_ADDRESS>";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const gasPrice = await signer.providerL1.getGasPrice();
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
     * const txCostPrice = await signer.getBaseCost({
     *   gasPrice,
     *   calldataLength: ethers.utils.arrayify(calldata).length,
     *   l2GasLimit,
     * });
     *
     * console.log(`Executing the transaction will cost ${ethers.utils.formatEther(txCostPrice)} ETH`);
     *
     * const executeTx = await signer.getRequestExecuteTx({
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
    estimateGasRequestExecute(transaction: {
        contractAddress: Address;
        calldata: string;
        l2GasLimit?: BigNumberish;
        l2Value?: BigNumberish;
        factoryDeps?: BytesLike[];
        operatorTip?: BigNumberish;
        gasPerPubdataByte?: BigNumberish;
        refundRecipient?: Address;
        overrides?: Overrides;
    }): Promise<BigNumber>;
    /**
     * @inheritDoc
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const CONTRACT_ADDRESS = "<CONTRACT_ADDRESS>";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     *
     * const gasPrice = await signer.providerL1.getGasPrice();
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
     * const txCostPrice = await signer.getBaseCost({
     *   gasPrice,
     *   calldataLength: ethers.utils.arrayify(calldata).length,
     *   l2GasLimit,
     * });
     *
     * console.log(`Executing the transaction will cost ${ethers.utils.formatEther(txCostPrice)} ETH`);
     *
     * const executeTx = await signer.getRequestExecuteTx({
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
    getRequestExecuteTx(transaction: {
        contractAddress: Address;
        calldata: string;
        l2GasLimit?: BigNumberish;
        l2Value?: BigNumberish;
        factoryDeps?: BytesLike[];
        operatorTip?: BigNumberish;
        gasPerPubdataByte?: BigNumberish;
        refundRecipient?: Address;
        overrides?: Overrides;
    }): Promise<ethers.PopulatedTransaction>;
    /**
     * Creates a new L1Singer with provided `signer` and `zksyncProvider`.
     *
     * @param signer  The signer from browser wallet.
     * @param zksyncProvider The provider instance for connecting to a L2 network.
     *
     * @example
     *
     * import { Provider, L1Signer, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = new ethers.providers.Web3Provider(window.ethereum);
     * const zksyncProvider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = L1Signer.from(provider.getSigner(), zksyncProvider);
     */
    static from(signer: ethers.providers.JsonRpcSigner, zksyncProvider: Provider): L1Signer;
    /**
     * Connects to the L2 network using the `provider`.
     *
     * @param provider The provider instance for connecting to a L2 network.
     */
    connectToL2(provider: Provider): this;
}
declare const L2VoidSigner_base: {
    new (...args: any[]): {
        _providerL2(): Provider;
        _signerL2(): ethers.Signer;
        getBalance(token?: string | undefined, blockTag?: BlockTag): Promise<BigNumber>;
        getAllBalances(): Promise<BalancesMap>;
        getDeploymentNonce(): Promise<BigNumber>;
        getL2BridgeContracts(): Promise<{
            erc20: Il2Bridge;
            weth: Il2Bridge;
        }>;
        _fillCustomData(data: import("./types").Eip712Meta): import("./types").Eip712Meta;
        withdraw(transaction: {
            token: string;
            amount: BigNumberish;
            to?: string | undefined;
            bridgeAddress?: string | undefined;
            paymasterParams?: PaymasterParams | undefined;
            overrides?: ethers.Overrides | undefined;
        }): Promise<TransactionResponse>;
        transfer(transaction: {
            to: string;
            amount: BigNumberish;
            token?: string | undefined;
            paymasterParams?: PaymasterParams | undefined;
            overrides?: ethers.Overrides | undefined;
        }): Promise<TransactionResponse>;
        sendTransaction(tx: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse>;
        getAddress(): Promise<string>;
    };
} & typeof ethers.VoidSigner;
/**
 * A `L2VoidSigner` is a class designed to allow an address to be used in any API which accepts a `Signer`, but for
 * which there are no credentials available to perform any actual signing.
 *
 * This for example allow impersonating an account for the purpose of static calls or estimating gas, but does not
 * allow sending transactions.
 *
 * Provides only L2 operations.
 *
 * @see {@link L1VoidSigner} for L1 operations.
 */
export declare class L2VoidSigner extends L2VoidSigner_base {
    provider: Provider;
    _signerL2(): this;
    _providerL2(): Provider;
    /**
     * Connects to the L2 network using the `provider`.
     *
     * @param provider The provider instance for connecting to a L2 network.
     *
     * @example
     *
     * import { Provider, L2VoidSigner, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     *
     * let signer = new L2VoidSigner("<ADDRESS>");
     * signer = signer.connect(provider);
     */
    connect(provider: Provider): L2VoidSigner;
    /**
     * Designed for users who prefer a simplified approach by providing only the necessary data to create a valid transaction.
     * The only required fields are `transaction.to` and either `transaction.data` or `transaction.value` (or both, if the method is payable).
     * Any other fields that are not set will be prepared by this method.
     *
     * @param transaction The transaction request that needs to be populated.
     *
     * @example
     *
     * import { Provider, L2VoidSigner, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = new L2VoidSigner("<ADDRESS>", provider);
     *
     * const populatedTx = await signer.populateTransaction({
     *   to: Wallet.createRandom().address,
     *   value: 7_000_000,
     *   maxFeePerGas: BigNumber.from(3_500_000_000),
     *   maxPriorityFeePerGas: BigNumber.from(2_000_000_000),
     *   customData: {
     *     gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
     *     factoryDeps: [],
     *   },
     * });
     */
    populateTransaction(transaction: TransactionRequest): Promise<TransactionRequest>;
    /**
     * Get the number of transactions ever sent for account, which is used as the `nonce` when sending a transaction.
     *
     * @param [blockTag] The block tag to query. If provided, the transaction count is as of that block.
     *
     * @example
     *
     * import { Provider, L2VoidSigner, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const signer = new L2VoidSigner("<ADDRESS>", provider);
     *
     * const nonce = await signer.getNonce();
     */
    getNonce(blockTag?: BlockTag): Promise<number>;
}
declare const L1VoidSigner_base: {
    new (...args: any[]): {
        _providerL2(): Provider;
        _providerL1(): ethers.providers.Provider;
        _signerL1(): ethers.Signer;
        getMainContract(): Promise<IZkSync>;
        getL1BridgeContracts(): Promise<{
            erc20: Il1Bridge;
            weth: Il1Bridge;
        }>;
        getBalanceL1(token?: string | undefined, blockTag?: ethers.providers.BlockTag | undefined): Promise<BigNumber>;
        getAllowanceL1(token: string, bridgeAddress?: string | undefined, blockTag?: ethers.providers.BlockTag | undefined): Promise<BigNumber>;
        l2TokenAddress(token: string): Promise<string>;
        /**
         * @inheritDoc
         *
         * @example
         *
         * import { Web3Provider } from "zksync-ethers";
         * import { ethers } from "ethers";
         *
         * const provider = new Web3Provider(window.ethereum);
         * const signer = provider.getSigner();
         *
         * const allBalances = await signer.getAllBalances();
         */
        approveERC20(token: string, amount: BigNumberish, overrides?: (ethers.Overrides & {
            bridgeAddress?: string | undefined;
        }) | undefined): Promise<ethers.providers.TransactionResponse>;
        getBaseCost(params: {
            gasLimit: BigNumberish;
            gasPerPubdataByte?: BigNumberish | undefined;
            gasPrice?: BigNumberish | undefined;
        }): Promise<BigNumber>;
        deposit(transaction: {
            token: string;
            amount: BigNumberish;
            to?: string | undefined;
            operatorTip?: BigNumberish | undefined;
            bridgeAddress?: string | undefined;
            approveERC20?: boolean | undefined;
            l2GasLimit?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
            approveOverrides?: ethers.Overrides | undefined;
            customBridgeData?: BytesLike | undefined;
        }): Promise<PriorityOpResponse>;
        estimateGasDeposit(transaction: {
            token: string;
            amount: BigNumberish;
            to?: string | undefined;
            operatorTip?: BigNumberish | undefined;
            bridgeAddress?: string | undefined;
            customBridgeData?: BytesLike | undefined;
            l2GasLimit?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<BigNumber>;
        getDepositTx(transaction: {
            token: string;
            amount: BigNumberish;
            to?: string | undefined;
            operatorTip?: BigNumberish | undefined;
            bridgeAddress?: string | undefined;
            l2GasLimit?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            customBridgeData?: BytesLike | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<any>;
        getFullRequiredDepositFee(transaction: {
            token: string;
            to?: string | undefined;
            bridgeAddress?: string | undefined;
            customBridgeData?: BytesLike | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<FullDepositFee>;
        _getWithdrawalLog(withdrawalHash: BytesLike, index?: number): Promise<{
            log: import("./types").Log;
            l1BatchTxId: number;
        }>;
        _getWithdrawalL2ToL1Log(withdrawalHash: BytesLike, index?: number): Promise<{
            l2ToL1LogIndex: number;
            l2ToL1Log: import("./types").L2ToL1Log;
        }>;
        finalizeWithdrawalParams(withdrawalHash: BytesLike, index?: number): Promise<FinalizeWithdrawalParams>;
        finalizeWithdrawal(withdrawalHash: BytesLike, index?: number, overrides?: ethers.Overrides | undefined): Promise<ethers.ContractTransaction>;
        isWithdrawalFinalized(withdrawalHash: BytesLike, index?: number): Promise<boolean>;
        claimFailedDeposit(depositHash: BytesLike, overrides?: ethers.Overrides | undefined): Promise<ethers.ContractTransaction>;
        requestExecute(transaction: {
            contractAddress: string;
            calldata: BytesLike;
            l2GasLimit?: BigNumberish | undefined;
            l2Value?: BigNumberish | undefined;
            factoryDeps?: BytesLike[] | undefined;
            operatorTip?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<PriorityOpResponse>;
        estimateGasRequestExecute(transaction: {
            contractAddress: string;
            calldata: BytesLike;
            l2GasLimit?: BigNumberish | undefined;
            l2Value?: BigNumberish | undefined;
            factoryDeps?: BytesLike[] | undefined;
            operatorTip?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<BigNumber>;
        getRequestExecuteTx(transaction: {
            contractAddress: string;
            calldata: BytesLike;
            /**
             * Get the number of transactions ever sent for account, which is used as the `nonce` when sending a transaction.
             *
             * @param [blockTag] The block tag to query. If provided, the transaction count is as of that block.
             *
             * @example
             *
             * import { L1VoidSigner } from "zksync-ethers";
             * import { ethers } from "ethers";
             *
             * const ethProvider = ethers.getDefaultProvider("sepolia");
             * const signer = new L1VoidSigner("<ADDRESS>", ethProvider);
             *
             * const nonce = await signer.getNonce();
             */
            l2GasLimit?: BigNumberish | undefined;
            l2Value?: BigNumberish | undefined;
            factoryDeps?: BytesLike[] | undefined;
            operatorTip?: BigNumberish | undefined;
            gasPerPubdataByte?: BigNumberish | undefined;
            refundRecipient?: string | undefined;
            overrides?: ethers.PayableOverrides | undefined;
        }): Promise<ethers.PopulatedTransaction>;
        sendTransaction(tx: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse>;
        getAddress(): Promise<string>;
    };
} & typeof ethers.VoidSigner;
/**
 * A `L1VoidSigner` is a class designed to allow an address to be used in any API which accepts a `Signer`, but for
 * which there are no credentials available to perform any actual signing.
 *
 * This for example allow impersonating an account for the purpose of static calls or estimating gas, but does not
 * allow sending transactions.
 *
 * Provides only L1 operations.
 *
 * @see {@link L2VoidSigner} for L2 operations.
 */
export declare class L1VoidSigner extends L1VoidSigner_base {
    providerL2?: Provider;
    _providerL2(): Provider;
    _providerL1(): ethers.providers.Provider;
    _signerL1(): this;
    /**
     * @param address The address of the account.
     * @param providerL1 The provider instance for connecting to a L1 network.
     * @param providerL2 The provider instance for connecting to a L2 network.
     *
     * @example
     *
     * import { Provider, L1VoidSigner, types } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const signer = new L1VoidSigner("<ADDRESS>", ethProvider, provider);
     */
    constructor(address: string, providerL1?: ethers.providers.Provider, providerL2?: Provider);
    /**
     * Connects to the L1 network using the `provider`.
     *
     * @param provider The provider instance for connecting to a L1 network.
     *
     * @example
     *
     * import { L1VoidSigner } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     *
     * let singer = new L1VoidSigner("<ADDRESS>);
     * singer = singer.connect(ethProvider);
     */
    connect(provider: ethers.providers.Provider): L1VoidSigner;
    /**
     * Connects to the L2 network using the `provider`.
     *
     * @param provider The provider instance for connecting to a L2 network.
     *
     * @example
     *
     * import { Provider, L1VoidSigner, types } from "zksync-ethers";
     *
     * const provider = Provider.getDefaultProvider(types.Network.Sepolia);
     * let signer = new L1VoidSigner("<ADDRESS>");
     * signer = signer.connectToL2(provider);
     */
    connectToL2(provider: Provider): this;
    /**
     * Get the number of transactions ever sent for account, which is used as the `nonce` when sending a transaction.
     *
     * @param [blockTag] The block tag to query. If provided, the transaction count is as of that block.
     *
     * @example
     *
     * import { L1VoidSigner } from "zksync-ethers";
     * import { ethers } from "ethers";
     *
     * const ethProvider = ethers.getDefaultProvider("sepolia");
     * const signer = new L1VoidSigner("<ADDRESS>", ethProvider);
     *
     * const nonce = await signer.getNonce();
     */
    getNonce(blockTag?: BlockTag): Promise<number>;
}
export {};
