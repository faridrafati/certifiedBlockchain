/**
 * @file App.jsx
 * @description Main application component for the CertifiedBlockchain DApp
 * @author CertifiedBlockchain
 *
 * This is the root component of the decentralized application (DApp).
 * It handles MetaMask wallet connection, account management, and routing
 * to all blockchain-based features.
 *
 * Features:
 * - MetaMask wallet detection and connection
 * - Account change handling (lock/unlock, account switch)
 * - Chain/network change detection
 * - Modal for wallet connection states
 * - Toast notifications for user feedback
 * - Routing to all blockchain components
 *
 * Routes:
 * - /token: DappToken wallet
 * - /crowdSale: Token sale interface
 * - /voting: Democratic voting system
 * - /weightedVoting: Weighted voting system
 * - /chat: Blockchain email
 * - /chatBoxStable: Chat application
 * - /todo: Task manager
 * - /auction: Auction platform
 * - /certificate: Certificate verification
 * - /pollSurvey: Poll/survey system
 * - /doggiesShop: NFT marketplace
 * - /guessing: Guessing game
 * - /petAdoption: Pet adoption tracker
 * - /ticketSale: Event ticketing
 */

import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import detectEthereumProvider from '@metamask/detect-provider';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './components/css/App.css';
import ModalForm from './modalForm';
import NavBar from './navBar';
import NotFound from './notFound';
import LoadingSpinner from './components/LoadingSpinner';

// Import all blockchain components
import Adoption from './adoption';
import Auction from './Auction';
import Certificate from './Certificate';
import GuessingGame from './GuessingGame';
import Task from './Task';
import Poll from './Poll';
import Email from './Email';
import CryptoDoggies from './CryptoDoggies';
import ChatBoxStable from './chatBoxStable';
import Voting from './Voting';
import WeightedVoting from './WeightedVoting';
import DappToken from './dappToken';
import DappTokenSale from './dappTokenSale';
import TicketSale from './TicketSale';

/**
 * Main Application Component
 *
 * @component
 * @returns {JSX.Element} The main application with routing and wallet connection
 *
 * @example
 * // In index.jsx
 * <BrowserRouter>
 *   <App />
 * </BrowserRouter>
 */
function App() {
  // State for wallet connection and UI
  const [currentAccount, setCurrentAccount] = useState(null);
  const [chainId, setChainId] = useState('');
  const [message, setMessage] = useState('Please Wait');
  const [buttonName, setButtonName] = useState('Ok');
  const [modalNeed, setModalNeed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Ref to prevent duplicate toast notifications
  const hasShownConnectedToast = useRef(false);

  // Initialize MetaMask connection on component mount
  useEffect(() => {
    checkMetamask();
  }, []);

  /**
   * Periodic check for wallet lock status
   * Some MetaMask versions don't fire events reliably when wallet is locked
   */
  useEffect(() => {
    if (!modalNeed && currentAccount) {
      const checkWalletStatus = async () => {
        try {
          const { ethereum } = window;
          if (ethereum) {
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length === 0) {
              // Wallet was locked
              handleAccountsChanged(accounts, false);
            }
          }
        } catch (err) {
          console.error('Error checking wallet status:', err);
        }
      };

      // Check every 3 seconds
      const intervalId = setInterval(checkWalletStatus, 3000);
      return () => clearInterval(intervalId);
    }
  }, [modalNeed, currentAccount]);

  /**
   * Initializes the application with the detected provider
   * Warns user if multiple wallets are detected
   * @param {Object} provider - The detected Ethereum provider
   */
  const startApp = (provider) => {
    if (provider !== window.ethereum) {
      console.error('Multiple wallets detected. Please use only one.');
      toast.warning('Multiple wallets detected. Please disable other wallets and use only MetaMask.');
    }
  };

  /**
   * Main MetaMask detection and initialization function
   * Checks for MetaMask, sets up event listeners for account/chain changes
   */
  const checkMetamask = async () => {
    try {
      const { ethereum } = window;

      // Check if MetaMask is installed
      if (!ethereum) {
        setButtonName('Install');
        setMessage('1. Please install MetaMask first!\n2. Then connect app to MetaMask.');
        setIsLoading(false);
        return;
      }

      const provider = await detectEthereumProvider();

      if (provider) {
        startApp(provider);
        setButtonName('');
      } else {
        setButtonName('Install');
        setMessage('1. Please install MetaMask first!\n2. Then connect app to MetaMask.');
        setIsLoading(false);
        return;
      }

      // Handle chain changes
      try {
        const chainIdResult = await ethereum.request({ method: 'eth_chainId' });
        handleChainChanged(chainIdResult);
      } catch (err) {
        console.error('Error fetching chain ID:', err);
      }

      // Listen for chain/network changes (will reload page)
      ethereum.on('chainChanged', (newChainId) => {
        handleChainChanged(newChainId);
        window.location.reload();
      });

      // Handle account changes
      try {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        handleAccountsChanged(accounts, true); // Initial check
      } catch (err) {
        console.error('Error fetching accounts:', err);
      }

      // Listen for account changes (wallet lock/unlock, account switch)
      ethereum.on('accountsChanged', (accounts) => {
        handleAccountsChanged(accounts, false);
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error checking MetaMask:', error);
      toast.error('Error initializing application');
      setIsLoading(false);
    }
  };

  /**
   * Handles blockchain network/chain changes
   * @param {string} newChainId - The new chain ID in hex format
   */
  const handleChainChanged = (newChainId) => {
    setChainId(newChainId);
  };

  /**
   * Handles account changes from MetaMask
   * Manages wallet lock/unlock states and account switching
   *
   * @param {string[]} accounts - Array of connected account addresses
   * @param {boolean} isInitialCheck - True if this is the initial connection check
   */
  const handleAccountsChanged = (accounts, isInitialCheck = false) => {
    if (accounts.length === 0) {
      // Wallet is locked or disconnected
      const wasConnected = currentAccount !== null;
      setCurrentAccount(null);
      setModalNeed(true);
      hasShownConnectedToast.current = false;

      if (wasConnected || !isInitialCheck) {
        // User was connected but locked their wallet - show Login
        setButtonName('Login');
        setMessage('Your wallet is locked. Please unlock MetaMask and login to continue.');
      } else {
        // Initial state - user never connected
        setButtonName('Connect');
        setMessage('Please connect to MetaMask!');
      }
    } else {
      const newAccount = accounts[0];
      if (newAccount !== currentAccount) {
        setCurrentAccount(newAccount);
        setModalNeed(false);

        // Only show toast once to prevent duplicate toasts on page load
        if (!hasShownConnectedToast.current) {
          toast.success('Wallet connected successfully!');
          hasShownConnectedToast.current = true;
        }
      }
    }
  };

  /**
   * Handles the connect/login button click
   * Requests MetaMask to connect accounts
   */
  const onClickConnect = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      toast.error('MetaMask is not installed!');
      return;
    }

    try {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setCurrentAccount(account);
      setModalNeed(false);
      // Toast is handled by handleAccountsChanged listener
    } catch (err) {
      if (err.code === 4001) {
        console.log('Please connect to MetaMask.');
        toast.warning('Connection request rejected.');
      } else {
        console.error(err);
        toast.error('Error connecting to MetaMask.');
      }
    }
  };

  // Show loading spinner while initializing
  if (isLoading) {
    return <LoadingSpinner message="Initializing Web3 Application..." />;
  }

  return (
    <div className="app-container">
      {/* Toast notifications container */}
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {/* Wallet connection modal */}
      {modalNeed && (
        <div className="fade-in">
          <ModalForm
            message={message}
            buttonName={buttonName}
            onClick={onClickConnect}
          />
        </div>
      )}

      {/* Main application content */}
      <div className={`fade-in app-content ${modalNeed ? 'blurred-content' : ''}`}>
        <NavBar />
        <main className="container mt-4">
          <Routes>
            {/* Finance Routes */}
            <Route path="/token" element={<DappToken />} />
            <Route path="/crowdSale" element={<DappTokenSale />} />
            <Route path="/auction" element={<Auction />} />
            <Route path="/ticketSale" element={<TicketSale />} />

            {/* Governance Routes */}
            <Route path="/voting" element={<Voting />} />
            <Route path="/weightedVoting" element={<WeightedVoting />} />
            <Route path="/pollSurvey" element={<Poll />} />

            {/* Communication Routes */}
            <Route path="/chat" element={<Email />} />
            <Route path="/chatBox" element={<Navigate to="/chatBoxStable" replace />} />
            <Route path="/chatBoxStable" element={<ChatBoxStable />} />

            {/* Shopping Routes */}
            <Route path="/petAdoption" element={<Adoption />} />
            <Route path="/doggiesShop" element={<CryptoDoggies />} />

            {/* Services Routes */}
            <Route path="/certificate" element={<Certificate />} />
            <Route path="/todo" element={<Task />} />

            {/* Games Routes */}
            <Route path="/guessing" element={<GuessingGame />} />

            {/* Utility Routes */}
            <Route path="/not-found" element={<NotFound />} />
            <Route path="/" element={<Navigate to="/token" replace />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
