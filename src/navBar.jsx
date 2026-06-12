/**
 * @file navBar.jsx
 * @description Navigation bar component for the CertifiedBlockchain DApp
 * @author CertifiedBlockchain
 *
 * A responsive navigation component that provides access to all DApp features
 * organized into categorized dropdown menus.
 *
 * Categories:
 * - Finance: Token Wallet, CrowdSale, DEX Exchange, Auction, Ticket Sale
 * - Governance: Voting, Weighted Voting, Poll Survey
 * - Communication: Blockchain Email, Chat Box
 * - Shopping: Pet Adoption, Crypto Doggies NFT
 * - Services: Certificate, Task Manager
 * - Games: Guessing Game
 *
 * Features:
 * - Responsive design (mobile hamburger menu)
 * - Custom branded logo
 * - Bootstrap-based dropdowns
 * - Active link highlighting via NavLink
 */

import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { IconButton, Popover, Box, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import 'bootstrap/dist/css/bootstrap.css';
import './components/css/navbar.css';

/**
 * Navigation Bar Component
 *
 * Renders the main navigation bar with dropdown menus for all DApp features.
 * Uses Bootstrap for responsive behavior and React Router for navigation.
 *
 * @component
 * @returns {JSX.Element} The navigation bar component
 *
 * @example
 * <NavBar />
 */
const NavBar = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  // On phones the Bootstrap collapse stays expanded after tapping a link,
  // covering the page content. Collapse it whenever a menu item is chosen.
  const closeMobileMenu = (event) => {
    if (!event.target.closest('.dropdown-item')) return;
    const nav = document.getElementById('navbarNavAltMarkup');
    if (nav?.classList.contains('show')) {
      nav.classList.remove('show');
      document
        .querySelector('.navbar-toggler')
        ?.setAttribute('aria-expanded', 'false');
    }
  };

  const handleInfoClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <div className="navbar-wrapper">
      <nav className="navbar navbar-dark navbar-expand-lg custom-navbar">
        <div className="container-fluid">
          {/* Brand Logo and Name */}
          <Link className="navbar-brand brand-logo" to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Custom SVG Logo */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="brand-icon"
            >
              <rect width="32" height="32" rx="8" fill="url(#gradient)" />
              <path
                d="M16 8L20 12L16 16L12 12L16 8Z"
                fill="white"
                opacity="0.9"
              />
              <path
                d="M16 16L20 20L16 24L12 20L16 16Z"
                fill="white"
                opacity="0.7"
              />
              <defs>
                <linearGradient
                  id="gradient"
                  x1="0"
                  y1="0"
                  x2="32"
                  y2="32"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#667eea" />
                  <stop offset="1" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </svg>
            <span className="brand-text">Blockchain DApp</span>
            <IconButton
              onClick={handleInfoClick}
              size="small"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                padding: '4px',
                marginLeft: '-4px',
                '&:hover': {
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <InfoOutlinedIcon fontSize="small" />
            </IconButton>
          </Link>

          {/* Info Popover */}
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handleInfoClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            sx={{
              '& .MuiPopover-paper': {
                borderRadius: '16px',
                boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                overflow: 'visible',
                mt: 1.5,
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                border: '2px solid rgba(102, 126, 234, 0.5)'
              }
            }}
          >
            <Box sx={{ p: 3, minWidth: '280px' }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 2,
                  fontWeight: 700,
                  color: '#fff',
                  fontSize: '1.1rem',
                  textAlign: 'center',
                  letterSpacing: '0.5px'
                }}
              >
                🌐 Connect with us
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  component="a"
                  href="https://www.linkedin.com/in/rafati-amir"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    padding: '14px 16px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: '#fff',
                    background: 'linear-gradient(135deg, #0077b5 0%, #005885 100%)',
                    boxShadow: '0 4px 12px rgba(0, 119, 181, 0.3)',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: '0 8px 24px rgba(0, 119, 181, 0.5)',
                      background: 'linear-gradient(135deg, #0088cc 0%, #006699 100%)'
                    }
                  }}
                >
                  <LinkedInIcon sx={{ fontSize: 28, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.2 }}>
                      LinkedIn
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.9, lineHeight: 1.2 }}>
                      Professional Profile
                    </Typography>
                  </Box>
                </Box>
                <Box
                  component="a"
                  href="https://github.com/faridrafati/certifiedBlockchain"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    padding: '14px 16px',
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: '#fff',
                    background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    '&:hover': {
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                      background: 'linear-gradient(135deg, #444 0%, #2a2a2a 100%)'
                    }
                  }}
                >
                  <GitHubIcon sx={{ fontSize: 28, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.2 }}>
                      GitHub
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', opacity: 0.9, lineHeight: 1.2 }}>
                      Source Code Repository
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Popover>

          {/* Mobile Toggle Button */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNavAltMarkup"
            aria-controls="navbarNavAltMarkup"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Collapsible Navigation Menu */}
          <div
            className="collapse navbar-collapse"
            id="navbarNavAltMarkup"
            onClick={closeMobileMenu}
          >
            <ul className="navbar-nav ms-auto">

              {/* Finance Dropdown - Token, CrowdSale, Auction, Tickets */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="financeDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="nav-icon">💰</span>
                  Finance
                </a>
                <ul className="dropdown-menu" aria-labelledby="financeDropdown">
                  <li>
                    <NavLink className="dropdown-item" to="/token">
                      <span className="dropdown-icon">👛</span>
                      Tokens Wallet
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/crowdSale">
                      <span className="dropdown-icon">🚀</span>
                      Token CrowdSale
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/exchange">
                      <span className="dropdown-icon">🔄</span>
                      DEX Exchange
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/auction">
                      <span className="dropdown-icon">⚡</span>
                      Auction
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/ticketSale">
                      <span className="dropdown-icon">🎟️</span>
                      Ticket Sale
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/tokenforge">
                      <span className="dropdown-icon">🏭</span>
                      Token Generator
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* Governance Dropdown - Voting Systems */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="governanceDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="nav-icon">🗳️</span>
                  Governance
                </a>
                <ul className="dropdown-menu" aria-labelledby="governanceDropdown">
                  <li>
                    <NavLink className="dropdown-item" to="/voting">
                      <span className="dropdown-icon">✅</span>
                      Democratic Voting
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/weightedVoting">
                      <span className="dropdown-icon">⚖️</span>
                      Weighted Voting
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/pollSurvey">
                      <span className="dropdown-icon">📊</span>
                      Poll Survey
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* Communication Dropdown - Email and Chat */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="communicationDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="nav-icon">💬</span>
                  Communication
                </a>
                <ul className="dropdown-menu" aria-labelledby="communicationDropdown">
                  <li>
                    <NavLink className="dropdown-item" to="/chat">
                      <span className="dropdown-icon">📧</span>
                      Blockchain Email
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/chatBoxStable">
                      <span className="dropdown-icon">💬</span>
                      Chat Box
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* Shopping Dropdown - Pet Adoption and NFT Shop */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="shoppingDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="nav-icon">🛒</span>
                  Shopping
                </a>
                <ul className="dropdown-menu" aria-labelledby="shoppingDropdown">
                  <li>
                    <NavLink className="dropdown-item" to="/petAdoption">
                      <span className="dropdown-icon">🐕</span>
                      Pet Adoption
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/doggiesShop">
                      <span className="dropdown-icon">🐶</span>
                      Crypto Doggies
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* Services Dropdown - Certificate and Task Management */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="servicesDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="nav-icon">📋</span>
                  Services
                </a>
                <ul className="dropdown-menu" aria-labelledby="servicesDropdown">
                  <li>
                    <NavLink className="dropdown-item" to="/certificate">
                      <span className="dropdown-icon">🎓</span>
                      Certificate
                    </NavLink>
                  </li>
                  <li>
                    <NavLink className="dropdown-item" to="/todo">
                      <span className="dropdown-icon">✓</span>
                      Task Manager
                    </NavLink>
                  </li>
                </ul>
              </li>

              {/* Games Dropdown */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  id="gamesDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <span className="nav-icon">🎮</span>
                  Games
                </a>
                <ul className="dropdown-menu" aria-labelledby="gamesDropdown">
                  <li>
                    <NavLink className="dropdown-item" to="/guessing">
                      <span className="dropdown-icon">🎯</span>
                      Guessing Game
                    </NavLink>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
