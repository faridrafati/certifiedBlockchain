import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import {
  TextField,
  Button,
  Card,
  CardContent,
  CardMedia,
  Divider,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventIcon from '@mui/icons-material/Event';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  TICKETSALE_ABI,
  TICKETSALE_ADDRESS,
} from './components/config/TicketSaleConfig';
import doggyidparser from './components/doggyidparser';
import HideShow from './HideShow.jsx';
import LoadingSpinner from './components/LoadingSpinner';
import './components/css/ticketsale.css';

const TicketSale = () => {
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
  const [tickets, setTickets] = useState([]);
  const [paused, setPaused] = useState(false);

  // Admin inputs
  const [ticketName, setTicketName] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketOwner, setTicketOwner] = useState('');
  const [newOwnerAddress, setNewOwnerAddress] = useState('');

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

  const replaceAt = (thisWord, index, replacement) => {
    return (
      thisWord.substring(0, index) +
      replacement +
      thisWord.substring(index + replacement.length)
    );
  };

  const generateTicketImage = useCallback((ticketId, size, canvasId) => {
    try {
      const data = doggyidparser(ticketId);
      const canvas = document.getElementById(canvasId);

      if (!canvas) return null;

      canvas.width = size * data.length;
      canvas.height = size * data[1].length;
      const ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'destination-over';

      for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < data[i].length; j++) {
          let color = data[i][j];
          if (color) {
            if (color === '#ffffff') {
              color = '#CC6600';
            }
            ctx.fillStyle = color;
            ctx.fillRect(i * size, j * size, size, size);
          }
        }
      }

      return canvas.toDataURL();
    } catch (error) {
      console.error('Error generating ticket image:', error);
      return null;
    }
  }, []);

  const getAllTokens = useCallback(
    async (contractInstance, web3Instance) => {
      try {
        const allTokens = await contractInstance.methods.getAllTokens().call();
        const isPaused = await contractInstance.methods.paused().call();

        const ticketsData = [];
        for (let i = 0; i < allTokens[0].length; i++) {
          ticketsData.push({
            name: allTokens[0][i],
            dna: allTokens[1][i],
            price: web3Instance.utils.fromWei(allTokens[2][i], 'ether'),
            nextPrice: web3Instance.utils.fromWei(allTokens[3][i], 'ether'),
            owner: allTokens[4][i],
          });
        }

        setTickets(ticketsData);
        setPaused(isPaused);

        // Generate images after state is set
        setTimeout(() => {
          for (let i = 0; i < allTokens[0].length; i++) {
            generateTicketImage(
              replaceAt(ticketsData[i].dna, 2, '00'),
              4,
              `ticket-canvas-${i}`
            );
          }
        }, 100);
      } catch (error) {
        console.error('Error getting tokens:', error);
        toast.error('Failed to load tickets');
      }
    },
    [generateTicketImage]
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
        TICKETSALE_ABI,
        TICKETSALE_ADDRESS
      );
      setContract(contractInstance);

      const ownerAddress = await contractInstance.methods.owner().call();
      setOwner(ownerAddress);

      await getAllTokens(contractInstance, web3Instance);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [getAllTokens]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  const handleRefresh = async () => {
    if (!contract || !web3) return;
    try {
      await getAllTokens(contract, web3);
      toast.success('Tickets data refreshed!');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleAddTicket = async (e) => {
    e.preventDefault();

    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!ticketName.trim()) {
      toast.error('Please enter a ticket name');
      return;
    }

    try {
      setSubmitting(true);

      toast.info('Adding ticket. Please confirm in MetaMask...');

      if (ticketPrice === '' || ticketOwner === '') {
        // Create token with just name
        await contract.methods
          .createToken(ticketName)
          .send({ from: account, gas: '1000000' })
          .on('transactionHash', (hash) => {
            toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
          })
          .on('receipt', async () => {
            toast.success('Ticket added successfully!');
            setTicketName('');
            setTicketPrice('');
            setTicketOwner('');
            await getAllTokens(contract, web3);
          })
          .on('error', (error) => {
            console.error('Add ticket error:', error);
            toast.error(`Failed to add ticket: ${error.message}`);
          });
      } else {
        // Create token with name, owner, and price
        const priceInWei = web3.utils.toWei(ticketPrice, 'ether');
        await contract.methods
          .createToken(ticketName, ticketOwner, priceInWei)
          .send({ from: account, gas: '1000000' })
          .on('transactionHash', (hash) => {
            toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
          })
          .on('receipt', async () => {
            toast.success('Ticket added successfully!');
            setTicketName('');
            setTicketPrice('');
            setTicketOwner('');
            await getAllTokens(contract, web3);
          })
          .on('error', (error) => {
            console.error('Add ticket error:', error);
            toast.error(`Failed to add ticket: ${error.message}`);
          });
      }
    } catch (error) {
      console.error('Add ticket failed:', error);
      toast.error(`Failed to add ticket: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyTicket = async (index, nextPrice) => {
    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    if (paused) {
      toast.error('Sales are currently paused');
      return;
    }

    try {
      setSubmitting(true);

      toast.info('Purchasing ticket. Please confirm in MetaMask...');

      const priceInWei = web3.utils.toWei(nextPrice, 'ether');

      await contract.methods
        .purchase(index)
        .send({
          from: account,
          value: priceInWei,
          gas: '1000000',
        })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Ticket purchased successfully!');
          await getAllTokens(contract, web3);
        })
        .on('error', (error) => {
          console.error('Purchase error:', error);
          toast.error(`Failed to purchase: ${error.message}`);
        });
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error(`Failed to purchase: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePauseSale = async () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setSubmitting(true);
      const action = paused ? 'unpausing' : 'pausing';

      toast.info(
        `${action.charAt(0).toUpperCase() + action.slice(1)} sale. Please confirm in MetaMask...`
      );

      const method = paused
        ? contract.methods.unpause()
        : contract.methods.pause();

      await method
        .send({ from: account, gas: '1000000' })
        .on('receipt', async () => {
          toast.success(`Sale ${paused ? 'unpaused' : 'paused'} successfully!`);
          setPaused(!paused);
        })
        .on('error', (error) => {
          console.error('Pause/unpause error:', error);
          toast.error(`Failed to ${action}: ${error.message}`);
        });
    } catch (error) {
      console.error('Pause/unpause failed:', error);
      toast.error(`Operation failed: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetOwner = async (e) => {
    e.preventDefault();

    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!newOwnerAddress.trim()) {
      toast.error('Please enter an address');
      return;
    }

    if (!web3.utils.isAddress(newOwnerAddress)) {
      toast.error('Invalid address');
      return;
    }

    try {
      setSubmitting(true);

      toast.info('Transferring ownership. Please confirm in MetaMask...');

      await contract.methods
        .setOwner(newOwnerAddress)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Ownership transferred successfully!');
          setNewOwnerAddress('');
          const ownerAddress = await contract.methods.owner().call();
          setOwner(ownerAddress);
        })
        .on('error', (error) => {
          console.error('Set owner error:', error);
          toast.error(`Failed to transfer ownership: ${error.message}`);
        });
    } catch (error) {
      console.error('Set owner failed:', error);
      toast.error(
        `Failed to transfer ownership: ${error.message || 'Unknown error'}`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Event Tickets..." />;
  }

  const isOwner =
    owner.toLowerCase() === account.toLowerCase() && account !== '';

  return (
    <div className="ticketsale-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="display-4 fw-bold mb-3">
            <EventIcon className="hero-icon" />
            Event Tickets
          </h1>
          <p className="lead mb-4">
            Buy and sell unique event tickets on the blockchain
          </p>
          <HideShow
            currentAccount={currentAccount}
            contractAddress={TICKETSALE_ADDRESS}
            chainId={chainId}
            owner={isOwner ? owner : undefined}
          />
        </div>
      </section>

      <div className="tickets-content">
        {isOwner ? (
          // Admin View
          <>
            <Card className="admin-actions-card">
              <CardContent>
                <div className="card-header-section">
                  <h3>
                    <AdminPanelSettingsIcon className="section-icon" />
                    Quick Actions
                  </h3>
                  <Tooltip title="Refresh Data">
                    <IconButton onClick={handleRefresh} className="refresh-btn">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </div>

                <Divider className="divider" />

                <div className="admin-actions">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={paused}
                        onChange={handlePauseSale}
                        disabled={submitting}
                        color="warning"
                      />
                    }
                    label={
                      <span className="switch-label">
                        {paused ? (
                          <>
                            <PauseIcon /> Sale Paused
                          </>
                        ) : (
                          <>
                            <PlayArrowIcon /> Sale Active
                          </>
                        )}
                      </span>
                    }
                    className="pause-switch"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="transfer-ownership-card">
              <CardContent>
                <h3>Transfer Ownership</h3>

                <Divider className="divider" />

                <form onSubmit={handleSetOwner}>
                  <div className="form-group">
                    <TextField
                      label="New Contract Owner Address"
                      variant="outlined"
                      fullWidth
                      value={newOwnerAddress}
                      onChange={(e) => setNewOwnerAddress(e.target.value)}
                      placeholder="0x..."
                      disabled={submitting}
                      required
                      helperText="Transfer contract ownership to a new address"
                    />

                    <Button
                      variant="contained"
                      color="warning"
                      size="large"
                      type="submit"
                      fullWidth
                      disabled={submitting || newOwnerAddress.length === 0}
                      className="submit-button"
                    >
                      {submitting ? 'Transferring...' : 'Change Owner Address'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="add-ticket-card">
              <CardContent>
                <h3>
                  <AddCircleIcon className="section-icon" />
                  Add New Ticket
                </h3>

                <Divider className="divider" />

                <form onSubmit={handleAddTicket}>
                  <div className="form-group">
                    <TextField
                      label="Ticket Name"
                      variant="outlined"
                      fullWidth
                      value={ticketName}
                      onChange={(e) => setTicketName(e.target.value)}
                      placeholder="Enter event name"
                      disabled={submitting}
                      required
                      helperText="Event or ticket name (required)"
                    />

                    <TextField
                      label="Price (ETH)"
                      variant="outlined"
                      fullWidth
                      type="number"
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(e.target.value)}
                      placeholder="0.0"
                      disabled={submitting}
                      inputProps={{
                        min: '0',
                        step: 'any',
                      }}
                      helperText="Initial price in ETH (optional)"
                    />

                    <TextField
                      label="Owner Address"
                      variant="outlined"
                      fullWidth
                      value={ticketOwner}
                      onChange={(e) => setTicketOwner(e.target.value)}
                      placeholder="0x..."
                      disabled={submitting}
                      helperText="Initial owner address (optional)"
                    />

                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      type="submit"
                      fullWidth
                      disabled={submitting || ticketName.length === 0}
                      className="submit-button"
                      startIcon={<AddCircleIcon />}
                    >
                      {submitting ? 'Adding Ticket...' : 'Add Ticket'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="tickets-table-card">
              <CardContent>
                <h3>
                  <ConfirmationNumberIcon className="section-icon" />
                  All Tickets
                </h3>

                <Divider className="divider" />

                <TableContainer component={Paper} className="tickets-table">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>DNA</TableCell>
                        <TableCell>Price (ETH)</TableCell>
                        <TableCell>Next Price (ETH)</TableCell>
                        <TableCell>Owner</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tickets.map((ticket, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{ticket.name}</TableCell>
                          <TableCell className="dna-cell">{ticket.dna}</TableCell>
                          <TableCell>{parseFloat(ticket.price).toFixed(4)}</TableCell>
                          <TableCell>
                            {parseFloat(ticket.nextPrice).toFixed(4)}
                          </TableCell>
                          <TableCell className="address-cell">
                            {ticket.owner.substring(0, 10)}...
                            {ticket.owner.substring(ticket.owner.length - 8)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {tickets.length === 0 && (
                  <div className="empty-state">
                    <ConfirmationNumberIcon className="empty-icon" />
                    <p>No tickets added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          // Public Marketplace View
          <>
            <div className="marketplace-header">
              <h2>
                <ShoppingCartIcon className="section-icon" />
                Ticket Marketplace
              </h2>
              <Tooltip title="Refresh Data">
                <IconButton onClick={handleRefresh} className="refresh-btn">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </div>

            {paused && (
              <Card className="paused-notice">
                <CardContent>
                  <PauseIcon className="pause-icon" />
                  <h4>Sales Currently Paused</h4>
                  <p>
                    The marketplace is temporarily unavailable. Please check back
                    later.
                  </p>
                </CardContent>
              </Card>
            )}

            <Grid container spacing={3}>
              {tickets.map((ticket, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card className="ticket-card">
                    <CardMedia className="card-media">
                      <canvas
                        id={`ticket-canvas-${index}`}
                        className="ticket-canvas"
                      />
                    </CardMedia>
                    <CardContent>
                      <div className="ticket-info">
                        <h4>{ticket.name}</h4>

                        <Divider className="divider-small" />

                        <div className="info-row">
                          <span className="info-label">DNA:</span>
                          <span className="info-value dna-text">
                            {ticket.dna}
                          </span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Price:</span>
                          <span className="info-value price-text">
                            {parseFloat(ticket.nextPrice).toFixed(4)} ETH
                          </span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Owner:</span>
                          <span className="info-value address-text">
                            {ticket.owner.substring(0, 10)}...
                            {ticket.owner.substring(ticket.owner.length - 8)}
                          </span>
                        </div>

                        <Divider className="divider-small" />

                        {ticket.owner === account ? (
                          <Chip
                            label="OWNED"
                            color="success"
                            className="owned-chip"
                          />
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            onClick={() => handleBuyTicket(index, ticket.nextPrice)}
                            disabled={submitting || paused}
                            startIcon={<ShoppingCartIcon />}
                            className="buy-button"
                          >
                            {submitting ? 'Purchasing...' : 'Buy Ticket'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {tickets.length === 0 && (
              <Card className="empty-state">
                <CardContent>
                  <ConfirmationNumberIcon className="empty-icon" />
                  <h4>No Tickets Available</h4>
                  <p>
                    There are no tickets in the marketplace yet. Check back soon!
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

TicketSale.propTypes = {};

export default TicketSale;
