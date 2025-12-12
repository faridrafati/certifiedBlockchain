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
import reportWebVitals from './reportWebVitals';

import './components/css/index.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import 'font-awesome/css/font-awesome.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
