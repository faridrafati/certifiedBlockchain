/**
 * @file WeightedVotingConfig.js
 * @description Configuration for Weighted Voting smart contract
 * @author CertifiedBlockchain
 *
 * Contains the deployed contract address and ABI for the WeightedVoting contract.
 * The address is loaded from environment variables for deployment flexibility.
 *
 * Contract Functions:
 * - voteForCandidate(index): Vote for candidate by index
 * - authorizeVoter(address, weight): Authorize voter with weight (owner only)
 * - getAllCandidatesWithVotes(): Get all candidates and their vote counts
 * - getVoteForCandidate(index): Get votes for specific candidate
 * - isAuthorizedVoter(): Check authorization status and weight
 * - candidatesList(index): Get candidate at index
 *
 * Authorization States:
 * - Not authorized: Cannot vote
 * - Authorized (weight > 0): Can vote with specified weight
 * - Voted (weight = 0): Already cast vote
 *
 * Used By: WeightedVoting.jsx
 *
 * Environment Variable: VITE_WEIGHTEDVOTING_ADDRESS
 */

// Default: Sepolia deployment from README.md; override via VITE_WEIGHTEDVOTING_ADDRESS in .env
export const WEIGHTEDVOTING_ADDRESS = import.meta.env.VITE_WEIGHTEDVOTING_ADDRESS || '0x89feB6297b6AEC69Bbb81A69a20209Fc89f9128E';
export const WEIGHTEDVOTING_ABI = [{"inputs":[{"internalType":"string[]","name":"_Candidates","type":"string[]"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"_address","type":"address"},{"internalType":"uint256","name":"_weight","type":"uint256"}],"name":"authorizeVoter","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"candidatesList","outputs":[{"internalType":"string","name":"name","type":"string"},{"internalType":"uint256","name":"voteCount","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAllCandidatesWithVotes","outputs":[{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_index","type":"uint256"}],"name":"getVoteForCandidate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"isAuthorizedVoter","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_index","type":"uint256"}],"name":"voteForCandidate","outputs":[],"stateMutability":"nonpayable","type":"function"}]