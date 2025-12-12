/**
 * @file AuctionConfig.js
 * @description Configuration for Decentralized Auction smart contract
 * @author CertifiedBlockchain
 *
 * Contains the deployed contract address and ABI for the Auction contract.
 * The address is loaded from environment variables for deployment flexibility.
 *
 * Contract Functions:
 * - putBid(): Place a bid (payable)
 * - withdrawBid(): Withdraw losing bid
 * - withdrawWinningBid(): Owner withdraws winning amount
 * - endAuction(bool): End the auction
 * - putEndTime(timestamp): Set auction end time
 * - HighestBid/HighestBidder: Get current winning bid/bidder
 * - getBidderBid(address): Get bid amount for specific address
 * - getAuctionEnded(): Check if auction has ended
 *
 * Events:
 * - BidPlaced: Emitted when bid is placed
 * - BidWithdrawn: Emitted when bid is withdrawn
 * - AuctionEnded: Emitted when auction ends
 * - AuctionEndTimeSet: Emitted when end time is set
 *
 * Used By: Auction.jsx
 *
 * Environment Variable: VITE_AUCTION_ADDRESS
 */

export const AUCTION_ADDRESS = import.meta.env.VITE_AUCTION_ADDRESS;
export const AUCTION_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"endTime","type":"uint256"}],"name":"AuctionEndTimeSet","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"winner","type":"address"},{"indexed":false,"internalType":"uint256","name":"winningBid","type":"uint256"}],"name":"AuctionEnded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"bidder","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"totalBid","type":"uint256"}],"name":"BidPlaced","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"bidder","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BidWithdrawn","type":"event"},{"inputs":[],"name":"HighestBid","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"HighestBidder","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bool","name":"_trueFalse","type":"bool"}],"name":"endAuction","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getAuctionEnded","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_address","type":"address"}],"name":"getBidderBid","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getEndTime","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwnerAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"putBid","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_endTime","type":"uint256"}],"name":"putEndTime","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdrawBid","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"withdrawWinningBid","outputs":[],"stateMutability":"nonpayable","type":"function"}]
