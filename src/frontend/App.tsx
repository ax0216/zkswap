/**
 * ZKSwap Vault - Main Application Component
 *
 * Privacy-first DEX on the Midnight Network.
 * Features: Private swaps, staking, liquidity pools, and ZK proof verification.
 */

import React, { useState } from 'react';
import { WalletProvider, useWallet } from './context/WalletContext';
import { WalletConnect } from './components/WalletConnect';
import { SwapForm } from './components/SwapForm';
import { StakePanel } from './components/StakePanel';
import { LiquidityPanel } from './components/LiquidityPanel';
import { PoolStats } from './components/PoolStats';

// ============================================================================
// Types
// ============================================================================

type TabId = 'swap' | 'stake' | 'liquidity' | 'pools';

interface TabConfig {
  id: TabId;
  label: string;
  icon: string;
}

// ============================================================================
// Constants
// ============================================================================

const TABS: TabConfig[] = [
  { id: 'swap', label: 'Swap', icon: '⇄' },
  { id: 'stake', label: 'Stake', icon: '🔒' },
  { id: 'liquidity', label: 'Liquidity', icon: '💧' },
  { id: 'pools', label: 'Pools', icon: '📊' },
];

// ============================================================================
// App Content Component
// ============================================================================

function AppContent() {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<TabId>('swap');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSwapComplete = (txHash: string) => {
    showNotification(`Swap complete! TX: ${txHash.slice(0, 10)}...`);
  };

  const handleStakeComplete = (txHash: string) => {
    showNotification(`Stake complete! TX: ${txHash.slice(0, 10)}...`);
  };

  const handleLiquidityComplete = (txHash: string) => {
    showNotification(`Liquidity operation complete! TX: ${txHash.slice(0, 10)}...`);
  };

  return (
    <div className="zkswap-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🔐</span>
            <h1>ZKSwap Vault</h1>
            <span className="network-badge">Midnight Testnet</span>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className="notification">
          <span className="notification-icon">✓</span>
          {notification}
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        {/* Tab Navigation */}
        <nav className="tab-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'swap' && (
            <SwapForm onSwapComplete={handleSwapComplete} />
          )}
          {activeTab === 'stake' && (
            <StakePanel onStakeComplete={handleStakeComplete} />
          )}
          {activeTab === 'liquidity' && (
            <LiquidityPanel onComplete={handleLiquidityComplete} />
          )}
          {activeTab === 'pools' && <PoolStats />}
        </div>

        {/* Privacy Info */}
        <div className="privacy-info">
          <div className="privacy-badge">
            <span className="shield">🛡️</span>
            <div>
              <strong>Zero-Knowledge Privacy</strong>
              <p>All transactions are protected by ZK proofs. Your balances and amounts remain private.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>Built on <strong>Midnight Network</strong> with Compact smart contracts</p>
          <div className="footer-links">
            <a href="https://midnight.network" target="_blank" rel="noopener noreferrer">Docs</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://discord.gg" target="_blank" rel="noopener noreferrer">Discord</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================================
// Main App Component with Providers
// ============================================================================

export default function App() {
  return (
    <WalletProvider autoConnect={false}>
      <AppContent />
    </WalletProvider>
  );
}

// ============================================================================
// App Styles (injected via main.tsx with component styles)
// ============================================================================

export const appStyles = `
  /* App Container */
  .zkswap-app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .app-header {
    background: rgba(15, 15, 35, 0.95);
    border-bottom: 1px solid #374151;
    padding: 16px 24px;
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
  }

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    font-size: 32px;
  }

  .logo h1 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .network-badge {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  /* Notification */
  .notification {
    position: fixed;
    top: 80px;
    right: 24px;
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    z-index: 200;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .notification-icon {
    font-size: 18px;
  }

  /* Main Content */
  .app-main {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 24px;
  }

  /* Tab Navigation */
  .tab-nav {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    background: rgba(31, 41, 55, 0.5);
    padding: 8px;
    border-radius: 16px;
    border: 1px solid #374151;
  }

  .tab-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: #9ca3af;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-button:hover {
    color: #e5e7eb;
    background: rgba(55, 65, 81, 0.5);
  }

  .tab-button.active {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }

  .tab-icon {
    font-size: 18px;
  }

  /* Tab Content */
  .tab-content {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Privacy Info */
  .privacy-info {
    margin-top: 32px;
  }

  .privacy-badge {
    display: flex;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 16px;
    padding: 20px 24px;
  }

  .privacy-badge .shield {
    font-size: 40px;
  }

  .privacy-badge strong {
    display: block;
    color: #e5e7eb;
    font-size: 16px;
    margin-bottom: 4px;
  }

  .privacy-badge p {
    color: #9ca3af;
    font-size: 14px;
    margin: 0;
  }

  /* Footer */
  .app-footer {
    background: rgba(15, 15, 35, 0.95);
    border-top: 1px solid #374151;
    padding: 24px;
    margin-top: auto;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #9ca3af;
    font-size: 14px;
  }

  .footer-links {
    display: flex;
    gap: 24px;
  }

  .footer-links a {
    color: #9ca3af;
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-links a:hover {
    color: #6366f1;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 16px;
    }

    .logo h1 {
      font-size: 20px;
    }

    .tab-nav {
      flex-wrap: wrap;
    }

    .tab-button {
      flex: 1 1 calc(50% - 4px);
    }

    .tab-label {
      display: none;
    }

    .tab-icon {
      font-size: 24px;
    }

    .footer-content {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }

    .privacy-badge {
      flex-direction: column;
      text-align: center;
    }
  }
`;
