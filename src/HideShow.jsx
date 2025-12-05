import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Collapse } from 'react-bootstrap';
import './components/css/hideshow.css';

const CHAIN_CONFIGS = [
  { chainId: '0x5', chainName: 'Goerli', explorerUrl: 'https://goerli.etherscan.io' },
  { chainId: '0x1', chainName: 'Mainnet', explorerUrl: 'https://etherscan.io' },
  { chainId: '0xaa36a7', chainName: 'Sepolia', explorerUrl: 'https://eth-sepolia.blockscout.com' },
  { chainId: '1337', chainName: 'Ganache', explorerUrl: null },
  { chainId: '31337', chainName: 'Hardhat', explorerUrl: null },
];

const HideShow = ({ owner = undefined, currentAccount = undefined, contractAddress = undefined, chainId = undefined }) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleCollapse = () => {
    setIsVisible((prev) => !prev);
  };

  const chainInfo = useMemo(() => {
    const normalizedOwner = owner?.toLowerCase();
    const normalizedAccount = currentAccount?.toLowerCase();
    const isOwner = normalizedOwner === normalizedAccount;

    const chain = CHAIN_CONFIGS.find((c) => c.chainId === chainId) || {
      chainId: chainId || 'Unknown',
      chainName: 'Unknown Network',
      explorerUrl: null,
    };

    // Build explorer URLs based on chain
    let accountUrl = null;
    let contractUrl = null;

    if (chain.explorerUrl) {
      accountUrl = `${chain.explorerUrl}/address/${currentAccount}`;
      // Use ?tab=contract for Blockscout (Sepolia), #readContract for Etherscan
      if (chain.explorerUrl.includes('blockscout')) {
        contractUrl = `${chain.explorerUrl}/address/${contractAddress}?tab=contract`;
      } else {
        contractUrl = `${chain.explorerUrl}/address/${contractAddress}#readContract`;
      }
    }

    return {
      chain,
      isOwner,
      accountUrl,
      contractUrl,
      normalizedAccount,
    };
  }, [owner, currentAccount, contractAddress, chainId]);

  return (
    <div className="contract-info-wrapper">
      <button
        className="contract-info-toggle"
        onClick={toggleCollapse}
        aria-expanded={isVisible}
        aria-controls="collapsePanel"
      >
        <span className="toggle-icon">{isVisible ? '−' : '+'}</span>
        <span className="toggle-text">Contract Information</span>
      </button>

      <Collapse in={isVisible}>
        <div id="collapsePanel" className="contract-info-panel">
          <div className="info-card">
            <div className="info-item">
              <div className="info-icon network-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                  <circle cx="10" cy="10" r="4" fill="currentColor" />
                </svg>
              </div>
              <div className="info-content">
                <span className="info-label">Network</span>
                <span className="info-value">
                  {chainInfo.chain.chainName}
                  <span className="chain-id-badge">{chainInfo.chain.chainId}</span>
                </span>
              </div>
            </div>

            {currentAccount && (
              <div className="info-item">
                <div className="info-icon wallet-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6C2 4.89543 2.89543 4 4 4H16C17.1046 4 18 4.89543 18 6V14C18 15.1046 17.1046 16 16 16H4C2.89543 16 2 15.1046 2 14V6Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="14" cy="10" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <div className="info-content">
                  <span className="info-label">
                    Your Address
                    {chainInfo.isOwner && <span className="owner-badge">Contract Owner</span>}
                  </span>
                  <a
                    className="info-value info-link"
                    href={chainInfo.accountUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {`${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`}
                    <span className="external-link-icon">↗</span>
                  </a>
                </div>
              </div>
            )}

            {contractAddress && (
              <div className="info-item">
                <div className="info-icon contract-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="14"
                      height="14"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path d="M7 8H13M7 12H13" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <div className="info-content">
                  <span className="info-label">Contract Address</span>
                  <a
                    className="info-value info-link"
                    href={chainInfo.contractUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {`${contractAddress.substring(0, 6)}...${contractAddress.substring(38)}`}
                    <span className="external-link-icon">↗</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </Collapse>
    </div>
  );
};

HideShow.propTypes = {
  owner: PropTypes.string,
  currentAccount: PropTypes.string,
  contractAddress: PropTypes.string,
  chainId: PropTypes.string,
};

export default HideShow;
