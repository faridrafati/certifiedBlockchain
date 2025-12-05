export const DAPPTOKENSALE_ADDRESS = import.meta.env.VITE_DAPPTOKENSALE_ADDRESS;
export const DAPPTOKENSALE_ABI = [
  {
    "inputs": [
      {"internalType": "contract DappToken", "name": "_tokenContract", "type": "address"},
      {"internalType": "uint256", "name": "_tokenPrice", "type": "uint256"}
    ],
    "stateMutability": "payable",
    "type": "constructor"
  },
  {"inputs": [], "name": "IncorrectETHAmount", "type": "error"},
  {"inputs": [], "name": "NotEnoughTokens", "type": "error"},
  {"inputs": [], "name": "OnlyAdmin", "type": "error"},
  {"inputs": [], "name": "TransferFailed", "type": "error"},
  {"inputs": [], "name": "ZeroPrice", "type": "error"},
  {"inputs": [], "name": "ZeroTokensPurchase", "type": "error"},
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "_buyer", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "_amount", "type": "uint256"}
    ],
    "name": "Sell",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "_admin", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "_tokensReturned", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "_ethReturned", "type": "uint256"}
    ],
    "name": "SaleEnded",
    "type": "event"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_numberOfTokens", "type": "uint256"}],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "endSale",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAdmin",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTokensSold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenContract",
    "outputs": [{"internalType": "contract DappToken", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokensSold",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];
