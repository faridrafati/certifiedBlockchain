/**
 * @file AdoptionConfig.js
 * @description Configuration for Pet Adoption smart contract
 * @author CertifiedBlockchain
 *
 * Contains the deployed contract address and ABI for the Adoption contract.
 * The address is loaded from environment variables for deployment flexibility.
 *
 * Contract Functions:
 * - adopt(petId): Adopt a pet by ID (0-15)
 * - adopters(petId): Get adopter address for a pet
 * - getAdopters(): Get all 16 adopter addresses
 *
 * Used By: adoption.jsx
 *
 * Environment Variable: VITE_ADOPTION_ADDRESS
 */

// Default: Sepolia deployment from README.md; override via VITE_ADOPTION_ADDRESS in .env
export const ADOPTION_ADDRESS = import.meta.env.VITE_ADOPTION_ADDRESS || '0x625E384A39d8A3C50FA8C5EbEf39a664E9e7eC17';
export const ADOPTION_ABI = [{"inputs":[{"internalType":"uint256","name":"_petId","type":"uint256"}],"name":"adopt","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"adopters","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getAdopters","outputs":[{"internalType":"address[16]","name":"","type":"address[16]"}],"stateMutability":"view","type":"function"}]