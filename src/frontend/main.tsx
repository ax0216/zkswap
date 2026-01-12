/**
 * ZKSwap Vault - Main Entry Point
 *
 * This is the entry point for the React application.
 * It renders the App component into the #root element.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import Tailwind CSS and global styles
import './styles/globals.css';

// Import legacy component styles for backwards compatibility
import { allStyles } from './components';

// Inject legacy component styles into the document (for non-Tailwind components)
if (allStyles) {
  const styleElement = document.createElement('style');
  styleElement.textContent = allStyles;
  document.head.appendChild(styleElement);
}

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure there is a <div id="root"></div> in your index.html'
  );
}

// Create React root and render the app
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
