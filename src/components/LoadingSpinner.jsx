/**
 * @file LoadingSpinner.jsx
 * @description Reusable loading spinner component with customizable message
 * @author CertifiedBlockchain
 *
 * A centered loading indicator with animated spinner and optional message.
 * Used throughout the application for loading states during async operations.
 *
 * CSS: ./css/LoadingSpinner.css
 */

import React from 'react';
import './css/LoadingSpinner.css';

/**
 * Loading Spinner Component
 *
 * Displays a full-screen or container-filling loading indicator
 * with an animated spinner and customizable message.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.message='Loading...'] - Message to display below the spinner
 *
 * @returns {JSX.Element} Loading spinner with message
 *
 * @example
 * // Default message
 * <LoadingSpinner />
 *
 * @example
 * // Custom message
 * <LoadingSpinner message="Initializing Web3 Application..." />
 *
 * @example
 * // Loading contract data
 * <LoadingSpinner message="Fetching data from blockchain..." />
 */
const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="loading-container">
      <div className="loading-spinner-wrapper">
        {/* Animated spinner with inner circle */}
        <div className="loading-spinner">
          <div className="loading-spinner-middle"></div>
        </div>
        {/* Customizable loading message */}
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
