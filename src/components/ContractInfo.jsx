import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import { toast } from 'react-toastify';
import './css/ContractInfo.css';

const ContractInfo = ({
  contractAddress,
  contractName = 'Smart Contract',
  network = 'Unknown',
  owner,
  account,
  additionalInfo = [],
}) => {
  const [open, setOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard!`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getNetworkName = (networkId) => {
    const networks = {
      '1': 'Ethereum Mainnet',
      '5': 'Goerli Testnet',
      '11155111': 'Sepolia Testnet',
      '137': 'Polygon Mainnet',
      '80001': 'Mumbai Testnet',
    };
    return networks[networkId] || network || 'Unknown Network';
  };

  const getEtherscanUrl = (address) => {
    const networkId = network;
    const baseUrls = {
      '1': 'https://etherscan.io/address/',
      '5': 'https://goerli.etherscan.io/address/',
      '11155111': 'https://eth-sepolia.blockscout.com/address/',
      '137': 'https://polygonscan.com/address/',
      '80001': 'https://mumbai.polygonscan.com/address/',
    };
    const baseUrl = baseUrls[networkId] || 'https://etherscan.io/address/';

    // For Sepolia Blockscout, add ?tab=contract
    if (networkId === '11155111') {
      return `${baseUrl}${address}?tab=contract`;
    }
    return `${baseUrl}${address}`;
  };

  return (
    <>
      <Tooltip title="Contract Information">
        <IconButton
          onClick={handleOpen}
          className="contract-info-btn"
          size="small"
        >
          <InfoIcon />
        </IconButton>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        className="contract-info-dialog"
        PaperProps={{
          className: 'contract-info-paper',
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="contract-info-title">
          <InfoIcon className="title-icon" />
          {contractName} Information
        </DialogTitle>

        <DialogContent className="contract-info-content">
          <div className="info-section">
            <div className="info-row">
              <span className="info-label">Network</span>
              <Chip
                label={getNetworkName(network)}
                size="small"
                className="network-chip"
                color="primary"
              />
            </div>

            <div className="info-row">
              <span className="info-label">Contract Address</span>
              <div className="info-value-row">
                <a
                  href={getEtherscanUrl(contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="address-link"
                >
                  {truncateAddress(contractAddress)}
                </a>
                <Tooltip title={copiedField === 'Contract' ? 'Copied!' : 'Copy Address'}>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(contractAddress, 'Contract')}
                    className="copy-btn"
                  >
                    {copiedField === 'Contract' ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </div>
            </div>

            {owner && (
              <div className="info-row">
                <span className="info-label">Contract Owner</span>
                <div className="info-value-row">
                  <a
                    href={getEtherscanUrl(owner)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="address-link"
                  >
                    {truncateAddress(owner)}
                  </a>
                  <Tooltip title={copiedField === 'Owner' ? 'Copied!' : 'Copy Address'}>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(owner, 'Owner')}
                      className="copy-btn"
                    >
                      {copiedField === 'Owner' ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            )}

            {account && (
              <div className="info-row">
                <span className="info-label">Your Address</span>
                <div className="info-value-row">
                  <a
                    href={getEtherscanUrl(account)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="address-link"
                  >
                    {truncateAddress(account)}
                  </a>
                  <Tooltip title={copiedField === 'Account' ? 'Copied!' : 'Copy Address'}>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(account, 'Account')}
                      className="copy-btn"
                    >
                      {copiedField === 'Account' ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            )}

            {additionalInfo.map((info, index) => (
              <div className="info-row" key={index}>
                <span className="info-label">{info.label}</span>
                <span className="info-value">{info.value}</span>
              </div>
            ))}
          </div>

          <div className="info-footer">
            <p className="security-note">
              Always verify contract addresses before interacting with them.
            </p>
          </div>
        </DialogContent>

        <DialogActions className="contract-info-actions">
          <Button
            onClick={() => window.open(getEtherscanUrl(contractAddress), '_blank')}
            variant="outlined"
            className="etherscan-btn"
          >
            View on Explorer
          </Button>
          <Button
            onClick={handleClose}
            variant="contained"
            className="close-btn"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContractInfo;
