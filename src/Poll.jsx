import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import {
  Button,
  Card,
  CardContent,
  CardMedia,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import PollIcon from '@mui/icons-material/Poll';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BarChartIcon from '@mui/icons-material/BarChart';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import Chart from 'react-apexcharts';
import { POLL_ABI, POLL_ADDRESS } from './components/config/PollConfig';
import HideShow from './HideShow.jsx';
import LoadingSpinner from './components/LoadingSpinner';
import './components/css/poll.css';

const Poll = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Poll state
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create poll form state
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollImage, setPollImage] = useState('');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [option3, setOption3] = useState('');

  // Chart state
  const [chartOptions, setChartOptions] = useState({
    chart: {
      id: 'poll-chart',
      toolbar: {
        show: false,
      },
    },
    xaxis: {
      categories: ['Option #1', 'Option #2', 'Option #3'],
    },
    plotOptions: {
      bar: {
        distributed: true,
        borderRadius: 8,
      },
    },
    colors: ['#667eea', '#764ba2', '#48bb78'],
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
      },
    },
  });

  const [chartSeries, setChartSeries] = useState([
    {
      name: 'Votes',
      data: [0, 0, 0],
    },
  ]);

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

  const getAllPolls = useCallback(
    async (contractInstance, userAccount) => {
      try {
        const numberOfPolls = await contractInstance.methods
          .getTotalPolls()
          .call();

        const pollsList = [];
        for (let i = 0; i < numberOfPolls; i++) {
          const pollData = await contractInstance.methods.getPoll(i).call();
          pollsList.push({
            id: pollData[0],
            question: pollData[1],
            image: pollData[2],
            votes: pollData[3].map((v) => Number(v)),
            items: pollData[4],
            voted: false,
          });
        }

        // Check which polls the user has voted on
        const votedList = await contractInstance.methods
          .getVoter(userAccount)
          .call();
        const votedPollIds = votedList[1].map((id) => Number(id));

        votedPollIds.forEach((pollId) => {
          if (pollsList[pollId]) {
            pollsList[pollId].voted = true;
          }
        });

        setPolls(pollsList);

        // Select first poll by default if available
        if (pollsList.length > 0 && !selectedPoll) {
          handleSelectPoll(pollsList[0]);
        }
      } catch (error) {
        console.error('Error getting polls:', error);
        toast.error('Failed to load polls');
      }
    },
    [selectedPoll]
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
        POLL_ABI,
        POLL_ADDRESS
      );
      setContract(contractInstance);

      await getAllPolls(contractInstance, userAccount);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [getAllPolls]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  const handleSelectPoll = (poll) => {
    setSelectedPoll(poll);
    setSelectedOption('');

    // Update chart
    setChartOptions({
      ...chartOptions,
      xaxis: {
        categories: poll.items,
      },
    });

    setChartSeries([
      {
        name: 'Votes',
        data: poll.votes,
      },
    ]);
  };

  const handleCreatePoll = async (e) => {
    e.preventDefault();

    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!pollQuestion.trim() || !option1.trim() || !option2.trim() || !option3.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Creating poll. Please confirm in MetaMask...');

      await contract.methods
        .createPoll(pollQuestion, pollImage, [option1, option2, option3])
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Poll created successfully!');
          setPollQuestion('');
          setPollImage('');
          setOption1('');
          setOption2('');
          setOption3('');
          setShowCreateForm(false);
          await getAllPolls(contract, account);
        })
        .on('error', (error) => {
          console.error('Create poll error:', error);
          toast.error(`Failed to create poll: ${error.message}`);
        });
    } catch (error) {
      console.error('Create poll failed:', error);
      toast.error(`Failed to create poll: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (e) => {
    e.preventDefault();

    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!selectedPoll) {
      toast.error('Please select a poll');
      return;
    }

    if (!selectedOption) {
      toast.error('Please select an option');
      return;
    }

    if (selectedPoll.voted) {
      toast.error('You have already voted on this poll');
      return;
    }

    try {
      setSubmitting(true);
      const selectedIndex = selectedPoll.items.indexOf(selectedOption);
      toast.info('Submitting vote. Please confirm in MetaMask...');

      await contract.methods
        .vote(selectedPoll.id, selectedIndex)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Vote submitted successfully!');

          // Update local state
          const updatedPoll = {
            ...selectedPoll,
            voted: true,
            votes: [...selectedPoll.votes],
          };
          updatedPoll.votes[selectedIndex]++;

          const updatedPolls = polls.map((p) =>
            p.id === updatedPoll.id ? updatedPoll : p
          );

          setPolls(updatedPolls);
          handleSelectPoll(updatedPoll);
          setSelectedOption('');
        })
        .on('error', (error) => {
          console.error('Vote error:', error);
          toast.error(`Failed to submit vote: ${error.message}`);
        });
    } catch (error) {
      console.error('Vote failed:', error);
      toast.error(`Failed to submit vote: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading polling system..." />;
  }

  return (
    <div className="poll-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="display-4 fw-bold mb-3">📊 Polling App</h1>
          <p className="lead mb-4">
            Create and vote on decentralized polls on the blockchain
          </p>
          <HideShow
            currentAccount={currentAccount}
            contractAddress={POLL_ADDRESS}
            chainId={chainId}
          />
        </div>
      </section>

      <div className="poll-actions">
        <Button
          variant="contained"
          color={showCreateForm ? 'secondary' : 'primary'}
          size="large"
          onClick={() => setShowCreateForm(!showCreateForm)}
          startIcon={showCreateForm ? <PollIcon /> : <AddCircleIcon />}
          className="toggle-button"
        >
          {showCreateForm ? 'View Polls' : 'Create New Poll'}
        </Button>
      </div>

      {showCreateForm ? (
        <div className="create-poll-section">
          <Card className="create-poll-card">
            <CardContent>
              <h3>Create New Poll</h3>
              <p className="create-description">
                Create a decentralized poll with three options
              </p>

              <form onSubmit={handleCreatePoll}>
                <div className="form-group">
                  <TextField
                    label="Poll Question"
                    variant="outlined"
                    fullWidth
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="What would you like to ask?"
                    disabled={submitting}
                    required
                  />

                  <TextField
                    label="Image URL (Optional)"
                    variant="outlined"
                    fullWidth
                    value={pollImage}
                    onChange={(e) => setPollImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    disabled={submitting}
                  />

                  <Divider className="divider">Options</Divider>

                  <TextField
                    label="Option 1"
                    variant="outlined"
                    fullWidth
                    value={option1}
                    onChange={(e) => setOption1(e.target.value)}
                    placeholder="First option"
                    disabled={submitting}
                    required
                  />

                  <TextField
                    label="Option 2"
                    variant="outlined"
                    fullWidth
                    value={option2}
                    onChange={(e) => setOption2(e.target.value)}
                    placeholder="Second option"
                    disabled={submitting}
                    required
                  />

                  <TextField
                    label="Option 3"
                    variant="outlined"
                    fullWidth
                    value={option3}
                    onChange={(e) => setOption3(e.target.value)}
                    placeholder="Third option"
                    disabled={submitting}
                    required
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    type="submit"
                    fullWidth
                    disabled={submitting}
                    className="create-button"
                    startIcon={<AddCircleIcon />}
                  >
                    {submitting ? 'Creating Poll...' : 'Create Poll'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="poll-content">
          {/* Polls List */}
          <div className="polls-sidebar">
            <div className="polls-header">
              <h3>Available Polls</h3>
              <Chip
                label={`${polls.length} poll${polls.length !== 1 ? 's' : ''}`}
                color="primary"
                className="polls-count"
              />
            </div>

            <div className="polls-list">
              {polls.length === 0 ? (
                <div className="no-polls">
                  <div className="no-polls-icon">📊</div>
                  <h4>No Polls Yet</h4>
                  <p>Create the first poll to get started!</p>
                </div>
              ) : (
                polls.map((poll, index) => (
                  <Card
                    key={index}
                    className={`poll-card ${
                      selectedPoll?.id === poll.id ? 'active' : ''
                    }`}
                    onClick={() => handleSelectPoll(poll)}
                  >
                    {poll.image && (
                      <CardMedia
                        component="img"
                        height="120"
                        image={poll.image}
                        alt={poll.question}
                        className="poll-image"
                      />
                    )}
                    <CardContent>
                      <h6>{poll.question}</h6>
                      <div className="poll-meta">
                        <Chip
                          label={`${poll.votes.reduce((a, b) => a + b, 0)} votes`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {poll.voted && (
                          <Chip
                            label="Voted"
                            size="small"
                            color="success"
                            icon={<CheckCircleIcon />}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Poll Details and Voting */}
          <div className="poll-main">
            {selectedPoll ? (
              <>
                <Card className="poll-details-card">
                  <CardContent>
                    <div className="poll-details-header">
                      <h3>{selectedPoll.question}</h3>
                      <Chip
                        label={
                          selectedPoll.voted
                            ? 'Already Voted'
                            : 'Vote Now'
                        }
                        color={selectedPoll.voted ? 'success' : 'primary'}
                        icon={
                          selectedPoll.voted ? (
                            <CheckCircleIcon />
                          ) : (
                            <HowToVoteIcon />
                          )
                        }
                        className="vote-status"
                      />
                    </div>

                    {selectedPoll.image && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={selectedPoll.image}
                        alt={selectedPoll.question}
                        className="poll-detail-image"
                      />
                    )}

                    <Divider className="divider" />

                    <form onSubmit={handleVote}>
                      <FormControl component="fieldset" fullWidth>
                        <RadioGroup
                          value={selectedOption}
                          onChange={(e) => setSelectedOption(e.target.value)}
                        >
                          {selectedPoll.items.map((item, index) => (
                            <FormControlLabel
                              key={index}
                              value={item}
                              control={<Radio />}
                              label={
                                <div className="option-label">
                                  <span>{item}</span>
                                  <Chip
                                    label={`${selectedPoll.votes[index]} votes`}
                                    size="small"
                                    className="vote-count"
                                  />
                                </div>
                              }
                              disabled={selectedPoll.voted || submitting}
                              className="option-item"
                            />
                          ))}
                        </RadioGroup>
                      </FormControl>

                      {!selectedPoll.voted && (
                        <Button
                          variant="contained"
                          color="primary"
                          size="large"
                          type="submit"
                          fullWidth
                          disabled={submitting || !selectedOption}
                          className="vote-button"
                          startIcon={<HowToVoteIcon />}
                        >
                          {submitting ? 'Submitting Vote...' : 'Submit Vote'}
                        </Button>
                      )}
                    </form>
                  </CardContent>
                </Card>

                {/* Chart */}
                <Card className="chart-card">
                  <CardContent>
                    <div className="chart-header">
                      <BarChartIcon className="chart-icon" />
                      <h4>Poll Results</h4>
                    </div>

                    <div className="chart-wrapper">
                      <Chart
                        options={chartOptions}
                        series={chartSeries}
                        type="bar"
                        height={320}
                      />
                    </div>

                    <div className="chart-stats">
                      <div className="stat-item">
                        <span className="stat-label">Total Votes</span>
                        <span className="stat-value">
                          {selectedPoll.votes.reduce((a, b) => a + b, 0)}
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Options</span>
                        <span className="stat-value">
                          {selectedPoll.items.length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="no-selection">
                <div className="no-selection-icon">📊</div>
                <h4>Select a Poll</h4>
                <p>Choose a poll from the list to view details and vote</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

Poll.propTypes = {};

export default Poll;
