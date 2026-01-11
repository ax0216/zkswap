/**
 * ZKSwap Vault - Wallet Connect Component
 *
 * Button/panel for connecting to Midnight wallet.
 * Shows connection status and wallet address.
 */

import React from 'react';
import { useWallet } from '../context/WalletContext';

// ============================================================================
// Types
// ============================================================================

interface WalletConnectProps {
  className?: string;
  showBalance?: boolean;
  compact?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function WalletConnect({
  className = '',
  showBalance = true,
  compact = false,
}: WalletConnectProps): JSX.Element {
  const {
    isConnected,
    isConnecting,
    address,
    balance,
    error,
    connect,
    disconnect,
  } = useWallet();

  // Format address for display
  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (amount: bigint, decimals = 9): string => {
    const divisor = 10n ** BigInt(decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4);
    return `${whole.toLocaleString()}.${fractionStr}`;
  };

  // Render error state
  if (error) {
    return (
      <div className={`zkswap-wallet-error ${className}`}>
        <div className="error-icon">!</div>
        <span className="error-message">{error}</span>
        <button onClick={connect} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  // Render connecting state
  if (isConnecting) {
    return (
      <div className={`zkswap-wallet-connecting ${className}`}>
        <div className="spinner" />
        <span>Connecting...</span>
      </div>
    );
  }

  // Render connected state
  if (isConnected && address) {
    if (compact) {
      return (
        <button
          className={`zkswap-wallet-compact ${className}`}
          onClick={disconnect}
          title="Click to disconnect"
        >
          <span className="wallet-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </span>
          <span className="address">{formatAddress(address)}</span>
        </button>
      );
    }

    return (
      <div className={`zkswap-wallet-connected ${className}`}>
        <div className="wallet-header">
          <span className="connected-dot" />
          <span className="address">{formatAddress(address)}</span>
          <button onClick={disconnect} className="disconnect-button">
            Disconnect
          </button>
        </div>

        {showBalance && balance && (
          <div className="wallet-balances">
            <div className="balance-row">
              <span className="token-name">NIGHT</span>
              <span className="token-amount">{formatBalance(balance.night)}</span>
            </div>
            <div className="balance-row">
              <span className="token-name">DUST</span>
              <span className="token-amount">{formatBalance(balance.dust)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render disconnected state
  return (
    <button
      className={`zkswap-wallet-connect ${className}`}
      onClick={connect}
    >
      <span className="wallet-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
        </svg>
      </span>
      <span>Connect Wallet</span>
    </button>
  );
}

// ============================================================================
// Styles (CSS-in-JS)
// ============================================================================

export const walletConnectStyles = `
  .zkswap-wallet-connect {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-wallet-connect:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .zkswap-wallet-connecting {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    background: #374151;
    color: #9ca3af;
    font-size: 16px;
  }

  .zkswap-wallet-connecting .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #9ca3af;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .zkswap-wallet-connected {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 12px;
    padding: 16px;
  }

  .zkswap-wallet-connected .wallet-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .zkswap-wallet-connected .connected-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #10b981;
  }

  .zkswap-wallet-connected .address {
    font-family: monospace;
    font-size: 14px;
    color: #e5e7eb;
    flex: 1;
  }

  .zkswap-wallet-connected .disconnect-button {
    padding: 4px 12px;
    border: 1px solid #374151;
    border-radius: 6px;
    background: transparent;
    color: #9ca3af;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-wallet-connected .disconnect-button:hover {
    background: #374151;
    color: #e5e7eb;
  }

  .zkswap-wallet-connected .wallet-balances {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #374151;
  }

  .zkswap-wallet-connected .balance-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
  }

  .zkswap-wallet-connected .token-name {
    color: #9ca3af;
    font-size: 14px;
  }

  .zkswap-wallet-connected .token-amount {
    color: #e5e7eb;
    font-family: monospace;
    font-size: 14px;
  }

  .zkswap-wallet-compact {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid #374151;
    border-radius: 8px;
    background: #1f2937;
    color: #e5e7eb;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-wallet-compact:hover {
    background: #374151;
  }

  .zkswap-wallet-error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 12px;
    background: #7f1d1d;
    color: #fca5a5;
  }

  .zkswap-wallet-error .error-icon {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #ef4444;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 12px;
  }

  .zkswap-wallet-error .error-message {
    flex: 1;
    font-size: 14px;
  }

  .zkswap-wallet-error .retry-button {
    padding: 4px 12px;
    border: 1px solid #fca5a5;
    border-radius: 6px;
    background: transparent;
    color: #fca5a5;
    font-size: 12px;
    cursor: pointer;
  }

  .zkswap-wallet-error .retry-button:hover {
    background: #991b1b;
  }
`;

export default WalletConnect;
