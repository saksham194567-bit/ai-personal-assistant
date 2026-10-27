/**
 * main.jsx — Application entry point.
 *
 * This file bootstraps the React application by mounting the root <App />
 * component into the #root div defined in index.html.
 *
 * React.StrictMode is enabled — it runs extra checks in development
 * to help catch common bugs early. It has no effect in production.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Global styles must be imported before any components
import './styles/globals.css';

import App from './App.jsx';

// Mount the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
