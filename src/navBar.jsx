import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import './components/css/navbar.css';

const NavBar = () => {
  return (
    <div className="navbar-wrapper">
      <nav className="navbar navbar-dark navbar-expand-lg custom-navbar">
        <div className="container-fluid">
          <Link className="navbar-brand brand-logo" to="/">
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
          </Link>

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

          <div className="collapse navbar-collapse" id="navbarNavAltMarkup">
            <ul className="navbar-nav ms-auto">
              {/* Finance Dropdown */}
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
                </ul>
              </li>

              {/* Governance Dropdown */}
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

              {/* Communication Dropdown */}
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

              {/* Shopping Dropdown */}
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

              {/* Services Dropdown */}
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
