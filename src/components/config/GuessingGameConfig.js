/**
 * @file GuessingGameConfig.js
 * @description Configuration for Blockchain Guessing Game smart contract
 * @author CertifiedBlockchain
 *
 * Contains the deployed contract address and ABI for the GuessingGame contract.
 * The address is loaded from environment variables for deployment flexibility.
 *
 * Contract Functions:
 * - winOrLose(display, guess): Play the game (payable)
 * - determineWinner(number, display, guess): Pure function to check win
 * - getContractBalance(): Get contract ETH balance
 * - setOnline(bool): Enable/disable game (owner only)
 * - setMaxBet(amount): Set max bet limit (owner only)
 * - withdrawBet(): Owner withdraws contract balance
 * - players(address): Get player win/loss record
 *
 * Game Rules:
 * - Higher (true): Win if mystery number > 5
 * - Lower (false): Win if mystery number <= 5
 * - Win = 2x bet returned
 *
 * Events:
 * - PlayerWon, PlayerLost: Game results
 * - GameStatusChanged, MaxBetChanged: Admin actions
 *
 * Used By: GuessingGame.jsx
 *
 * Environment Variable: VITE_GUESSINGGAME_ADDRESS
 */

export const GUESSINGGAME_ADDRESS = import.meta.env.VITE_GUESSINGGAME_ADDRESS;
export const GUESSINGGAME_ABI = [{"inputs":[],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"online","type":"bool"}],"name":"GameStatusChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newMaxBet","type":"uint256"}],"name":"MaxBetChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"mysteryNumber","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"displayedNumber","type":"uint256"}],"name":"PlayerLost","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"player","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"mysteryNumber","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"displayedNumber","type":"uint256"}],"name":"PlayerWon","type":"event"},{"inputs":[{"internalType":"uint256","name":"_number","type":"uint256"},{"internalType":"uint256","name":"_display","type":"uint256"},{"internalType":"bool","name":"_guess","type":"bool"}],"name":"determineWinner","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"getContractBalance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxBetAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"online","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"players","outputs":[{"internalType":"uint256","name":"wins","type":"uint256"},{"internalType":"uint256","name":"losses","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_maxBet","type":"uint256"}],"name":"setMaxBet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"_online","type":"bool"}],"name":"setOnline","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_display","type":"uint256"},{"internalType":"bool","name":"_guess","type":"bool"}],"name":"winOrLose","outputs":[{"internalType":"bool","name":"","type":"bool"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"withdrawBet","outputs":[],"stateMutability":"nonpayable","type":"function"},{"stateMutability":"payable","type":"receive"}]
