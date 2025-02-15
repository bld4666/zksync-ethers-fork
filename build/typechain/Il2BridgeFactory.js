"use strict";
/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Il2BridgeFactory = void 0;
const ethers_1 = require("ethers");
class Il2BridgeFactory {
    static connect(address, signerOrProvider) {
        return new ethers_1.Contract(address, _abi, signerOrProvider);
    }
}
exports.Il2BridgeFactory = Il2BridgeFactory;
const _abi = [
    {
        inputs: [
            {
                internalType: "address",
                name: "_l1Sender",
                type: "address",
            },
            {
                internalType: "address",
                name: "_l2Receiver",
                type: "address",
            },
            {
                internalType: "address",
                name: "_l1Token",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_amount",
                type: "uint256",
            },
            {
                internalType: "bytes",
                name: "_data",
                type: "bytes",
            },
        ],
        name: "finalizeDeposit",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [],
        name: "l1Bridge",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_l2Token",
                type: "address",
            },
        ],
        name: "l1TokenAddress",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_l1Token",
                type: "address",
            },
        ],
        name: "l2TokenAddress",
        outputs: [
            {
                internalType: "address",
                name: "",
                type: "address",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "_l1Receiver",
                type: "address",
            },
            {
                internalType: "address",
                name: "_l2Token",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "_amount",
                type: "uint256",
            },
        ],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
//# sourceMappingURL=Il2BridgeFactory.js.map