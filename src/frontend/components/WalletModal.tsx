/**
 * ZKSwap Vault - Wallet Connection Modal
 *
 * Professional animated modal for wallet connection states.
 * Handles loading, success, and all error edge cases.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

export type ModalType = 'loading' | 'success' | 'error' | 'no-wallet' | 'canceled' | 'no-accounts';

interface WalletModalProps {
  isOpen: boolean;
  type: ModalType;
  message?: string;
  address?: string | null;
  onClose: () => void;
  onRetry?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function WalletModal({
  isOpen,
  type,
  message,
  address,
  onClose,
  onRetry,
}: WalletModalProps): JSX.Element {
  // Format address for display
  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  // Render modal content based on type
  const renderContent = () => {
    switch (type) {
      case 'loading':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="modal-content"
          >
            <div className="modal-icon loading">
              <div className="spinner-large" />
            </div>
            <h3 className="modal-title">Connecting Wallet</h3>
            <p className="modal-message">Please approve the connection in your wallet...</p>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="modal-content"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="modal-icon success"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h3 className="modal-title">Wallet Connected!</h3>
            <p className="modal-message">
              {address && (
                <span className="wallet-address">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                  {formatAddress(address)}
                </span>
              )}
            </p>
            <button onClick={onClose} className="modal-button primary">
              Close
            </button>
          </motion.div>
        );

      case 'no-wallet':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="modal-content"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
              className="modal-icon error"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </motion.div>
            <h3 className="modal-title">No Wallet Detected</h3>
            <p className="modal-message">
              Please install Lace wallet and enable the Midnight Testnet profile to use ZKSwap Vault.
            </p>
            <div className="modal-actions">
              <a
                href="https://lace.io"
                target="_blank"
                rel="noopener noreferrer"
                className="modal-button primary"
              >
                Get Lace Wallet →
              </a>
              <button onClick={onClose} className="modal-button secondary">
                Close
              </button>
            </div>
          </motion.div>
        );

      case 'canceled':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="modal-content"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="modal-icon warning"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </motion.div>
            <h3 className="modal-title">Connection Canceled</h3>
            <p className="modal-message">You canceled the wallet connection. Would you like to try again?</p>
            <div className="modal-actions">
              {onRetry && (
                <button onClick={onRetry} className="modal-button primary">
                  Retry Connection
                </button>
              )}
              <button onClick={onClose} className="modal-button secondary">
                Close
              </button>
            </div>
          </motion.div>
        );

      case 'no-accounts':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="modal-content"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              className="modal-icon warning"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                <line x1="18" y1="8" x2="22" y2="8" strokeLinecap="round" />
              </svg>
            </motion.div>
            <h3 className="modal-title">No Accounts Found</h3>
            <p className="modal-message">
              {message || 'No accounts found in your wallet. Please create an account in Lace wallet and enable the Midnight Testnet profile.'}
            </p>
            <div className="modal-actions">
              <a
                href="https://www.lace.io/blog/how-to-use-midnight-testnet-on-lace"
                target="_blank"
                rel="noopener noreferrer"
                className="modal-button primary"
              >
                View Setup Guide →
              </a>
              <button onClick={onClose} className="modal-button secondary">
                Close
              </button>
            </div>
          </motion.div>
        );

      case 'error':
      default:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="modal-content"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 150 }}
              className="modal-icon error"
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
            <h3 className="modal-title">Connection Failed</h3>
            <p className="modal-message">
              {message || 'Failed to connect to wallet. Please check your wallet settings and try again.'}
            </p>
            <div className="modal-actions">
              {onRetry && (
                <button onClick={onRetry} className="modal-button primary">
                  Try Again
                </button>
              )}
              <button onClick={onClose} className="modal-button secondary">
                Close
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={type !== 'loading' ? onClose : undefined}
            className="modal-backdrop"
          />

          {/* Modal */}
          <div className="modal-container">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="modal-wrapper"
            >
              {/* Close button (except during loading) */}
              {type !== 'loading' && (
                <button onClick={onClose} className="modal-close" aria-label="Close modal">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {renderContent()}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Styles
// ============================================================================

export const walletModalStyles = `
  /* Modal Backdrop */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    z-index: 9998;
  }

  /* Modal Container */
  .modal-container {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 9999;
    pointer-events: none;
  }

  /* Modal Wrapper */
  .modal-wrapper {
    position: relative;
    width: 100%;
    max-width: 480px;
    background: rgba(15, 15, 35, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(99, 102, 241, 0.3);
    border-radius: 24px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.2);
    pointer-events: auto;
    overflow: hidden;
  }

  .modal-wrapper::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  }

  /* Close Button */
  .modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 10;
  }

  .modal-close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
  }

  /* Modal Content */
  .modal-content {
    padding: 48px 32px 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  /* Modal Icon */
  .modal-icon {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24px;
    position: relative;
  }

  .modal-icon::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    filter: blur(16px);
    opacity: 0.4;
    z-index: -1;
  }

  .modal-icon.loading {
    background: rgba(99, 102, 241, 0.1);
    border: 2px solid rgba(99, 102, 241, 0.3);
  }

  .modal-icon.loading::after {
    background: rgba(99, 102, 241, 0.5);
  }

  .modal-icon.success {
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .modal-icon.success::after {
    background: rgba(16, 185, 129, 0.5);
  }

  .modal-icon.warning {
    background: rgba(251, 191, 36, 0.1);
    border: 2px solid rgba(251, 191, 36, 0.3);
    color: #fbbf24;
  }

  .modal-icon.warning::after {
    background: rgba(251, 191, 36, 0.5);
  }

  .modal-icon.error {
    background: rgba(239, 68, 68, 0.1);
    border: 2px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  .modal-icon.error::after {
    background: rgba(239, 68, 68, 0.5);
  }

  /* Spinner */
  .spinner-large {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(99, 102, 241, 0.2);
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Modal Title */
  .modal-title {
    font-size: 24px;
    font-weight: 700;
    color: #e5e7eb;
    margin: 0 0 12px 0;
  }

  /* Modal Message */
  .modal-message {
    font-size: 15px;
    line-height: 1.6;
    color: #9ca3af;
    margin: 0 0 24px 0;
    max-width: 400px;
  }

  .wallet-address {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 12px;
    color: #a5b4fc;
    font-family: monospace;
    font-size: 14px;
    margin-top: 8px;
  }

  .wallet-address svg {
    color: #6366f1;
  }

  /* Modal Actions */
  .modal-actions {
    display: flex;
    gap: 12px;
    width: 100%;
    max-width: 320px;
  }

  /* Modal Buttons */
  .modal-button {
    flex: 1;
    padding: 12px 24px;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    white-space: nowrap;
  }

  .modal-button.primary {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }

  .modal-button.primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
  }

  .modal-button.secondary {
    background: rgba(255, 255, 255, 0.05);
    color: #9ca3af;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-button.secondary:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e5e7eb;
  }

  /* Responsive */
  @media (max-width: 640px) {
    .modal-content {
      padding: 40px 24px 24px;
    }

    .modal-icon {
      width: 64px;
      height: 64px;
      margin-bottom: 20px;
    }

    .modal-icon svg {
      width: 36px;
      height: 36px;
    }

    .spinner-large {
      width: 32px;
      height: 32px;
    }

    .modal-title {
      font-size: 20px;
    }

    .modal-message {
      font-size: 14px;
    }

    .modal-actions {
      flex-direction: column;
      max-width: 100%;
    }

    .modal-button {
      padding: 10px 20px;
      font-size: 14px;
    }
  }
`;
