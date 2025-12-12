/**
 * @file TicTacToeConfig.js
 * @description Configuration for Standalone TicTacToe Game smart contract
 * @author CertifiedBlockchain
 *
 * Contains the deployed contract address and ABI for the TicTacToe contract.
 * A standalone 2-player TicTacToe game with ETH betting.
 *
 * Contract Functions:
 * - joinGameasPlayer1(): Join as player 1 (payable - game cost)
 * - joinGameasPlayer2(): Join as player 2 (payable - game cost)
 * - setStone(x, y): Make move on 3x3 board
 * - getBoard(): Get current board state (address[3][3])
 * - resetGame(): Reset for new game
 * - withdrawWin(): Withdraw winnings
 * - emergecyCashout(): Emergency fund withdrawal
 *
 * State Variables:
 * - player1, player2: Player addresses
 * - activePlayer: Current turn
 * - gameActive: Game in progress
 * - movesCounter: Moves made (max 9)
 * - gameCost: ETH required to join
 * - gameValidUntil: Timeout timestamp
 *
 * Events:
 * - PlayerJoined, NextPlayer
 * - GameOverWithWin, GameOverWithDraw
 * - PayoutSuccess
 *
 * Used By: Not currently integrated (standalone contract)
 *
 * Environment Variable: VITE_TICTACTOE_ADDRESS
 */

export const TICTACTOE_ADDRESS = import.meta.env.VITE_TICTACTOE_ADDRESS;
export const TICTACTOE_ABI = [{"inputs":[],"stateMutability":"payable","type":"constructor"},{"anonymous":false,"inputs":[],"name":"GameOverWithDraw","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"winner","type":"address"}],"name":"GameOverWithWin","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"player","type":"address"}],"name":"NextPlayer","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"receiver","type":"address"},{"indexed":false,"internalType":"uint256","name":"amountInWei","type":"uint256"}],"name":"PayoutSuccess","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"player","type":"address"}],"name":"PlayerJoined","type":"event"},{"inputs":[],"name":"activePlayer","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"balanceToWithdrawPlayer1","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"balanceToWithdrawPlayer2","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"boardSize","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"emergecyCashout","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"gameActive","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"gameCost","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"gameValidUntil","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getBoard","outputs":[{"internalType":"address[3][3]","name":"","type":"address[3][3]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"joinGameasPlayer1","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"joinGameasPlayer2","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"movesCounter","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"player1","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"player2","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"resetGame","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint8","name":"x","type":"uint8"},{"internalType":"uint8","name":"y","type":"uint8"}],"name":"setStone","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"timeToReact","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"withdrawWin","outputs":[],"stateMutability":"nonpayable","type":"function"}]
