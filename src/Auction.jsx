import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import { TextField, Button, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import car from './components/images/car.png';
import sold from './components/images/sold.png';
import { AUCTION_ABI, AUCTION_ADDRESS } from './components/config/AuctionConfig';
import ContractInfo from './components/ContractInfo';
import './components/css/auction.css';

const Auction = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState('');
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);

  // Auction specific state
  const [highestBid, setHighestBid] = useState('0');
  const [highestBidder, setHighestBidder] = useState('');
  const [accountBid, setAccountBid] = useState('0');
  const [endTime, setEndTime] = useState('');
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [bidInput, setBidInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const formatDateTime = (timestamp) => {
    // Convert BigInt to Number if needed
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(ts * 1000);
  };

  const dateToTimestamp = (dateString) => {
    return new Date(dateString).valueOf() / 1000;
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

      const contractInstance = new web3Instance.eth.Contract(AUCTION_ABI, AUCTION_ADDRESS);
      setContract(contractInstance);

      // Get owner
      let contractOwner = '';
      const ownerMethods = ['getOwner', 'getOwnerAddress', 'owner'];
      for (const method of ownerMethods) {
        try {
          contractOwner = await contractInstance.methods[method]().call();
          if (contractOwner) break;
        } catch (err) {
          // Method doesn't exist, try next one
        }
      }
      setOwner(contractOwner);

      // Get auction data
      const hBid = await contractInstance.methods.HighestBid().call();
      const hBidder = await contractInstance.methods.HighestBidder().call();
      const accBid = await contractInstance.methods.getBidderBid(userAccount).call();
      const eTime = await contractInstance.methods.getEndTime().call();
      const aEnded = await contractInstance.methods.getAuctionEnded().call();

      // Convert BigInt to string/number for cross-browser compatibility
      setHighestBid(hBid.toString());
      setHighestBidder(hBidder);
      setAccountBid(accBid.toString());
      setEndTime(Number(eTime.toString()));
      setAuctionEnded(aEnded);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  // Auto-refresh every 12 seconds (Ethereum block time)
  useEffect(() => {
    if (!contract || !account) return;

    const interval = setInterval(() => {
      initializeContract();
    }, 12000);

    return () => clearInterval(interval);
  }, [contract, account, initializeContract]);

  const handlePutBid = async () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!bidInput || parseFloat(bidInput) <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }

    // Calculate the new total bid and validate it exceeds the highest bid
    const bidAmountWei = BigInt(web3.utils.toWei(bidInput, 'finney'));
    const currentAccountBid = BigInt(accountBid);
    const currentHighestBid = BigInt(highestBid);
    const newTotalBid = currentAccountBid + bidAmountWei;

    if (newTotalBid <= currentHighestBid) {
      const minimumNeeded = currentHighestBid - currentAccountBid + BigInt(1);
      const minimumInFinney = web3.utils.fromWei(minimumNeeded.toString(), 'finney');
      const minimumInEth = web3.utils.fromWei(minimumNeeded.toString(), 'ether');
      toast.error(
        `Your bid must exceed the highest bid. You need at least ${parseFloat(minimumInFinney).toFixed(2)} finney (${parseFloat(minimumInEth).toFixed(6)} ETH) to become the highest bidder.`
      );
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Placing bid. Please confirm in MetaMask...');

      await contract.methods
        .putBid()
        .send({
          from: account,
          gas: '1000000',
          value: web3.utils.toWei(bidInput, 'finney'),
        })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', () => {
          toast.success('Bid placed successfully!');
          initializeContract();
          setBidInput('');
        })
        .on('error', (error) => {
          console.error('Bid error:', error);
          toast.error(`Bid failed: ${error.message}`);
        });
    } catch (error) {
      console.error('Bid failed:', error);
      toast.error(`Bid failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndAuction = async () => {
    if (!contract || !account) return;

    try {
      setSubmitting(true);
      toast.info('Ending auction. Please confirm in MetaMask...');

      await contract.methods
        .endAuction(true)
        .send({ from: account, gas: '1000000' })
        .on('receipt', () => {
          toast.success('Auction ended successfully!');
          initializeContract();
        });
    } catch (error) {
      toast.error(`Failed to end auction: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartAuction = async () => {
    if (!contract || !account) return;

    try {
      setSubmitting(true);
      toast.info('Starting auction. Please confirm in MetaMask...');

      await contract.methods
        .endAuction(false)
        .send({ from: account, gas: '1000000' })
        .on('receipt', () => {
          toast.success('Auction started successfully!');
          initializeContract();
        });
    } catch (error) {
      toast.error(`Failed to start auction: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetEndTime = async () => {
    if (!contract || !account || !endTimeInput) return;

    try {
      setSubmitting(true);
      const timestamp = parseInt(dateToTimestamp(endTimeInput));
      toast.info('Setting end time. Please confirm in MetaMask...');

      await contract.methods
        .putEndTime(timestamp)
        .send({ from: account, gas: '1000000' })
        .on('receipt', () => {
          toast.success('End time set successfully!');
          initializeContract();
          setEndTimeInput('');
        });
    } catch (error) {
      toast.error(`Failed to set end time: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !account || !withdrawAddress) return;

    try {
      setSubmitting(true);
      toast.info('Processing withdrawal. Please confirm in MetaMask...');

      await contract.methods
        .withdrawBid(withdrawAddress)
        .send({ from: account, gas: '1000000' })
        .on('receipt', () => {
          toast.success('Withdrawal successful!');
          initializeContract();
          setWithdrawAddress('');
        });
    } catch (error) {
      toast.error(`Withdrawal failed: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    if (!contract) return;
    try {
      await initializeContract();
      toast.success('Data refreshed!');
    } catch (error) {
      console.error('Refresh failed:', error);
      toast.error('Failed to refresh data');
    }
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading auction...</p>
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const isEnded = auctionEnded || now > endTime;
  const isBidder = highestBidder.toLowerCase() === account.toLowerCase();
  const isOwner = owner.toLowerCase() === account.toLowerCase();

  if (!isOwner) {
    // Regular user view
    return (
      <div className="auction-container">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-title-row">
              <h1 className="display-4 fw-bold mb-3">Blockchain Auction</h1>
              <ContractInfo
                contractAddress={AUCTION_ADDRESS}
                contractName="Auction Contract"
                network={import.meta.env.VITE_NETWORK_ID}
                owner={owner}
                account={account}
              />
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh} className="hero-refresh-btn">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </div>
            <p className="lead mb-4">
              Participate in a transparent, decentralized auction powered by smart contracts.
            </p>
          </div>
        </section>

        <div className="auction-content">
          <div className="auction-item-card">
            <div className="item-image-container">
              <img
                src={isEnded ? sold : car}
                alt={isEnded ? 'Sold' : 'Auction Item'}
                className="auction-item-image"
              />
              {isEnded && <div className="sold-overlay">SOLD</div>}
            </div>

            <div className="auction-status">
              <span className={`status-badge ${isEnded ? 'ended' : 'active'}`}>
                {isEnded ? '⏰ Auction Ended' : '🔥 Live Auction'}
              </span>
              <p className="end-time">
                {isEnded
                  ? `Ended: ${formatDateTime(endTime)}`
                  : `Ends: ${formatDateTime(endTime)}`}
              </p>
            </div>
          </div>

          <div className="bid-section">
            <div className="current-bid-card">
              <h3>Current Bid</h3>
              <div className="bid-amount">
                {web3 ? web3.utils.fromWei(highestBid, 'ether') : '0'} ETH
              </div>
              <div className="bidder-info">
                {isBidder ? (
                  <span className="your-bid">🎉 You are the highest bidder!</span>
                ) : (
                  <span className="other-bidder">
                    Highest Bidder: {highestBidder.substring(0, 6)}...
                    {highestBidder.substring(38)}
                  </span>
                )}
              </div>
            </div>

            {!isEnded && (
              <div className="place-bid-card">
                <h4>Place Your Bid</h4>
                <div className="bid-input-group">
                  <TextField
                    label="Bid Amount (in finney)"
                    variant="outlined"
                    fullWidth
                    value={bidInput}
                    onChange={(e) => setBidInput(e.target.value)}
                    type="number"
                    helperText="1 ETH = 1000 finney"
                    disabled={submitting}
                  />
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handlePutBid}
                    disabled={submitting || !bidInput}
                    className="bid-button"
                  >
                    {submitting ? 'Processing...' : 'Place Bid'}
                  </Button>
                </div>
              </div>
            )}

            {!isBidder && web3 && accountBid !== '0' && (
              <div className="your-bid-info">
                <p>Your Bid: {web3.utils.fromWei(accountBid, 'ether')} ETH</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="auction-container admin-view">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-title-row">
            <h1 className="display-4 fw-bold mb-3">Auction Admin Panel</h1>
            <ContractInfo
              contractAddress={AUCTION_ADDRESS}
              contractName="Auction Contract"
              network={import.meta.env.VITE_NETWORK_ID}
              owner={owner}
              account={account}
            />
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} className="hero-refresh-btn">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </div>
          <p className="lead mb-4">Manage your blockchain auction</p>
        </div>
      </section>

      <div className="auction-content">
        <div className="auction-item-card">
          <div className="item-image-container">
            <img
              src={isEnded ? sold : car}
              alt={isEnded ? 'Sold' : 'Auction Item'}
              className="auction-item-image"
            />
            {isEnded && <div className="sold-overlay">SOLD</div>}
          </div>
          <div className="auction-status">
            <span className={`status-badge ${isEnded ? 'ended' : 'active'}`}>
              {auctionEnded ? 'Auction Ended' : 'Auction Active'}
            </span>
            <p className="end-time">
              {isEnded
                ? `Ended: ${formatDateTime(endTime)}`
                : `Ends: ${formatDateTime(endTime)}`}
            </p>
          </div>

          <div className="admin-bid-info">
            <div className="admin-bid-section">
              <h4>💰 Total Deposited Bid</h4>
              <div className="admin-bid-amount">
                {web3 ? web3.utils.fromWei(highestBid, 'ether') : '0'} ETH
              </div>
              {highestBidder !== '0x0000000000000000000000000000000000000000' && (
                <div className="admin-bidder-info">
                  <p className="admin-bidder-label">Highest Bidder:</p>
                  <p className="admin-bidder-address">
                    {highestBidder.substring(0, 6)}...{highestBidder.substring(38)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="admin-controls">
          <div className="control-card">
            <h4>⏰ Set End Time</h4>
            <TextField
              label="End Time"
              type="datetime-local"
              variant="outlined"
              fullWidth
              value={endTimeInput}
              onChange={(e) => setEndTimeInput(e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={submitting}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSetEndTime}
              disabled={submitting || !endTimeInput}
              fullWidth
            >
              Set End Time
            </Button>
          </div>

          <div className="control-card">
            <h4>💰 Withdraw Bid</h4>
            <TextField
              label="Withdraw Address"
              variant="outlined"
              fullWidth
              value={withdrawAddress}
              onChange={(e) => setWithdrawAddress(e.target.value)}
              disabled={submitting}
            />
            <Button
              variant="contained"
              color="warning"
              onClick={handleWithdraw}
              disabled={submitting || !withdrawAddress}
              fullWidth
            >
              Withdraw
            </Button>
          </div>

          <div className="control-card">
            <h4>🎯 Auction Control</h4>
            <p className="status-text">
              Status: {auctionEnded ? 'Ended' : 'In Progress'}
            </p>
            {auctionEnded ? (
              <Button
                variant="contained"
                color="success"
                onClick={handleStartAuction}
                disabled={submitting}
                fullWidth
              >
                Start Auction
              </Button>
            ) : (
              <Button
                variant="contained"
                color="error"
                onClick={handleEndAuction}
                disabled={submitting}
                fullWidth
              >
                End Auction
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

Auction.propTypes = {};

export default Auction;
