import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import { TextField, Button, Chip } from '@mui/material';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  WEIGHTEDVOTING_ABI,
  WEIGHTEDVOTING_ADDRESS,
} from './components/config/WeightedVotingConfig';
import HideShow from './HideShow.jsx';
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

      if (isAuthorized[0] === '0') {
        status = 'not_authorized';
      } else {
        if (isAuthorized[1] === false) {
          status = 'authorized_can_vote';
          enableButton = true;
        } else {
          status = 'authorized_voted';
        }
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
          voteCount: list[2 * i + 1],
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
      const web3Instance = new Web3(Web3.givenProvider || 'http://localhost:8545');
      setWeb3(web3Instance);

      const networkType = await web3Instance.eth.net.getNetworkType();
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

      await contract.methods
        .authorizeVoter(voterAddress, weight)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success(`Voter authorized with weight ${weight}!`);
          setVoterAddress('');
          setVoterWeight('1');
          await loadCandidates(contract);
        })
        .on('error', (error) => {
          console.error('Authorization error:', error);
          toast.error(`Authorization failed: ${error.message}`);
        });
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

    if (!canVote) {
      toast.error('You are not authorized to vote or have already voted');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Submitting vote. Please confirm in MetaMask...');

      await contract.methods
        .voteForCandidate(candidateIndex)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Vote cast successfully!');
          await loadCandidates(contract);
          await checkAuthorizationStatus(contract, account);
        })
        .on('error', (error) => {
          console.error('Voting error:', error);
          toast.error(`Voting failed: ${error.message}`);
        });
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
            <h1 className="display-4 fw-bold mb-3">⚖️ Weighted Voting Admin</h1>
            <p className="lead mb-4">
              Manage weighted voting with custom voter authorization
            </p>
            <HideShow
              currentAccount={currentAccount}
              contractAddress={WEIGHTEDVOTING_ADDRESS}
              chainId={chainId}
              owner={owner}
            />
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
                      <span className="result-votes">{candidate.voteCount} votes</span>
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
          <h1 className="display-4 fw-bold mb-3">⚖️ Weighted Voting</h1>
          <p className="lead mb-4">
            Cast your weighted vote for your preferred candidate
          </p>
          <HideShow
            currentAccount={currentAccount}
            contractAddress={WEIGHTEDVOTING_ADDRESS}
            chainId={chainId}
            owner={owner}
          />
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
                      <span className="candidate-votes">
                        {candidate.voteCount} votes
                      </span>
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
