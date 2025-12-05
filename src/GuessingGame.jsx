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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RefreshIcon from '@mui/icons-material/Refresh';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  GUESSINGGAME_ABI,
  GUESSINGGAME_ADDRESS,
} from './components/config/GuessingGameConfig';
import HideShow from './HideShow.jsx';
import LoadingSpinner from './components/LoadingSpinner';
import './components/css/guessinggame.css';

const GuessingGame = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Contract state
  const [owner, setOwner] = useState('');
  const [player, setPlayer] = useState({ wins: 0, losses: 0 });
  const [guess, setGuess] = useState('');
  const [amount, setAmount] = useState('');
  const [winEvents, setWinEvents] = useState([]);
  const [loseEvents, setLoseEvents] = useState([]);

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

  const getTransferDetails = useCallback(
    (dataEvents, eventName, userAccount, web3Instance) => {
      const winOrLose = [];
      for (let i = 0; i < dataEvents.length; i++) {
        const mysteryNumber = dataEvents[i]['returnValues']['mysteryNumber'];
        const player = dataEvents[i]['returnValues']['player'];
        const amount = dataEvents[i]['returnValues']['amount'];
        const convertedAmount = web3Instance.utils.fromWei(amount);

        if (player === userAccount) {
          if (eventName === 'PlayerWon') {
            if (mysteryNumber > 5) {
              winOrLose.push(
                `${convertedAmount} (ETH) by guessing ${mysteryNumber} would be higher than 5`
              );
            } else {
              winOrLose.push(
                `${convertedAmount} (ETH) by guessing ${mysteryNumber} would be lower than or equal 5`
              );
            }
          } else {
            if (mysteryNumber <= 5) {
              winOrLose.push(
                `${convertedAmount} (ETH) by guessing ${mysteryNumber} would be higher than 5`
              );
            } else {
              winOrLose.push(
                `${convertedAmount} (ETH) by guessing ${mysteryNumber} would be lower than or equal 5`
              );
            }
          }
        }
      }
      return winOrLose;
    },
    []
  );

  const getEvents = useCallback(
    async (
      contractInstance,
      userAccount,
      web3Instance,
      eventName,
      blockNumberOfContract
    ) => {
      try {
        const latestBlock = await web3Instance.eth.getBlockNumber();
        const historicalBlock = blockNumberOfContract;

        const events = await contractInstance.getPastEvents(
          eventName,
          {
            filter: {},
            fromBlock: historicalBlock,
            toBlock: latestBlock,
          },
          function (error) {
            if (error) {
              console.log(error);
            }
          }
        );

        const winOrLose = getTransferDetails(
          events,
          eventName,
          userAccount,
          web3Instance
        );
        return winOrLose;
      } catch (error) {
        console.error(`Error getting ${eventName} events:`, error);
        return [];
      }
    },
    [getTransferDetails]
  );

  const getPlayersData = useCallback(
    async (contractInstance, userAccount, web3Instance) => {
      try {
        const playerData = await contractInstance.methods
          .players(userAccount)
          .call();
        setPlayer(playerData);

        const wins = await getEvents(
          contractInstance,
          userAccount,
          web3Instance,
          'PlayerWon',
          0
        );
        const losses = await getEvents(
          contractInstance,
          userAccount,
          web3Instance,
          'PlayerLost',
          0
        );

        setWinEvents(wins);
        setLoseEvents(losses);
      } catch (error) {
        console.error('Error getting player data:', error);
        toast.error('Failed to load player data');
      }
    },
    [getEvents]
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

      const contractInstance = new web3Instance.eth.Contract(
        GUESSINGGAME_ABI,
        GUESSINGGAME_ADDRESS
      );
      setContract(contractInstance);

      const ownerAddress = await contractInstance.methods.owner().call();
      setOwner(ownerAddress);

      await getPlayersData(contractInstance, userAccount, web3Instance);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [getPlayersData]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  const handleRefresh = async () => {
    if (!contract || !account || !web3) return;
    try {
      await getPlayersData(contract, account, web3);
      toast.success('Game data refreshed!');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleSubmitGuess = async (e) => {
    e.preventDefault();

    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!guess) {
      toast.error('Please select Higher or Lower');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid bet amount');
      return;
    }

    try {
      setSubmitting(true);

      const amountInWei = web3.utils.toWei(amount, 'ether');
      const guessBoolean = guess === 'higher';

      toast.info('Placing bet. Please confirm in MetaMask...');

      await contract.methods
        .winOrLose(5, guessBoolean)
        .send({
          from: account,
          value: amountInWei,
          gas: '1000000',
        })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Bet placed! Good luck!');
          setGuess('');
          setAmount('');
          await getPlayersData(contract, account, web3);
        })
        .on('error', (error) => {
          console.error('Submit guess error:', error);
          toast.error(`Failed to place bet: ${error.message}`);
        });
    } catch (error) {
      console.error('Submit guess failed:', error);
      toast.error(`Failed to place bet: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setSubmitting(true);

      toast.info('Withdrawing balance. Please confirm in MetaMask...');

      await contract.methods
        .withdrawBet()
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Balance withdrawn successfully!');
          await getPlayersData(contract, account, web3);
        })
        .on('error', (error) => {
          console.error('Withdraw error:', error);
          toast.error(`Failed to withdraw: ${error.message}`);
        });
    } catch (error) {
      console.error('Withdraw failed:', error);
      toast.error(`Failed to withdraw: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Guessing Game..." />;
  }

  const isOwner =
    owner.toLowerCase() === account.toLowerCase() && account !== '';
  const canSubmit = guess && amount && parseFloat(amount) > 0 && !submitting;

  return (
    <div className="guessinggame-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="display-4 fw-bold mb-3">
            <CasinoIcon className="hero-icon" />
            Guessing Game
          </h1>
          <p className="lead mb-4">
            Higher or Lower? Test your luck on the blockchain!
          </p>
          <HideShow
            currentAccount={currentAccount}
            contractAddress={GUESSINGGAME_ADDRESS}
            chainId={chainId}
            owner={isOwner ? owner : undefined}
          />
        </div>
      </section>

      <div className="game-content">
        <Grid container spacing={3}>
          <Grid item xs={12} md={8} lg={6} className="mx-auto">
            <Card className="betting-card">
              <CardContent>
                <div className="card-header-section">
                  <h3>
                    <CasinoIcon className="section-icon" />
                    Betting Window
                  </h3>
                  <Tooltip title="Refresh Data">
                    <IconButton onClick={handleRefresh} className="refresh-btn">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </div>

                <Divider className="divider" />

                <div className="game-description">
                  <h4>Higher or Lower</h4>
                  <p>Will the mystery number be higher or lower than 5?</p>
                </div>

                <form onSubmit={handleSubmitGuess}>
                  <div className="form-group">
                    <FormControl component="fieldset" fullWidth>
                      <FormLabel component="legend" className="form-label">
                        Make Your Guess
                      </FormLabel>
                      <RadioGroup
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        className="radio-group"
                      >
                        <FormControlLabel
                          value="higher"
                          control={<Radio />}
                          label={
                            <span className="radio-label higher">
                              <TrendingUpIcon /> Higher than 5
                            </span>
                          }
                          disabled={submitting}
                          className="radio-option higher-option"
                        />
                        <FormControlLabel
                          value="lower"
                          control={<Radio />}
                          label={
                            <span className="radio-label lower">
                              <TrendingDownIcon /> Lower than or equal to 5
                            </span>
                          }
                          disabled={submitting}
                          className="radio-option lower-option"
                        />
                      </RadioGroup>
                    </FormControl>

                    <TextField
                      label="Bet Amount (ETH)"
                      variant="outlined"
                      fullWidth
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      disabled={submitting}
                      required
                      inputProps={{
                        min: '0',
                        step: 'any',
                      }}
                      helperText="Enter the amount you want to bet"
                    />

                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      type="submit"
                      fullWidth
                      disabled={!canSubmit}
                      className="submit-button"
                      startIcon={<PlayArrowIcon />}
                    >
                      {submitting ? 'Placing Bet...' : 'Check Your Chance'}
                    </Button>

                    {isOwner && (
                      <>
                        <Divider className="divider" />
                        <Button
                          variant="contained"
                          color="warning"
                          size="large"
                          fullWidth
                          onClick={handleWithdraw}
                          disabled={submitting}
                          startIcon={<AccountBalanceWalletIcon />}
                          className="withdraw-button"
                        >
                          {submitting ? 'Withdrawing...' : 'Withdraw Balance'}
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card className="wins-card">
              <CardContent>
                <div className="card-header-wins">
                  <EmojiEventsIcon className="wins-icon" />
                  <h3>Wins</h3>
                  <Chip
                    label={winEvents.length}
                    color="success"
                    className="count-chip"
                  />
                </div>

                <Divider className="divider" />

                <List className="events-list">
                  {winEvents.length > 0 ? (
                    winEvents.map((event, index) => (
                      <ListItem key={index} className="event-item">
                        <ListItemIcon>
                          <EmojiEventsIcon className="event-icon win-icon" />
                        </ListItemIcon>
                        <ListItemText primary={`You win ${event}`} />
                      </ListItem>
                    ))
                  ) : (
                    <div className="empty-state">
                      <EmojiEventsIcon className="empty-icon" />
                      <p>No wins yet. Try your luck!</p>
                    </div>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card className="losses-card">
              <CardContent>
                <div className="card-header-losses">
                  <SentimentVeryDissatisfiedIcon className="losses-icon" />
                  <h3>Losses</h3>
                  <Chip
                    label={loseEvents.length}
                    color="error"
                    className="count-chip"
                  />
                </div>

                <Divider className="divider" />

                <List className="events-list">
                  {loseEvents.length > 0 ? (
                    loseEvents.map((event, index) => (
                      <ListItem key={index} className="event-item">
                        <ListItemIcon>
                          <SentimentVeryDissatisfiedIcon className="event-icon loss-icon" />
                        </ListItemIcon>
                        <ListItemText primary={`You lose ${event}`} />
                      </ListItem>
                    ))
                  ) : (
                    <div className="empty-state">
                      <SentimentVeryDissatisfiedIcon className="empty-icon" />
                      <p>No losses yet. You're doing great!</p>
                    </div>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};

GuessingGame.propTypes = {};

export default GuessingGame;
