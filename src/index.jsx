/**
 * @file index.jsx
 * @description Application entry point - React root mounting
 * @author CertifiedBlockchain
 *
 * Main entry point for the CertifiedBlockchain DApp.
 * Configures React root with:
 * - React StrictMode for development warnings
 * - HashRouter for client-side routing (works with static hosting)
 * - Global CSS and Bootstrap imports
 *
 * CSS Imports:
 * - ./components/css/index.css (global styles)
 * - bootstrap/dist/css/bootstrap.css
 * - font-awesome/css/font-awesome.css
 *
 * Note: Uses HashRouter for compatibility with GitHub Pages
 * and other static file hosting services.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';

import './components/css/index.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import 'font-awesome/css/font-awesome.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* future flags opt in to v7 behavior and silence the upgrade warnings */}
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </HashRouter>
  </React.StrictMode>
);
