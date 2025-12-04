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
import HideShow from './HideShow.jsx';
import LoadingSpinner from './components/LoadingSpinner';
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

        setTokenName(name);
        setTokenSymbol(symbol);
        setTokenDecimals(parseInt(decimals));
        setTotalSupply((parseInt(supply) / 10 ** parseInt(decimals)).toString());

        // Get user balance
        const userBalance = await contractInstance.methods
          .balanceOf(userAccount)
          .call();
        setBalance((parseInt(userBalance) / 10 ** parseInt(decimals)).toString());
      } catch (error) {
        console.error('Error getting token info:', error);
        toast.error('Failed to load token information');
      }
    },
    []
  );

  const initializeContract = useCallback(async () => {
    try {
      const web3Instance = new Web3(
        Web3.givenProvider || 'http://localhost:8545'
      );
      setWeb3(web3Instance);

      const networkType = await web3Instance.eth.net.getNetworkType();
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

    if (!transferAmount || parseFloat(transferAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!web3.utils.isAddress(transferAddress)) {
      toast.error('Invalid recipient address');
      return;
    }

    if (parseFloat(transferAmount) > parseFloat(balance)) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setSubmitting(true);

      // Convert amount to wei (with decimals)
      const amountInWei = (
        parseFloat(transferAmount) *
        10 ** tokenDecimals
      ).toString();

      toast.info('Transferring tokens. Please confirm in MetaMask...');

      await contract.methods
        .transfer(transferAddress, amountInWei)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Tokens transferred successfully!');
          setTransferAddress('');
          setTransferAmount('');
          await getTokenInfo(contract, account);
        })
        .on('error', (error) => {
          console.error('Transfer error:', error);
          toast.error(`Failed to transfer: ${error.message}`);
        });
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
          <h1 className="display-4 fw-bold mb-3">
            <AccountBalanceWalletIcon className="hero-icon" />
            {tokenName}
          </h1>
          <p className="lead mb-4">
            ERC-20 Token Wallet - Manage your {tokenSymbol} tokens
          </p>
          <HideShow
            currentAccount={currentAccount}
            contractAddress={DAPPTOKEN_ADDRESS}
            chainId={chainId}
          />
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
              <Grid item xs={12} sm={6}>
                <div className="info-item">
                  <span className="info-label">Token Name</span>
                  <span className="info-value">{tokenName}</span>
                </div>
              </Grid>

              <Grid item xs={12} sm={6}>
                <div className="info-item">
                  <span className="info-label">Symbol</span>
                  <span className="info-value">{tokenSymbol}</span>
                </div>
              </Grid>

              <Grid item xs={12} sm={6}>
                <div className="info-item">
                  <span className="info-label">Decimals</span>
                  <span className="info-value">{tokenDecimals}</span>
                </div>
              </Grid>

              <Grid item xs={12} sm={6}>
                <div className="info-item">
                  <span className="info-label">Total Supply</span>
                  <span className="info-value">
                    {parseFloat(totalSupply).toLocaleString()} {tokenSymbol}
                  </span>
                </div>
              </Grid>

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
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.0"
                  disabled={submitting}
                  required
                  inputProps={{
                    min: '0',
                    step: 'any',
                  }}
                  helperText={`Available: ${parseFloat(balance).toLocaleString()} ${tokenSymbol}`}
                />

                <div className="quick-amounts">
                  <span className="quick-label">Quick Amount:</span>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setTransferAmount((parseFloat(balance) * 0.25).toString())
                    }
                    disabled={submitting}
                  >
                    25%
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setTransferAmount((parseFloat(balance) * 0.5).toString())
                    }
                    disabled={submitting}
                  >
                    50%
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      setTransferAmount((parseFloat(balance) * 0.75).toString())
                    }
                    disabled={submitting}
                  >
                    75%
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setTransferAmount(balance)}
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
