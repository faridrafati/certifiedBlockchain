/**
 * @file CertificateConfig.js
 * @description Configuration for Certificate Verification smart contract
 * @author CertifiedBlockchain
 *
 * Contains the deployed contract address and ABI for the Certificate contract.
 * The address is loaded from environment variables for deployment flexibility.
 *
 * Contract Functions:
 * - addCertificate(): Issue a new certificate (owner only)
 * - checkCertificate(credentialID): Verify certificate by ID
 * - certified(index): Get certificate at index
 * - getNumberOfCertificates(): Total certificates issued
 * - getOwner(): Get contract owner address
 *
 * Certificate Data Structure:
 * - credentialID: Unique identifier (SHA-256 hash)
 * - name: Recipient name
 * - courseName: Course/certification name
 * - issuingOrganization: Organization name
 * - issueDate: Unix timestamp of issuance
 * - expirationDate: Unix timestamp of expiration (0 = no expiry)
 * - reasonForAward: Description of achievement
 *
 * Used By: Certificate.jsx
 *
 * Environment Variable: VITE_CERTIFICATE_ADDRESS
 */

export const CERTIFICATE_ADDRESS = import.meta.env.VITE_CERTIFICATE_ADDRESS;
export const CERTIFICATE_ABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"string","name":"_credentialID","type":"string"},{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_courseName","type":"string"},{"internalType":"string","name":"_issuingOrganization","type":"string"},{"internalType":"uint256","name":"_issueDate","type":"uint256"},{"internalType":"uint256","name":"_expirationDate","type":"uint256"},{"internalType":"string","name":"_reasonForAward","type":"string"}],"name":"addCertificate","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"certified","outputs":[{"internalType":"string","name":"credentialID","type":"string"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"courseName","type":"string"},{"internalType":"string","name":"issuingOrganization","type":"string"},{"internalType":"uint256","name":"issueDate","type":"uint256"},{"internalType":"uint256","name":"expirationDate","type":"uint256"},{"internalType":"string","name":"reasonForAward","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_credentialID","type":"string"}],"name":"checkCertificate","outputs":[{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"string","name":"","type":"string"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getNumberOfCertificates","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getOwner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"}]