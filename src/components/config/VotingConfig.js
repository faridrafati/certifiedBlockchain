/**
 * @file VotingConfig.js
 * @description Configuration for Democratic Voting smart contract
 * @author CertifiedBlockchain
 *
 * Contains the deployed contract address and ABI for the Voting contract.
 * The address is loaded from environment variables for deployment flexibility.
 *
 * Contract Functions:
 * - voteForCandidate(address): Cast vote for a candidate
 * - addCandidate(address): Add new candidate (owner only)
 * - getAllCandidates(): Get all candidate addresses
 * - VotesForCandidate(address): Get vote count for candidate
 * - CandidateExists(address): Check if address is a candidate
 * - HasVoted(address): Check if address has voted
 * - setVotingStatus(bool): Open/close voting (owner only)
 * - setMaxCandidates(uint): Set max candidates limit
 *
 * Events:
 * - CandidateAdded: Emitted when candidate is added
 * - VoteCast: Emitted when vote is cast
 * - VotingStatusChanged: Emitted when voting opens/closes
 *
 * Used By: Voting.jsx
 *
 * Environment Variable: VITE_VOTING_ADDRESS
 */

export const VOTING_ADDRESS = import.meta.env.VITE_VOTING_ADDRESS;
export const VOTING_ABI = [{"inputs":[{"internalType":"address[]","name":"FirstCandidates","type":"address[]"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"candidate","type":"address"},{"indexed":false,"internalType":"uint256","name":"totalCandidates","type":"uint256"}],"name":"CandidateAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"voter","type":"address"},{"indexed":true,"internalType":"address","name":"candidate","type":"address"},{"indexed":false,"internalType":"uint256","name":"totalVotes","type":"uint256"}],"name":"VoteCast","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"bool","name":"isOpen","type":"bool"}],"name":"VotingStatusChanged","type":"event"},{"inputs":[{"internalType":"address","name":"Candidate","type":"address"}],"name":"CandidateExists","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"Candidates","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"Voter","type":"address"}],"name":"HasVoted","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"Candidate","type":"address"}],"name":"VotesForCandidate","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"Candidate","type":"address"}],"name":"addCandidate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getAllCandidates","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTotalVoters","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"maxCandidates","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"numberOfCandidates","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_max","type":"uint256"}],"name":"setMaxCandidates","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bool","name":"_isOpen","type":"bool"}],"name":"setVotingStatus","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"Candidate","type":"address"}],"name":"voteForCandidate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"votes","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"votingOpen","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}]
