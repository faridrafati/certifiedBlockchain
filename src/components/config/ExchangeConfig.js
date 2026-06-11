/**
 * @file ExchangeConfig.js
 * @description Configuration for DEX Exchange smart contract
 * @author CertifiedBlockchain
 *
 * Contains the deployed contract address and ABI for the Exchange contract.
 * The address is loaded from environment variables for deployment flexibility.
 *
 * Contract Functions:
 * - depositEther(): Deposit ETH to exchange (payable)
 * - withdrawEther(amount): Withdraw ETH from exchange
 * - depositToken(token, amount): Deposit ERC20 tokens
 * - withdrawToken(token, amount): Withdraw ERC20 tokens
 * - balanceOf(token, user): Get token balance in exchange
 * - makeOrder(tokenGet, amountGet, tokenGive, amountGive): Create order
 * - cancelOrder(id): Cancel an order
 * - fillOrder(id): Fill an existing order
 * - feeAccount: Get fee collection account
 * - feePercent: Get fee percentage
 * - tokenAddress: Get linked DappToken address
 * - orderCount: Get total orders count
 * - orders(id): Get order details
 * - orderCancelled(id): Check if order is cancelled
 * - orderFilled(id): Check if order is filled
 *
 * Events:
 * - Deposit: Emitted when tokens/ETH deposited
 * - Withdraw: Emitted when tokens/ETH withdrawn
 * - Order: Emitted when order is created
 * - Cancel: Emitted when order is cancelled
 * - Trade: Emitted when order is filled
 *
 * Constructor Args: feeAccount, feePercent, tokenAddress
 *
 * Used By: Exchange.jsx, exchange/components/*.jsx
 *
 * Environment Variables:
 * - VITE_EXCHANGE_ADDRESS: Exchange contract address
 * - VITE_DAPPTOKEN_ADDRESS: DappToken contract address (for trading)
 */

// Default: Sepolia deployment from README.md (linked to the DappToken above);
// override via VITE_EXCHANGE_ADDRESS in .env
export const EXCHANGE_ADDRESS = import.meta.env.VITE_EXCHANGE_ADDRESS || '0x26203b12bA4Cec5eB24A68834EC57ee47fa0F00B';
export const EXCHANGE_ABI = [{"inputs":[{"internalType":"address","name":"_feeAccount","type":"address"},{"internalType":"uint256","name":"_feePercent","type":"uint256"},{"internalType":"address","name":"_tokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"address","name":"tokenGet","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountGet","type":"uint256"},{"indexed":false,"internalType":"address","name":"tokenGive","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountGive","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"Cancel","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"balance","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"address","name":"tokenGet","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountGet","type":"uint256"},{"indexed":false,"internalType":"address","name":"tokenGive","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountGive","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"Order","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"id","type":"uint256"},{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"address","name":"tokenGet","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountGet","type":"uint256"},{"indexed":false,"internalType":"address","name":"tokenGive","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountGive","type":"uint256"},{"indexed":false,"internalType":"address","name":"userFill","type":"address"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"Trade","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"address","name":"user","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"balance","type":"uint256"}],"name":"Withdraw","type":"event"},{"stateMutability":"nonpayable","type":"fallback"},{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"address","name":"_user","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"cancelOrder","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"depositEther","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"depositToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"feeAccount","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feePercent","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"fillOrder","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_tokenGet","type":"address"},{"internalType":"uint256","name":"_amountGet","type":"uint256"},{"internalType":"address","name":"_tokenGive","type":"address"},{"internalType":"uint256","name":"_amountGive","type":"uint256"}],"name":"makeOrder","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"orderCount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"orderCancelled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"orderFilled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"orders","outputs":[{"internalType":"uint256","name":"id","type":"uint256"},{"internalType":"address","name":"user","type":"address"},{"internalType":"address","name":"tokenGet","type":"address"},{"internalType":"uint256","name":"amountGet","type":"uint256"},{"internalType":"address","name":"tokenGive","type":"address"},{"internalType":"uint256","name":"amountGive","type":"uint256"},{"internalType":"uint256","name":"timestamp","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"tokens","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdrawEther","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"withdrawToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]
