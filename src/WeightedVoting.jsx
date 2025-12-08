import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import { TextField, Button, Chip, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  WEIGHTEDVOTING_ABI,
  WEIGHTEDVOTING_ADDRESS,
} from './components/config/WeightedVotingConfig';
import ContractInfo from './components/ContractInfo';
import LoadingSpinner from './components/LoadingSpinner';
import './components/css/weightedvoting.css';

const WeightedVoting = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState('');
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Weighted voting state
  const [candidates, setCandidates] = useState([
    { name: '', voteCount: '' },
    { name: '', voteCount: '' },
    { name: '', voteCount: '' },
  ]);
  const [authorizationStatus, setAuthorizationStatus] = useState('');
  const [canVote, setCanVote] = useState(false);

  // Authorization form state
  const [voterAddress, setVoterAddress] = useState('');
  const [voterWeight, setVoterWeight] = useState('1');

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

  const checkAuthorizationStatus = useCallback(async (contractInstance, userAccount) => {
    try {
      const isAuthorized = await contractInstance.methods
        .isAuthorizedVoter()
        .call({ from: userAccount });

      let status;
      let enableButton = false;

      // Convert weight to number for proper comparison (Web3 may return BigInt or string)
      const weight = parseInt(isAuthorized[0].toString()) || 0;
      const hasVoted = isAuthorized[1] === true || isAuthorized[1] === 'true';

      if (weight === 0) {
        status = 'not_authorized';
      } else if (!hasVoted) {
        status = 'authorized_can_vote';
        enableButton = true;
      } else {
        status = 'authorized_voted';
      }

      setAuthorizationStatus(status);
      setCanVote(enableButton);
    } catch (error) {
      console.error('Error checking authorization:', error);
      setAuthorizationStatus('error');
      setCanVote(false);
    }
  }, []);

  const loadCandidates = useCallback(async (contractInstance) => {
    try {
      const list = await contractInstance.methods.getAllCandidatesWithVotes().call();
      const candidatesList = [];

      for (let i = 0; i < 3; i++) {
        candidatesList.push({
          name: list[2 * i],
          voteCount: String(list[2 * i + 1] || 0),
        });
      }

      setCandidates(candidatesList);
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast.error('Failed to load candidates');
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

      const contractInstance = new web3Instance.eth.Contract(
        WEIGHTEDVOTING_ABI,
        WEIGHTEDVOTING_ADDRESS
      );
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

      // Load candidates
      await loadCandidates(contractInstance);

      // Check authorization status
      await checkAuthorizationStatus(contractInstance, userAccount);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [loadCandidates, checkAuthorizationStatus]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  // Auto-refresh every 12 seconds (Ethereum block time)
  useEffect(() => {
    if (!contract || !account) return;

    const interval = setInterval(() => {
      loadCandidates(contract);
      checkAuthorizationStatus(contract, account);
    }, 12000);

    return () => clearInterval(interval);
  }, [contract, account, loadCandidates, checkAuthorizationStatus]);

  const handleRefresh = async () => {
    if (!contract || !account) return;
    try {
      await loadCandidates(contract);
      await checkAuthorizationStatus(contract, account);
      toast.success('Data refreshed!');
    } catch (error) {
      console.error('Refresh failed:', error);
      toast.error('Failed to refresh data');
    }
  };

  const handleAuthorizeVoter = async (e) => {
    e.preventDefault();

    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!voterAddress.trim()) {
      toast.error('Please enter a voter address');
      return;
    }

    if (!web3.utils.isAddress(voterAddress)) {
      toast.error('Invalid Ethereum address');
      return;
    }

    const weight = parseInt(voterWeight);
    if (isNaN(weight) || weight < 1) {
      toast.error('Weight must be a positive number');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Authorizing voter. Please confirm in MetaMask...');

      const receipt = await contract.methods
        .authorizeVoter(voterAddress, weight)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        });

      if (receipt.status) {
        toast.success(`Voter authorized with weight ${weight}!`);
        setVoterAddress('');
        setVoterWeight('1');
        // Refresh candidates after authorization
        await loadCandidates(contract);
      }
    } catch (error) {
      console.error('Authorization failed:', error);
      toast.error(`Authorization failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (candidateIndex) => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    // Re-check authorization status before voting
    try {
      const isAuthorized = await contract.methods
        .isAuthorizedVoter()
        .call({ from: account });

      const weight = parseInt(isAuthorized[0].toString()) || 0;
      const hasVoted = isAuthorized[1] === true || isAuthorized[1] === 'true';

      if (weight === 0) {
        toast.error('You are not authorized to vote. Please contact the contract owner.');
        setCanVote(false);
        setAuthorizationStatus('not_authorized');
        return;
      }

      if (hasVoted) {
        toast.error('You have already voted.');
        setCanVote(false);
        setAuthorizationStatus('authorized_voted');
        return;
      }
    } catch (error) {
      console.error('Error checking authorization before vote:', error);
      toast.error('Failed to verify authorization status');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Submitting vote. Please confirm in MetaMask...');

      const receipt = await contract.methods
        .voteForCandidate(candidateIndex)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        });

      if (receipt.status) {
        toast.success('Vote cast successfully!');
        // Refresh candidates and authorization status after successful vote
        await loadCandidates(contract);
        await checkAuthorizationStatus(contract, account);
      }
    } catch (error) {
      console.error('Vote failed:', error);
      toast.error(`Vote failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading weighted voting system..." />;
  }

  const isOwner = owner.toLowerCase() === account.toLowerCase();

  // Calculate total votes
  const totalVotes = candidates.reduce(
    (sum, candidate) => sum + parseInt(candidate.voteCount || 0),
    0
  );

  // Render authorization status badge
  const renderStatusBadge = () => {
    switch (authorizationStatus) {
      case 'not_authorized':
        return (
          <Chip
            label="⚠️ Not Authorized"
            className="status-badge not-authorized"
          />
        );
      case 'authorized_can_vote':
        return (
          <Chip
            label="✅ Authorized - Ready to Vote"
            className="status-badge authorized"
          />
        );
      case 'authorized_voted':
        return (
          <Chip
            label="✓ Already Voted"
            className="status-badge voted"
          />
        );
      default:
        return (
          <Chip
            label="❓ Status Unknown"
            className="status-badge unknown"
          />
        );
    }
  };

  // Owner view - Admin panel
  if (isOwner) {
    return (
      <div className="weighted-voting-container">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-title-row">
              <h1 className="display-4 fw-bold mb-3">⚖️ Weighted Voting Admin</h1>
              <ContractInfo
                contractAddress={WEIGHTEDVOTING_ADDRESS}
                contractName="Weighted Voting Contract"
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
              Manage weighted voting with custom voter authorization
            </p>
          </div>
        </section>

        <div className="admin-content">
          <div className="results-card">
            <h3>📊 Voting Results</h3>
            <div className="candidates-results">
              {candidates.map((candidate, index) => {
                const votePercentage =
                  totalVotes > 0
                    ? (parseInt(candidate.voteCount || 0) / totalVotes) * 100
                    : 0;

                return (
                  <div key={index} className="result-item">
                    <div className="result-header">
                      <span className="result-rank">#{index + 1}</span>
                      <span className="result-name">{candidate.name}</span>
                      <span className="candidate-votes">{candidate.voteCount} votes</span>
                    </div>
                    <div className="result-progress">
                      <div
                        className="result-progress-fill"
                        style={{ width: `${votePercentage}%` }}
                      >
                        <span className="result-percentage">
                          {votePercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="total-votes">
              <span className="total-label">Total Votes:</span>
              <span className="total-value">{totalVotes}</span>
            </div>
          </div>

          <div className="authorization-card">
            <h3>🔐 Authorize Voter</h3>
            <p className="authorization-description">
              Grant voting rights to an address with a specific weight
            </p>

            <form onSubmit={handleAuthorizeVoter}>
              <TextField
                label="Voter Address"
                variant="outlined"
                fullWidth
                value={voterAddress}
                onChange={(e) => setVoterAddress(e.target.value)}
                placeholder="0x..."
                disabled={submitting}
                helperText="Enter the Ethereum address of the voter"
                className="auth-input"
              />

              <TextField
                label="Voting Weight"
                variant="outlined"
                fullWidth
                type="number"
                value={voterWeight}
                onChange={(e) => setVoterWeight(e.target.value)}
                disabled={submitting}
                inputProps={{ min: 1 }}
                helperText="Higher weight means more voting power"
                className="auth-input"
              />

              <Button
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                fullWidth
                disabled={submitting || !voterAddress.trim()}
                className="authorize-button"
              >
                {submitting ? 'Authorizing...' : 'Authorize Voter'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Voter view
  return (
    <div className="weighted-voting-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-title-row">
            <h1 className="display-4 fw-bold mb-3">⚖️ Weighted Voting</h1>
            <ContractInfo
              contractAddress={WEIGHTEDVOTING_ADDRESS}
              contractName="Weighted Voting Contract"
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
            Cast your weighted vote for your preferred candidate
          </p>
        </div>
      </section>

      <div className="voter-content">
        <div className="status-section">
          <h3>Your Status</h3>
          {renderStatusBadge()}
          {authorizationStatus === 'not_authorized' && (
            <p className="status-message">
              You need to be authorized by the contract owner to vote
            </p>
          )}
          {authorizationStatus === 'authorized_can_vote' && (
            <p className="status-message success">
              You can now cast your vote for a candidate below
            </p>
          )}
          {authorizationStatus === 'authorized_voted' && (
            <p className="status-message">
              Thank you for voting! Your vote has been recorded
            </p>
          )}
        </div>

        <div className="voting-section">
          <h3>Candidates</h3>
          <div className="candidates-list">
            {candidates.map((candidate, index) => {
              const votePercentage =
                totalVotes > 0
                  ? (parseInt(candidate.voteCount || 0) / totalVotes) * 100
                  : 0;

              return (
                <div key={index} className="candidate-item">
                  <div className="candidate-info">
                    <div className="candidate-number">#{index + 1}</div>
                    <div className="candidate-details">
                      <h4 className="candidate-name">{candidate.name}</h4>
                      <span className="candidate-votes">{candidate.voteCount} votes</span>
                    </div>
                  </div>

                  <div className="candidate-progress">
                    <div
                      className="candidate-progress-fill"
                      style={{ width: `${votePercentage}%` }}
                    >
                      <span className="candidate-percentage">
                        {votePercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={() => handleVote(index)}
                    disabled={!canVote || submitting}
                    className="vote-button"
                  >
                    {submitting ? 'Voting...' : 'Vote'}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

WeightedVoting.propTypes = {};

export default WeightedVoting;
