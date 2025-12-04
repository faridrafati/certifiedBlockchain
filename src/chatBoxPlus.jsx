import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import { TextField, Button, IconButton, Badge, Chip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ChatIcon from '@mui/icons-material/Chat';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  CHATBOXPLUS_ABI,
  CHATBOXPLUS_ADDRESS,
} from './components/config/ChatBoxPlusConfig';
import HideShow from './HideShow.jsx';
import LoginForm from './loginForm';
import LoadingSpinner from './components/LoadingSpinner';
import _ from 'lodash';
import './components/css/chatboxplus.css';

const ChatBoxPlus = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState('');
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Chat state
  const [isRegistered, setIsRegistered] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [myInboxSize, setMyInboxSize] = useState(0);
  const [myOutboxSize, setMyOutboxSize] = useState(0);
  const [selectedContactIndex, setSelectedContactIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [showListedContact, setShowListedContact] = useState(false);
  const [chatting, setChatting] = useState(true);

  // Game state
  const [gameExists, setGameExists] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [gameMessage, setGameMessage] = useState('');
  const [board, setBoard] = useState([]);
  const [boardSize, setBoardSize] = useState(3);
  const [activePlayer, setActivePlayer] = useState('');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [secondPlayer, setSecondPlayer] = useState('');
  const [winner, setWinner] = useState('');
  const [winCount, setWinCount] = useState(0);
  const [loseCount, setLoseCount] = useState(0);

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const MAX_MESSAGE_LENGTH = 32;

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

  const bytes32toAscii = useCallback(
    (content) => {
      if (!web3) return '';
      const ascii = web3.utils.toAscii(content);
      return ascii.replace(/[^a-zA-Z0-9 ]/g, '');
    },
    [web3]
  );

  const getContractProperties = useCallback(
    async (contractInstance) => {
      try {
        const contractProperties = await contractInstance.methods
          .getContractProperties()
          .call();

        const contactsList = [];
        for (let i = 0; i < contractProperties[1].length; i++) {
          contactsList.push({
            address: contractProperties[1][i],
            name: bytes32toAscii(contractProperties[2][i]),
            listed: false,
            lastActivity: '',
          });
        }

        setContacts(contactsList);
        setOwner(contractProperties[0]);
      } catch (error) {
        console.error('Error getting contract properties:', error);
      }
    },
    [bytes32toAscii]
  );

  const checkUserRegistration = useCallback(
    async (contractInstance, userAccount) => {
      try {
        const registered = await contractInstance.methods
          .checkUserRegistration()
          .call({ from: userAccount });

        setIsRegistered(registered);
        return registered;
      } catch (error) {
        console.error('Error checking registration:', error);
        return false;
      }
    },
    []
  );

  const getMyContactList = useCallback(
    async (contractInstance, userAccount) => {
      try {
        const initialContactList = await contractInstance.methods
          .getMyContactList()
          .call({ from: userAccount });

        setContacts((prevContacts) => {
          const updatedContacts = [...prevContacts];
          for (let i = 0; i < updatedContacts.length; i++) {
            updatedContacts[i].listed = false;
          }

          for (let i = 0; i < updatedContacts.length; i++) {
            for (let j = 0; j < initialContactList.length; j++) {
              if (initialContactList[j] !== ZERO_ADDRESS) {
                if (
                  updatedContacts[i].address.toLowerCase() ===
                  initialContactList[j].toLowerCase()
                ) {
                  updatedContacts[i].listed = true;
                  break;
                }
              }
            }
          }
          return updatedContacts;
        });
      } catch (error) {
        console.error('Error getting contact list:', error);
      }
    },
    [ZERO_ADDRESS]
  );

  const retrieveMessages = useCallback(
    async (contractInstance, userAccount, inboxSize, outboxSize) => {
      try {
        // Get inbox messages
        const inboxData = await contractInstance.methods
          .receiveMessages()
          .call({ from: userAccount });

        const messagesList = [];

        // Process inbox
        for (let i = 0; i < inboxSize; i++) {
          if (parseInt(inboxData[1][i]) !== 0) {
            messagesList.push({
              from: inboxData[2][i],
              to: userAccount,
              message: bytes32toAscii(inboxData[0][i]),
              time: parseInt(inboxData[1][i]),
            });
          }
        }

        // Get outbox messages
        const outboxData = await contractInstance.methods
          .sentMessages()
          .call({ from: userAccount });

        // Process outbox
        for (let i = 0; i < outboxSize; i++) {
          if (parseInt(outboxData[1][i]) !== 0) {
            messagesList.push({
              from: userAccount,
              to: outboxData[2][i],
              message: bytes32toAscii(outboxData[0][i]),
              time: parseInt(outboxData[1][i]),
            });
          }
        }

        return messagesList;
      } catch (error) {
        console.error('Error retrieving messages:', error);
        return [];
      }
    },
    [bytes32toAscii]
  );

  const sortMessages = useCallback((messagesList, contactsList, userAccount) => {
    // Sort messages by time
    const sorted = _.orderBy(messagesList, ['time'], ['asc']);

    // Add formatted time
    for (let i = 0; i < sorted.length; i++) {
      const date = new Date(sorted[i].time * 1000).toLocaleDateString('en-US');
      const time = new Date(sorted[i].time * 1000).toLocaleTimeString('en-US');
      sorted[i].beautyTime = `${date} | ${time}`;
    }

    // Update last activity for contacts
    const updatedContacts = contactsList.map((contact) => ({
      ...contact,
      lastActivity: '',
    }));

    for (let j = 0; j < sorted.length; j++) {
      for (let i = 0; i < updatedContacts.length; i++) {
        if (
          (sorted[j].from === userAccount &&
            sorted[j].to === updatedContacts[i].address) ||
          (sorted[j].to === userAccount &&
            sorted[j].from === updatedContacts[i].address)
        ) {
          updatedContacts[i].lastActivity = sorted[j].beautyTime;
        }
      }
    }

    return { messages: sorted, contacts: updatedContacts };
  }, []);

  const getUpdateMessages = useCallback(
    async (contractInstance, userAccount) => {
      try {
        const value = await contractInstance.methods
          .getMyInboxSize()
          .call({ from: userAccount });

        const outboxSize = parseInt(value[0]);
        const inboxSize = parseInt(value[1]);

        setMyOutboxSize(outboxSize);
        setMyInboxSize(inboxSize);

        const messagesList = await retrieveMessages(
          contractInstance,
          userAccount,
          inboxSize,
          outboxSize
        );

        const { messages: sortedMessages, contacts: updatedContacts } =
          sortMessages(messagesList, contacts, userAccount);

        setMessages(sortedMessages);
        setContacts(updatedContacts);
      } catch (error) {
        console.error('Error updating messages:', error);
      }
    },
    [retrieveMessages, sortMessages, contacts]
  );

  const getEvents = useCallback(
    async (contractInstance, web3Instance, eventName, blockNumber) => {
      try {
        const latestBlock = await web3Instance.eth.getBlockNumber();
        const historicalBlock = blockNumber;

        const events = await contractInstance.getPastEvents(eventName, {
          filter: {},
          fromBlock: historicalBlock,
          toBlock: latestBlock,
        });

        const winOrLose = [];
        for (let i = 0; i < events.length; i++) {
          const winner = events[i].returnValues.winner;
          const looser = events[i].returnValues.looser;
          winOrLose.push(winner, looser);
        }

        return winOrLose;
      } catch (error) {
        console.error('Error getting events:', error);
        return [];
      }
    },
    []
  );

  const winLoseEvent = useCallback(
    async (contractInstance, web3Instance, userAccount) => {
      try {
        if (contacts.length === 0 || selectedContactIndex >= contacts.length)
          return;

        const winEvents = await getEvents(
          contractInstance,
          web3Instance,
          'GameWinner',
          0
        );

        const secondPlayerAddr = contacts[selectedContactIndex].address;
        let wins = 0;
        let losses = 0;

        for (let i = 0; i < winEvents.length; i += 2) {
          if (
            winEvents[i] === userAccount &&
            winEvents[i + 1] === secondPlayerAddr
          ) {
            wins++;
          }
          if (
            winEvents[i] === secondPlayerAddr &&
            winEvents[i + 1] === userAccount
          ) {
            losses++;
          }
        }

        setWinCount(wins);
        setLoseCount(losses);
      } catch (error) {
        console.error('Error calculating win/lose:', error);
      }
    },
    [contacts, selectedContactIndex, getEvents]
  );

  const getMyXOGameInfo = useCallback(
    async (contractInstance, userAccount) => {
      try {
        if (contacts.length === 0 || selectedContactIndex >= contacts.length)
          return;

        const secondPlayerAddr = contacts[selectedContactIndex].address;
        setSecondPlayer(secondPlayerAddr);

        const gameIndex = await contractInstance.methods
          .gameIndexFunction(secondPlayerAddr)
          .call({ from: userAccount });

        const gameExistsFlag = gameIndex[0];
        setGameExists(gameExistsFlag);

        if (gameExistsFlag) {
          const game = await contractInstance.methods
            .game(parseInt(gameIndex[1]))
            .call();

          const activePlayerAddr = game.activePlayer;
          const gameActiveFlag = game.gameActive;
          const player1Addr = game.player1;
          const player2Addr = game.player2;
          const winnerAddr = game.winner;

          setActivePlayer(activePlayerAddr);
          setGameActive(gameActiveFlag);
          setPlayer1(player1Addr);
          setPlayer2(player2Addr);
          setWinner(winnerAddr);

          const size = await contractInstance.methods.boardSize().call();
          setBoardSize(parseInt(size));

          const boardData = await contractInstance.methods
            .getBoard(secondPlayerAddr)
            .call({ from: userAccount });

          const tempBoard = [];
          for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
              tempBoard[size * i + j] = boardData[i][j];
            }
          }

          setBoard(tempBoard);

          // Set game message
          let message = '';
          if (!gameActiveFlag) {
            if (winnerAddr !== ZERO_ADDRESS) {
              if (winnerAddr === userAccount) {
                message = 'You Are Winner!!!';
              } else {
                message = `${contacts[selectedContactIndex].name} is winner`;
              }
            } else {
              message = 'Game Ended - Draw';
            }
          }
          setGameMessage(message);
        }
      } catch (error) {
        console.error('Error getting game info:', error);
      }
    },
    [contacts, selectedContactIndex, ZERO_ADDRESS]
  );

  const getUpdateTotalChats = useCallback(async () => {
    if (!contract || !account) return;

    try {
      await getUpdateMessages(contract, account);
      await getMyXOGameInfo(contract, account);
      await winLoseEvent(contract, web3, account);
    } catch (error) {
      console.error('Error updating chats:', error);
    }
  }, [contract, account, getUpdateMessages, getMyXOGameInfo, winLoseEvent, web3]);

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
        CHATBOXPLUS_ABI,
        CHATBOXPLUS_ADDRESS
      );
      setContract(contractInstance);

      await getContractProperties(contractInstance);
      const registered = await checkUserRegistration(
        contractInstance,
        userAccount
      );

      if (registered) {
        await getMyContactList(contractInstance, userAccount);
        await getUpdateMessages(contractInstance, userAccount);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [
    getContractProperties,
    checkUserRegistration,
    getMyContactList,
    getUpdateMessages,
  ]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  // Setup polling interval
  useEffect(() => {
    if (!isRegistered) return;

    const interval = setInterval(() => {
      getUpdateTotalChats();
    }, 1000);

    return () => clearInterval(interval);
  }, [isRegistered, getUpdateTotalChats]);

  const handleRegisterUser = async (username) => {
    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Registering user. Please confirm in MetaMask...');

      const usernameHex = web3.utils.fromAscii(username);

      await contract.methods
        .registerUser(usernameHex)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Registration submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Registration successful!');
          setIsRegistered(true);
          await getContractProperties(contract);
          await getMyContactList(contract, account);
        })
        .on('error', (error) => {
          console.error('Registration error:', error);
          toast.error(`Registration failed: ${error.message}`);
        });
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(`Registration failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!inputValue.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (contacts.length === 0 || selectedContactIndex >= contacts.length) {
      toast.error('Please select a contact');
      return;
    }

    try {
      setSubmitting(true);
      const receiver = contacts[selectedContactIndex].address;
      const messageHex = web3.utils.fromAscii(inputValue);

      toast.info('Sending message. Please confirm in MetaMask...');

      await contract.methods
        .sendMessage(receiver, messageHex)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Message sent successfully!');
          setInputValue('');
          await getUpdateMessages(contract, account);
        })
        .on('error', (error) => {
          console.error('Send message error:', error);
          toast.error(`Failed to send message: ${error.message}`);
        });
    } catch (error) {
      console.error('Send message failed:', error);
      toast.error(`Failed to send message: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearInbox = async () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to clear your inbox? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      toast.info('Clearing inbox. Please confirm in MetaMask...');

      await contract.methods
        .clearInbox()
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Inbox cleared successfully!');
          await getUpdateMessages(contract, account);
        })
        .on('error', (error) => {
          console.error('Clear inbox error:', error);
          toast.error(`Failed to clear inbox: ${error.message}`);
        });
    } catch (error) {
      console.error('Clear inbox failed:', error);
      toast.error(`Failed to clear inbox: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditContactList = async (index) => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setSubmitting(true);
      const contactAddress = contacts[index].address;
      const newListedStatus = !contacts[index].listed;

      toast.info('Updating contact list. Please confirm in MetaMask...');

      await contract.methods
        .editMyContactList(contactAddress, newListedStatus)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success(
            `Contact ${newListedStatus ? 'added to' : 'removed from'} favorites!`
          );

          // Update local state
          setContacts((prevContacts) => {
            const updated = [...prevContacts];
            updated[index].listed = newListedStatus;
            return updated;
          });
        })
        .on('error', (error) => {
          console.error('Edit contact error:', error);
          toast.error(`Failed to update contact: ${error.message}`);
        });
    } catch (error) {
      console.error('Edit contact failed:', error);
      toast.error(`Failed to update contact: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateGame = async () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!secondPlayer || secondPlayer === ZERO_ADDRESS) {
      toast.error('Please select a valid contact');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Creating game. Please confirm in MetaMask...');

      await contract.methods
        .createGame(secondPlayer)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Game created successfully!');
          await getMyXOGameInfo(contract, account);
        })
        .on('error', (error) => {
          console.error('Create game error:', error);
          toast.error(`Failed to create game: ${error.message}`);
        });
    } catch (error) {
      console.error('Create game failed:', error);
      toast.error(`Failed to create game: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetGame = async () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!secondPlayer || secondPlayer === ZERO_ADDRESS) {
      toast.error('Please select a valid contact');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Resetting game. Please confirm in MetaMask...');

      await contract.methods
        .resetGame(secondPlayer)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Game reset successfully!');
          await getMyXOGameInfo(contract, account);
        })
        .on('error', (error) => {
          console.error('Reset game error:', error);
          toast.error(`Failed to reset game: ${error.message}`);
        });
    } catch (error) {
      console.error('Reset game failed:', error);
      toast.error(`Failed to reset game: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPosition = async (index) => {
    if (!contract || !account) return;

    if (
      board[index] === ZERO_ADDRESS &&
      account === activePlayer &&
      gameActive
    ) {
      const x = Math.trunc(index / boardSize);
      const y = index % boardSize;

      try {
        setSubmitting(true);
        toast.info('Making move. Please confirm in MetaMask...');

        await contract.methods
          .setStone(x, y, secondPlayer)
          .send({ from: account, gas: '1000000' })
          .on('transactionHash', (hash) => {
            toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
          })
          .on('receipt', async () => {
            toast.success('Move made successfully!');

            // Update board locally
            setBoard((prevBoard) => {
              const newBoard = [...prevBoard];
              newBoard[index] = account;
              return newBoard;
            });

            await getMyXOGameInfo(contract, account);
          })
          .on('error', (error) => {
            console.error('Make move error:', error);
            toast.error(`Failed to make move: ${error.message}`);
          });
      } catch (error) {
        console.error('Make move failed:', error);
        toast.error(`Failed to make move: ${error.message || 'Unknown error'}`);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getCellClass = (index) => {
    if (!board || board.length === 0) return 'game-cell cell';

    if (board[index] === ZERO_ADDRESS) {
      return 'game-cell cell';
    } else if (board[index] === player1) {
      return 'game-cell cell-x';
    } else if (board[index] === player2) {
      return 'game-cell cell-o';
    }
    return 'game-cell cell';
  };

  const handleRefresh = async () => {
    if (!contract || !account) return;
    try {
      await getContractProperties(contract);
      await getUpdateMessages(contract, account);
      toast.success('Refreshed successfully!');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleToggleFavorites = async () => {
    setShowListedContact(!showListedContact);
    setSelectedContactIndex(0);
    if (contract && account) {
      await getMyContactList(contract, account);
    }
  };

  const handleToggleView = () => {
    setChatting(!chatting);
  };

  if (loading) {
    return <LoadingSpinner message="Loading chat system..." />;
  }

  if (!isRegistered) {
    return (
      <div className="chatbox-container">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="display-4 fw-bold mb-3">💬 Chat Box Plus</h1>
            <p className="lead mb-4">
              Blockchain chat with integrated tic-tac-toe game
            </p>
            <HideShow
              currentAccount={currentAccount}
              contractAddress={CHATBOXPLUS_ADDRESS}
              chainId={chainId}
              owner={owner}
            />
          </div>
        </section>
        <LoginForm register={handleRegisterUser} />
      </div>
    );
  }

  // Filter contacts
  let filteredContacts = [...contacts];
  if (showListedContact) {
    filteredContacts = _.filter(filteredContacts, (contact) => contact.listed);
  }
  filteredContacts = _.filter(filteredContacts, (contact) =>
    contact.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    contact.address.toLowerCase().includes(searchValue.toLowerCase())
  );

  if (filteredContacts.length === 0) {
    filteredContacts = [{ address: '0x0', name: 'No contacts found', listed: false }];
  }

  const currentContact =
    filteredContacts.length > selectedContactIndex
      ? filteredContacts[selectedContactIndex]
      : null;

  const cellsBoardSize = _.range(0, boardSize);

  return (
    <div className="chatbox-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="display-4 fw-bold mb-3">💬 Chat Box Plus</h1>
          <p className="lead mb-4">
            Blockchain chat with integrated tic-tac-toe game
          </p>
          <HideShow
            currentAccount={currentAccount}
            contractAddress={CHATBOXPLUS_ADDRESS}
            chainId={chainId}
            owner={owner}
          />
        </div>
      </section>

      <div className="chat-content">
        {/* Sidebar with contacts */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-actions">
              <IconButton
                size="small"
                onClick={handleRefresh}
                title="Refresh"
                className="action-btn"
              >
                <RefreshIcon />
              </IconButton>

              <IconButton
                size="small"
                onClick={handleClearInbox}
                disabled={submitting}
                title="Clear Inbox"
                className="action-btn"
              >
                <DeleteSweepIcon />
              </IconButton>

              <IconButton
                size="small"
                onClick={handleToggleFavorites}
                title={showListedContact ? 'Show All' : 'Show Favorites'}
                className="action-btn"
              >
                {showListedContact ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>

              <IconButton
                size="small"
                onClick={handleToggleView}
                title={chatting ? 'Show Game' : 'Show Chat'}
                className="action-btn"
              >
                {chatting ? <SportsEsportsIcon /> : <ChatIcon />}
              </IconButton>
            </div>

            <div className="search-bar-container">
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search contacts..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon className="search-icon" />,
                }}
              />
            </div>
          </div>

          <div className="contacts-list">
            {filteredContacts.map((contact, index) => (
              <div
                key={index}
                className={`contact-item ${
                  selectedContactIndex === index ? 'active' : ''
                }`}
                onClick={() => setSelectedContactIndex(index)}
              >
                <div className="contact-avatar">
                  <PersonIcon />
                </div>
                <div className="contact-info">
                  <div className="contact-header">
                    <h6>
                      {contact.address === account
                        ? `${contact.name} (Saved Messages)`
                        : contact.name}
                    </h6>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditContactList(index);
                      }}
                      disabled={submitting || contact.address === '0x0'}
                      className="favorite-btn"
                    >
                      {contact.listed ? (
                        <StarIcon className="star-filled" />
                      ) : (
                        <StarBorderIcon />
                      )}
                    </IconButton>
                  </div>
                  <p className="contact-address">
                    {contact.address.substring(0, 10)}...
                    {contact.address.substring(38)}
                  </p>
                  {contact.lastActivity && (
                    <span className="last-activity">{contact.lastActivity}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat/game area */}
        <div className="chat-main">
          {chatting ? (
            // Chat View
            <div className="chat-view">
              <div className="chat-header">
                <h5>
                  {currentContact
                    ? currentContact.address === account
                      ? `${currentContact.name} (Saved Messages)`
                      : currentContact.name
                    : 'Select a contact'}
                </h5>
              </div>

              <div className="messages-area">
                {messages.map((message, index) => {
                  if (
                    !currentContact ||
                    (message.from === account &&
                      message.to === currentContact.address) ||
                    (message.to === account &&
                      message.from === currentContact.address)
                  ) {
                    const isSent = message.from === account;

                    return (
                      <div
                        key={index}
                        className={`message ${isSent ? 'sent' : 'received'}`}
                      >
                        <div className="message-bubble">
                          <p>{message.message}</p>
                          <span className="message-time">
                            {message.beautyTime}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              <div className="chat-input-area">
                <Chip
                  label={`${inputValue.length}/${MAX_MESSAGE_LENGTH}`}
                  color={inputValue.length < 24 ? 'default' : 'error'}
                  size="small"
                  className="char-counter"
                />
                <div className="input-container">
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !submitting) {
                        handleSendMessage();
                      }
                    }}
                    disabled={submitting}
                    inputProps={{ maxLength: MAX_MESSAGE_LENGTH }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={submitting || !inputValue.trim()}
                    className="send-button"
                    endIcon={<SendIcon />}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Game View
            <div className="game-view">
              {gameExists ? (
                <div className="game-container">
                  <div className="game-header">
                    <h5>Tic-Tac-Toe with {currentContact?.name || 'Contact'}</h5>
                    <div className="game-score">
                      <Chip
                        label={`Wins: ${winCount}`}
                        color="success"
                        className="score-chip"
                      />
                      <Chip
                        label={`Losses: ${loseCount}`}
                        color="error"
                        className="score-chip"
                      />
                    </div>
                  </div>

                  {gameActive && (
                    <div className="game-status">
                      {account === activePlayer && player2 !== ZERO_ADDRESS ? (
                        <Chip
                          label="Your Turn"
                          color="success"
                          className="turn-indicator"
                        />
                      ) : activePlayer !== ZERO_ADDRESS &&
                        player2 !== ZERO_ADDRESS ? (
                        <Chip
                          label={`${currentContact?.name || 'Opponent'}'s Turn`}
                          color="error"
                          className="turn-indicator"
                        />
                      ) : null}
                    </div>
                  )}

                  <div className="game-board">
                    <table>
                      <tbody>
                        {cellsBoardSize.map((row) => (
                          <tr key={row}>
                            {cellsBoardSize.map((col) => (
                              <td key={col}>
                                <div
                                  className={getCellClass(row * boardSize + col)}
                                  onClick={() =>
                                    handleMarkPosition(row * boardSize + col)
                                  }
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!gameActive && gameMessage && (
                    <div className="game-result">
                      <Chip
                        label={gameMessage}
                        color={
                          gameMessage.includes('Winner')
                            ? 'success'
                            : gameMessage.includes('winner')
                            ? 'error'
                            : 'default'
                        }
                        className="result-chip"
                      />
                    </div>
                  )}

                  <div className="game-actions">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleResetGame}
                      disabled={submitting}
                    >
                      Reset Game
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="no-game">
                  <div className="no-game-icon">🎮</div>
                  <h4>No Game Active</h4>
                  <p>Start a new tic-tac-toe game with {currentContact?.name || 'this contact'}</p>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    onClick={handleCreateGame}
                    disabled={submitting || !currentContact || currentContact.address === '0x0'}
                  >
                    Create Game
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ChatBoxPlus.propTypes = {};

export default ChatBoxPlus;
