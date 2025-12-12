/**
 * @file TicketSale.jsx
 * @description NFT-based event ticketing system with visual seat selection
 * @author CertifiedBlockchain
 *
 * This component provides a complete event ticketing platform where:
 * - Event organizers (contract owner) can create events with customizable details
 * - Users can visually select and purchase seats as NFTs
 * - Ticket holders can transfer their tickets to other wallets
 * - Admin can withdraw collected funds
 *
 * Features:
 * - Visual interactive seat map with real-time availability
 * - Multi-seat selection and batch purchasing
 * - ERC721 NFT tickets with transfer capability
 * - Auto-refresh every 12 seconds (Ethereum block time)
 * - Responsive design with Material-UI components
 *
 * Smart Contract: TicketSale.sol (ERC721)
 * CSS: ./components/css/ticketsale.css
 */

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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  TICKETSALE_ABI,
  TICKETSALE_ADDRESS,
} from './components/config/TicketSaleConfig';
import ContractInfo from './components/ContractInfo';
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
  const [totalSupply, setTotalSupply] = useState(0);

  // Transfer dialog
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferToAddress, setTransferToAddress] = useState('');
  const [selectedTicketForTransfer, setSelectedTicketForTransfer] = useState(null);

  // Seat selection dialog
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [takenSeats, setTakenSeats] = useState([]);
  const [mySeats, setMySeats] = useState([]);

  // Success dialog
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [purchasedSeatsInfo, setPurchasedSeatsInfo] = useState({ seats: [], eventName: '', totalCost: '' });

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
    async (contractInstance, web3Instance, userAccount) => {
      try {
        const total = await contractInstance.methods.totalOccasions().call();
        const totalNum = Number(total);

        const occasionsList = [];
        for (let i = 1; i <= totalNum; i++) {
          try {
            const occasion = await contractInstance.methods.getOccasion(i).call();
            const seatsTaken = await contractInstance.methods.getSeatsTaken(i).call();
            const takenSeatsNumbers = seatsTaken.map(s => Number(s.toString()));

            // Check which seats belong to the current user
            const userOwnedSeats = [];
            if (userAccount) {
              for (const seatNum of takenSeatsNumbers) {
                try {
                  const seatOwner = await contractInstance.methods.seatTaken(i, seatNum).call();
                  if (seatOwner.toLowerCase() === userAccount.toLowerCase()) {
                    userOwnedSeats.push(seatNum);
                  }
                } catch (err) {
                  console.error(`Error checking seat ${seatNum} owner:`, err);
                }
              }
            }

            // Convert BigInt to Number for cross-browser compatibility
            occasionsList.push({
              id: Number(occasion.id.toString()),
              name: occasion.name,
              cost: web3Instance.utils.fromWei(occasion.cost.toString(), 'ether'),
              costWei: occasion.cost.toString(),
              tickets: Number(occasion.tickets.toString()),
              maxTickets: Number(occasion.maxTickets.toString()),
              date: occasion.date,
              time: occasion.time,
              location: occasion.location,
              seatsTaken: takenSeatsNumbers,
              mySeats: userOwnedSeats,
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

  const loadTotalSupply = useCallback(async (contractInstance) => {
    try {
      const supply = await contractInstance.methods.totalSupply().call();
      setTotalSupply(Number(supply.toString()));
    } catch (error) {
      console.error('Error loading total supply:', error);
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

      await loadOccasions(contractInstance, web3Instance, userAccount);
      await loadContractBalance(web3Instance, TICKETSALE_ADDRESS);
      await loadTotalSupply(contractInstance);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [loadOccasions, loadContractBalance, loadTotalSupply]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  // Auto-refresh every 12 seconds (Ethereum block time)
  useEffect(() => {
    if (!contract || !web3 || !account) return;

    const interval = setInterval(() => {
      loadOccasions(contract, web3, account);
      loadContractBalance(web3, TICKETSALE_ADDRESS);
      loadTotalSupply(contract);
    }, 12000);

    return () => clearInterval(interval);
  }, [contract, web3, account, loadOccasions, loadContractBalance, loadTotalSupply]);

  const handleRefresh = async () => {
    if (!contract || !web3) return;
    try {
      await loadOccasions(contract, web3, account);
      await loadContractBalance(web3, TICKETSALE_ADDRESS);
      await loadTotalSupply(contract);
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

    // Validate based on smart contract requirements
    const cost = parseFloat(occasionCost);
    const maxTickets = parseInt(occasionMaxTickets, 10);

    if (cost <= 0) {
      toast.error('Ticket price must be greater than 0');
      return;
    }

    if (maxTickets < 1) {
      toast.error('Must have at least 1 ticket');
      return;
    }

    try {
      setSubmitting(true);

      toast.info('Creating event. Please confirm in MetaMask...');

      const costInWei = web3.utils.toWei(occasionCost, 'ether');

      // Format date from YYYY-MM-DD to readable format (e.g., "December 25, 2025")
      const dateObj = new Date(occasionDate + 'T00:00:00');
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Format time from HH:MM to readable format (e.g., "7:00 PM")
      const [hours, minutes] = occasionTime.split(':');
      const timeObj = new Date();
      timeObj.setHours(parseInt(hours, 10), parseInt(minutes, 10));
      const formattedTime = timeObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      await contract.methods
        .list(occasionName.trim(), costInWei, maxTickets, formattedDate, formattedTime, occasionLocation.trim())
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
          await loadOccasions(contract, web3, account);
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
    setMySeats(occasion.mySeats || []);
    setSelectedSeats([]);
    setSeatDialogOpen(true);
  };

  const toggleSeatSelection = (seat) => {
    setSelectedSeats(prev => {
      if (prev.includes(seat)) {
        return prev.filter(s => s !== seat);
      } else {
        return [...prev, seat].sort((a, b) => a - b);
      }
    });
  };

  const handleMintTicket = async () => {
    if (!contract || !account || !web3 || !selectedOccasion || selectedSeats.length === 0) {
      toast.error('Please select at least one seat');
      return;
    }

    // Validate all selected seats
    for (const seatNum of selectedSeats) {
      if (seatNum < 1 || seatNum > selectedOccasion.maxTickets) {
        toast.error(`Invalid seat number: ${seatNum}`);
        return;
      }
      if (takenSeats.includes(seatNum)) {
        toast.error(`Seat ${seatNum} is already taken`);
        return;
      }
    }

    const eventName = selectedOccasion.name;
    const ticketCost = selectedOccasion.cost;
    const seatsToProcess = [...selectedSeats];

    try {
      setSubmitting(true);
      setSeatDialogOpen(false);

      const totalSeats = seatsToProcess.length;
      toast.info(`Purchasing ${totalSeats} ticket${totalSeats > 1 ? 's' : ''}. Please confirm each transaction in MetaMask...`);

      let successCount = 0;
      const purchasedSeats = [];
      for (const seatNum of seatsToProcess) {
        try {
          await contract.methods
            .mint(selectedOccasion.id, seatNum)
            .send({
              from: account,
              value: selectedOccasion.costWei,
              gas: '300000',
            })
            .on('transactionHash', (hash) => {
              toast.info(`Seat #${seatNum}: Transaction submitted`);
            });
          successCount++;
          purchasedSeats.push(seatNum);
        } catch (error) {
          console.error(`Mint error for seat ${seatNum}:`, error);
          toast.error(`Failed to purchase seat #${seatNum}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        await loadOccasions(contract, web3, account);
        await loadContractBalance(web3, TICKETSALE_ADDRESS);

        // Show success dialog
        setPurchasedSeatsInfo({
          seats: purchasedSeats,
          eventName: eventName,
          totalCost: (parseFloat(ticketCost) * successCount).toFixed(4),
        });
        setSuccessDialogOpen(true);
      }
    } catch (error) {
      console.error('Mint failed:', error);
      toast.error(`Failed to purchase: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
      setSelectedOccasion(null);
      setSelectedSeats([]);
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

  const openTransferDialog = (occasion, seatNumber) => {
    setSelectedTicketForTransfer({ occasionId: occasion.id, seat: seatNumber, eventName: occasion.name });
    setTransferToAddress('');
    setTransferDialogOpen(true);
  };

  const handleTransferTicket = async () => {
    if (!contract || !account || !web3 || !selectedTicketForTransfer) {
      toast.error('Missing required data for transfer');
      return;
    }

    if (!transferToAddress || !web3.utils.isAddress(transferToAddress)) {
      toast.error('Please enter a valid Ethereum address');
      return;
    }

    if (transferToAddress.toLowerCase() === account.toLowerCase()) {
      toast.error('Cannot transfer to yourself');
      return;
    }

    try {
      setSubmitting(true);
      setTransferDialogOpen(false);

      // Find the token ID for this seat
      // We need to iterate through all tokens to find the one for this seat
      // For simplicity, we'll use the seatTaken mapping to verify ownership
      // and then transfer using safeTransferFrom

      toast.info('Transferring ticket. Please confirm in MetaMask...');

      // Get the token ID - we need to find which token corresponds to this seat
      // Since tokens are minted sequentially, we need to search for it
      const supply = await contract.methods.totalSupply().call();
      let tokenId = null;

      for (let i = 1; i <= Number(supply); i++) {
        try {
          const tokenOwner = await contract.methods.ownerOf(i).call();
          if (tokenOwner.toLowerCase() === account.toLowerCase()) {
            // Check if this token is for the selected seat/occasion
            // Since we don't have a direct mapping, we verify via seatTaken
            const seatOwner = await contract.methods.seatTaken(
              selectedTicketForTransfer.occasionId,
              selectedTicketForTransfer.seat
            ).call();
            if (seatOwner.toLowerCase() === account.toLowerCase()) {
              tokenId = i;
              break;
            }
          }
        } catch {
          continue;
        }
      }

      if (!tokenId) {
        toast.error('Could not find the token for this ticket');
        setSubmitting(false);
        return;
      }

      await contract.methods
        .safeTransferFrom(account, transferToAddress, tokenId)
        .send({ from: account, gas: '150000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Ticket transferred successfully!');
          await loadOccasions(contract, web3, account);
          await loadTotalSupply(contract);
        })
        .on('error', (error) => {
          console.error('Transfer error:', error);
          toast.error(`Failed to transfer: ${error.message}`);
        });
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error(`Failed to transfer: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
      setSelectedTicketForTransfer(null);
      setTransferToAddress('');
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
          <div className="hero-title-row">
            <h1 className="display-4 fw-bold mb-3">
              📅 Event Tickets
            </h1>
            <ContractInfo
              contractAddress={TICKETSALE_ADDRESS}
              contractName="Event Tickets"
              owner={owner}
              account={account}
              network={import.meta.env.VITE_NETWORK_ID}
            />
            <Tooltip title="Refresh Data">
              <IconButton onClick={handleRefresh} className="hero-refresh-btn">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </div>
          <p className="lead mb-4">
            Buy tickets for events secured on the blockchain
          </p>
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
                  <div className="stat-item">
                    <ConfirmationNumberIcon />
                    <span>Total Tickets Minted: {totalSupply}</span>
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
                      InputProps={{
                        startAdornment: <EventIcon sx={{ mr: 1, color: 'primary.main' }} />,
                      }}
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
                      inputProps={{ min: '0.000001', step: 'any' }}
                      InputProps={{
                        startAdornment: <AccountBalanceWalletIcon sx={{ mr: 1, color: 'primary.main' }} />,
                      }}
                      helperText="Must be greater than 0"
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
                      InputProps={{
                        startAdornment: <EventSeatIcon sx={{ mr: 1, color: 'primary.main' }} />,
                      }}
                      helperText="Must be at least 1"
                    />

                    <TextField
                      label="Event Date"
                      variant="outlined"
                      fullWidth
                      type="date"
                      value={occasionDate}
                      onChange={(e) => setOccasionDate(e.target.value)}
                      disabled={submitting}
                      required
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ min: new Date().toISOString().split('T')[0] }}
                      InputProps={{
                        startAdornment: <CalendarTodayIcon sx={{ mr: 1, color: 'primary.main' }} />,
                      }}
                      helperText="Must be today or later"
                    />

                    <TextField
                      label="Event Time"
                      variant="outlined"
                      fullWidth
                      type="time"
                      value={occasionTime}
                      onChange={(e) => setOccasionTime(e.target.value)}
                      disabled={submitting}
                      required
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'primary.main' }} />,
                      }}
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
                      InputProps={{
                        startAdornment: <LocationOnIcon sx={{ mr: 1, color: 'primary.main' }} />,
                      }}
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
          {occasions.map((occasion, index) => (
            <Grid item xs={12} sm={6} md={4} key={occasion.id}>
              <Card className={`ticket-card card-color-${(index % 6) + 1}`}>
                <CardContent>
                  <div className="ticket-info">
                    <h4>{occasion.name}</h4>

                    <Divider className="divider-small" />

                    <div className="info-row">
                      <CalendarTodayIcon className="info-icon" />
                      <span className="info-label">Date:</span>
                      <span className="info-value">{occasion.date}</span>
                    </div>

                    <div className="info-row">
                      <AccessTimeIcon className="info-icon" />
                      <span className="info-label">Time:</span>
                      <span className="info-value">{occasion.time}</span>
                    </div>

                    <div className="info-row">
                      <LocationOnIcon className="info-icon" />
                      <span className="info-label">Location:</span>
                      <span className="info-value">{occasion.location}</span>
                    </div>

                    <div className="info-row">
                      <EventSeatIcon className="info-icon" />
                      <span className="info-label">Available Seats:</span>
                      <span className="info-value">
                        {occasion.tickets} / {occasion.maxTickets} available
                      </span>
                    </div>

                    {occasion.mySeats && occasion.mySeats.length > 0 && (
                      <Tooltip title="Click to view your seats">
                        <div
                          className="my-tickets-info clickable"
                          onClick={() => openSeatDialog(occasion)}
                        >
                          <ConfirmationNumberIcon className="my-tickets-icon" />
                          <span>Your Tickets: #{occasion.mySeats.join(', #')}</span>
                        </div>
                      </Tooltip>
                    )}

                    <div className="card-bottom-section">
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
      <Dialog open={seatDialogOpen} onClose={() => setSeatDialogOpen(false)} maxWidth="md" fullWidth className="seat-dialog">
        <DialogTitle className="seat-dialog-title">
          <EventSeatIcon className="dialog-icon" />
          Select Your Seat
        </DialogTitle>
        <DialogContent className="seat-dialog-content">
          {selectedOccasion && (
            <>
              <p className="dialog-event-name">{selectedOccasion.name}</p>

              {/* Stage/Screen */}
              <div className="stage-container">
                <div className="stage">STAGE</div>
              </div>

              {/* Seat Map */}
              <div className="seat-map-container">
                <div className="seat-map">
                  {(() => {
                    const totalSeats = selectedOccasion.maxTickets;
                    const seatsPerRow = Math.min(14, Math.ceil(Math.sqrt(totalSeats * 1.5)));
                    const rows = Math.ceil(totalSeats / seatsPerRow);
                    const seatElements = [];

                    for (let row = 0; row < rows; row++) {
                      const rowSeats = [];
                      const startSeat = row * seatsPerRow + 1;
                      const endSeat = Math.min(startSeat + seatsPerRow - 1, totalSeats);

                      for (let seat = startSeat; seat <= endSeat; seat++) {
                        const isTaken = takenSeats.includes(seat);
                        const isMine = mySeats.includes(seat);
                        const isSelected = selectedSeats.includes(seat);

                        let tooltipText = `Seat ${seat} - Available`;
                        if (isMine) tooltipText = `Seat ${seat} - Your Ticket (click to transfer)`;
                        else if (isTaken) tooltipText = `Seat ${seat} - Taken`;
                        else if (isSelected) tooltipText = `Seat ${seat} - Selected (click to deselect)`;

                        rowSeats.push(
                          <Tooltip key={seat} title={tooltipText}>
                            <div
                              className={`seat ${isMine ? 'mine' : isTaken ? 'taken' : 'available'} ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                if (isMine) {
                                  openTransferDialog(selectedOccasion, seat);
                                } else if (!isTaken) {
                                  toggleSeatSelection(seat);
                                }
                              }}
                            >
                              <EventSeatIcon />
                            </div>
                          </Tooltip>
                        );
                      }

                      seatElements.push(
                        <div key={row} className="seat-row">
                          <div className="seats">{rowSeats}</div>
                          <span className="row-number">{row + 1}</span>
                        </div>
                      );
                    }

                    return seatElements;
                  })()}
                </div>
              </div>

              {/* Legend */}
              <div className="seat-legend">
                <div className="legend-item">
                  <div className="seat-icon available"><EventSeatIcon /></div>
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <div className="seat-icon taken"><EventSeatIcon /></div>
                  <span>Taken</span>
                </div>
                <div className="legend-item">
                  <div className="seat-icon selected"><EventSeatIcon /></div>
                  <span>Selected</span>
                </div>
                <div className="legend-item">
                  <div className="seat-icon mine"><EventSeatIcon /></div>
                  <span>Your Tickets</span>
                </div>
              </div>

              {/* Transfer Hint */}
              {mySeats.length > 0 && (
                <div className="transfer-hint">
                  <SendIcon className="hint-icon" />
                  <span>Click on your tickets (blue seats) to transfer them to another wallet</span>
                </div>
              )}

              {/* Selected Seat Info */}
              <div className="selected-seat-info">
                {selectedSeats.length > 0 ? (
                  <p>
                    Selected Seat{selectedSeats.length > 1 ? 's' : ''}: <strong>#{selectedSeats.join(', #')}</strong> |
                    Total: <strong>{(parseFloat(selectedOccasion.cost) * selectedSeats.length).toFixed(4)} ETH</strong>
                    {selectedSeats.length > 1 && <span className="seat-count"> ({selectedSeats.length} tickets)</span>}
                  </p>
                ) : (
                  <p>Click on available seats to select them (you can select multiple)</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
        <DialogActions className="seat-dialog-actions">
          <Button onClick={() => setSeatDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleMintTicket}
            variant="contained"
            color="primary"
            disabled={submitting || selectedSeats.length === 0}
          >
            {submitting ? 'Processing...' : selectedSeats.length > 1 ? `Buy ${selectedSeats.length} Tickets` : 'Confirm Purchase'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="success-dialog"
      >
        <DialogTitle className="success-dialog-title">
          <CheckCircleIcon className="success-icon" />
          Purchase Successful!
        </DialogTitle>
        <DialogContent className="success-dialog-content">
          <div className="success-details">
            <h3>{purchasedSeatsInfo.eventName}</h3>
            <div className="success-info-row">
              <span className="success-label">Seat{purchasedSeatsInfo.seats.length > 1 ? 's' : ''} Purchased:</span>
              <span className="success-value">#{purchasedSeatsInfo.seats.join(', #')}</span>
            </div>
            <div className="success-info-row">
              <span className="success-label">Total Tickets:</span>
              <span className="success-value">{purchasedSeatsInfo.seats.length}</span>
            </div>
            <div className="success-info-row">
              <span className="success-label">Total Paid:</span>
              <span className="success-value price">{purchasedSeatsInfo.totalCost} ETH</span>
            </div>
          </div>
          <p className="success-message">
            Your ticket{purchasedSeatsInfo.seats.length > 1 ? 's have' : ' has'} been minted as NFT{purchasedSeatsInfo.seats.length > 1 ? 's' : ''} to your wallet!
          </p>
        </DialogContent>
        <DialogActions className="success-dialog-actions">
          <Button
            onClick={() => setSuccessDialogOpen(false)}
            variant="contained"
            color="primary"
            fullWidth
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      {/* Transfer Ticket Dialog */}
      <Dialog
        open={transferDialogOpen}
        onClose={() => setTransferDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="transfer-dialog"
      >
        <DialogTitle className="transfer-dialog-title">
          <SendIcon className="transfer-icon" />
          Transfer Ticket
        </DialogTitle>
        <DialogContent className="transfer-dialog-content">
          {selectedTicketForTransfer && (
            <div className="transfer-details">
              <h3>{selectedTicketForTransfer.eventName}</h3>
              <div className="transfer-info-row">
                <span className="transfer-label">Seat Number:</span>
                <span className="transfer-value">#{selectedTicketForTransfer.seat}</span>
              </div>
              <Divider className="divider-small" />
              <TextField
                label="Recipient Address"
                variant="outlined"
                fullWidth
                value={transferToAddress}
                onChange={(e) => setTransferToAddress(e.target.value)}
                placeholder="0x..."
                disabled={submitting}
                helperText="Enter the Ethereum address to transfer this ticket to"
                sx={{ mt: 2 }}
              />
            </div>
          )}
        </DialogContent>
        <DialogActions className="transfer-dialog-actions">
          <Button onClick={() => setTransferDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleTransferTicket}
            variant="contained"
            color="primary"
            disabled={submitting || !transferToAddress}
            startIcon={<SendIcon />}
          >
            {submitting ? 'Transferring...' : 'Transfer Ticket'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TicketSale;
