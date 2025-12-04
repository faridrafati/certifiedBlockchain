import React from 'react';
import { Link } from 'react-router-dom';
import './components/css/notFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-animation">
          <div className="error-number">
            <span className="four">4</span>
            <span className="zero">
              <svg
                width="120"
                height="120"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="55"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray="20 10"
                  className="rotating-circle"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0"
                    y1="0"
                    x2="120"
                    y2="120"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#667eea" />
                    <stop offset="1" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="four">4</span>
          </div>

          <div className="floating-elements">
            <div className="floating-box box-1"></div>
            <div className="floating-box box-2"></div>
            <div className="floating-box box-3"></div>
            <div className="floating-box box-4"></div>
          </div>
        </div>

        <h1 className="error-title">Page Not Found</h1>

        <p className="error-message">
          Oops! The page you're looking for has wandered off into the blockchain.
          It might have been moved, deleted, or never existed in the first place.
        </p>

        <div className="error-suggestions">
          <h3 className="suggestions-title">Here's what you can do:</h3>
          <ul className="suggestions-list">
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor"/>
              </svg>
              <span>Check the URL for typos</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor"/>
              </svg>
              <span>Use the navigation menu above</span>
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L12 8L18 10L12 12L10 18L8 12L2 10L8 8L10 2Z" fill="currentColor"/>
              </svg>
              <span>Return to the home page</span>
            </li>
          </ul>
        </div>

        <div className="action-buttons">
          <Link to="/" className="btn btn-home">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 10L10 3L17 10M5 8V17H8V13H12V17H15V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Go Home
          </Link>

          <button onClick={() => window.history.back()} className="btn btn-back">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5L3 10L8 15M3 10H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Go Back
          </button>
        </div>

        <div className="popular-links">
          <p className="popular-title">Popular Pages:</p>
          <div className="link-grid">
            <Link to="/petAdoption" className="quick-link">
              🐕 Pet Adoption
            </Link>
            <Link to="/token" className="quick-link">
              💰 Tokens
            </Link>
            <Link to="/voting" className="quick-link">
              🗳️ Voting
            </Link>
            <Link to="/auction" className="quick-link">
              ⚡ Auction
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
