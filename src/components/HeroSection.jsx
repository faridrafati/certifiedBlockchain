/**
 * @file HeroSection.jsx
 * @description Global hero section component for all dApp pages
 * @author CertifiedBlockchain
 *
 * This component provides a consistent hero section across all dApps with:
 * - Title with optional emoji icon
 * - Subtitle/description text
 * - Contract information display
 * - Refresh button for data updates
 *
 * @example
 * <HeroSection
 *   title="🗳️ Democratic Voting System"
 *   description="Participate in transparent, blockchain-based democratic voting"
 *   contractAddress={VOTING_ADDRESS}
 *   contractName="Voting Contract"
 *   network={network}
 *   owner={owner}
 *   account={account}
 *   onRefresh={handleRefresh}
 * />
 */

import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContractInfo from './ContractInfo';

const HeroSection = ({
  title,
  description,
  contractAddress,
  contractName,
  network = import.meta.env.VITE_NETWORK_ID || '11155111', // Sepolia by default
  owner = '',
  account = '',
  onRefresh = null,
}) => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-title-row">
          <h1 className="display-4 fw-bold mb-3">{title}</h1>
          {contractAddress ? (
            <ContractInfo
              contractAddress={contractAddress}
              contractName={contractName}
              network={network}
              owner={owner}
              account={account}
            />
          ) : (
            <span
              className="badge bg-warning text-dark"
              title={`Set the ${contractName || 'contract'} address in the .env file (VITE_*_ADDRESS) and restart the dev server`}
            >
              ⚠️ Contract not configured
            </span>
          )}
          {onRefresh && (
            <Tooltip title="Refresh Data">
              <IconButton onClick={onRefresh} className="hero-refresh-btn">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
        </div>
        <p className="lead mb-4">{description}</p>

        {/* Network Info */}
        <p className="network-info" style={{ fontSize: '0.9rem', opacity: 0.85, marginTop: '-0.5rem' }}>
          This website works on the <strong>Sepolia testnet</strong>.
          Need test ETH? Get it from the{' '}
          <a
            href="https://sepolia-faucet.pk910.de/#/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Sepolia Faucet
          </a>
        </p>
      </div>
    </section>
  );
};

HeroSection.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  // Undefined when the matching VITE_*_ADDRESS env var is not set
  contractAddress: PropTypes.string,
  contractName: PropTypes.string.isRequired,
  network: PropTypes.string,
  owner: PropTypes.string,
  account: PropTypes.string,
  onRefresh: PropTypes.func,
};

export default HeroSection;
