import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import { IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import pets from './components/pets.json';
import { ADOPTION_ABI, ADOPTION_ADDRESS } from './components/config/AdoptionConfig';
import ContractInfo from './components/ContractInfo';
import './components/css/card.css';

// Import all pet images using Vite's import.meta.glob
const petImages = import.meta.glob('./components/images/*.jpeg', { eager: true });

// Helper function to get image URL from pet picture path
const getPetImage = (picturePath) => {
  const fullPath = `./components/${picturePath}`;
  return petImages[fullPath]?.default || '';
};

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const Adoption = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [isMetaMask, setIsMetaMask] = useState(false);
  const [owner, setOwner] = useState('');
  const [adopters, setAdopters] = useState([]);
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [adoptingIndex, setAdoptingIndex] = useState(null);

  // Initialize Web3
  const initWeb = useCallback(async (web3Instance) => {
    try {
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

      return { network: networkType, account: userAccount };
    } catch (error) {
      console.error('Error initializing Web3:', error);
      toast.error('Failed to initialize Web3');
      throw error;
    }
  }, []);

  // Initialize Contract
  const initContract = useCallback(async (web3Instance) => {
    try {
      const contractInstance = new web3Instance.eth.Contract(ADOPTION_ABI, ADOPTION_ADDRESS);
      let contractOwner = '';

      // Try different methods to get owner
      const ownerMethods = ['getOwner', 'getOwnerAddress', 'owner'];
      for (const method of ownerMethods) {
        try {
          contractOwner = await contractInstance.methods[method]().call();
          if (contractOwner) break;
        } catch (err) {
          // Method doesn't exist, try next one
        }
      }

      const isMetaMaskProvider = await web3Instance.currentProvider.isMetaMask;

      setContract(contractInstance);
      setOwner(contractOwner);
      setIsMetaMask(isMetaMaskProvider);

      return contractInstance;
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      throw error;
    }
  }, []);

  // Get all adopters
  const getAllAdopters = useCallback(async (contractInstance, userAccount) => {
    try {
      const adoptersList = await contractInstance.methods
        .getAdopters()
        .call({ from: userAccount });

      setAdopters(adoptersList);
    } catch (error) {
      console.error('Error fetching adopters:', error);
      toast.error('Failed to fetch adoption status');
    }
  }, []);

  // Check MetaMask and setup listeners
  const checkMetamask = useCallback(async () => {
    try {
      const { ethereum } = window;
      const provider = await detectEthereumProvider();

      if (!provider) {
        toast.error('Please install MetaMask!');
        setLoading(false);
        return;
      }

      // Get chain ID
      const chain = await ethereum.request({ method: 'eth_chainId' });
      setChainId(chain);

      // Setup chain change listener
      ethereum.on('chainChanged', (newChainId) => {
        setChainId(newChainId);
        window.location.reload();
      });

      // Setup account change listener
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

  // Initialize everything
  const initialize = useCallback(async () => {
    try {
      setLoading(true);

      if (!window.ethereum) {
        toast.error('Please install MetaMask to use this application');
        setLoading(false);
        return;
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      await checkMetamask();
      await initWeb(web3Instance);
      const contractInstance = await initContract(web3Instance);
      const accounts = await web3Instance.eth.getAccounts();
      await getAllAdopters(contractInstance, accounts[0]);

      setLoading(false);
    } catch (error) {
      console.error('Error during initialization:', error);
      setLoading(false);
    }
  }, [checkMetamask, initWeb, initContract, getAllAdopters]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Refresh adoption data
  const handleRefresh = async () => {
    if (!contract || !account) return;
    try {
      await getAllAdopters(contract, account);
      toast.success('Refreshed successfully!');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  // Adopt a pet
  const handleAdopt = async (petIndex) => {
    if (!contract || !account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (adopters[petIndex] !== ZERO_ADDRESS) {
      toast.warning('This pet is already adopted');
      return;
    }

    try {
      setAdoptingIndex(petIndex);

      toast.info('Adoption transaction initiated. Please confirm in MetaMask...');

      await contract.methods
        .adopt(petIndex)
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', (receipt) => {
          toast.success('Adoption successful! Congratulations on your new pet!');
          getAllAdopters(contract, account);
        })
        .on('error', (error) => {
          console.error('Adoption error:', error);
          toast.error(`Adoption failed: ${error.message}`);
        });
    } catch (error) {
      console.error('Adoption failed:', error);
      toast.error(`Adoption failed: ${error.message || 'Unknown error'}`);
    } finally {
      setAdoptingIndex(null);
    }
  };

  // Get button state
  const getButtonState = (petIndex) => {
    const petAdopter = adopters[petIndex];

    if (adoptingIndex === petIndex) {
      return { className: 'warning', text: 'Adopting...', disabled: true };
    }

    if (petAdopter === ZERO_ADDRESS) {
      return { className: 'primary', text: 'Adopt Me', disabled: false };
    }

    if (account && petAdopter.toLowerCase() === account.toLowerCase()) {
      return { className: 'success', text: 'You Own This Pet', disabled: true };
    }

    return { className: 'secondary', text: 'Already Adopted', disabled: true };
  };

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading pets...</p>
      </div>
    );
  }

  return (
    <div className="container adoption-container">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-title-row">
            <h1 className="display-4 fw-bold mb-3">Pet Adoption DApp</h1>
            <ContractInfo
              contractAddress={ADOPTION_ADDRESS}
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
            Each adoption is secured by smart contracts.
          </p>
        </div>
      </section>

      <div className="pets-grid">
        {pets.map((pet, index) => {
          const buttonState = getButtonState(index);

          return (
            <div key={pet.id} className="pet-card">
              <div className="pet-card-header">
                <h5 className="pet-name">{pet.name}</h5>
                {adopters[index] && adopters[index] !== ZERO_ADDRESS && (
                  <span className="badge bg-success">Adopted</span>
                )}
              </div>

              <div className="pet-image-container">
                <img
                  src={getPetImage(pet.picture)}
                  className="pet-image"
                  alt={pet.name}
                  loading="lazy"
                />
              </div>

              <div className="pet-card-body">
                <div className="pet-info">
                  <div className="info-row">
                    <span className="info-label">Breed:</span>
                    <span className="info-value">{pet.breed}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Age:</span>
                    <span className="info-value">{pet.age} {pet.age === 1 ? 'Year' : 'Years'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Location:</span>
                    <span className="info-value">{pet.location}</span>
                  </div>
                </div>

                <button
                  className={`btn btn-${buttonState.className} w-100 mt-3 adopt-btn`}
                  onClick={() => handleAdopt(index)}
                  disabled={buttonState.disabled}
                >
                  {adoptingIndex === index && (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  )}
                  {buttonState.text}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

Adoption.propTypes = {
  // No props needed for this component
};

export default Adoption;
