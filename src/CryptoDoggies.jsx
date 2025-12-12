import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import PetsIcon from '@mui/icons-material/Pets';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  CRYPTODOGGIES_ABI,
  CRYPTODOGGIES_ADDRESS,
} from './components/config/CryptoDoggiesConfig';
import doggyidparser from './components/doggyidparser';
import ContractInfo from './components/ContractInfo';
import LoadingSpinner from './components/LoadingSpinner';
import './components/css/cryptodoggies.css';

// Constants
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const GAS_LIMIT = '300000';
const NETWORK_NAMES = {
  1n: 'mainnet',
  5n: 'goerli',
  11155111n: 'sepolia',
  137n: 'polygon',
  80001n: 'mumbai',
  56n: 'bsc',
  97n: 'bsc-testnet',
};

const CryptoDoggies = () => {
  // Core state
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Contract state
  const [owner, setOwner] = useState('');
  const [doggies, setDoggies] = useState([]);
  const [paused, setPaused] = useState(false);

  // Admin inputs
  const [doggyName, setDoggyName] = useState('');
  const [doggyPrice, setDoggyPrice] = useState('');
  const [doggyOwner, setDoggyOwner] = useState('');
  const [newOwnerAddress, setNewOwnerAddress] = useState('');

  // Computed values
  const isOwner = useMemo(
    () => owner && account && owner.toLowerCase() === account.toLowerCase(),
    [owner, account]
  );

  // Helper functions
  const formatAddress = useCallback((address) => {
    if (!address || address.length < 20) return address;
    return `${address.substring(0, 10)}...${address.substring(address.length - 8)}`;
  }, []);

  const replaceAt = useCallback((str, index, replacement) => {
    return str.substring(0, index) + replacement + str.substring(index + replacement.length);
  }, []);

  // Generate doggy image from DNA
  const generateDoggyImage = useCallback((doggyId, size, canvasId) => {
    try {
      const data = doggyidparser(doggyId);
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
            if (color === '#ffffff') color = '#CC6600';
            ctx.fillStyle = color;
            ctx.fillRect(i * size, j * size, size, size);
          }
        }
      }
      return canvas.toDataURL();
    } catch (error) {
      console.error('Error generating doggy image:', error);
      return null;
    }
  }, []);

  // Fetch all tokens from contract
  const fetchTokens = useCallback(
    async (contractInstance, web3Instance) => {
      try {
        if (!contractInstance?.methods?.getAllTokens) {
          toast.warning('Contract ABI incomplete. Token listing unavailable.');
          setDoggies([]);
          return;
        }

        const [allTokens, isPaused] = await Promise.all([
          contractInstance.methods.getAllTokens().call(),
          contractInstance.methods.paused().call().catch(() => false),
        ]);

        const doggiesData = [];
        if (allTokens?.[0]?.length > 0) {
          for (let i = 0; i < allTokens[0].length; i++) {
            doggiesData.push({
              id: i,
              name: allTokens[0][i],
              dna: allTokens[1][i],
              price: web3Instance.utils.fromWei(allTokens[2][i], 'ether'),
              nextPrice: web3Instance.utils.fromWei(allTokens[3][i], 'ether'),
              owner: allTokens[4][i],
            });
          }
        }

        setDoggies(doggiesData);
        setPaused(isPaused);

        // Generate images after render
        if (doggiesData.length > 0) {
          setTimeout(() => {
            doggiesData.forEach((doggy, i) => {
              generateDoggyImage(replaceAt(doggy.dna, 2, '00'), 4, `doggy-canvas-${i}`);
            });
          }, 100);
        }
      } catch (error) {
        console.error('Error fetching tokens:', error);
        if (error.message?.includes('execution reverted')) {
          toast.error('Contract not found. Please switch to the correct network.');
        } else {
          toast.error('Failed to load doggies');
        }
        setDoggies([]);
      }
    },
    [generateDoggyImage, replaceAt]
  );

  // Initialize contract connection
  const initializeContract = useCallback(async () => {
    try {
      const provider = await detectEthereumProvider();
      if (!provider) {
        toast.error('Please install MetaMask!');
        setLoading(false);
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      const [chainId, accounts] = await Promise.all([
        web3Instance.eth.getChainId(),
        web3Instance.eth.getAccounts(),
      ]);

      const networkType = NETWORK_NAMES[chainId] || `chain-${chainId}`;
      const userAccount = accounts[0];

      setNetwork(networkType);
      setAccount(userAccount);

      const contractInstance = new web3Instance.eth.Contract(
        CRYPTODOGGIES_ABI,
        CRYPTODOGGIES_ADDRESS
      );
      setContract(contractInstance);

      const ownerAddress = await contractInstance.methods.owner().call();
      setOwner(ownerAddress);

      await fetchTokens(contractInstance, web3Instance);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing:', error);
      toast.error('Failed to initialize contract');
      setLoading(false);
    }
  }, [fetchTokens]);

  // Setup MetaMask listeners
  useEffect(() => {
    const setupListeners = async () => {
      if (!window.ethereum) return;

      window.ethereum.on('chainChanged', () => window.location.reload());
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) window.location.reload();
      });
    };

    setupListeners();
    initializeContract();

    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('chainChanged', () => {});
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, [initializeContract]);

  // Transaction handler wrapper
  const executeTransaction = useCallback(
    async (method, options = {}, successMsg, errorMsg) => {
      try {
        setSubmitting(true);
        await method
          .send({ from: account, gas: GAS_LIMIT, ...options })
          .on('transactionHash', (hash) => {
            toast.info(`Transaction: ${hash.substring(0, 10)}...`);
          })
          .on('receipt', async () => {
            toast.success(successMsg);
            await fetchTokens(contract, web3);
          });
        return true;
      } catch (error) {
        console.error(errorMsg, error);
        toast.error(`${errorMsg}: ${error.message || 'Unknown error'}`);
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [account, contract, web3, fetchTokens]
  );

  // Handlers
  const handleRefresh = async () => {
    if (!contract || !web3) return;
    await fetchTokens(contract, web3);
    toast.success('Data refreshed!');
  };

  const handleAddDoggy = async (e) => {
    e.preventDefault();
    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!doggyName.trim()) {
      toast.error('Please enter a doggy name');
      return;
    }

    toast.info('Adding doggy. Please confirm in MetaMask...');

    let method;
    if (!doggyPrice || !doggyOwner) {
      method = contract.methods.createToken(doggyName);
    } else {
      const priceInWei = web3.utils.toWei(doggyPrice, 'ether');
      method = contract.methods.createToken(doggyName, doggyOwner, priceInWei);
    }

    const success = await executeTransaction(
      method,
      {},
      'Doggy added successfully!',
      'Failed to add doggy'
    );

    if (success) {
      setDoggyName('');
      setDoggyPrice('');
      setDoggyOwner('');
    }
  };

  const handleBuyDoggy = async (tokenId, price) => {
    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }
    if (paused) {
      toast.error('Sales are currently paused');
      return;
    }

    toast.info('Purchasing doggy. Please confirm in MetaMask...');
    const priceInWei = web3.utils.toWei(price, 'ether');

    await executeTransaction(
      contract.methods.purchase(tokenId),
      { value: priceInWei },
      'Doggy purchased successfully!',
      'Failed to purchase'
    );
  };

  const handlePauseSale = async () => {
    if (!contract || !account) return;

    const action = paused ? 'unpausing' : 'pausing';
    toast.info(`${action.charAt(0).toUpperCase() + action.slice(1)} sale...`);

    const method = paused ? contract.methods.unpause() : contract.methods.pause();
    const success = await executeTransaction(
      method,
      {},
      `Sale ${paused ? 'unpaused' : 'paused'} successfully!`,
      `Failed to ${action}`
    );

    if (success) setPaused(!paused);
  };

  const handleSetOwner = async (e) => {
    e.preventDefault();
    if (!contract || !account || !web3) {
      toast.error('Please connect your wallet');
      return;
    }
    if (!newOwnerAddress.trim() || !web3.utils.isAddress(newOwnerAddress)) {
      toast.error('Invalid address');
      return;
    }

    toast.info('Transferring ownership...');
    const success = await executeTransaction(
      contract.methods.setOwner(newOwnerAddress),
      {},
      'Ownership transferred!',
      'Failed to transfer ownership'
    );

    if (success) {
      setNewOwnerAddress('');
      const ownerAddress = await contract.methods.owner().call();
      setOwner(ownerAddress);
    }
  };

  const handleWithdraw = async () => {
    if (!contract || !account) return;

    toast.info('Withdrawing balance...');
    await executeTransaction(
      contract.methods.withdrawBalance(ZERO_ADDRESS, 0),
      {},
      'Balance withdrawn!',
      'Failed to withdraw'
    );
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner message="Loading CryptoDoggies..." />;
  }

  // Admin View
  if (isOwner) {
    return (
      <div className="cryptodoggies-container">
        <section className="hero-section">
          <div className="hero-content">
            <div className="hero-title-row">
              <h1 className="display-4 fw-bold mb-3">🐾 Doggies Admin</h1>
              <ContractInfo
                contractAddress={CRYPTODOGGIES_ADDRESS}
                contractName="Doggies Shop"
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
            <p className="lead mb-4">Manage your NFT doggies collection</p>
          </div>
        </section>

        <div className="doggies-content">
          {/* Quick Actions */}
          <Card className="admin-actions-card">
            <CardContent>
              <div className="card-header-section">
                <h3>
                  <AdminPanelSettingsIcon className="section-icon" />
                  Quick Actions
                </h3>
              </div>
              <Divider className="divider" />
              <div className="admin-actions">
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  onClick={handleWithdraw}
                  disabled={submitting}
                  startIcon={<AccountBalanceWalletIcon />}
                  className="admin-action-btn"
                >
                  {submitting ? 'Withdrawing...' : 'Withdraw Balance'}
                </Button>
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
                      {paused ? <><PauseIcon /> Sale Paused</> : <><PlayArrowIcon /> Sale Active</>}
                    </span>
                  }
                  className="pause-switch"
                />
              </div>
            </CardContent>
          </Card>

          {/* Transfer Ownership */}
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
                    disabled={submitting || !newOwnerAddress}
                    className="submit-button"
                  >
                    {submitting ? 'Transferring...' : 'Change Owner'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Add New Doggy */}
          <Card className="add-doggy-card">
            <CardContent>
              <h3>
                <AddCircleIcon className="section-icon" />
                Add New Doggy
              </h3>
              <Divider className="divider" />
              <form onSubmit={handleAddDoggy}>
                <div className="form-group">
                  <TextField
                    label="Doggy Name"
                    variant="outlined"
                    fullWidth
                    value={doggyName}
                    onChange={(e) => setDoggyName(e.target.value)}
                    placeholder="Enter doggy name"
                    disabled={submitting}
                    required
                    helperText="Unique name for the doggy (required)"
                  />
                  <TextField
                    label="Price (ETH)"
                    variant="outlined"
                    fullWidth
                    type="number"
                    value={doggyPrice}
                    onChange={(e) => setDoggyPrice(e.target.value)}
                    placeholder="0.0"
                    disabled={submitting}
                    inputProps={{ min: '0', step: 'any' }}
                    helperText="Initial price in ETH (optional)"
                  />
                  <TextField
                    label="Owner Address"
                    variant="outlined"
                    fullWidth
                    value={doggyOwner}
                    onChange={(e) => setDoggyOwner(e.target.value)}
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
                    disabled={submitting || !doggyName}
                    className="submit-button"
                    startIcon={<AddCircleIcon />}
                  >
                    {submitting ? 'Adding...' : 'Add Doggy'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Doggies Table */}
          <Card className="doggies-table-card">
            <CardContent>
              <h3>
                <PetsIcon className="section-icon" />
                All Doggies ({doggies.length})
              </h3>
              <Divider className="divider" />
              {doggies.length > 0 ? (
                <TableContainer component={Paper} className="doggies-table">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>#</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>DNA</TableCell>
                        <TableCell>Price (ETH)</TableCell>
                        <TableCell>Next Price</TableCell>
                        <TableCell>Owner</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {doggies.map((doggy, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{doggy.name}</TableCell>
                          <TableCell className="dna-cell">{doggy.dna}</TableCell>
                          <TableCell>{parseFloat(doggy.price).toFixed(4)}</TableCell>
                          <TableCell>{parseFloat(doggy.nextPrice).toFixed(4)}</TableCell>
                          <TableCell className="address-cell">
                            {formatAddress(doggy.owner)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <div className="empty-state">
                  <PetsIcon className="empty-icon" />
                  <p>No doggies added yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Public Marketplace View
  return (
    <div className="cryptodoggies-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-title-row">
            <h1 className="display-4 fw-bold mb-3">🐾 Doggies Shop</h1>
            <ContractInfo
              contractAddress={CRYPTODOGGIES_ADDRESS}
              contractName="Doggies Shop"
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
            Collect and trade unique NFT doggies on the blockchain
          </p>
        </div>
      </section>

      <div className="doggies-content">
        {paused && (
          <Card className="paused-notice">
            <CardContent>
              <PauseIcon className="pause-icon" />
              <h4>Sales Currently Paused</h4>
              <p>The marketplace is temporarily unavailable. Check back later.</p>
            </CardContent>
          </Card>
        )}

        {doggies.length > 0 ? (
          <Grid container spacing={3}>
            {doggies.map((doggy, index) => {
              const isOwnedByUser = doggy.owner.toLowerCase() === account.toLowerCase();
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card className="doggy-card">
                    <CardMedia className="card-media">
                      <canvas id={`doggy-canvas-${index}`} className="doggy-canvas" />
                    </CardMedia>
                    <CardContent>
                      <div className="doggy-info">
                        <h4>{doggy.name}</h4>
                        <Divider className="divider-small" />

                        <div className="info-row">
                          <span className="info-label">DNA:</span>
                          <span className="info-value dna-text">{doggy.dna}</span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Price:</span>
                          <span className="info-value price-text">
                            {parseFloat(doggy.nextPrice).toFixed(4)} ETH
                          </span>
                        </div>

                        <div className="info-row">
                          <span className="info-label">Owner:</span>
                          <span className="info-value address-text">
                            {formatAddress(doggy.owner)}
                          </span>
                        </div>

                        <Divider className="divider-small" />

                        {isOwnedByUser ? (
                          <Chip label="OWNED" color="success" className="owned-chip" />
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            onClick={() => handleBuyDoggy(index, doggy.nextPrice)}
                            disabled={submitting || paused}
                            startIcon={<ShoppingCartIcon />}
                            className="buy-button"
                          >
                            {submitting ? 'Purchasing...' : 'Buy'}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Card className="empty-state">
            <CardContent>
              <PetsIcon className="empty-icon" />
              <h4>No Doggies Available</h4>
              <p>There are no doggies in the marketplace yet. Check back soon!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CryptoDoggies;
