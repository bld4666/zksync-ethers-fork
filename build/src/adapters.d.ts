import { BigNumber, BigNumberish, BytesLike, ethers } from 'ethers';
import { Provider } from './provider';
import { Address, BalancesMap, BlockTag, Eip712Meta, FinalizeWithdrawalParams, FullDepositFee, PriorityOpResponse, TransactionResponse, PaymasterParams } from './types';
import { Il2Bridge } from '../typechain/Il2Bridge';
import { IZkSync } from '../typechain/IZkSync';
import { Il1Bridge } from '../typechain/Il1Bridge';
type Constructor<T = {}> = new (...args: any[]) => T;
interface TxSender {
    sendTransaction(tx: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse>;
    getAddress(): Promise<Address>;
}
export declare function AdapterL1<TBase extends Constructor<TxSender>>(Base: TBase): {
    new (...args: any[]): {
        /**
         * Returns a provider instance for connecting to an L2 network.
         */
        _providerL2(): Provider;
        /**
         * Returns a provider instance for connecting to a L1 network.
         */
        _providerL1(): ethers.providers.Provider;
        /**
         * Returns a signer instance used for signing transactions sent to the L1 network.
         */
        _signerL1(): ethers.Signer;
        /**
         * Returns `Contract` wrapper of the zkSync Era smart contract.
         */
        getMainContract(): Promise<IZkSync>;
        /**
         * Returns L1 bridge contracts.
         *
         * @remarks There is no separate Ether bridge contract, {@link getMainContract Main contract} is used instead.
         */
        getL1BridgeContracts(): Promise<{
            erc20: Il1Bridge;
            weth: Il1Bridge;
        }>;
        /**
         * Returns the amount of the token held by the account on the L1 network.
         *
         * @param [token] The address of the token. Defaults to ETH if not provided.
         * @param [blockTag] The block in which the balance should be checked.
         * Defaults to 'committed', i.e., the latest processed block.
         */
        getBalanceL1(token?: Address, blockTag?: ethers.providers.BlockTag): Promise<BigNumber>;
        /**
         * Returns the amount of approved tokens for a specific L1 bridge.
         *
         * @param token The Ethereum address of the token.
         * @param [bridgeAddress] The address of the bridge contract to be used.
         * Defaults to the default zkSync Era bridge, either `L1EthBridge` or `L1Erc20Bridge`.
         * @param [blockTag] The block in which an allowance should be checked.
         * Defaults to 'committed', i.e., the latest processed block.
         */
        getAllowanceL1(token: Address, bridgeAddress?: Address, blockTag?: ethers.providers.BlockTag): Promise<BigNumber>;
        /**
         * Returns the L2 token address equivalent for a L1 token address as they are not necessarily equal.
         * The ETH address is set to the zero address.
         *
         * @remarks Only works for tokens bridged on default zkSync Era bridges.
         *
         * @param token The address of the token on L1.
         */
        l2TokenAddress(token: Address): Promise<string>;
        /**
         * Bridging ERC20 tokens from L1 requires approving the tokens to the zkSync Era smart contract.
         *
         * @param token The L1 address of the token.
         * @param amount The amount of the token to be approved.
         * @param [overrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
         * @returns A promise that resolves to the response of the approval transaction.
         * @throws {Error} If attempting to approve an ETH token.
         */
        approveERC20(token: Address, amount: BigNumberish, overrides?: ethers.Overrides & {
            bridgeAddress?: Address;
        }): Promise<ethers.providers.TransactionResponse>;
        /**
         * Returns the base cost for an L2 transaction.
         *
         * @param params The parameters for calculating the base cost.
         * @param params.gasLimit The gasLimit for the L2 contract call.
         * @param [params.gasPerPubdataByte] The L2 gas price for each published L1 calldata byte.
         * @param [params.gasPrice] The L1 gas price of the L1 transaction that will send the request for an execute call.
         */
        getBaseCost(params: {
            gasLimit: BigNumberish;
            gasPerPubdataByte?: BigNumberish;
            gasPrice?: BigNumberish;
        }): Promise<BigNumber>;
        /**
         * Transfers the specified token from the associated account on the L1 network to the target account on the L2 network.
         * The token can be either ETH or any ERC20 token. For ERC20 tokens, enough approved tokens must be associated with
         * the specified L1 bridge (default one or the one defined in `transaction.bridgeAddress`).
         * In this case, `transaction.approveERC20` can be enabled to perform token approval. If there are already enough
         * approved tokens for the L1 bridge, token approval will be skipped.
         * To check the amount of approved tokens for a specific bridge, use the {@link getAllowanceL1} method.
         *
         * @param transaction The transaction object containing deposit details.
         * @param transaction.token The address of the token to deposit. ETH by default.
         * @param transaction.amount The amount of the token to withdraw.
         * @param [transaction.to] The address that will receive the deposited tokens on L2.
         * @param [transaction.operatorTip] (currently not used) If the ETH value passed with the transaction is not
         * explicitly stated in the overrides, this field will be equal to the tip the operator will receive on top of
         * the base cost of the transaction.
         * @param [transaction.bridgeAddress] The address of the bridge contract to be used.
         * Defaults to the default zkSync Era bridge (either `L1EthBridge` or `L1Erc20Bridge`).
         * @param [transaction.approveERC20] Whether or not token approval should be performed under the hood.
         * Set this flag to true if you bridge an ERC20 token and didn't call the {@link approveERC20}  function beforehand.
         * @param [transaction.l2GasLimit] Maximum amount of L2 gas that the transaction can consume during execution on L2.
         * @param [transaction.gasPerPubdataByte] The L2 gas price for each published L1 calldata byte.
         * @param [transaction.refundRecipient] The address on L2 that will receive the refund for the transaction.
         * If the transaction fails, it will also be the address to receive `l2Value`.
         * @param [transaction.overrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
         * @param [transaction.approveOverrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
         * @param [transaction.customBridgeData] Additional data that can be sent to a bridge.
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
            overrides?: ethers.PayableOverrides;
            approveOverrides?: ethers.Overrides;
            customBridgeData?: BytesLike;
        }): Promise<PriorityOpResponse>;
        /**
         * Estimates the amount of gas required for a deposit transaction on the L1 network.
         * Gas for approving ERC20 tokens is not included in the estimation.
         *
         * @param transaction The transaction details.
         * @param transaction.token The address of the token to deposit. ETH by default.
         * @param transaction.amount The amount of the token to withdraw.
         * @param [transaction.to] The address that will receive the deposited tokens on L2.
         * @param [transaction.operatorTip] (currently not used) If the ETH value passed with the transaction is not
         * explicitly stated in the overrides, this field will be equal to the tip the operator will receive on top of the
         * base cost of the transaction.
         * @param [transaction.bridgeAddress] The address of the bridge contract to be used.
         * Defaults to the default zkSync Era bridge (either `L1EthBridge` or `L1Erc20Bridge`).
         * @param [transaction.l2GasLimit] Maximum amount of L2 gas that the transaction can consume during execution on L2.
         * @param [transaction.gasPerPubdataByte] The L2 gas price for each published L1 calldata byte.
         * @param [transaction.customBridgeData] Additional data that can be sent to a bridge.
         * @param [transaction.refundRecipient] The address on L2 that will receive the refund for the transaction.
         * If the transaction fails, it will also be the address to receive `l2Value`.
         * @param [transaction.overrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
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
            overrides?: ethers.PayableOverrides;
        }): Promise<BigNumber>;
        /**
         * Returns a populated deposit transaction.
         *
         * @param transaction The transaction details.
         * @param transaction.token The address of the token to deposit. ETH by default.
         * @param transaction.amount The amount of the token to withdraw.
         * @param [transaction.to] The address that will receive the deposited tokens on L2.
         * @param [transaction.operatorTip] (currently not used) If the ETH value passed with the transaction is not
         * explicitly stated in the overrides, this field will be equal to the tip the operator will receive on top of the
         * base cost of the transaction.
         * @param [transaction.bridgeAddress] The address of the bridge contract to be used. Defaults to the default zkSync
         * Era bridge (either `L1EthBridge` or `L1Erc20Bridge`).
         * @param [transaction.l2GasLimit] Maximum amount of L2 gas that the transaction can consume during execution on L2.
         * @param [transaction.gasPerPubdataByte] The L2 gas price for each published L1 calldata byte.
         * @param [transaction.customBridgeData] Additional data that can be sent to a bridge.
         * @param [transaction.refundRecipient] The address on L2 that will receive the refund for the transaction.
         * If the transaction fails, it will also be the address to receive `l2Value`.
         * @param [transaction.overrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
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
            overrides?: ethers.PayableOverrides;
        }): Promise<any>;
        /**
         * Retrieves the full needed ETH fee for the deposit. Returns the L1 fee and the L2 fee {@link FullDepositFee}.
         *
         * @param transaction The transaction details.
         * @param transaction.token The address of the token to deposit. ETH by default.
         * @param [transaction.to] The address that will receive the deposited tokens on L2.
         * @param [transaction.bridgeAddress] The address of the bridge contract to be used.
         * Defaults to the default zkSync Era bridge (either `L1EthBridge` or `L1Erc20Bridge`).
         * @param [transaction.customBridgeData] Additional data that can be sent to a bridge.
         * @param [transaction.gasPerPubdataByte] The L2 gas price for each published L1 calldata byte.
         * @param [transaction.overrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
         * @throws {Error} If:
         *  - There's not enough balance for the deposit under the provided gas price.
         *  - There's not enough allowance to cover the deposit.
         */
        getFullRequiredDepositFee(transaction: {
            token: Address;
            to?: Address;
            bridgeAddress?: Address;
            customBridgeData?: BytesLike;
            gasPerPubdataByte?: BigNumberish;
            overrides?: ethers.PayableOverrides;
        }): Promise<FullDepositFee>;
        _getWithdrawalLog(withdrawalHash: BytesLike, index?: number): Promise<{
            log: import("./types").Log;
            l1BatchTxId: number;
        }>;
        _getWithdrawalL2ToL1Log(withdrawalHash: BytesLike, index?: number): Promise<{
            l2ToL1LogIndex: number;
            l2ToL1Log: import("./types").L2ToL1Log;
        }>;
        /**
         * Returns the {@link FinalizeWithdrawalParams parameters} required for finalizing a withdrawal from the
         * withdrawal transaction's log on the L1 network.
         *
         * @param withdrawalHash Hash of the L2 transaction where the withdrawal was initiated.
         * @param [index=0] In case there were multiple withdrawals in one transaction, you may pass an index of the
         * withdrawal you want to finalize.
         * @throws {Error} If log proof can not be found.
         */
        finalizeWithdrawalParams(withdrawalHash: BytesLike, index?: number): Promise<FinalizeWithdrawalParams>;
        /**
         * Proves the inclusion of the `L2->L1` withdrawal message.
         *
         * @param withdrawalHash Hash of the L2 transaction where the withdrawal was initiated.
         * @param [index=0] In case there were multiple withdrawals in one transaction, you may pass an index of the
         * withdrawal you want to finalize.
         * @param [overrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
         * @returns A promise that resolves to the proof of inclusion of the withdrawal message.
         * @throws {Error} If log proof can not be found.
         */
        finalizeWithdrawal(withdrawalHash: BytesLike, index?: number, overrides?: ethers.Overrides): Promise<ethers.ContractTransaction>;
        /**
         * Returns whether the withdrawal transaction is finalized on the L1 network.
         *
         * @param withdrawalHash Hash of the L2 transaction where the withdrawal was initiated.
         * @param [index=0] In case there were multiple withdrawals in one transaction, you may pass an index of the
         * withdrawal you want to finalize.
         * @throws {Error} If log proof can not be found.
         */
        isWithdrawalFinalized(withdrawalHash: BytesLike, index?: number): Promise<boolean>;
        /**
         * Withdraws funds from the initiated deposit, which failed when finalizing on L2.
         * If the deposit L2 transaction has failed, it sends an L1 transaction calling `claimFailedDeposit` method of the
         * L1 bridge, which results in returning L1 tokens back to the depositor.
         *
         * @param depositHash The L2 transaction hash of the failed deposit.
         * @param [overrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
         * @returns A promise that resolves to the response of the `claimFailedDeposit` transaction.
         * @throws {Error} If attempting to claim successful deposit.
         */
        claimFailedDeposit(depositHash: BytesLike, overrides?: ethers.Overrides): Promise<ethers.ContractTransaction>;
        /**
         * Requests execution of an L2 transaction from L1.
         *
         * @param transaction The transaction details.
         * @param transaction.contractAddress The L2 contract to be called.
         * @param transaction.calldata The input of the L2 transaction.
         * @param [transaction.l2GasLimit] Maximum amount of L2 gas that transaction can consume during execution on L2.
         * @param [transaction.l2Value] `msg.value` of L2 transaction.
         * @param [transaction.factoryDeps] An array of L2 bytecodes that will be marked as known on L2.
         * @param [transaction.operatorTip] (currently not used) If the ETH value passed with the transaction is not
         * explicitly stated in the overrides, this field will be equal to the tip the operator will receive on top of
         * the base cost of the transaction.
         * @param [transaction.gasPerPubdataByte] The L2 gas price for each published L1 calldata byte.
         * @param [transaction.refundRecipient] The address on L2 that will receive the refund for the transaction.
         * If the transaction fails, it will also be the address to receive `l2Value`.
         * @param [transaction.overrides] Transaction's overrides which may be used to pass L2 `gasLimit`, `gasPrice`, `value`, etc.
         * @returns A promise that resolves to the response of the execution request.
         */
        requestExecute(transaction: {
            contractAddress: Address;
            calldata: BytesLike;
            l2GasLimit?: BigNumberish;
            l2Value?: BigNumberish;
            factoryDeps?: ethers.BytesLike[];
            operatorTip?: BigNumberish;
            gasPerPubdataByte?: BigNumberish;
            refundRecipient?: Address;
            overrides?: ethers.PayableOverrides;
        }): Promise<PriorityOpResponse>;
        /**
         * Estimates the amount of gas required for a request execute transaction.
         *
         * @param transaction The transaction details.
         * @param transaction.contractAddress The L2 contract to be called.
         * @param transaction.calldata The input of the L2 transaction.
         * @param [transaction.l2GasLimit] Maximum amount of L2 gas that transaction can consume during execution on L2.
         * @param [transaction.l2Value] `msg.value` of L2 transaction.
         * @param [transaction.factoryDeps] An array of L2 bytecodes that will be marked as known on L2.
         * @param [transaction.operatorTip] (currently not used) If the ETH value passed with the transaction is not
         * explicitly stated in the overrides, this field will be equal to the tip the operator will receive on top
         * of the base cost of the transaction.
         * @param [transaction.gasPerPubdataByte] The L2 gas price for each published L1 calldata byte.
         * @param [transaction.refundRecipient] The address on L2 that will receive the refund for the transaction.
         * If the transaction fails, it will also be the address to receive `l2Value`.
         * @param [transaction.overrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
         */
        estimateGasRequestExecute(transaction: {
            contractAddress: Address;
            calldata: BytesLike;
            l2GasLimit?: BigNumberish;
            l2Value?: BigNumberish;
            factoryDeps?: ethers.BytesLike[];
            operatorTip?: BigNumberish;
            gasPerPubdataByte?: BigNumberish;
            refundRecipient?: Address;
            overrides?: ethers.PayableOverrides;
        }): Promise<BigNumber>;
        /**
         * Returns a populated request execute transaction.
         *
         * @param transaction The transaction details.
         * @param transaction.contractAddress The L2 contract to be called.
         * @param transaction.calldata The input of the L2 transaction.
         * @param [transaction.l2GasLimit] Maximum amount of L2 gas that transaction can consume during execution on L2.
         * @param [transaction.l2Value] `msg.value` of L2 transaction.
         * @param [transaction.factoryDeps] An array of L2 bytecodes that will be marked as known on L2.
         * @param [transaction.operatorTip] (currently not used) If the ETH value passed with the transaction is not
         * explicitly stated in the overrides, this field will be equal to the tip the operator will receive on top of the
         * base cost of the transaction.
         * @param [transaction.gasPerPubdataByte] The L2 gas price for each published L1 calldata byte.
         * @param [transaction.refundRecipient] The address on L2 that will receive the refund for the transaction.
         * If the transaction fails, it will also be the address to receive `l2Value`.
         * @param [transaction.overrides] Transaction's overrides which may be used to pass L1 `gasLimit`, `gasPrice`, `value`, etc.
         */
        getRequestExecuteTx(transaction: {
            contractAddress: Address;
            calldata: BytesLike;
            l2GasLimit?: BigNumberish;
            l2Value?: BigNumberish;
            factoryDeps?: ethers.BytesLike[];
            operatorTip?: BigNumberish;
            gasPerPubdataByte?: BigNumberish;
            refundRecipient?: Address;
            overrides?: ethers.PayableOverrides;
        }): Promise<ethers.PopulatedTransaction>;
        sendTransaction(tx: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse>;
        getAddress(): Promise<string>;
    };
} & TBase;
export declare function AdapterL2<TBase extends Constructor<TxSender>>(Base: TBase): {
    new (...args: any[]): {
        /**
         * Returns a provider instance for connecting to an L2 network.
         */
        _providerL2(): Provider;
        /**
         * Returns a signer instance used for signing transactions sent to the L2 network.
         */
        _signerL2(): ethers.Signer;
        /**
         * Returns the balance of the account.
         *
         * @param [token] The token address to query balance for. Defaults to the native token.
         * @param [blockTag='committed'] The block tag to get the balance at.
         */
        getBalance(token?: Address, blockTag?: BlockTag): Promise<BigNumber>;
        /**
         * Returns all token balances of the account.
         */
        getAllBalances(): Promise<BalancesMap>;
        /**
         * Returns the deployment nonce of the account.
         */
        getDeploymentNonce(): Promise<BigNumber>;
        /**
         * Returns L2 bridge contracts.
         */
        getL2BridgeContracts(): Promise<{
            erc20: Il2Bridge;
            weth: Il2Bridge;
        }>;
        _fillCustomData(data: Eip712Meta): Eip712Meta;
        /**
         * Initiates the withdrawal process which withdraws ETH or any ERC20 token
         * from the associated account on L2 network to the target account on L1 network.
         *
         * @param transaction Withdrawal transaction request.
         * @param transaction.token The address of the token. Defaults to ETH.
         * @param transaction.amount The amount of the token to withdraw.
         * @param [transaction.to] The address of the recipient on L1.
         * @param [transaction.bridgeAddress] The address of the bridge contract to be used.
         * @param [transaction.paymasterParams] Paymaster parameters.
         * @param [transaction.overrides] Transaction's overrides which may be used to pass L2 `gasLimit`, `gasPrice`, `value`, etc.
         * @returns A Promise resolving to a withdrawal transaction response.
         */
        withdraw(transaction: {
            token: Address;
            amount: BigNumberish;
            to?: Address;
            bridgeAddress?: Address;
            paymasterParams?: PaymasterParams;
            overrides?: ethers.Overrides;
        }): Promise<TransactionResponse>;
        /**
         * Transfer ETH or any ERC20 token within the same interface.
         *
         * @param transaction Transfer transaction request.
         * @param transaction.to The address of the recipient.
         * @param transaction.amount The amount of the token to transfer.
         * @param [transaction.token] The address of the token. Defaults to ETH.
         * @param [transaction.paymasterParams] Paymaster parameters.
         * @param [transaction.overrides] Transaction's overrides which may be used to pass L2 `gasLimit`, `gasPrice`, `value`, etc.
         * @returns A Promise resolving to a transfer transaction response.
         */
        transfer(transaction: {
            to: Address;
            amount: BigNumberish;
            token?: Address;
            paymasterParams?: PaymasterParams;
            overrides?: ethers.Overrides;
        }): Promise<TransactionResponse>;
        sendTransaction(tx: ethers.providers.TransactionRequest): Promise<ethers.providers.TransactionResponse>;
        getAddress(): Promise<string>;
    };
} & TBase;
export {};
