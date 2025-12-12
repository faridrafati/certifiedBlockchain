/**
 * @file dappToken.jsx
 * @description ERC-20 token wallet interface for managing DApp tokens
 * @author CertifiedBlockchain
 *
 * This component provides a complete ERC-20 token wallet where:
 * - Users can view their token balance and token information
 * - Transfer tokens to any Ethereum address
 * - Add the token to MetaMask for tracking
 * - View real-time balance updates
 *
 * Features:
 * - Token information display (name, symbol, decimals, total supply)
 * - Balance tracking with auto-refresh every 12 seconds
 * - Token transfer with validation and confirmation
 * - Quick amount buttons (25%, 50%, 75%, Max)
 * - MetaMask wallet_watchAsset integration
 * - Copy contract address functionality
 *
 * Smart Contract: DappToken.sol (ERC-20)
 * CSS: ./components/css/dapptoken.css
 *
 * Technical Notes:
 * - Uses BigInt for precise token calculations
 * - Handles decimal conversion for display and transfers
 * - Number formatting with commas for readability
 *
 * @example
 * <DappToken />
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import {
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SendIcon from '@mui/icons-material/Send';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  DAPPTOKEN_ABI,
  DAPPTOKEN_ADDRESS,
} from './components/config/DappTokenConfig';
import LoadingSpinner from './components/LoadingSpinner';
import ContractInfo from './components/ContractInfo';
import './components/css/dapptoken.css';

const DappToken = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Token state
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [totalSupply, setTotalSupply] = useState('0');
  const [balance, setBalance] = useState('0');

  // Transfer state
  const [transferAddress, setTransferAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Helper functions for number formatting
  const formatNumberWithCommas = (value) => {
    if (!value) return '';
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const parseFormattedNumber = (value) => {
    return value.replace(/,/g, '');
  };

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTransferAmount(formatNumberWithCommas(value));
    }
  };

  const checkMetamask = useCallback(async () => {
    try {
      const { ethereum } = window;
      const provider = await detectEthereumProvider();

      if (!provider) {
        toast.error('Please install MetaMask!');
        setLoading(false);
        return;
      }

      const chain = await ethereum.request({ method: 'eth_chainId' });
      setChainId(chain);

      ethereum.on('chainChanged', () => window.location.reload());
      ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
          setAccount(accounts[0]);
          window.location.reload();
        }
      });
    } catch (error) {
      console.error('Error checking MetaMask:', error);
      toast.error('Failed to connect to MetaMask');
      setLoading(false);
    }
  }, []);

  const getTokenInfo = useCallback(
    async (contractInstance, userAccount) => {
      try {
        // Get token properties
        const name = await contractInstance.methods.name().call();
        const symbol = await contractInstance.methods.symbol().call();
        const decimals = await contractInstance.methods.decimals().call();
        const supply = await contractInstance.methods.totalSupply().call();

        // Convert BigInt to string first for cross-browser compatibility
        const decimalsNum = Number(decimals.toString());
        const supplyNum = Number(supply.toString());

        setTokenName(name);
        setTokenSymbol(symbol);
        setTokenDecimals(decimalsNum);
        setTotalSupply((supplyNum / 10 ** decimalsNum).toString());

        // Get user balance
        const userBalance = await contractInstance.methods
          .balanceOf(userAccount)
          .call();
        setBalance((Number(userBalance.toString()) / 10 ** decimalsNum).toString());
      } catch (error) {
        console.error('Error getting token info:', error);
        toast.error('Failed to load token information');
      }
    },
    []
  );

  const initializeContract = useCallback(async () => {
    try {
      if (!window.ethereum) {
        toast.error('Please install MetaMask to use this application');
        setLoading(false);
        return;
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      const chainId = await web3Instance.eth.getChainId();
      const networkNames = {
        1n: 'mainnet',
        5n: 'goerli',
        11155111n: 'sepolia',
        137n: 'polygon',
        80001n: 'mumbai',
        56n: 'bsc',
        97n: 'bsc-testnet',
      };
      const networkType = networkNames[chainId] || `chain-${chainId}`;
      const accounts = await web3Instance.eth.getAccounts();
      const userAccount = accounts[0];

      setNetwork(networkType);
      setAccount(userAccount);
      setCurrentAccount(userAccount);

      const contractInstance = new web3Instance.eth.Contract(
        DAPPTOKEN_ABI,
        DAPPTOKEN_ADDRESS
      );
      setContract(contractInstance);

      await getTokenInfo(contractInstance, userAccount);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [getTokenInfo]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  // Auto-refresh every 12 seconds (Ethereum block time)
  useEffect(() => {
    if (!contract || !account) return;

    const interval = setInterval(() => {
      getTokenInfo(contract, account);
    }, 12000);

    return () => clearInterval(interval);
  }, [contract, account, getTokenInfo]);

  const handleRefresh = async () => {
    if (!contract || !account) return;
    try {
      await getTokenInfo(contract, account);
      toast.success('Balance refreshed!');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!transferAddress.trim()) {
      toast.error('Please enter a recipient address');
      return;
    }

    const rawAmount = parseFormattedNumber(transferAmount);

    if (!rawAmount || parseFloat(rawAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!web3.utils.isAddress(transferAddress)) {
      toast.error('Invalid recipient address');
      return;
    }

    if (parseFloat(rawAmount) > parseFloat(balance)) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setSubmitting(true);

      // Convert amount to wei (with decimals) using BigInt to avoid scientific notation
      const [wholePart, decimalPart = ''] = rawAmount.split('.');
      const paddedDecimal = decimalPart.padEnd(tokenDecimals, '0').slice(0, tokenDecimals);
      const amountInWei = BigInt(wholePart + paddedDecimal).toString();

      toast.info('Transferring tokens. Please confirm in MetaMask...');

      const receipt = await contract.methods
        .transfer(transferAddress, amountInWei)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        });

      if (receipt.status) {
        toast.success('Tokens transferred successfully!');
        setTransferAddress('');
        setTransferAmount('');
        // Refresh balance after successful transfer
        await getTokenInfo(contract, account);
      }
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error(`Failed to transfer: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToWallet = async () => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: DAPPTOKEN_ADDRESS,
            symbol: tokenSymbol,
            decimals: tokenDecimals,
            image: '',
          },
        },
      });

      toast.success(`${tokenName} added to your wallet!`);
    } catch (error) {
      console.error('Add token failed:', error);
      if (error.code !== 4001) {
        toast.error(`Failed to add token: ${error.message}`);
      }
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(DAPPTOKEN_ADDRESS);
    toast.success('Contract address copied to clipboard!');
  };

  if (loading) {
    return <LoadingSpinner message="Loading token wallet..." />;
  }

  return (
    <div className="dapptoken-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-title-row">
            <h1 className="display-4 fw-bold mb-3">
              <AccountBalanceWalletIcon className="hero-icon" />
              {tokenName}
            </h1>
            <ContractInfo
              contractAddress={DAPPTOKEN_ADDRESS}
              contractName={`${tokenName} Token`}
              network={import.meta.env.VITE_NETWORK_ID}
              account={account}
            />
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} className="hero-refresh-btn">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </div>
          <p className="lead mb-4">
            ERC-20 Token Wallet - Manage your {tokenSymbol} tokens
          </p>
        </div>
      </section>

      <div className="token-content">
        {/* Token Information */}
        <Card className="info-card">
          <CardContent>
            <div className="card-header-section">
              <h3>Token Information</h3>
              <Tooltip title="Refresh Balance">
                <IconButton onClick={handleRefresh} className="refresh-btn">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </div>

            <Divider className="divider" />

            <Grid container spacing={3}>
              {/* Row 1: Token Name */}
              <Grid item xs={12}>
                <div className="info-item">
                  <span className="info-label">Token Name</span>
                  <span className="info-value">{tokenName}</span>
                </div>
              </Grid>

              {/* Row 2: Decimals and Symbol */}
              <Grid item xs={12} sm={6}>
                <div className="info-item">
                  <span className="info-label">Decimals</span>
                  <span className="info-value">{tokenDecimals}</span>
                </div>
              </Grid>

              <Grid item xs={12} sm={6}>
                <div className="info-item">
                  <span className="info-label">Symbol</span>
                  <span className="info-value">{tokenSymbol}</span>
                </div>
              </Grid>

              {/* Row 3: Total Supply */}
              <Grid item xs={12}>
                <div className="info-item">
                  <span className="info-label">Total Supply</span>
                  <span className="info-value">
                    {parseFloat(totalSupply).toLocaleString()} {tokenSymbol}
                  </span>
                </div>
              </Grid>

              {/* Row 4: Contract Address */}
              <Grid item xs={12}>
                <div className="info-item">
                  <span className="info-label">Contract Address</span>
                  <div className="address-container">
                    <span className="info-value contract-address">
                      {DAPPTOKEN_ADDRESS}
                    </span>
                    <Tooltip title="Copy Address">
                      <IconButton
                        size="small"
                        onClick={handleCopyAddress}
                        className="copy-btn"
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Wallet Balance */}
        <Card className="balance-card">
          <CardContent>
            <div className="balance-header">
              <AccountBalanceWalletIcon className="balance-icon" />
              <h3>My Wallet</h3>
            </div>

            <Divider className="divider" />

            <div className="balance-display">
              <span className="balance-label">Your Balance</span>
              <div className="balance-amount">
                <span className="balance-value">
                  {parseFloat(balance).toLocaleString()}
                </span>
                <Chip
                  label={tokenSymbol}
                  color="primary"
                  className="token-chip"
                />
              </div>
            </div>

            <Button
              variant="outlined"
              color="primary"
              fullWidth
              size="large"
              onClick={handleAddToWallet}
              startIcon={<AddCircleIcon />}
              className="add-wallet-btn"
            >
              Add {tokenSymbol} to MetaMask
            </Button>
          </CardContent>
        </Card>

        {/* Transfer Tokens */}
        <Card className="transfer-card">
          <CardContent>
            <div className="transfer-header">
              <SendIcon className="transfer-icon" />
              <h3>Transfer Tokens</h3>
            </div>

            <Divider className="divider" />

            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <TextField
                  label="Recipient Address"
                  variant="outlined"
                  fullWidth
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  placeholder="0x..."
                  disabled={submitting}
                  required
                />

                <TextField
                  label={`Amount (${tokenSymbol})`}
                  variant="outlined"
                  fullWidth
                  type="text"
                  value={transferAmount}
                  onChange={handleAmountChange}
                  placeholder="0.0"
                  disabled={submitting}
                  required
                  helperText={`Available: ${parseFloat(balance).toLocaleString()} ${tokenSymbol}`}
                />

                <div className="quick-amounts">
                  <span className="quick-label">Quick Amount:</span>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setTransferAmount(formatNumberWithCommas((parseFloat(balance) * 0.25).toString()))
                    }
                    disabled={submitting}
                  >
                    25%
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setTransferAmount(formatNumberWithCommas((parseFloat(balance) * 0.5).toString()))
                    }
                    disabled={submitting}
                  >
                    50%
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setTransferAmount(formatNumberWithCommas((parseFloat(balance) * 0.75).toString()))
                    }
                    disabled={submitting}
                  >
                    75%
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setTransferAmount(formatNumberWithCommas(balance))}
                    disabled={submitting}
                  >
                    Max
                  </Button>
                </div>

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  fullWidth
                  disabled={submitting || !transferAddress || !transferAmount}
                  className="transfer-button"
                  startIcon={<SendIcon />}
                >
                  {submitting ? 'Transferring...' : 'Transfer Tokens'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

DappToken.propTypes = {};

export default DappToken;
