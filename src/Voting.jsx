import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import { TextField, Button, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import { VOTING_ABI, VOTING_ADDRESS } from './components/config/VotingConfig';
import HideShow from './HideShow.jsx';
import LoadingSpinner from './components/LoadingSpinner';
import './components/css/voting.css';

const Voting = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState('');
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Voting state
  const [candidates, setCandidates] = useState([]);
  const [numberOfCandidates, setNumberOfCandidates] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [newCandidateAddress, setNewCandidateAddress] = useState('');

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

  const loadCandidates = useCallback(async (contractInstance) => {
    try {
      const numCandidates = parseInt(
        await contractInstance.methods.numberOfCandidates().call()
      );
      setNumberOfCandidates(numCandidates);

      const candidateList = [];
      for (let i = 0; i < numCandidates; i++) {
        const address = await contractInstance.methods.Candidates(i).call();
        const votes = await contractInstance.methods.VotesForCandidate(address).call();
        candidateList.push({
          address: address.toString(),
          votes: votes.toString(),
        });
      }

      setCandidates(candidateList);
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

      const contractInstance = new web3Instance.eth.Contract(VOTING_ABI, VOTING_ADDRESS);
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

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [loadCandidates]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  const handleVote = async (e) => {
    e.preventDefault();

    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!selectedCandidate) {
      toast.error('Please select a candidate');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Submitting vote. Please confirm in MetaMask...');

      await contract.methods
        .voteForCandidate(selectedCandidate)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Vote cast successfully!');
          setSelectedCandidate('');
          await loadCandidates(contract);
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

  const handleAddCandidate = async (e) => {
    e.preventDefault();

    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!newCandidateAddress.trim()) {
      toast.error('Please enter a candidate address');
      return;
    }

    // Validate Ethereum address
    if (!web3.utils.isAddress(newCandidateAddress)) {
      toast.error('Invalid Ethereum address');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Adding candidate. Please confirm in MetaMask...');

      await contract.methods
        .addCandidate(newCandidateAddress)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Candidate added successfully!');
          setNewCandidateAddress('');
          await loadCandidates(contract);
        })
        .on('error', (error) => {
          console.error('Add candidate error:', error);
          toast.error(`Failed to add candidate: ${error.message}`);
        });
    } catch (error) {
      console.error('Add candidate failed:', error);
      toast.error(`Failed to add candidate: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading voting system..." />;
  }

  const isOwner = owner.toLowerCase() === account.toLowerCase();

  // Calculate total votes
  const totalVotes = candidates.reduce((sum, candidate) => sum + parseInt(candidate.votes), 0);

  return (
    <div className="voting-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="display-4 fw-bold mb-3">🗳️ Democratic Voting System</h1>
          <p className="lead mb-4">
            Participate in transparent, blockchain-based democratic voting
          </p>
          <HideShow
            currentAccount={currentAccount}
            contractAddress={VOTING_ADDRESS}
            chainId={chainId}
            owner={owner}
          />
        </div>
      </section>

      <div className="voting-content">
        {/* Candidates Display */}
        <div className="candidates-section">
          <h2 className="section-title">📋 Candidates</h2>
          {candidates.length === 0 ? (
            <div className="no-candidates">
              <div className="no-candidates-icon">🗳️</div>
              <h3>No Candidates Yet</h3>
              <p>
                {isOwner
                  ? 'Add candidates to start the voting process'
                  : 'Candidates will appear here once added'}
              </p>
            </div>
          ) : (
            <div className="candidates-grid">
              {candidates.map((candidate, index) => {
                const votePercentage =
                  totalVotes > 0 ? (parseInt(candidate.votes) / totalVotes) * 100 : 0;

                return (
                  <div key={index} className="candidate-card">
                    <div className="candidate-header">
                      <div className="candidate-rank">#{index + 1}</div>
                      <div className="candidate-votes-badge">{candidate.votes} votes</div>
                    </div>

                    <div className="candidate-address">
                      <span className="address-label">Address:</span>
                      <span className="address-value">
                        {candidate.address.substring(0, 8)}...
                        {candidate.address.substring(38)}
                      </span>
                    </div>

                    <div className="vote-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${votePercentage}%` }}
                        >
                          <span className="progress-text">
                            {votePercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      onClick={() => setSelectedCandidate(candidate.address)}
                      className={`vote-candidate-button ${
                        selectedCandidate === candidate.address ? 'selected' : ''
                      }`}
                      disabled={submitting}
                    >
                      {selectedCandidate === candidate.address ? '✓ Selected' : 'Select'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Voting & Admin Actions */}
        <div className="actions-section">
          {/* Vote Form */}
          {candidates.length > 0 && (
            <div className="vote-card">
              <h3>🗳️ Cast Your Vote</h3>
              <p className="vote-description">Select a candidate above, then submit your vote</p>

              {selectedCandidate && (
                <div className="selected-candidate-info">
                  <span className="selected-label">Selected:</span>
                  <span className="selected-address">
                    {selectedCandidate.substring(0, 10)}...{selectedCandidate.substring(38)}
                  </span>
                </div>
              )}

              <form onSubmit={handleVote}>
                <Button
                  variant="contained"
                  size="large"
                  type="submit"
                  fullWidth
                  disabled={submitting || !selectedCandidate}
                  className="submit-vote-button"
                >
                  {submitting ? 'Voting...' : 'Submit Vote'}
                </Button>
              </form>
            </div>
          )}

          {/* Add Candidate Form (Owner Only) */}
          {isOwner && (
            <div className="add-candidate-card">
              <h3>➕ Add Candidate</h3>
              <p className="add-description">Add a new candidate to the voting pool</p>

              <form onSubmit={handleAddCandidate}>
                <TextField
                  label="Candidate Address"
                  variant="outlined"
                  fullWidth
                  value={newCandidateAddress}
                  onChange={(e) => setNewCandidateAddress(e.target.value)}
                  placeholder="0x..."
                  disabled={submitting}
                  helperText="Enter a valid Ethereum address"
                />
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  type="submit"
                  fullWidth
                  disabled={submitting || !newCandidateAddress.trim()}
                  className="add-candidate-button"
                >
                  {submitting ? 'Adding...' : 'Add Candidate'}
                </Button>
              </form>
            </div>
          )}

          {/* Voting Stats */}
          <div className="stats-card">
            <h3>📊 Voting Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{numberOfCandidates}</div>
                <div className="stat-label">Total Candidates</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{totalVotes}</div>
                <div className="stat-label">Total Votes</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {candidates.length > 0
                    ? (totalVotes / candidates.length).toFixed(1)
                    : '0'}
                </div>
                <div className="stat-label">Avg Votes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Voting.propTypes = {};

export default Voting;
