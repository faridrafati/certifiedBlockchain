import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import Web3 from 'web3';
import { TextField, Button } from '@mui/material';
import { toast } from 'react-toastify';
import detectEthereumProvider from '@metamask/detect-provider';
import { sha256 } from 'js-sha256';
import logoPhoto from './components/images/image007.png';
import certPhoto from './components/images/image008.png';
import { CERTIFICATE_ABI, CERTIFICATE_ADDRESS } from './components/config/CertificateConfig';
import HideShow from './HideShow.jsx';
import LoadingSpinner from './components/LoadingSpinner';
import './components/css/certificate.css';

const Certificate = () => {
  const [web3, setWeb3] = useState(null);
  const [network, setNetwork] = useState('');
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [owner, setOwner] = useState('');
  const [chainId, setChainId] = useState('');
  const [currentAccount, setCurrentAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Certificate state
  const [certificateInput, setCertificateInput] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);
  const [displayedCertificate, setDisplayedCertificate] = useState({
    credentialID: '',
    name: '',
    courseName: '',
    issuingOrganization: '',
    reasonForAward: '',
    issueDate: 0,
    expirationDate: 0,
  });

  // Admin state
  const [formInputs, setFormInputs] = useState({
    name: '',
    courseName: '',
    issuingOrganization: '',
    reasonForAward: '',
    issueDate: '',
    expirationDate: '',
    credentialID: '',
  });
  const [certificateList, setCertificateList] = useState([]);

  // Date formatting functions
  const formatDateTime = (timestamp) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(timestamp * 1000);
  };

  const dateToTimestamp = (dateString) => {
    const dateParts = dateString.split('-');
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    return Math.floor(date.getTime() / 1000);
  };

  const formatDateForInput = (date) => {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  // Hash function for credential ID
  const generateCredentialID = (data) => {
    const hashString =
      data.name +
      data.courseName +
      data.issuingOrganization +
      data.reasonForAward +
      data.issueDate +
      data.expirationDate;
    return sha256(hashString).substring(0, 13);
  };

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

  const getAllCertificates = useCallback(async (contractInstance) => {
    try {
      const numberOfCertificates = await contractInstance.methods.getNumberOfCertificates().call();
      const certificates = [];

      for (let i = 0; i < numberOfCertificates; i++) {
        const cert = await contractInstance.methods.certified(i).call();
        certificates.push(cert);
      }

      setCertificateList(certificates);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to load certificates');
    }
  }, []);

  const initializeContract = useCallback(async () => {
    try {
      const web3Instance = new Web3(Web3.givenProvider || 'http://localhost:8545');
      setWeb3(web3Instance);

      const networkType = await web3Instance.eth.net.getNetworkType();
      const accounts = await web3Instance.eth.getAccounts();
      const userAccount = accounts[0];

      setNetwork(networkType);
      setAccount(userAccount);
      setCurrentAccount(userAccount);

      const contractInstance = new web3Instance.eth.Contract(
        CERTIFICATE_ABI,
        CERTIFICATE_ADDRESS
      );
      setContract(contractInstance);

      // Get owner
      let contractOwner = '';
      const ownerMethods = ['getOwner', 'getOwnerAddress', 'owner'];
      for (const method of ownerMethods) {
        try {
          contractOwner = await contractInstance.methods[method]().call();
          if (contractOwner) break;
        } catch (err) {
          // Method doesn't exist, try next one
        }
      }
      setOwner(contractOwner);

      // Load all certificates
      await getAllCertificates(contractInstance);

      setLoading(false);
    } catch (error) {
      console.error('Error initializing contract:', error);
      toast.error('Failed to initialize smart contract');
      setLoading(false);
    }
  }, [getAllCertificates]);

  useEffect(() => {
    checkMetamask();
    initializeContract();
  }, [checkMetamask, initializeContract]);

  const handleCheckCertificate = async (e) => {
    e.preventDefault();

    if (!contract) {
      toast.error('Contract not initialized');
      return;
    }

    if (!certificateInput.trim()) {
      toast.error('Please enter a credential ID');
      return;
    }

    try {
      setSubmitting(true);
      const foundCertificate = await contract.methods
        .checkCertificate(certificateInput)
        .call();

      if (foundCertificate[0] !== '') {
        setDisplayedCertificate({
          credentialID: foundCertificate[0],
          name: foundCertificate[1],
          courseName: foundCertificate[2],
          issuingOrganization: foundCertificate[3],
          issueDate: foundCertificate[4],
          expirationDate: foundCertificate[5],
          reasonForAward: foundCertificate[6],
        });
        setShowCertificate(true);
        toast.success('Certificate found!');
      } else {
        setShowCertificate(false);
        toast.warning('Certificate not found');
      }
    } catch (error) {
      console.error('Error checking certificate:', error);
      toast.error('Failed to check certificate');
      setShowCertificate(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const newInputs = { ...formInputs, [id]: value };

    // Auto-generate credential ID when form fields change
    if (id !== 'credentialID' && newInputs.name && newInputs.courseName) {
      newInputs.credentialID = generateCredentialID(newInputs);
    }

    setFormInputs(newInputs);
  };

  const handleAddCertificate = async (e) => {
    e.preventDefault();

    if (!contract || !account) {
      toast.error('Please connect your wallet');
      return;
    }

    // Validation
    if (!formInputs.name || !formInputs.courseName || !formInputs.issuingOrganization) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formInputs.issueDate || !formInputs.expirationDate) {
      toast.error('Please select issue and expiration dates');
      return;
    }

    try {
      setSubmitting(true);
      toast.info('Adding certificate. Please confirm in MetaMask...');

      await contract.methods
        .addCertificate(
          formInputs.credentialID,
          formInputs.name,
          formInputs.courseName,
          formInputs.issuingOrganization,
          dateToTimestamp(formInputs.issueDate),
          dateToTimestamp(formInputs.expirationDate),
          formInputs.reasonForAward
        )
        .send({ from: account, gas: '1000000' })
        .on('transactionHash', (hash) => {
          toast.info(`Transaction submitted: ${hash.substring(0, 10)}...`);
        })
        .on('receipt', async () => {
          toast.success('Certificate added successfully!');

          // Reset form
          setFormInputs({
            name: '',
            courseName: '',
            issuingOrganization: '',
            reasonForAward: '',
            issueDate: '',
            expirationDate: '',
            credentialID: '',
          });

          // Reload certificates
          await getAllCertificates(contract);
        })
        .on('error', (error) => {
          console.error('Certificate error:', error);
          toast.error(`Failed to add certificate: ${error.message}`);
        });
    } catch (error) {
      console.error('Add certificate failed:', error);
      toast.error(`Failed to add certificate: ${error.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading certificate system..." />;
  }

  const isOwner = owner.toLowerCase() === account.toLowerCase();

  // Public view - Certificate checker
  if (!isOwner) {
    return (
      <div className="certificate-container">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="display-4 fw-bold mb-3">🎓 Certificate Verification</h1>
            <p className="lead mb-4">
              Verify the authenticity of blockchain-secured certificates
            </p>
            <HideShow
              currentAccount={currentAccount}
              contractAddress={CERTIFICATE_ADDRESS}
              chainId={chainId}
              owner={owner}
            />
          </div>
        </section>

        <div className="certificate-checker">
          <div className="checker-card">
            <h3>🔍 Check Certificate</h3>
            <p className="checker-description">
              Enter the credential ID to verify certificate authenticity
            </p>
            <form onSubmit={handleCheckCertificate}>
              <div className="checker-input-group">
                <TextField
                  id="checkCertificate"
                  label="Credential ID"
                  variant="outlined"
                  fullWidth
                  value={certificateInput}
                  onChange={(e) => setCertificateInput(e.target.value)}
                  placeholder="Enter 13-character credential ID"
                  disabled={submitting}
                />
                <Button
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={submitting || !certificateInput.trim()}
                  className="check-button"
                >
                  {submitting ? 'Checking...' : 'Verify Certificate'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {showCertificate && (
          <div className="certificate-display">
            <div className="certificate-document">
              <div className="certificate-header">
                <h1 className="certificate-title">COURSE CERTIFICATE</h1>
                <img
                  src={logoPhoto}
                  alt="Organization Logo"
                  className="certificate-logo"
                />
              </div>

              <p className="certificate-intro">This is to certify that</p>

              <h2 className="certificate-name">{displayedCertificate.name}</h2>

              <div className="certificate-body">
                <div className="certificate-image-container">
                  <img
                    src={certPhoto}
                    alt="Certificate"
                    className="certificate-image"
                  />
                </div>
                <p className="certificate-reason">
                  {displayedCertificate.reasonForAward}
                </p>
                <h3 className="certificate-course">
                  {displayedCertificate.courseName}
                </h3>
              </div>

              <div className="certificate-footer">
                <p className="certificate-org">
                  {displayedCertificate.issuingOrganization}
                </p>
                <p className="certificate-date">
                  Issued: {formatDateTime(displayedCertificate.issueDate)}
                </p>
                <p className="certificate-date">
                  Expires: {formatDateTime(displayedCertificate.expirationDate)}
                </p>
                <p className="certificate-id">
                  Credential ID: {displayedCertificate.credentialID}
                </p>
                <div className="verified-badge">
                  <span className="verified-icon">✓</span>
                  <span>Blockchain Verified</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showCertificate && certificateInput && !submitting && (
          <div className="no-certificate">
            <div className="no-certificate-icon">❌</div>
            <h3>Certificate Not Found</h3>
            <p>The credential ID you entered does not match any certificate in our system.</p>
          </div>
        )}
      </div>
    );
  }

  // Admin view - Certificate management
  return (
    <div className="certificate-container admin-view">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="display-4 fw-bold mb-3">🎓 Certificate Admin Panel</h1>
          <p className="lead mb-4">Manage and issue blockchain certificates</p>
          <HideShow
            currentAccount={currentAccount}
            contractAddress={CERTIFICATE_ADDRESS}
            chainId={chainId}
            owner={owner}
          />
        </div>
      </section>

      <div className="admin-content">
        <div className="admin-form-card">
          <h3>📝 Add New Certificate</h3>
          <form onSubmit={handleAddCertificate}>
            <div className="form-row">
              <TextField
                id="name"
                label="Name & Family"
                variant="outlined"
                value={formInputs.name}
                onChange={handleInputChange}
                disabled={submitting}
                required
              />
              <TextField
                id="courseName"
                label="Course Name"
                variant="outlined"
                value={formInputs.courseName}
                onChange={handleInputChange}
                disabled={submitting}
                required
              />
              <TextField
                id="issuingOrganization"
                label="Issuing Organization"
                variant="outlined"
                value={formInputs.issuingOrganization}
                onChange={handleInputChange}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-row">
              <TextField
                id="reasonForAward"
                label="Reason For Award"
                variant="outlined"
                fullWidth
                value={formInputs.reasonForAward}
                onChange={handleInputChange}
                disabled={submitting}
                multiline
                rows={2}
              />
            </div>

            <div className="form-row">
              <TextField
                id="issueDate"
                label="Issue Date"
                type="date"
                variant="outlined"
                value={formInputs.issueDate}
                onChange={handleInputChange}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                id="expirationDate"
                label="Expiration Date"
                type="date"
                variant="outlined"
                value={formInputs.expirationDate}
                onChange={handleInputChange}
                disabled={submitting}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                id="credentialID"
                label="Credential ID (Auto-generated)"
                variant="outlined"
                value={formInputs.credentialID}
                InputProps={{ readOnly: true }}
                disabled
              />
            </div>

            <Button
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? 'Adding Certificate...' : 'Add Certificate'}
            </Button>
          </form>
        </div>

        <div className="certificates-table-card">
          <h3>📋 All Certificates</h3>
          {certificateList.length === 0 ? (
            <div className="no-certificates">
              <p>No certificates have been issued yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="certificates-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Credential ID</th>
                    <th>Name</th>
                    <th>Course</th>
                    <th>Organization</th>
                    <th>Reason</th>
                    <th>Issue Date</th>
                    <th>Expiration</th>
                  </tr>
                </thead>
                <tbody>
                  {certificateList.map((cert, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td className="credential-id">{cert.credentialID}</td>
                      <td>{cert.name}</td>
                      <td>{cert.courseName}</td>
                      <td>{cert.issuingOrganization}</td>
                      <td>{cert.reasonForAward}</td>
                      <td>{formatDateTime(cert.issueDate)}</td>
                      <td>{formatDateTime(cert.expirationDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

Certificate.propTypes = {};

export default Certificate;
