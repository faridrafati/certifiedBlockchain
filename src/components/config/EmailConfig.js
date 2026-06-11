/**
 * @file EmailConfig.js
 * @description Configuration for Decentralized Email/Messaging smart contract
 * @author CertifiedBlockchain
 *
 * Contains the deployed contract address and ABI for the Email contract.
 * The address is loaded from environment variables for deployment flexibility.
 *
 * Contract Functions:
 * - registerUser(): Create inbox for new user
 * - sendMessage(receiver, content): Send bytes32 message
 * - receiveMessages(): Get inbox messages (bytes32[16])
 * - sentMessages(): Get outbox messages (bytes32[16])
 * - clearInbox/clearOutbox/clearConversationWith(): Clear messages
 * - checkUserRegistration(): Check if user is registered
 * - getMyInboxSize(): Get inbox/outbox counts
 * - getContractProperties(): Get owner and registered users
 *
 * Technical Notes:
 * - Messages stored as bytes32 (32 character limit)
 * - Max 16 messages per inbox/outbox
 * - Uses Web3 asciiToHex/toAscii for encoding
 *
 * Used By: Email.jsx
 *
 * Environment Variable: VITE_EMAIL_ADDRESS
 */

// Default: Sepolia deployment from README.md; override via VITE_EMAIL_ADDRESS in .env
export const EMAIL_ADDRESS = import.meta.env.VITE_EMAIL_ADDRESS || '0xF0307B91AF329eAE1f1d24EaAd629108C21592DC';
export const EMAIL_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "contact",
				"type": "address"
			}
		],
		"name": "clearConversationWith",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "clearInbox",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "clearOutbox",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "registerUser",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_receiver",
				"type": "address"
			},
			{
				"internalType": "bytes32",
				"name": "_content",
				"type": "bytes32"
			}
		],
		"name": "sendMessage",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [],
		"name": "checkUserRegistration",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getContractProperties",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getMyInboxSize",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "receiveMessages",
		"outputs": [
			{
				"internalType": "bytes32[16]",
				"name": "",
				"type": "bytes32[16]"
			},
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			},
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "sentMessages",
		"outputs": [
			{
				"internalType": "bytes32[16]",
				"name": "",
				"type": "bytes32[16]"
			},
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			},
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];
// NOTE: the deployed Sepolia Email contract (0xF030...92DC) is an older build whose
// receiveMessages/sentMessages do NOT return the bool[16] "deleted" flags that the
// current hardHat/contracts/Email.sol source defines. The ABI above matches the
// deployed contract; Email.jsx tolerates the missing 4th array. If the contract is
// redeployed from current source, add the bool[16] output back to both functions.