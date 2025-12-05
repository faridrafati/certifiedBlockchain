import React, { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';
import {
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import RefreshIcon from '@mui/icons-material/Refresh';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  TICKETSALE_ABI,
  TICKETSALE_ADDRESS,
} from './components/config/TicketSaleConfig';
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
  const [occasions, setOccasions] = useState([]);
  const [contractBalance, setContractBalance] = useState('0');

  // Seat selection dialog
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [selectedSeat, setSelectedSeat] = useState('');
  const [takenSeats, setTakenSeats] = useState([]);

  // Admin inputs for listing new occasion
  const [occasionName, setOccasionName] = useState('');
  const [occasionCost, setOccasionCost] = useState('');
  const [occasionMaxTickets, setOccasionMaxTickets] = useState('');
  const [occasionDate, setOccasionDate] = useState('');
  const [occasionTime, setOccasionTime] = useState('');
  const [occasionLocation, setOccasionLocation] = useState('');

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

  const loadOccasions = useCallback(
    async (contractInstance, web3Instance) => {
      try {
        const total = await contractInstance.methods.totalOccasions().call();
        const totalNum = Number(total);

        const occasionsList = [];
        for (let i = 1; i <= totalNum; i++) {
          try {
            const occasion = await contractInstance.methods.getOccasion(i).call();
            const seatsTaken = await contractInstance.methods.getSeatsTaken(i).call();

            occasionsList.push({
              id: Number(occasion.id),
              name: occasion.name,
              cost: web3Instance.utils.fromWei(occasion.cost.toString(), 'ether'),
              costWei: occasion.cost.toString(),
              tickets: Number(occasion.tickets),
              maxTickets: Number(occasion.maxTickets),
              date: occasion.date,
              time: occasion.time,
              location: occasion.location,
              seatsTaken: seatsTaken.map(s => Number(s)),
            });
          } catch (err) {
            console.error(`Error loading occasion ${i}:`, err);
          }
        }

        setOccasions(occasionsList);
      } catch (error) {
        console.error('Error loading occasions:', error);
        toast.error('Failed to load events');
      }
    },
    []
  );

  const loadContractBalance = useCallback(async (web3Instance, contractAddress) => {
    try {
      const balance = await web3Instance.eth.getBalance(contractAddress);
      setContractBalance(web3Instance.utils.fromWei(balance, 'ether'));
    } catch (error) {
      console.error('Error loading contract balance:', error);
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
        TICKETSALE_ABI,
        TICKETSALE_ADDRESS
      );
      setContract(contractInstance);

      // Try different methods to get owner
      let ownerAddress = '';
      try {
        ownerAddress = await contractInstance.methods.getOwner().call();
      } catch {
        try {
          ownerAddress = await contractInstance.methods.owner().call();
        } catch (err) {
          console.error('Could not get owner:', err);
        }
      }
      setOwner(ownerAddress);

      await loadOccasions(contractInstance, web3Instance);
      await loadContractBalance(web3Instance, TICKETSALE_ADDRESS);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [loadOccasions, loadContractBalance]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  const handleRefresh = async () => {
    if (!contract || !web3) return;
    try {
      await loadOccasions(contract, web3);
      await loadContractBalance(web3, TICKETSALE_ADDRESS);
      toast.success('Events data refreshed!');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleListOccasion = async (e) => {
    e.preventDefault();

    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!occasionName.trim() || !occasionCost || !occasionMaxTickets || !occasionDate || !occasionTime || !occasionLocation) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);

      toast.info('Creating event. Please confirm in MetaMask...');

      const costInWei = web3.utils.toWei(occasionCost, 'ether');

      await contract.methods
        .list(occasionName, costInWei, occasionMaxTickets, occasionDate, occasionTime, occasionLocation)
        .send({ from: account, gas: '500000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Event created successfully!');
          setOccasionName('');
          setOccasionCost('');
          setOccasionMaxTickets('');
          setOccasionDate('');
          setOccasionTime('');
          setOccasionLocation('');
          await loadOccasions(contract, web3);
        })
        .on('error', (error) => {
          console.error('List occasion error:', error);
          toast.error(`Failed to create event: ${error.message}`);
        });
    } catch (error) {
      console.error('List occasion failed:', error);
      toast.error(`Failed to create event: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const openSeatDialog = async (occasion) => {
    setSelectedOccasion(occasion);
    setTakenSeats(occasion.seatsTaken);
    setSelectedSeat('');
    setSeatDialogOpen(true);
  };

  const handleMintTicket = async () => {
    if (!contract || !account || !web3 || !selectedOccasion || !selectedSeat) {
      toast.error('Please select a seat');
      return;
    }

    const seatNum = parseInt(selectedSeat);
    if (isNaN(seatNum) || seatNum < 1 || seatNum > selectedOccasion.maxTickets) {
      toast.error(`Please enter a valid seat number (1-${selectedOccasion.maxTickets})`);
      return;
    }

    if (takenSeats.includes(seatNum)) {
      toast.error('This seat is already taken');
      return;
    }

    try {
      setSubmitting(true);
      setSeatDialogOpen(false);

      toast.info('Purchasing ticket. Please confirm in MetaMask...');

      await contract.methods
        .mint(selectedOccasion.id, seatNum)
        .send({
          from: account,
          value: selectedOccasion.costWei,
          gas: '300000',
        })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Ticket purchased successfully!');
          await loadOccasions(contract, web3);
          await loadContractBalance(web3, TICKETSALE_ADDRESS);
        })
        .on('error', (error) => {
          console.error('Mint error:', error);
          toast.error(`Failed to purchase: ${error.message}`);
        });
    } catch (error) {
      console.error('Mint failed:', error);
      toast.error(`Failed to purchase: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
      setSelectedOccasion(null);
      setSelectedSeat('');
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setSubmitting(true);

      toast.info('Withdrawing funds. Please confirm in MetaMask...');

      await contract.methods
        .withdraw()
        .send({ from: account, gas: '100000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Funds withdrawn successfully!');
          await loadContractBalance(web3, TICKETSALE_ADDRESS);
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
    return <LoadingSpinner message="Loading Events..." />;
  }

  const isOwner =
    owner && account && owner.toLowerCase() === account.toLowerCase();

  return (
    <div className="ticketsale-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="display-4 fw-bold mb-3">
            <EventIcon className="hero-icon" />
            Event Tickets
          </h1>
          <p className="lead mb-4">
            Buy tickets for events secured on the blockchain
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
        {isOwner && (
          <>
            <Card className="admin-actions-card">
              <CardContent>
                <div className="card-header-section">
                  <h3>
                    <AdminPanelSettingsIcon className="section-icon" />
                    Admin Panel
                  </h3>
                  <Tooltip title="Refresh Data">
                    <IconButton onClick={handleRefresh} className="refresh-btn">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </div>

                <Divider className="divider" />

                <div className="admin-stats">
                  <div className="stat-item">
                    <AccountBalanceWalletIcon />
                    <span>Contract Balance: {parseFloat(contractBalance).toFixed(4)} ETH</span>
                  </div>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleWithdraw}
                    disabled={submitting || parseFloat(contractBalance) === 0}
                    startIcon={<AccountBalanceWalletIcon />}
                  >
                    Withdraw Funds
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="add-ticket-card">
              <CardContent>
                <h3>
                  <AddCircleIcon className="section-icon" />
                  Create New Event
                </h3>

                <Divider className="divider" />

                <form onSubmit={handleListOccasion}>
                  <div className="form-group">
                    <TextField
                      label="Event Name"
                      variant="outlined"
                      fullWidth
                      value={occasionName}
                      onChange={(e) => setOccasionName(e.target.value)}
                      placeholder="Enter event name"
                      disabled={submitting}
                      required
                    />

                    <TextField
                      label="Ticket Price (ETH)"
                      variant="outlined"
                      fullWidth
                      type="number"
                      value={occasionCost}
                      onChange={(e) => setOccasionCost(e.target.value)}
                      placeholder="0.01"
                      disabled={submitting}
                      required
                      inputProps={{ min: '0', step: 'any' }}
                    />

                    <TextField
                      label="Max Tickets (Seats)"
                      variant="outlined"
                      fullWidth
                      type="number"
                      value={occasionMaxTickets}
                      onChange={(e) => setOccasionMaxTickets(e.target.value)}
                      placeholder="100"
                      disabled={submitting}
                      required
                      inputProps={{ min: '1' }}
                    />

                    <TextField
                      label="Date"
                      variant="outlined"
                      fullWidth
                      value={occasionDate}
                      onChange={(e) => setOccasionDate(e.target.value)}
                      placeholder="December 25, 2025"
                      disabled={submitting}
                      required
                    />

                    <TextField
                      label="Time"
                      variant="outlined"
                      fullWidth
                      value={occasionTime}
                      onChange={(e) => setOccasionTime(e.target.value)}
                      placeholder="7:00 PM"
                      disabled={submitting}
                      required
                    />

                    <TextField
                      label="Location"
                      variant="outlined"
                      fullWidth
                      value={occasionLocation}
                      onChange={(e) => setOccasionLocation(e.target.value)}
                      placeholder="Madison Square Garden, NYC"
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
                      className="submit-button"
                      startIcon={<AddCircleIcon />}
                    >
                      {submitting ? 'Creating Event...' : 'Create Event'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </>
        )}

        <div className="marketplace-header">
          <h2>
            <ConfirmationNumberIcon className="section-icon" />
            Available Events
          </h2>
          {!isOwner && (
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} className="refresh-btn">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>

        <Grid container spacing={3}>
          {occasions.map((occasion) => (
            <Grid item xs={12} sm={6} md={4} key={occasion.id}>
              <Card className="ticket-card">
                <CardContent>
                  <div className="ticket-info">
                    <h4>{occasion.name}</h4>

                    <Divider className="divider-small" />

                    <div className="info-row">
                      <CalendarTodayIcon className="info-icon" />
                      <span className="info-value">{occasion.date}</span>
                    </div>

                    <div className="info-row">
                      <AccessTimeIcon className="info-icon" />
                      <span className="info-value">{occasion.time}</span>
                    </div>

                    <div className="info-row">
                      <LocationOnIcon className="info-icon" />
                      <span className="info-value">{occasion.location}</span>
                    </div>

                    <div className="info-row">
                      <EventSeatIcon className="info-icon" />
                      <span className="info-value">
                        {occasion.tickets} / {occasion.maxTickets} seats available
                      </span>
                    </div>

                    <Divider className="divider-small" />

                    <div className="price-display">
                      <span className="price-label">Price:</span>
                      <span className="price-value">{parseFloat(occasion.cost).toFixed(4)} ETH</span>
                    </div>

                    {occasion.tickets > 0 ? (
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        onClick={() => openSeatDialog(occasion)}
                        disabled={submitting}
                        startIcon={<ConfirmationNumberIcon />}
                        className="buy-button"
                      >
                        Buy Ticket
                      </Button>
                    ) : (
                      <Chip
                        label="SOLD OUT"
                        color="error"
                        className="soldout-chip"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {occasions.length === 0 && (
          <Card className="empty-state">
            <CardContent>
              <ConfirmationNumberIcon className="empty-icon" />
              <h4>No Events Available</h4>
              <p>There are no events listed yet. Check back soon!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Seat Selection Dialog */}
      <Dialog open={seatDialogOpen} onClose={() => setSeatDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <EventSeatIcon className="dialog-icon" />
          Select Your Seat
        </DialogTitle>
        <DialogContent>
          {selectedOccasion && (
            <>
              <p className="dialog-event-name">{selectedOccasion.name}</p>
              <p className="dialog-info">
                Available seats: 1 - {selectedOccasion.maxTickets}
              </p>
              {takenSeats.length > 0 && (
                <p className="dialog-taken">
                  Taken seats: {takenSeats.sort((a, b) => a - b).join(', ')}
                </p>
              )}
              <TextField
                label="Seat Number"
                variant="outlined"
                fullWidth
                type="number"
                value={selectedSeat}
                onChange={(e) => setSelectedSeat(e.target.value)}
                placeholder="Enter seat number"
                inputProps={{ min: 1, max: selectedOccasion.maxTickets }}
                className="seat-input"
                error={selectedSeat && takenSeats.includes(parseInt(selectedSeat))}
                helperText={selectedSeat && takenSeats.includes(parseInt(selectedSeat)) ? 'This seat is taken' : ''}
              />
              <p className="dialog-price">
                Total: {parseFloat(selectedOccasion.cost).toFixed(4)} ETH
              </p>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSeatDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleMintTicket}
            variant="contained"
            color="primary"
            disabled={submitting || !selectedSeat || (selectedSeat && takenSeats.includes(parseInt(selectedSeat)))}
          >
            {submitting ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TicketSale;
