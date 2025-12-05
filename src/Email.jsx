import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import PersonIcon from '@mui/icons-material/Person';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import { EMAIL_ABI, EMAIL_ADDRESS } from './components/config/EmailConfig';
import HideShow from './HideShow.jsx';
import LoadingSpinner from './components/LoadingSpinner';
import './components/css/email.css';

const Email = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState('');
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Email state
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [outboxMessages, setOutboxMessages] = useState([]);
  const [selectedContact, setSelectedContact] = useState('');
  const [messageText, setMessageText] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState(null);

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

  const loadMessages = useCallback(
    async (contractInstance, userAccount, web3Instance) => {
      try {
        // Load inbox
        const inboxSize = await contractInstance.methods
          .getMyInboxSize()
          .call({ from: userAccount });
        const inboxCount = parseInt(inboxSize[1]);

        if (inboxCount > 0) {
          const inboxData = await contractInstance.methods
            .receiveMessages()
            .call({ from: userAccount });

          const inbox = [];
          for (let i = 0; i < inboxCount; i++) {
            inbox.push({
              content: web3Instance.utils.toAscii(inboxData[0][i]),
              timestamp: parseInt(inboxData[1][i]),
              address: inboxData[2][i],
              type: 'received',
            });
          }
          setInboxMessages(inbox);
        }

        // Load outbox
        const outboxSize = await contractInstance.methods
          .getMyInboxSize()
          .call({ from: userAccount });
        const outboxCount = parseInt(outboxSize[0]);

        if (outboxCount > 0) {
          const outboxData = await contractInstance.methods
            .sentMessages()
            .call({ from: userAccount });

          const outbox = [];
          for (let i = 0; i < outboxCount; i++) {
            outbox.push({
              content: web3Instance.utils.toAscii(outboxData[0][i]),
              timestamp: parseInt(outboxData[1][i]),
              address: outboxData[2][i],
              type: 'sent',
            });
          }
          setOutboxMessages(outbox);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    },
    []
  );

  const checkRegistration = useCallback(
    async (contractInstance, userAccount) => {
      try {
        const registered = await contractInstance.methods
          .checkUserRegistration()
          .call({ from: userAccount });

        if (!registered) {
          const confirmed = window.confirm(
            'New user: We need to set up an inbox for you on the Ethereum blockchain. You will need to submit a transaction in MetaMask. You only need to do this once.'
          );

          if (confirmed) {
            await handleRegisterUser(contractInstance, userAccount);
          } else {
            setLoading(false);
            return false;
          }
        }

        setIsRegistered(true);
        return true;
      } catch (error) {
        console.error('Error checking registration:', error);
        return false;
      }
    },
    []
  );

  const handleRegisterUser = async (contractInstance, userAccount) => {
    try {
      toast.info('Registering user. Please confirm in MetaMask...');

      await contractInstance.methods
        .registerUser()
        .send({ from: userAccount, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Registration submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', () => {
          toast.success('Registration successful! Your inbox is ready.');
          setIsRegistered(true);
        })
        .on('error', (error) => {
          console.error('Registration error:', error);
          toast.error(`Registration failed: ${error.message}`);
        });
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error(`Registration failed: ${error.message || 'Unknown error'}`);
    }
  };

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

      const contractInstance = new web3Instance.eth.Contract(EMAIL_ABI, EMAIL_ADDRESS);
      setContract(contractInstance);

      // Get contract properties
      const properties = await contractInstance.methods.getContractProperties().call();
      setOwner(properties[0]);
      setRegisteredUsers(properties[1]);

      // Check registration
      const registered = await checkRegistration(contractInstance, userAccount);

      if (registered) {
        // Load messages
        await loadMessages(contractInstance, userAccount, web3Instance);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [checkRegistration, loadMessages]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!selectedContact) {
      toast.error('Please select a contact');
      return;
    }

    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (!web3.utils.isAddress(selectedContact)) {
      toast.error('Invalid recipient address');
      return;
    }

    try {
      setSubmitting(true);
      const messageHex = web3.utils.fromAscii(messageText);
      toast.info('Sending message. Please confirm in MetaMask...');

      await contract.methods
        .sendMessage(selectedContact, messageHex)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Message sent successfully!');
          setMessageText('');
          await loadMessages(contract, account, web3);
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
          setInboxMessages([]);
          setCurrentTab(0);
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

  const handleReply = (message) => {
    setSelectedContact(message.address);
    setSelectedMessage(message);
    setCurrentTab(0);
    toast.info(`Replying to ${message.address.substring(0, 8)}...`);
  };

  const formatDateTime = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US'),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  if (loading) {
    return <LoadingSpinner message="Loading email system..." />;
  }

  if (!isRegistered) {
    return (
      <div className="email-container">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="display-4 fw-bold mb-3">📧 Blockchain Email</h1>
            <p className="lead mb-4">Registration required to continue</p>
          </div>
        </section>
        <div className="registration-message">
          <h3>Please refresh the page to complete registration</h3>
        </div>
      </div>
    );
  }

  const contacts = registeredUsers.filter((addr) => addr !== account);

  return (
    <div className="email-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="display-4 fw-bold mb-3">📧 Blockchain Email</h1>
          <p className="lead mb-4">
            Secure, decentralized messaging on the Ethereum blockchain
          </p>
          <HideShow
            currentAccount={currentAccount}
            contractAddress={EMAIL_ADDRESS}
            chainId={chainId}
            owner={owner}
          />
        </div>
      </section>

      <div className="email-content">
        {/* Compose Section */}
        <div className="compose-section">
          <h3>✉️ Compose Message</h3>

          <FormControl fullWidth className="contact-select">
            <InputLabel>Select Contact</InputLabel>
            <Select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              label="Select Contact"
              disabled={submitting}
            >
              {contacts.map((contact, index) => (
                <MenuItem key={index} value={contact}>
                  <PersonIcon fontSize="small" style={{ marginRight: '8px' }} />
                  {contact.substring(0, 10)}...{contact.substring(38)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedMessage && (
            <div className="reply-context">
              <strong>Replying to:</strong>
              <p>{selectedMessage.content}</p>
            </div>
          )}

          <form onSubmit={handleSendMessage}>
            <TextField
              label="Message"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              disabled={submitting}
              inputProps={{ maxLength: MAX_MESSAGE_LENGTH }}
              helperText={`${messageText.length}/${MAX_MESSAGE_LENGTH} characters`}
            />

            <Button
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              fullWidth
              disabled={submitting || !selectedContact || !messageText.trim()}
              className="send-button"
              startIcon={<SendIcon />}
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </form>

          <Chip
            label={`${contacts.length} Contact${contacts.length !== 1 ? 's' : ''}`}
            color="primary"
            className="contacts-count"
          />
        </div>

        {/* Messages Section */}
        <div className="messages-section">
          <Box className="tabs-container">
            <Tabs
              value={currentTab}
              onChange={(e, newValue) => setCurrentTab(newValue)}
              variant="fullWidth"
            >
              <Tab label={`Inbox (${inboxMessages.length})`} />
              <Tab label={`Sent (${outboxMessages.length})`} />
            </Tabs>
          </Box>

          {/* Inbox Tab */}
          {currentTab === 0 && (
            <div className="messages-list">
              {inboxMessages.length === 0 ? (
                <div className="no-messages">
                  <div className="no-messages-icon">📭</div>
                  <h4>No Messages</h4>
                  <p>Your inbox is empty</p>
                </div>
              ) : (
                <>
                  {inboxMessages.map((message, index) => {
                    const { date, time } = formatDateTime(message.timestamp);
                    return (
                      <div key={index} className="message-card received">
                        <div className="message-header">
                          <div className="message-from">
                            <PersonIcon fontSize="small" />
                            <span>
                              {message.address.substring(0, 10)}...
                              {message.address.substring(38)}
                            </span>
                          </div>
                          <div className="message-time">
                            {date} {time}
                          </div>
                        </div>
                        <div className="message-content">{message.content}</div>
                        <Button
                          size="small"
                          onClick={() => handleReply(message)}
                          className="reply-button"
                        >
                          Reply
                        </Button>
                      </div>
                    );
                  })}

                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={handleClearInbox}
                    disabled={submitting}
                    startIcon={<DeleteSweepIcon />}
                    className="clear-inbox-button"
                  >
                    Clear Inbox
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Sent Tab */}
          {currentTab === 1 && (
            <div className="messages-list">
              {outboxMessages.length === 0 ? (
                <div className="no-messages">
                  <div className="no-messages-icon">📮</div>
                  <h4>No Sent Messages</h4>
                  <p>You haven't sent any messages yet</p>
                </div>
              ) : (
                <>
                  {outboxMessages.map((message, index) => {
                    const { date, time } = formatDateTime(message.timestamp);
                    return (
                      <div key={index} className="message-card sent">
                        <div className="message-header">
                          <div className="message-to">
                            <PersonIcon fontSize="small" />
                            <span>
                              To: {message.address.substring(0, 10)}...
                              {message.address.substring(38)}
                            </span>
                          </div>
                          <div className="message-time">
                            {date} {time}
                          </div>
                        </div>
                        <div className="message-content">{message.content}</div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Email.propTypes = {};

export default Email;
