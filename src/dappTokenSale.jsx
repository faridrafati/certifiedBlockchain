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
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SendIcon from '@mui/icons-material/Send';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  DAPPTOKENSALE_ABI,
  DAPPTOKENSALE_ADDRESS,
} from './components/config/DappTokenSaleConfig';
import {
  DAPPTOKEN_ABI,
  DAPPTOKEN_ADDRESS,
} from './components/config/DappTokenConfig';
import LoadingSpinner from './components/LoadingSpinner';
import ConfirmDialog from './components/ConfirmDialog';
import ContractInfo from './components/ContractInfo';
import './components/css/dapptokensale.css';

const DappTokenSale = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [tokenContract, setTokenContract] = useState(null);
  const [saleContract, setSaleContract] = useState(null);
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
  const [contractBalance, setContractBalance] = useState('0');

  // Sale state
  const [tokenPrice, setTokenPrice] = useState('0');
  const [tokensSold, setTokensSold] = useState('0');
  const [buyAmount, setBuyAmount] = useState('');

  // Transfer state
  const [transferAddress, setTransferAddress] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  // Admin state
  const [admin, setAdmin] = useState('');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

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

  const handleBuyAmountChange = (e) => {
    const value = e.target.value.replace(/,/g, '');
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBuyAmount(formatNumberWithCommas(value));
    }
  };

  const handleTransferAmountChange = (e) => {
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
    async (tokenContractInstance, saleContractInstance, userAccount) => {
      try {
        // Get token properties
        const name = await tokenContractInstance.methods.name().call();
        const symbol = await tokenContractInstance.methods.symbol().call();
        const decimals = await tokenContractInstance.methods.decimals().call();
        const supply = await tokenContractInstance.methods.totalSupply().call();

        // Convert BigInt to string first for cross-browser compatibility
        const decimalsNum = Number(decimals.toString());
        const supplyNum = Number(supply.toString());

        setTokenName(name);
        setTokenSymbol(symbol);
        setTokenDecimals(decimalsNum);
        setTotalSupply((supplyNum / 10 ** decimalsNum).toString());

        // Get user balance
        const userBalance = await tokenContractInstance.methods
          .balanceOf(userAccount)
          .call();
        setBalance(
          (Number(userBalance.toString()) / 10 ** decimalsNum).toString()
        );

        // Get contract balance
        const saleBalance = await tokenContractInstance.methods
          .balanceOf(DAPPTOKENSALE_ADDRESS)
          .call();
        setContractBalance(
          (Number(saleBalance.toString()) / 10 ** decimalsNum).toString()
        );

        // Get sale info
        const price = await saleContractInstance.methods.tokenPrice().call();
        setTokenPrice(price);

        // Try getTokensSold() first (new contract), fallback to tokensSold() (old contract)
        let sold;
        try {
          sold = await saleContractInstance.methods.getTokensSold().call();
        } catch {
          // Fallback for old contract that doesn't have getTokensSold()
          sold = await saleContractInstance.methods.tokensSold().call();
        }
        setTokensSold(sold.toString());

        // Try to get admin address (new contract only)
        try {
          const adminAddress = await saleContractInstance.methods.getAdmin().call();
          setAdmin(adminAddress);
        } catch {
          // Old contract doesn't have getAdmin()
          setAdmin('');
        }
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

      // Initialize both contracts
      const tokenContractInstance = new web3Instance.eth.Contract(
        DAPPTOKEN_ABI,
        DAPPTOKEN_ADDRESS
      );
      setTokenContract(tokenContractInstance);

      const saleContractInstance = new web3Instance.eth.Contract(
        DAPPTOKENSALE_ABI,
        DAPPTOKENSALE_ADDRESS
      );
      setSaleContract(saleContractInstance);

      await getTokenInfo(
        tokenContractInstance,
        saleContractInstance,
        userAccount
      );

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
    if (!tokenContract || !saleContract || !account) return;

    const interval = setInterval(() => {
      getTokenInfo(tokenContract, saleContract, account);
    }, 12000);

    return () => clearInterval(interval);
  }, [tokenContract, saleContract, account, getTokenInfo]);

  const handleRefresh = async () => {
    if (!tokenContract || !saleContract || !account) return;
    try {
      await getTokenInfo(tokenContract, saleContract, account);
      toast.success('Data refreshed!');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleBuyTokens = async (e) => {
    e.preventDefault();

    if (!saleContract || !tokenContract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    const rawBuyAmount = parseFormattedNumber(buyAmount);

    if (!rawBuyAmount || parseFloat(rawBuyAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setSubmitting(true);

      // User enters whole token amount (e.g., 1000 means 1000 full tokens)
      // Contract handles decimals internally: tokenAmount = numberOfTokens * 10^decimals
      // Cost calculation: msg.value == numberOfTokens * tokenPrice
      const numberOfTokens = Math.floor(parseFloat(rawBuyAmount));
      const ethCost = (BigInt(tokenPrice) * BigInt(numberOfTokens)).toString();

      toast.info('Buying tokens. Please confirm in MetaMask...');

      const receipt = await saleContract.methods
        .buyTokens(numberOfTokens)
        .send({ from: account, value: ethCost, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        });

      if (receipt.status) {
        toast.success('Tokens purchased successfully!');
        setBuyAmount('');
        // Refresh balance after successful purchase
        await getTokenInfo(tokenContract, saleContract, account);
      }
    } catch (error) {
      console.error('Buy tokens failed:', error);
      toast.error(`Failed to buy tokens: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!tokenContract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!transferAddress.trim()) {
      toast.error('Please enter a recipient address');
      return;
    }

    const rawTransferAmount = parseFormattedNumber(transferAmount);

    if (!rawTransferAmount || parseFloat(rawTransferAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!web3.utils.isAddress(transferAddress)) {
      toast.error('Invalid recipient address');
      return;
    }

    if (parseFloat(rawTransferAmount) > parseFloat(balance)) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setSubmitting(true);

      // Convert amount to wei (with decimals) using BigInt to avoid scientific notation
      const [wholePart, decimalPart = ''] = rawTransferAmount.split('.');
      const paddedDecimal = decimalPart.padEnd(tokenDecimals, '0').slice(0, tokenDecimals);
      const amountInWei = BigInt(wholePart + paddedDecimal).toString();

      toast.info('Transferring tokens. Please confirm in MetaMask...');

      const receipt = await tokenContract.methods
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
        await getTokenInfo(tokenContract, saleContract, account);
      }
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error(`Failed to transfer: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndSale = () => {
    if (!saleContract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'End Token Sale',
      message:
        'Are you sure you want to end the token sale? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          setSubmitting(true);
          toast.info('Ending token sale. Please confirm in MetaMask...');

          const receipt = await saleContract.methods
            .endSale()
            .send({ from: account, gas: '1000000' })
            .on('transactionHash', (hash) => {
              toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
            });

          if (receipt.status) {
            toast.success('Token sale ended successfully!');
            await getTokenInfo(tokenContract, saleContract, account);
          }
        } catch (error) {
          console.error('End sale failed:', error);
          toast.error(
            `Failed to end sale: ${error.message || 'Unknown error'}`
          );
        } finally {
          setSubmitting(false);
        }
      },
    });
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

  if (loading) {
    return <LoadingSpinner message="Loading token sale..." />;
  }

  // Calculate progress based on tokens sold vs total allocated to sale (sold + available)
  const totalAllocated = parseFloat(tokensSold) + parseFloat(contractBalance);
  const progress = totalAllocated > 0 ? Math.floor((parseFloat(tokensSold) / totalAllocated) * 100) : 0;
  const priceInEth = web3 ? parseFloat(web3.utils.fromWei(tokenPrice, 'ether')) : 0;

  return (
    <div className="tokensale-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-title-row">
            <h1 className="display-4 fw-bold mb-3">
              <TrendingUpIcon className="hero-icon" />
              {tokenName} Token Sale
            </h1>
            <ContractInfo
              contractAddress={DAPPTOKENSALE_ADDRESS}
              contractName={`${tokenName} Token Sale`}
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
            Participate in the {tokenSymbol} token crowdsale
          </p>
        </div>
      </section>

      {/* Token Information Panel */}
      <Card className="token-info-card">
        <CardContent>
          <h3 className="token-info-title">Token Information</h3>
          <Divider className="divider" />
          <div className="token-info-grid">
            {/* Row 1: Token Name */}
            <div className="token-info-row">
              <div className="token-info-item full-width">
                <span className="token-info-label">Token Name</span>
                <span className="token-info-value">{tokenName}</span>
              </div>
            </div>
            {/* Row 2: Decimals and Symbol */}
            <div className="token-info-row">
              <div className="token-info-item">
                <span className="token-info-label">Decimals</span>
                <span className="token-info-value">{tokenDecimals}</span>
              </div>
              <div className="token-info-item">
                <span className="token-info-label">Symbol</span>
                <span className="token-info-value">{tokenSymbol}</span>
              </div>
            </div>
            {/* Row 3: Total Supply */}
            <div className="token-info-row">
              <div className="token-info-item full-width">
                <span className="token-info-label">Total Supply</span>
                <span className="token-info-value">
                  {parseFloat(totalSupply).toLocaleString()} {tokenSymbol}
                </span>
              </div>
            </div>
            {/* Row 4: Contract Address */}
            <div className="token-info-row">
              <div className="token-info-item full-width">
                <span className="token-info-label">Contract Address</span>
                <span className="token-info-value address">
                  {DAPPTOKEN_ADDRESS}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="sale-content">
        {/* Buy Tokens Card */}
        <Card className="buy-card">
          <CardContent>
            <div className="card-header-section">
              <div className="header-with-icon">
                <ShoppingCartIcon className="section-icon" />
                <h3>Buy Tokens</h3>
              </div>
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh} className="refresh-btn">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </div>

            <Divider className="divider" />

            <div className="sale-info">
              <div className="info-row">
                <span className="info-label">Token Price:</span>
                <Chip
                  label={`${priceInEth} ETH per ${tokenSymbol}`}
                  color="primary"
                  className="price-chip"
                />
              </div>

              <div className="info-row">
                <span className="info-label">Your Balance:</span>
                <span className="info-value">
                  {parseFloat(balance).toLocaleString()} {tokenSymbol}
                </span>
              </div>
            </div>

            <Divider className="divider" />

            <form onSubmit={handleBuyTokens}>
              <div className="form-group">
                <TextField
                  label={`Amount (${tokenSymbol})`}
                  variant="outlined"
                  fullWidth
                  type="text"
                  value={buyAmount}
                  onChange={handleBuyAmountChange}
                  placeholder="0.0"
                  disabled={submitting}
                  required
                  helperText={
                    buyAmount
                      ? `Cost: ${(parseFloat(parseFormattedNumber(buyAmount)) * parseFloat(tokenPrice) / Math.pow(10, 18)).toFixed(6)} ETH`
                      : 'Enter amount to see cost'
                  }
                />

                <div className="quick-amounts">
                  <span className="quick-label">Quick Buy:</span>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setBuyAmount('100')}
                    disabled={submitting}
                  >
                    100
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setBuyAmount('500')}
                    disabled={submitting}
                  >
                    500
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setBuyAmount(formatNumberWithCommas('1000'))}
                    disabled={submitting}
                  >
                    1,000
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setBuyAmount(formatNumberWithCommas('5000'))}
                    disabled={submitting}
                  >
                    5,000
                  </Button>
                </div>

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  fullWidth
                  disabled={submitting || !buyAmount}
                  className="buy-button"
                  startIcon={<ShoppingCartIcon />}
                >
                  {submitting ? 'Buying...' : 'Buy Tokens'}
                </Button>
              </div>
            </form>

            <Divider className="divider" />

            <div className="progress-section">
              <div className="progress-header">
                <span className="progress-label">Sale Progress</span>
                <span className="progress-percentage">{progress}%</span>
              </div>

              <LinearProgress
                variant="determinate"
                value={progress}
                className="progress-bar"
              />

              <div className="progress-stats">
                <span className="stat-item">
                  <strong>{parseFloat(tokensSold).toLocaleString()}</strong> sold
                </span>
                <span className="stat-divider">/</span>
                <span className="stat-item">
                  <strong>{parseFloat(contractBalance).toLocaleString()}</strong>{' '}
                  available
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet & Transfer Card */}
        <Card className="wallet-card">
          <CardContent>
            <div className="card-header-section">
              <div className="header-with-icon">
                <SendIcon className="section-icon" />
                <h3>My Wallet & Transfer</h3>
              </div>
            </div>

            <Divider className="divider" />

            <div className="balance-display">
              <span className="balance-label">Your Token Balance</span>
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

            <Divider className="divider" />

            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <h4 className="section-subtitle">Transfer Tokens</h4>

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
                  onChange={handleTransferAmountChange}
                  placeholder="0.0"
                  disabled={submitting}
                  required
                  helperText={`Available: ${parseFloat(balance).toLocaleString()} ${tokenSymbol}`}
                />

                <Button
                  variant="contained"
                  color="secondary"
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

            {admin && account && admin.toLowerCase() === account.toLowerCase() && (
              <>
                <Divider className="divider" />

                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  fullWidth
                  onClick={handleEndSale}
                  disabled={submitting}
                  className="end-sale-button"
                  startIcon={<StopCircleIcon />}
                >
                  {submitting ? 'Ending Sale...' : 'End Token Sale (Admin Only)'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </div>
  );
};

DappTokenSale.propTypes = {};

export default DappTokenSale;
