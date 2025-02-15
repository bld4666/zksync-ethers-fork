"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountNonceOrdering = exports.AccountAbstractionVersion = exports.TransactionStatus = exports.PriorityOpTree = exports.PriorityQueueType = exports.Network = void 0;
/** Ethereum network. */
var Network;
(function (Network) {
    Network[Network["Mainnet"] = 1] = "Mainnet";
    Network[Network["Ropsten"] = 3] = "Ropsten";
    Network[Network["Rinkeby"] = 4] = "Rinkeby";
    Network[Network["Goerli"] = 5] = "Goerli";
    Network[Network["Sepolia"] = 6] = "Sepolia";
    Network[Network["Localhost"] = 9] = "Localhost";
})(Network = exports.Network || (exports.Network = {}));
/** Enumerated list of priority queue types. */
var PriorityQueueType;
(function (PriorityQueueType) {
    PriorityQueueType[PriorityQueueType["Deque"] = 0] = "Deque";
    PriorityQueueType[PriorityQueueType["HeapBuffer"] = 1] = "HeapBuffer";
    PriorityQueueType[PriorityQueueType["Heap"] = 2] = "Heap";
})(PriorityQueueType = exports.PriorityQueueType || (exports.PriorityQueueType = {}));
/** Enumerated list of priority operation tree types. */
var PriorityOpTree;
(function (PriorityOpTree) {
    PriorityOpTree[PriorityOpTree["Full"] = 0] = "Full";
    PriorityOpTree[PriorityOpTree["Rollup"] = 1] = "Rollup";
})(PriorityOpTree = exports.PriorityOpTree || (exports.PriorityOpTree = {}));
/** Enumerated list of transaction status types. */
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["NotFound"] = "not-found";
    TransactionStatus["Processing"] = "processing";
    TransactionStatus["Committed"] = "committed";
    TransactionStatus["Finalized"] = "finalized";
})(TransactionStatus = exports.TransactionStatus || (exports.TransactionStatus = {}));
/** Enumerated list of account abstraction versions. */
var AccountAbstractionVersion;
(function (AccountAbstractionVersion) {
    /** Used for contracts that are not accounts */
    AccountAbstractionVersion[AccountAbstractionVersion["None"] = 0] = "None";
    /** Used for contracts that are accounts */
    AccountAbstractionVersion[AccountAbstractionVersion["Version1"] = 1] = "Version1";
})(AccountAbstractionVersion = exports.AccountAbstractionVersion || (exports.AccountAbstractionVersion = {}));
/**
 * Enumerated list of account nonce ordering formats.
 */
var AccountNonceOrdering;
(function (AccountNonceOrdering) {
    /**
     * Nonces should be ordered in the same way as in externally owned accounts (EOAs).
     * This means, for instance, that the operator will always wait for a transaction with nonce `X`
     * before processing a transaction with nonce `X+1`.
     */
    AccountNonceOrdering[AccountNonceOrdering["Sequential"] = 0] = "Sequential";
    /** Nonces can be ordered in arbitrary order. */
    AccountNonceOrdering[AccountNonceOrdering["Arbitrary"] = 1] = "Arbitrary";
})(AccountNonceOrdering = exports.AccountNonceOrdering || (exports.AccountNonceOrdering = {}));
//# sourceMappingURL=types.js.map