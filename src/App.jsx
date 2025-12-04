import React, { useState, useEffect } from 'react';
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
import ChatBox from './chatBoxPlus';
import ChatBoxStable from './chatBoxStable';
import Voting from './Voting';
import WeightedVoting from './WeightedVoting';
import DappToken from './dappToken';
import DappTokenSale from './dappTokenSale';
import TicketSale from './TicketSale';

function App() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [chainId, setChainId] = useState('');
  const [message, setMessage] = useState('Please Wait');
  const [buttonName, setButtonName] = useState('Ok');
  const [modalNeed, setModalNeed] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkMetamask();
  }, []);

  const startApp = (provider) => {
    if (provider !== window.ethereum) {
      console.error('Multiple wallets detected. Please use only one.');
      toast.warning('Multiple wallets detected. Please disable other wallets and use only MetaMask.');
    }
  };

  const checkMetamask = async () => {
    try {
      const { ethereum } = window;

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

      ethereum.on('chainChanged', (newChainId) => {
        handleChainChanged(newChainId);
        window.location.reload();
      });

      // Handle account changes
      try {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        handleAccountsChanged(accounts);
      } catch (err) {
        console.error('Error fetching accounts:', err);
      }

      ethereum.on('accountsChanged', (accounts) => {
        handleAccountsChanged(accounts);
        window.location.reload();
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error checking MetaMask:', error);
      toast.error('Error initializing application');
      setIsLoading(false);
    }
  };

  const handleChainChanged = (newChainId) => {
    setChainId(newChainId);
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setButtonName('Connect');
      setMessage('Please connect to MetaMask!');
      setCurrentAccount(null);
      setModalNeed(true);
    } else {
      setButtonName('');
      if (accounts[0] !== currentAccount) {
        setCurrentAccount(accounts[0]);
        setButtonName('Refresh');
        setMessage(`Your Account Address is: ${accounts[0]}`);
        setModalNeed(false);
      }
    }
  };

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
      toast.success('Successfully connected to MetaMask!');
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

  if (isLoading) {
    return <LoadingSpinner message="Initializing Web3 Application..." />;
  }

  return (
    <div className="app-container">
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

      {modalNeed ? (
        <div className="fade-in">
          <ModalForm
            message={message}
            buttonName={buttonName}
            onClick={onClickConnect}
          />
        </div>
      ) : (
        <div className="fade-in">
          <NavBar />
          <main className="container mt-4">
            <Routes>
              <Route path="/petAdoption" element={<Adoption />} />
              <Route path="/token" element={<DappToken />} />
              <Route path="/crowdSale" element={<DappTokenSale />} />
              <Route path="/voting" element={<Voting />} />
              <Route path="/weightedVoting" element={<WeightedVoting />} />
              <Route path="/chat" element={<Email />} />
              <Route path="/chatBox" element={<ChatBox />} />
              <Route path="/chatBoxStable" element={<ChatBoxStable />} />
              <Route path="/todo" element={<Task />} />
              <Route path="/auction" element={<Auction />} />
              <Route path="/certificate" element={<Certificate />} />
              <Route path="/pollSurvey" element={<Poll />} />
              <Route path="/doggiesShop" element={<CryptoDoggies />} />
              <Route path="/guessing" element={<GuessingGame />} />
              <Route path="/ticketSale" element={<TicketSale />} />
              <Route path="/not-found" element={<NotFound />} />
              <Route path="/" element={<Navigate to="/token" replace />} />
              <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Routes>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
