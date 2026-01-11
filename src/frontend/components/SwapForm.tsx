/**
 * ZKSwap Vault - Swap Form Component
 *
 * Main swap interface for exchanging tokens privately.
 * Supports single swaps and premium batch swaps.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useZKSwap } from '../hooks/useZKSwap';

// ============================================================================
// Types
// ============================================================================

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  icon?: string;
}

interface SwapFormProps {
  className?: string;
  onSwapComplete?: (txHash: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const SUPPORTED_TOKENS: Token[] = [
  { symbol: 'NIGHT', name: 'Midnight Token', address: '0x01', decimals: 9 },
  { symbol: 'DUST', name: 'Dust Token', address: '0x02', decimals: 9 },
  { symbol: 'USDC', name: 'USD Coin', address: '0x03', decimals: 6 },
  { symbol: 'ETH', name: 'Wrapped Ether', address: '0x04', decimals: 18 },
];

// ============================================================================
// Component
// ============================================================================

export function SwapForm({
  className = '',
  onSwapComplete,
}: SwapFormProps): JSX.Element {
  const { isConnected, isPremium } = useWallet();
  const { swap, batchSwap, getQuote, isLoading, error } = useZKSwap();

  // Form state
  const [fromToken, setFromToken] = useState<Token>(SUPPORTED_TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(SUPPORTED_TOKENS[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);

  // Quote state
  const [quote, setQuote] = useState<{
    expectedOutput: string;
    priceImpact: number;
    fee: string;
  } | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);

  // Batch swap state (premium only)
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchSwaps, setBatchSwaps] = useState<Array<{
    fromToken: Token;
    toToken: Token;
    amount: string;
  }>>([]);

  // Fetch quote when input changes
  useEffect(() => {
    const fetchQuote = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setQuote(null);
        setToAmount('');
        return;
      }

      setIsQuoting(true);
      try {
        const result = await getQuote(
          fromToken.address,
          toToken.address,
          fromAmount
        );
        setQuote(result);
        setToAmount(result.expectedOutput);
      } catch (err) {
        console.error('Quote error:', err);
        setQuote(null);
      } finally {
        setIsQuoting(false);
      }
    };

    const debounce = setTimeout(fetchQuote, 300);
    return () => clearTimeout(debounce);
  }, [fromToken, toToken, fromAmount, getQuote]);

  // Swap token positions
  const handleSwapTokens = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  }, [fromToken, toToken, fromAmount, toAmount]);

  // Execute swap
  const handleSwap = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;

    try {
      const minOutput = (
        parseFloat(toAmount) * (1 - slippage / 100)
      ).toString();

      const txHash = await swap({
        fromToken: fromToken.address,
        toToken: toToken.address,
        amount: fromAmount,
        minOutput,
      });

      onSwapComplete?.(txHash);
      setFromAmount('');
      setToAmount('');
      setQuote(null);
    } catch (err) {
      console.error('Swap failed:', err);
    }
  };

  // Execute batch swap (premium only)
  const handleBatchSwap = async () => {
    if (batchSwaps.length === 0) return;

    try {
      const txHash = await batchSwap(
        batchSwaps.map(s => ({
          fromToken: s.fromToken.address,
          toToken: s.toToken.address,
          amount: s.amount,
          minOutput: '0', // Would calculate in production
        }))
      );

      onSwapComplete?.(txHash);
      setBatchSwaps([]);
    } catch (err) {
      console.error('Batch swap failed:', err);
    }
  };

  // Add swap to batch
  const addToBatch = () => {
    if (!fromAmount || batchSwaps.length >= 5) return;

    setBatchSwaps([
      ...batchSwaps,
      { fromToken, toToken, amount: fromAmount },
    ]);
    setFromAmount('');
  };

  // Remove from batch
  const removeFromBatch = (index: number) => {
    setBatchSwaps(batchSwaps.filter((_, i) => i !== index));
  };

  return (
    <div className={`zkswap-swap-form ${className}`}>
      {/* Header */}
      <div className="swap-header">
        <h2>Swap</h2>
        <div className="header-actions">
          {isPremium && (
            <button
              className={`batch-toggle ${isBatchMode ? 'active' : ''}`}
              onClick={() => setIsBatchMode(!isBatchMode)}
            >
              Batch Mode
            </button>
          )}
          <button
            className="settings-button"
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="slippage-setting">
            <label>Slippage Tolerance</label>
            <div className="slippage-options">
              {[0.1, 0.5, 1.0].map(value => (
                <button
                  key={value}
                  className={slippage === value ? 'active' : ''}
                  onClick={() => setSlippage(value)}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                value={slippage}
                onChange={e => setSlippage(parseFloat(e.target.value) || 0.5)}
                min="0.1"
                max="50"
                step="0.1"
              />
            </div>
          </div>
        </div>
      )}

      {/* From Token Input */}
      <div className="token-input">
        <label>From</label>
        <div className="input-row">
          <select
            value={fromToken.symbol}
            onChange={e => {
              const token = SUPPORTED_TOKENS.find(t => t.symbol === e.target.value);
              if (token) setFromToken(token);
            }}
          >
            {SUPPORTED_TOKENS.map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={e => setFromAmount(e.target.value)}
            disabled={!isConnected}
          />
        </div>
      </div>

      {/* Swap Direction Button */}
      <button className="swap-direction" onClick={handleSwapTokens}>
        ↕
      </button>

      {/* To Token Input */}
      <div className="token-input">
        <label>To</label>
        <div className="input-row">
          <select
            value={toToken.symbol}
            onChange={e => {
              const token = SUPPORTED_TOKENS.find(t => t.symbol === e.target.value);
              if (token) setToToken(token);
            }}
          >
            {SUPPORTED_TOKENS.map(token => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="0.0"
            value={toAmount}
            readOnly
            className={isQuoting ? 'loading' : ''}
          />
        </div>
      </div>

      {/* Quote Details */}
      {quote && (
        <div className="quote-details">
          <div className="quote-row">
            <span>Price Impact</span>
            <span className={quote.priceImpact > 5 ? 'warning' : ''}>
              {quote.priceImpact.toFixed(2)}%
            </span>
          </div>
          <div className="quote-row">
            <span>Fee (0.5%)</span>
            <span>{quote.fee} DUST</span>
          </div>
          <div className="quote-row">
            <span>Min. Received</span>
            <span>
              {(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)} {toToken.symbol}
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {!isConnected ? (
        <button className="swap-button disabled">
          Connect Wallet
        </button>
      ) : isBatchMode ? (
        <div className="batch-actions">
          <button
            className="add-to-batch"
            onClick={addToBatch}
            disabled={!fromAmount || batchSwaps.length >= 5}
          >
            Add to Batch ({batchSwaps.length}/5)
          </button>
          <button
            className="execute-batch"
            onClick={handleBatchSwap}
            disabled={batchSwaps.length === 0 || isLoading}
          >
            {isLoading ? 'Processing...' : 'Execute Batch'}
          </button>
        </div>
      ) : (
        <button
          className="swap-button"
          onClick={handleSwap}
          disabled={!fromAmount || isLoading || isQuoting}
        >
          {isLoading ? 'Swapping...' : 'Swap'}
        </button>
      )}

      {/* Batch Queue (Premium) */}
      {isBatchMode && batchSwaps.length > 0 && (
        <div className="batch-queue">
          <h4>Batch Queue</h4>
          {batchSwaps.map((swap, index) => (
            <div key={index} className="batch-item">
              <span>
                {swap.amount} {swap.fromToken.symbol} → {swap.toToken.symbol}
              </span>
              <button onClick={() => removeFromBatch(index)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="privacy-notice">
        <span className="shield-icon">🛡️</span>
        <span>Your swap is protected by zero-knowledge proofs</span>
      </div>
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

export const swapFormStyles = `
  .zkswap-swap-form {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 16px;
    padding: 24px;
    max-width: 480px;
    margin: 0 auto;
  }

  .zkswap-swap-form .swap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .zkswap-swap-form .swap-header h2 {
    margin: 0;
    color: #e5e7eb;
    font-size: 20px;
  }

  .zkswap-swap-form .header-actions {
    display: flex;
    gap: 8px;
  }

  .zkswap-swap-form .batch-toggle {
    padding: 6px 12px;
    border: 1px solid #6366f1;
    border-radius: 8px;
    background: transparent;
    color: #6366f1;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-swap-form .batch-toggle.active {
    background: #6366f1;
    color: white;
  }

  .zkswap-swap-form .settings-button {
    padding: 6px 10px;
    border: 1px solid #374151;
    border-radius: 8px;
    background: transparent;
    font-size: 16px;
    cursor: pointer;
  }

  .zkswap-swap-form .settings-panel {
    background: #111827;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .zkswap-swap-form .slippage-setting label {
    display: block;
    color: #9ca3af;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .zkswap-swap-form .slippage-options {
    display: flex;
    gap: 8px;
  }

  .zkswap-swap-form .slippage-options button {
    padding: 8px 16px;
    border: 1px solid #374151;
    border-radius: 8px;
    background: transparent;
    color: #e5e7eb;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-swap-form .slippage-options button.active {
    background: #6366f1;
    border-color: #6366f1;
  }

  .zkswap-swap-form .slippage-options input {
    width: 80px;
    padding: 8px;
    border: 1px solid #374151;
    border-radius: 8px;
    background: #111827;
    color: #e5e7eb;
    text-align: center;
  }

  .zkswap-swap-form .token-input {
    background: #111827;
    border: 1px solid #374151;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 8px;
  }

  .zkswap-swap-form .token-input label {
    display: block;
    color: #9ca3af;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .zkswap-swap-form .token-input .input-row {
    display: flex;
    gap: 12px;
  }

  .zkswap-swap-form .token-input select {
    padding: 12px;
    border: 1px solid #374151;
    border-radius: 8px;
    background: #1f2937;
    color: #e5e7eb;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
  }

  .zkswap-swap-form .token-input input {
    flex: 1;
    padding: 12px;
    border: none;
    background: transparent;
    color: #e5e7eb;
    font-size: 24px;
    text-align: right;
    outline: none;
  }

  .zkswap-swap-form .token-input input.loading {
    opacity: 0.5;
  }

  .zkswap-swap-form .swap-direction {
    display: block;
    width: 40px;
    height: 40px;
    margin: -16px auto;
    border: 4px solid #1f2937;
    border-radius: 12px;
    background: #374151;
    color: #e5e7eb;
    font-size: 18px;
    cursor: pointer;
    z-index: 1;
    position: relative;
    transition: all 0.2s ease;
  }

  .zkswap-swap-form .swap-direction:hover {
    background: #4b5563;
    transform: rotate(180deg);
  }

  .zkswap-swap-form .quote-details {
    background: #111827;
    border-radius: 12px;
    padding: 12px 16px;
    margin: 16px 0;
  }

  .zkswap-swap-form .quote-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    color: #9ca3af;
    font-size: 14px;
  }

  .zkswap-swap-form .quote-row .warning {
    color: #fbbf24;
  }

  .zkswap-swap-form .error-message {
    background: #7f1d1d;
    color: #fca5a5;
    padding: 12px;
    border-radius: 8px;
    margin: 16px 0;
    font-size: 14px;
  }

  .zkswap-swap-form .swap-button {
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-swap-form .swap-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .zkswap-swap-form .swap-button:disabled,
  .zkswap-swap-form .swap-button.disabled {
    background: #374151;
    color: #6b7280;
    cursor: not-allowed;
  }

  .zkswap-swap-form .batch-actions {
    display: flex;
    gap: 12px;
  }

  .zkswap-swap-form .batch-actions button {
    flex: 1;
    padding: 14px;
    border: none;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .zkswap-swap-form .add-to-batch {
    background: #374151;
    color: #e5e7eb;
  }

  .zkswap-swap-form .execute-batch {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
  }

  .zkswap-swap-form .batch-queue {
    margin-top: 16px;
    padding: 16px;
    background: #111827;
    border-radius: 12px;
  }

  .zkswap-swap-form .batch-queue h4 {
    margin: 0 0 12px 0;
    color: #9ca3af;
    font-size: 14px;
  }

  .zkswap-swap-form .batch-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #374151;
    color: #e5e7eb;
    font-size: 14px;
  }

  .zkswap-swap-form .batch-item:last-child {
    border-bottom: none;
  }

  .zkswap-swap-form .batch-item button {
    padding: 4px 8px;
    border: none;
    background: transparent;
    color: #ef4444;
    cursor: pointer;
  }

  .zkswap-swap-form .privacy-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
    padding: 12px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 8px;
    color: #10b981;
    font-size: 13px;
  }
`;

export default SwapForm;
