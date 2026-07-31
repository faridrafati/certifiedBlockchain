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
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';

// Bootstrap first so the design-system sheet (index.css) can override it
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import 'font-awesome/css/font-awesome.css';
import './components/css/index.css';

// MUI theme aligned with the design tokens in components/css/index.css
const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7C3AED' },
    secondary: { main: '#22C55E' },
    background: { default: '#0F172A', paper: '#171939' },
    text: { primary: '#F8FAFC', secondary: '#CBD5E1' },
  },
  typography: {
    fontFamily: "'Exo 2', system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
  shape: { borderRadius: 12 },
});

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {/* future flags opt in to v7 behavior and silence the upgrade warnings */}
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider theme={muiTheme}>
        <App />
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>
);
