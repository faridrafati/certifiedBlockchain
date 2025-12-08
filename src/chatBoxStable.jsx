import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import { TextField, Button, IconButton, Chip, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  CHATBOXPLUS_ABI,
  CHATBOXPLUS_ADDRESS,
} from './components/config/ChatBoxPlusConfig';
import LoginForm from './loginForm';
import LoadingSpinner from './components/LoadingSpinner';
import ConfirmDialog from './components/ConfirmDialog';
import ContractInfo from './components/ContractInfo';
import _ from 'lodash';
import './components/css/chatboxstable.css';

const ChatBoxStable = () => {
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

  // Game state (Tic-Tac-Toe)
  const [showGame, setShowGame] = useState(false);
  const [gameExists, setGameExists] = useState(false);
  const [gameBoard, setGameBoard] = useState(Array(3).fill(null).map(() => Array(3).fill('0x0000000000000000000000000000000000000000')));
  const [gameActive, setGameActive] = useState(false);
  const [activePlayer, setActivePlayer] = useState('');
  const [gameWinner, setGameWinner] = useState('');
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [player1Address, setPlayer1Address] = useState('');
  const [player2Address, setPlayer2Address] = useState('');
  const [winCount, setWinCount] = useState(0);
  const [loseCount, setLoseCount] = useState(0);

  // Refs to track data for non-reactive updates
  const contactsRef = useRef([]);
  const messagesRef = useRef([]);
  const isUpdatingRef = useRef(false);
  const getUpdateMessagesRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const web3Ref = useRef(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  });

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
      const w3 = web3Ref.current || web3;
      if (!w3) return '';
      try {
        return w3.utils.toAscii(content).replace(/\0/g, '').trim();
      } catch {
        return '';
      }
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
            lastActivityTime: 0,
          });
        }

        contactsRef.current = contactsList;
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
          contactsRef.current = updatedContacts;
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

        // Process inbox - inboxData[3] is the deleted flag array
        for (let i = 0; i < inboxSize; i++) {
          // Convert BigInt to Number for cross-browser compatibility
          const timestamp = Number(inboxData[1][i].toString());
          const isDeleted = inboxData[3] ? inboxData[3][i] : false;
          if (timestamp !== 0 && !isDeleted) {
            messagesList.push({
              from: inboxData[2][i],
              to: userAccount,
              message: bytes32toAscii(inboxData[0][i]),
              time: timestamp,
            });
          }
        }

        // Get outbox messages
        const outboxData = await contractInstance.methods
          .sentMessages()
          .call({ from: userAccount });

        // Process outbox - outboxData[3] is the deleted flag array
        for (let i = 0; i < outboxSize; i++) {
          // Convert BigInt to Number for cross-browser compatibility
          const timestamp = Number(outboxData[1][i].toString());
          const isDeleted = outboxData[3] ? outboxData[3][i] : false;
          if (timestamp !== 0 && !isDeleted) {
            messagesList.push({
              from: userAccount,
              to: outboxData[2][i],
              message: bytes32toAscii(outboxData[0][i]),
              time: timestamp,
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

    // Calculate new last activity for each contact (store both formatted and raw timestamp)
    const lastActivityMap = {};
    for (let j = 0; j < sorted.length; j++) {
      for (let i = 0; i < contactsList.length; i++) {
        if (
          (sorted[j].from === userAccount &&
            sorted[j].to === contactsList[i].address) ||
          (sorted[j].to === userAccount &&
            sorted[j].from === contactsList[i].address)
        ) {
          lastActivityMap[contactsList[i].address] = {
            formatted: sorted[j].beautyTime,
            timestamp: sorted[j].time,
          };
        }
      }
    }

    // Only update contacts if lastActivity actually changed
    const updatedContacts = contactsList.map((contact) => {
      const newActivity = lastActivityMap[contact.address];
      // If no new activity found, preserve existing lastActivity
      if (!newActivity || contact.lastActivity === newActivity.formatted) {
        return contact; // Return same reference if unchanged or no new activity
      }
      return {
        ...contact,
        lastActivity: newActivity.formatted,
        lastActivityTime: newActivity.timestamp,
      };
    });

    return { messages: sorted, contacts: updatedContacts };
  }, []);

  const getUpdateMessages = useCallback(
    async (contractInstance, userAccount) => {
      // Prevent overlapping updates
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      try {
        const value = await contractInstance.methods
          .getMyInboxSize()
          .call({ from: userAccount });

        // Convert BigInt to Number for cross-browser compatibility
        const outboxSize = Number(value[0].toString());
        const inboxSize = Number(value[1].toString());

        const messagesList = await retrieveMessages(
          contractInstance,
          userAccount,
          inboxSize,
          outboxSize
        );

        const { messages: sortedMessages, contacts: updatedContacts } =
          sortMessages(messagesList, contactsRef.current, userAccount);

        // Only update state if values actually changed
        setMyOutboxSize((prev) => (prev !== outboxSize ? outboxSize : prev));
        setMyInboxSize((prev) => (prev !== inboxSize ? inboxSize : prev));

        // Only update messages if they changed (compare by length and last message time)
        const messagesChanged =
          sortedMessages.length !== messagesRef.current.length ||
          (sortedMessages.length > 0 &&
            messagesRef.current.length > 0 &&
            sortedMessages[sortedMessages.length - 1]?.time !==
              messagesRef.current[messagesRef.current.length - 1]?.time);

        if (messagesChanged) {
          messagesRef.current = sortedMessages;
          setMessages(sortedMessages);
        }

        // Only update contacts if they actually changed
        const hasContactsChanged = updatedContacts.some(
          (contact, i) => contact !== contactsRef.current[i]
        );
        if (hasContactsChanged) {
          contactsRef.current = updatedContacts;
          setContacts(updatedContacts);
        }
      } catch (error) {
        console.error('Error updating messages:', error);
      } finally {
        isUpdatingRef.current = false;
      }
    },
    [retrieveMessages, sortMessages]
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
      web3Ref.current = web3Instance; // Set ref synchronously for immediate use
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
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  // Auto-refresh every 12 seconds (Ethereum block time)
  // Keep ref updated with latest getUpdateMessages
  useEffect(() => {
    getUpdateMessagesRef.current = getUpdateMessages;
  }, [getUpdateMessages]);

  // Auto-refresh every 12 seconds (Ethereum block time)
  useEffect(() => {
    if (!isRegistered || !contract || !account) return;

    const interval = setInterval(() => {
      if (getUpdateMessagesRef.current) {
        getUpdateMessagesRef.current(contract, account);
      }
    }, 12000);

    return () => clearInterval(interval);
  }, [isRegistered, contract, account]);

  const handleRegisterUser = async (username) => {
    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Registering user. Please confirm in MetaMask...');

      const usernameHex = web3.utils.padRight(
        web3.utils.asciiToHex(username),
        64
      );

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

    if (filteredContacts.length === 0 || selectedContactIndex >= filteredContacts.length) {
      toast.error('Please select a contact');
      return;
    }

    try {
      setSubmitting(true);
      const receiver = filteredContacts[selectedContactIndex].address;
      const messageHex = web3.utils.padRight(
        web3.utils.asciiToHex(inputValue),
        64
      );

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

  const handleClearInbox = () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Clear All Messages',
      message:
        'Are you sure you want to clear ALL your messages? This will delete all sent and received messages. This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          setSubmitting(true);
          toast.info('Clearing all messages. Please confirm in MetaMask...');

          await contract.methods
            .clearInbox()
            .send({ from: account, gas: '1000000' })
            .on('transactionHash', (hash) => {
              toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
            })
            .on('receipt', async () => {
              toast.success('All messages cleared successfully!');
              await getUpdateMessages(contract, account);
            })
            .on('error', (error) => {
              console.error('Clear inbox error:', error);
              toast.error(`Failed to clear messages: ${error.message}`);
            });
        } catch (error) {
          console.error('Clear inbox failed:', error);
          toast.error(
            `Failed to clear messages: ${error.message || 'Unknown error'}`
          );
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const handleClearConversation = () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!currentContact || currentContact.address === '0x0') {
      toast.error('Please select a valid contact');
      return;
    }

    const contactName = currentContact.name || currentContact.address.substring(0, 10);

    setConfirmDialog({
      open: true,
      title: 'Clear Conversation',
      message: `Are you sure you want to clear your conversation with ${contactName}? This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          setSubmitting(true);
          toast.info('Clearing conversation. Please confirm in MetaMask...');

          await contract.methods
            .clearConversationWith(currentContact.address)
            .send({ from: account, gas: '1000000' })
            .on('transactionHash', (hash) => {
              toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
            })
            .on('receipt', async () => {
              toast.success(`Conversation with ${contactName} cleared!`);
              await getUpdateMessages(contract, account);
            })
            .on('error', (error) => {
              console.error('Clear conversation error:', error);
              toast.error(`Failed to clear conversation: ${error.message}`);
            });
        } catch (error) {
          console.error('Clear conversation failed:', error);
          toast.error(
            `Failed to clear conversation: ${error.message || 'Unknown error'}`
          );
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const handleClearContactList = () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Clear Contact List',
      message:
        'Are you sure you want to clear your contact list? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          setSubmitting(true);
          toast.info('Clearing contact list. Please confirm in MetaMask...');

          await contract.methods
            .clearMyContactList()
            .send({ from: account, gas: '1000000' })
            .on('transactionHash', (hash) => {
              toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
            })
            .on('receipt', async () => {
              toast.success('Contact list cleared successfully!');
              await getMyContactList(contract, account);
            })
            .on('error', (error) => {
              console.error('Clear contact list error:', error);
              toast.error(`Failed to clear contact list: ${error.message}`);
            });
        } catch (error) {
          console.error('Clear contact list failed:', error);
          toast.error(
            `Failed to clear contact list: ${error.message || 'Unknown error'}`
          );
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const handleEditContactList = async (index) => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setSubmitting(true);
      // Use filteredContacts since index comes from the filtered/sorted list
      const contactAddress = filteredContacts[index].address;
      const newListedStatus = !filteredContacts[index].listed;

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

          // Update local state - find the correct index in the original contacts array
          setContacts((prevContacts) => {
            const updated = [...prevContacts];
            const originalIndex = updated.findIndex(c => c.address === contactAddress);
            if (originalIndex !== -1) {
              updated[originalIndex].listed = newListedStatus;
            }
            contactsRef.current = updated;
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

  // Get game events from blockchain
  const getGameEvents = useCallback(async (contactAddress) => {
    if (!contract || !web3Ref.current || !account || !contactAddress || contactAddress === '0x0') {
      return [];
    }

    try {
      const latestBlock = await web3Ref.current.eth.getBlockNumber();
      // Look back ~10000 blocks or from block 0
      const fromBlock = latestBlock > 10000n ? latestBlock - 10000n : 0n;

      const events = await contract.getPastEvents('GameWinner', {
        filter: {},
        fromBlock: fromBlock,
        toBlock: latestBlock,
      });

      return events;
    } catch (error) {
      console.error('Error getting game events:', error);
      return [];
    }
  }, [contract, account]);

  // Calculate win/loss record against a specific opponent
  const calculateWinLoss = useCallback(async (contactAddress) => {
    if (!account || !contactAddress || contactAddress === '0x0') {
      setWinCount(0);
      setLoseCount(0);
      return;
    }

    try {
      const events = await getGameEvents(contactAddress);
      let wins = 0;
      let losses = 0;

      for (const event of events) {
        const winner = event.returnValues.winner;
        const loser = event.returnValues.looser;

        // Check if this game involves both players
        if (
          (winner.toLowerCase() === account.toLowerCase() && loser.toLowerCase() === contactAddress.toLowerCase()) ||
          (winner.toLowerCase() === contactAddress.toLowerCase() && loser.toLowerCase() === account.toLowerCase())
        ) {
          if (winner.toLowerCase() === account.toLowerCase()) {
            wins++;
          } else {
            losses++;
          }
        }
      }

      setWinCount(wins);
      setLoseCount(losses);
    } catch (error) {
      console.error('Error calculating win/loss:', error);
      setWinCount(0);
      setLoseCount(0);
    }
  }, [account, getGameEvents]);

  // Game functions
  const loadGameState = useCallback(async (contactAddress) => {
    if (!contract || !account || !contactAddress || contactAddress === '0x0') {
      setGameExists(false);
      setGameBoard(Array(3).fill(null).map(() => Array(3).fill(ZERO_ADDRESS)));
      setGameActive(false);
      setActivePlayer('');
      setGameWinner('');
      setIsMyTurn(false);
      setPlayer1Address('');
      setPlayer2Address('');
      return;
    }

    try {
      // Check if game exists
      const gameIndex = await contract.methods
        .gameIndexFunction(contactAddress)
        .call({ from: account });

      const exists = gameIndex[0];
      setGameExists(exists);

      if (exists) {
        // Get game data
        const gameData = await contract.methods
          .game(gameIndex[1])
          .call({ from: account });

        setGameActive(gameData.gameActive);
        setActivePlayer(gameData.activePlayer);
        setGameWinner(gameData.winner);
        setIsMyTurn(gameData.activePlayer.toLowerCase() === account.toLowerCase());
        setPlayer1Address(gameData.player1);
        setPlayer2Address(gameData.player2);

        // Get board
        const board = await contract.methods
          .getBoard(contactAddress)
          .call({ from: account });
        setGameBoard(board);
      } else {
        setGameBoard(Array(3).fill(null).map(() => Array(3).fill(ZERO_ADDRESS)));
        setGameActive(false);
        setActivePlayer('');
        setGameWinner('');
        setIsMyTurn(false);
        setPlayer1Address('');
        setPlayer2Address('');
      }
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  }, [contract, account, ZERO_ADDRESS]);

  const handleCreateGame = async () => {
    if (!contract || !account || !currentContact || currentContact.address === '0x0') {
      toast.error('Please select a valid contact');
      return;
    }

    if (currentContact.address.toLowerCase() === account.toLowerCase()) {
      toast.error('Cannot play against yourself');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Creating game. Please confirm in MetaMask...');

      await contract.methods
        .createGame(currentContact.address)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Game created! You can start playing.');
          await loadGameState(currentContact.address);
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

  const handleSetStone = async (x, y) => {
    if (!contract || !account || !currentContact) {
      toast.error('Please select a contact');
      return;
    }

    if (!isMyTurn) {
      toast.error("It's not your turn!");
      return;
    }

    if (gameBoard[x][y] !== ZERO_ADDRESS) {
      toast.error('This cell is already occupied');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Making move. Please confirm in MetaMask...');

      await contract.methods
        .setStone(x, y, currentContact.address)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Move made!');
          await loadGameState(currentContact.address);
        })
        .on('error', (error) => {
          console.error('Set stone error:', error);
          toast.error(`Failed to make move: ${error.message}`);
        });
    } catch (error) {
      console.error('Set stone failed:', error);
      toast.error(`Failed to make move: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetGame = async () => {
    if (!contract || !account || !currentContact || currentContact.address === '0x0') {
      toast.error('Please select a valid contact');
      return;
    }

    setConfirmDialog({
      open: true,
      title: 'Reset Game',
      message: 'Are you sure you want to reset the game? This will clear the board and start a new game.',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          setSubmitting(true);
          toast.info('Resetting game. Please confirm in MetaMask...');

          await contract.methods
            .resetGame(currentContact.address)
            .send({ from: account, gas: '1000000' })
            .on('transactionHash', (hash) => {
              toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
            })
            .on('receipt', async () => {
              toast.success('Game reset! New game started.');
              await loadGameState(currentContact.address);
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
      },
    });
  };

  // Memoize filtered contacts to prevent recalculation on every render
  // Must be before any early returns to maintain hook order
  const filteredContacts = useMemo(() => {
    // Separate current user from other contacts
    const myContact = contacts.find(
      (contact) => contact.address.toLowerCase() === account.toLowerCase()
    );
    let otherContacts = contacts.filter(
      (contact) => contact.address.toLowerCase() !== account.toLowerCase()
    );

    if (showListedContact) {
      otherContacts = _.filter(otherContacts, (contact) => contact.listed);
    }
    otherContacts = _.filter(
      otherContacts,
      (contact) =>
        contact.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        contact.address.toLowerCase().includes(searchValue.toLowerCase())
    );

    // Sort other contacts by last activity (most recent first)
    otherContacts = _.orderBy(
      otherContacts,
      [(contact) => contact.lastActivityTime || 0],
      ['desc']
    );

    // Always put current user at top
    let result = myContact ? [myContact, ...otherContacts] : otherContacts;

    if (result.length === 0) {
      result = [{ address: '0x0', name: 'No contacts found', listed: false }];
    }

    return result;
  }, [contacts, account, showListedContact, searchValue]);

  const currentContact =
    filteredContacts.length > selectedContactIndex
      ? filteredContacts[selectedContactIndex]
      : null;

  // Load game state when contact changes
  useEffect(() => {
    if (showGame && currentContact && currentContact.address !== '0x0') {
      loadGameState(currentContact.address);
      calculateWinLoss(currentContact.address);
    }
  }, [showGame, currentContact, loadGameState, calculateWinLoss]);

  if (loading) {
    return <LoadingSpinner message="Loading chat system..." />;
  }

  if (!isRegistered) {
    return (
      <div className="chatbox-stable-container">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-title-row">
              <h1 className="display-4 fw-bold mb-3">💬 Chat Box</h1>
              <ContractInfo
                contractAddress={CHATBOXPLUS_ADDRESS}
                contractName="Chat Box"
                network={import.meta.env.VITE_NETWORK_ID}
                owner={owner}
                account={currentAccount}
              />
            </div>
            <p className="lead mb-4">
              Secure blockchain messaging on Ethereum
            </p>
          </div>
        </section>
        <LoginForm register={handleRegisterUser} submitting={submitting} />

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
  }

  return (
    <div className="chatbox-stable-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-title-row">
            <h1 className="display-4 fw-bold mb-3">💬 Chat Box</h1>
            <ContractInfo
              contractAddress={CHATBOXPLUS_ADDRESS}
              contractName="Chat Box"
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
            Secure blockchain messaging on Ethereum
          </p>
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
                onClick={handleToggleFavorites}
                title={showListedContact ? 'Show All' : 'Show Favorites'}
                className="action-btn"
              >
                {showListedContact ? <StarIcon /> : <StarBorderIcon />}
              </IconButton>

              <IconButton
                size="small"
                onClick={handleClearContactList}
                disabled={submitting}
                title="Clear Contact List"
                className="action-btn"
              >
                <ClearAllIcon />
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
            {filteredContacts.map((contact, index) => {
              const isMe = contact.address.toLowerCase() === account.toLowerCase();
              return (
                <div
                  key={contact.address}
                  className={`contact-item ${
                    selectedContactIndex === index ? 'active' : ''
                  } ${isMe ? 'me-contact' : ''}`}
                  onClick={() => setSelectedContactIndex(index)}
                >
                  <div className={`contact-avatar ${isMe ? 'me-avatar' : ''}`}>
                    <PersonIcon />
                  </div>
                  <div className="contact-info">
                    <div className="contact-header">
                      <h6>
                        {isMe ? (
                          <>
                            <Chip
                              label="Me"
                              size="small"
                              color="primary"
                              className="me-chip"
                            />
                            {contact.name} (Saved Messages)
                          </>
                        ) : (
                          contact.name
                        )}
                      </h6>
                      {!isMe && (
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
                      )}
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
              );
            })}
          </div>
        </div>

        {/* Main chat area */}
        <div className="chat-main">
          <div className="chat-view">
            <div className="chat-header">
              <h5>
                {currentContact
                  ? currentContact.address === account
                    ? `${currentContact.name} (Saved Messages)`
                    : currentContact.name
                  : 'Select a contact'}
              </h5>
              <div className="chat-header-actions">
                <Chip
                  label={`${myInboxSize} received · ${myOutboxSize} sent`}
                  color="primary"
                  size="small"
                  className="message-stats"
                />
                <Tooltip title={showGame ? 'Show Chat' : 'Play Tic-Tac-Toe'}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={() => setShowGame(!showGame)}
                      disabled={!currentContact || currentContact.address === '0x0' || currentContact.address === account}
                      className={`game-toggle-btn ${showGame ? 'active' : ''}`}
                    >
                      <SportsEsportsIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Clear this conversation">
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleClearConversation}
                      disabled={submitting || !currentContact || currentContact.address === '0x0'}
                      className="clear-conversation-btn"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Clear all messages">
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleClearInbox}
                      disabled={submitting}
                      className="clear-all-btn"
                    >
                      <DeleteSweepIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </div>
            </div>

            {showGame ? (
              /* Game Board UI */
              <div className="game-area">
                <div className="game-status">
                  {!gameExists ? (
                    <div className="no-game">
                      <p>No game exists with this contact</p>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleCreateGame}
                        disabled={submitting}
                        startIcon={<SportsEsportsIcon />}
                      >
                        Start New Game
                      </Button>
                    </div>
                  ) : (
                    <>
                      {gameWinner && gameWinner !== ZERO_ADDRESS ? (
                        <Chip
                          label={`Winner: ${gameWinner.toLowerCase() === account.toLowerCase() ? 'You!' : currentContact?.name || 'Opponent'}`}
                          color={gameWinner.toLowerCase() === account.toLowerCase() ? 'success' : 'error'}
                          className="game-winner-chip"
                        />
                      ) : !gameActive && gameExists ? (
                        <Chip label="Game ended in a draw!" color="warning" />
                      ) : (
                        <Chip
                          label={isMyTurn ? "Your turn!" : `${currentContact?.name || 'Opponent'}'s turn`}
                          color={isMyTurn ? 'success' : 'default'}
                        />
                      )}
                      <div className="game-actions">
                        <Tooltip title="Reset Game">
                          <span>
                            <IconButton
                              onClick={handleResetGame}
                              disabled={submitting}
                              className="reset-game-btn"
                            >
                              <RestartAltIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Refresh Game">
                          <span>
                            <IconButton
                              onClick={() => loadGameState(currentContact?.address)}
                              disabled={submitting}
                            >
                              <RefreshIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </div>
                    </>
                  )}
                </div>

                {gameExists && (
                  <div className="game-board">
                    {gameBoard.map((row, rowIndex) => (
                      <div key={rowIndex} className="game-row">
                        {row.map((cell, colIndex) => {
                          const isEmpty = cell === ZERO_ADDRESS;
                          const isPlayer1Cell = !isEmpty && player1Address && cell.toLowerCase() === player1Address.toLowerCase();
                          return (
                            <button
                              key={colIndex}
                              className={`game-cell ${isEmpty ? 'empty' : ''} ${isPlayer1Cell ? 'player1' : 'player2'}`}
                              onClick={() => handleSetStone(rowIndex, colIndex)}
                              disabled={!isEmpty || !isMyTurn || !gameActive || submitting}
                            >
                              {isEmpty ? '' : isPlayer1Cell ? 'X' : 'O'}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {gameExists && (winCount > 0 || loseCount > 0) && (
                  <div className="game-score">
                    <Chip label={`Wins: ${winCount}`} color="success" size="small" className="score-chip" />
                    <Chip label={`Losses: ${loseCount}`} color="error" size="small" className="score-chip" />
                  </div>
                )}

                {gameExists && (
                  <div className="game-legend">
                    <span className="legend-item">
                      <span className="legend-symbol player1">X</span> = {player1Address && player1Address.toLowerCase() === account.toLowerCase() ? 'You' : currentContact?.name || 'Opponent'}
                    </span>
                    <span className="legend-item">
                      <span className="legend-symbol player2">O</span> = {player2Address && player2Address.toLowerCase() === account.toLowerCase() ? 'You' : currentContact?.name || 'Opponent'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              /* Messages Area */
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
            )}

            {!showGame && (
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
            )}
          </div>
        </div>
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

ChatBoxStable.propTypes = {};

export default ChatBoxStable;
