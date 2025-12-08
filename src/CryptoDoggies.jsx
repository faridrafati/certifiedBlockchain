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

const CryptoDoggies = () => {
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
  const [doggies, setDoggies] = useState([]);
  const [paused, setPaused] = useState(false);

  // Admin inputs
  const [doggyName, setDoggyName] = useState('');
  const [doggyPrice, setDoggyPrice] = useState('');
  const [doggyOwner, setDoggyOwner] = useState('');
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
      console.error('Error generating doggy image:', error);
      return null;
    }
  }, []);

  const getAllTokens = useCallback(
    async (contractInstance, web3Instance) => {
      try {
        // Check if getAllTokens method exists in the ABI
        if (!contractInstance.methods.getAllTokens) {
          console.warn('getAllTokens method not available in contract ABI');
          toast.warning('Contract ABI is incomplete. Token listing not available.');
          setDoggies([]);
          return;
        }

        const allTokens = await contractInstance.methods.getAllTokens().call();

        let isPaused = false;
        try {
          isPaused = await contractInstance.methods.paused().call();
        } catch (err) {
          console.warn('Could not get paused status:', err);
        }

        const doggiesData = [];
        if (allTokens && allTokens[0] && allTokens[0].length > 0) {
          for (let i = 0; i < allTokens[0].length; i++) {
            doggiesData.push({
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

        // Generate images after state is set
        if (doggiesData.length > 0) {
          setTimeout(() => {
            for (let i = 0; i < doggiesData.length; i++) {
              generateDoggyImage(
                replaceAt(doggiesData[i].dna, 2, '00'),
                4,
                `doggy-canvas-${i}`
              );
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error getting tokens:', error);
        if (error.message?.includes('execution reverted') || error.message?.includes('call revert')) {
          toast.error('Contract not found on this network. Please switch to the correct network.');
        } else if (error.message?.includes('is not a function')) {
          toast.warning('Contract ABI is incomplete. Please update the ABI configuration.');
        } else {
          toast.error('Failed to load doggies');
        }
        setDoggies([]);
      }
    },
    [generateDoggyImage]
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
        CRYPTODOGGIES_ABI,
        CRYPTODOGGIES_ADDRESS
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
      toast.success('Doggies data refreshed!');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
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

    try {
      setSubmitting(true);

      toast.info('Adding doggy. Please confirm in MetaMask...');

      if (doggyPrice === '' || doggyOwner === '') {
        // Create token with just name
        await contract.methods
          .createToken(doggyName)
          .send({ from: account, gas: '1000000' })
          .on('transactionHash', (hash) => {
            toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
          })
          .on('receipt', async () => {
            toast.success('Doggy added successfully!');
            setDoggyName('');
            setDoggyPrice('');
            setDoggyOwner('');
            await getAllTokens(contract, web3);
          })
          .on('error', (error) => {
            console.error('Add doggy error:', error);
            toast.error(`Failed to add doggy: ${error.message}`);
          });
      } else {
        // Create token with name, owner, and price
        const priceInWei = web3.utils.toWei(doggyPrice, 'ether');
        await contract.methods
          .createToken(doggyName, doggyOwner, priceInWei)
          .send({ from: account, gas: '1000000' })
          .on('transactionHash', (hash) => {
            toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
          })
          .on('receipt', async () => {
            toast.success('Doggy added successfully!');
            setDoggyName('');
            setDoggyPrice('');
            setDoggyOwner('');
            await getAllTokens(contract, web3);
          })
          .on('error', (error) => {
            console.error('Add doggy error:', error);
            toast.error(`Failed to add doggy: ${error.message}`);
          });
      }
    } catch (error) {
      console.error('Add doggy failed:', error);
      toast.error(`Failed to add doggy: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyDoggy = async (index, nextPrice) => {
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

      toast.info('Purchasing doggy. Please confirm in MetaMask...');

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
          toast.success('Doggy purchased successfully!');
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

  const handleWithdraw = async () => {
    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      setSubmitting(true);

      toast.info('Withdrawing balance. Please confirm in MetaMask...');

      await contract.methods
        .withdrawBalance('0x0000000000000000000000000000000000000000', 0)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Balance withdrawn successfully!');
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
    return <LoadingSpinner message="Loading CryptoDoggies..." />;
  }

  const isOwner =
    owner.toLowerCase() === account.toLowerCase() && account !== '';

  return (
    <div className="cryptodoggies-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="display-4 fw-bold mb-3">
            <PetsIcon className="hero-icon" />
            {isOwner ? 'CryptoDoggies - Admin Panel' : 'Doggies Shop'}
          </h1>
          <ContractInfo
            contractAddress={CRYPTODOGGIES_ADDRESS}
            account={account}
            network={import.meta.env.VITE_NETWORK_ID}
          />
          <p className="lead mb-4">
            {isOwner
              ? 'Manage your NFT doggies collection'
              : 'Collect and trade unique NFT doggies on the blockchain'}
          </p>
        </div>
      </section>

      <div className="doggies-content">
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
                      disabled={submitting || doggyName.length === 0}
                      className="submit-button"
                      startIcon={<AddCircleIcon />}
                    >
                      {submitting ? 'Adding Doggy...' : 'Add Doggy'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="doggies-table-card">
              <CardContent>
                <h3>
                  <PetsIcon className="section-icon" />
                  All Doggies
                </h3>

                <Divider className="divider" />

                <TableContainer component={Paper} className="doggies-table">
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
                      {doggies.map((doggy, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{doggy.name}</TableCell>
                          <TableCell className="dna-cell">{doggy.dna}</TableCell>
                          <TableCell>{parseFloat(doggy.price).toFixed(4)}</TableCell>
                          <TableCell>
                            {parseFloat(doggy.nextPrice).toFixed(4)}
                          </TableCell>
                          <TableCell className="address-cell">
                            {doggy.owner.substring(0, 10)}...
                            {doggy.owner.substring(doggy.owner.length - 8)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {doggies.length === 0 && (
                  <div className="empty-state">
                    <PetsIcon className="empty-icon" />
                    <p>No doggies added yet</p>
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
                Doggy Marketplace
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
              {doggies.map((doggy, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card className="doggy-card">
                    <CardMedia className="card-media">
                      <canvas
                        id={`doggy-canvas-${index}`}
                        className="doggy-canvas"
                      />
                    </CardMedia>
                    <CardContent>
                      <div className="doggy-info">
                        <h4>{doggy.name}</h4>

                        <Divider className="divider-small" />

                        <div className="info-row">
                          <span className="info-label">DNA:</span>
                          <span className="info-value dna-text">
                            {doggy.dna}
                          </span>
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
                            {doggy.owner.substring(0, 10)}...
                            {doggy.owner.substring(doggy.owner.length - 8)}
                          </span>
                        </div>

                        <Divider className="divider-small" />

                        {doggy.owner === account ? (
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
              ))}
            </Grid>

            {doggies.length === 0 && (
              <Card className="empty-state">
                <CardContent>
                  <PetsIcon className="empty-icon" />
                  <h4>No Doggies Available</h4>
                  <p>
                    There are no doggies in the marketplace yet. Check back soon!
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

CryptoDoggies.propTypes = {};

export default CryptoDoggies;
