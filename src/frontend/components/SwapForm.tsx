/**
 * ZKSwap Vault - Swap Form Component
 *
 * Main swap interface for exchanging tokens privately.
 * Supports single swaps and premium batch swaps.
 */

import React, { useState, useCallback, useEffect, ChangeEvent } from 'react';
import { useWallet } from '../context/WalletContext';
import { useZKSwap } from '../hooks/useZKSwap';
import type { Bytes32 } from '../../types';

// ============================================================================
// Types
// ============================================================================

interface Token {
  symbol: string;
  name: string;
  address: Bytes32;
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
  { symbol: 'NIGHT', name: 'Midnight Token', address: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32, decimals: 9 },
  { symbol: 'DUST', name: 'Dust Token', address: '0x0000000000000000000000000000000000000000000000000000000000000002' as Bytes32, decimals: 9 },
  { symbol: 'USDC', name: 'USD Coin', address: '0x0000000000000000000000000000000000000000000000000000000000000003' as Bytes32, decimals: 6 },
  { symbol: 'ETH', name: 'Wrapped Ether', address: '0x0000000000000000000000000000000000000000000000000000000000000004' as Bytes32, decimals: 18 },
];

// ============================================================================
// Component
// ============================================================================

export function SwapForm({
  className = '',
  onSwapComplete,
}: SwapFormProps): JSX.Element {
  const { isConnected, isPremium } = useWallet();
  const zkSwap = useZKSwap();
  const { swap, batchSwap, getQuote, isSwapping, error } = zkSwap;

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

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fromAmount, fromToken.address, toToken.address, getQuote]);

  // Parse amount to bigint
  const parseAmount = useCallback((amount: string, decimals: number): bigint => {
    if (!amount) return 0n;
    const [whole, fraction = ''] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole || '0') * 10n ** BigInt(decimals) + BigInt(paddedFraction);
  }, []);

  // Swap tokens position
  const handleSwapTokens = useCallback(() => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  }, [fromToken, toToken, fromAmount, toAmount]);

  // Execute single swap
  const handleSwap = useCallback(async () => {
    if (!fromAmount || !toAmount) return;

    try {
      const minOutput = parseAmount(toAmount, toToken.decimals);
      const slippageAmount = minOutput * BigInt(Math.floor(slippage * 100)) / 10000n;
      const minOutputWithSlippage = minOutput - slippageAmount;

      const result = await swap({
        inputTokenId: fromToken.address,
        inputAmount: parseAmount(fromAmount, fromToken.decimals),
        outputTokenId: toToken.address,
        minOutputAmount: minOutputWithSlippage,
        deadlineBlocks: 100,
      });

      onSwapComplete?.(result.txHash);
      setFromAmount('');
      setToAmount('');
      setQuote(null);
    } catch (err) {
      console.error('Swap failed:', err);
    }
  }, [fromAmount, toAmount, fromToken, toToken, slippage, parseAmount, swap, onSwapComplete]);

  // Execute batch swap
  const handleBatchSwap = useCallback(async () => {
    if (!fromAmount || !toAmount) return;

    try {
      const minOutput = parseAmount(toAmount, toToken.decimals);
      const slippageAmount = minOutput * BigInt(Math.floor(slippage * 100)) / 10000n;
      const minOutputWithSlippage = minOutput - slippageAmount;

      const result = await batchSwap({
        orders: [{
          inputTokenId: fromToken.address,
          inputAmount: parseAmount(fromAmount, fromToken.decimals),
          outputTokenId: toToken.address,
          minOutputAmount: minOutputWithSlippage,
          deadlineBlocks: 100,
        }],
      });

      onSwapComplete?.(result.txHash);
      setFromAmount('');
      setToAmount('');
      setQuote(null);
    } catch (err) {
      console.error('Batch swap failed:', err);
    }
  }, [fromAmount, toAmount, fromToken, toToken, slippage, parseAmount, batchSwap, onSwapComplete]);

  // Handle input changes
  const handleFromAmountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setFromAmount(e.target.value);
  }, []);

  const handleFromTokenChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const token = SUPPORTED_TOKENS.find(t => t.address === e.target.value);
    if (token && token.address !== toToken.address) {
      setFromToken(token);
    }
  }, [toToken.address]);

  const handleToTokenChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    const token = SUPPORTED_TOKENS.find(t => t.address === e.target.value);
    if (token && token.address !== fromToken.address) {
      setToToken(token);
    }
  }, [fromToken.address]);

  const handleSlippageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSlippage(parseFloat(e.target.value) || 0.5);
  }, []);

  // Not connected state
  if (!isConnected) {
    return (
      <div className={`zkswap-swap-form ${className}`}>
        <div className="form-header">
          <h2>Swap</h2>
        </div>
        <div className="connect-prompt">
          <p>Connect your wallet to start swapping</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`zkswap-swap-form ${className}`}>
      {/* Header */}
      <div className="form-header">
        <h2>Swap</h2>
        <div className="header-actions">
          {isPremium && (
            <button
              className={`batch-toggle ${isBatchMode ? 'active' : ''}`}
              onClick={() => setIsBatchMode(!isBatchMode)}
              title="Batch Mode (Premium)"
            >
              ⚡
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
          <label>
            Slippage Tolerance
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
                onChange={handleSlippageChange}
                placeholder="Custom"
              />
            </div>
          </label>
        </div>
      )}

      {/* From Token Input */}
      <div className="token-input">
        <div className="input-header">
          <span>From</span>
          <span className="balance">Balance: --</span>
        </div>
        <div className="input-row">
          <input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={handleFromAmountChange}
          />
          <select value={fromToken.address} onChange={handleFromTokenChange}>
            {SUPPORTED_TOKENS.filter(t => t.address !== toToken.address).map(token => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Swap Direction Button */}
      <button className="swap-direction" onClick={handleSwapTokens}>
        ↕️
      </button>

      {/* To Token Input */}
      <div className="token-input">
        <div className="input-header">
          <span>To</span>
          <span className="balance">Balance: --</span>
        </div>
        <div className="input-row">
          <input
            type="number"
            placeholder="0.0"
            value={toAmount}
            readOnly
          />
          <select value={toToken.address} onChange={handleToTokenChange}>
            {SUPPORTED_TOKENS.filter(t => t.address !== fromToken.address).map(token => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quote Info */}
      {quote && (
        <div className="swap-info">
          <div className="info-row">
            <span>Rate</span>
            <span>
              1 {fromToken.symbol} ≈ {(parseFloat(quote.expectedOutput) / parseFloat(fromAmount)).toFixed(4)} {toToken.symbol}
            </span>
          </div>
          <div className="info-row">
            <span>Fee</span>
            <span>{quote.fee} {fromToken.symbol}</span>
          </div>
          <div className="info-row">
            <span>Price Impact</span>
            <span className={quote.priceImpact > 1 ? 'warning' : ''}>
              {quote.priceImpact.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <button
        className="swap-button"
        onClick={isBatchMode ? handleBatchSwap : handleSwap}
        disabled={!fromAmount || !toAmount || isSwapping || isQuoting}
      >
        {isSwapping ? 'Swapping...' : isQuoting ? 'Getting Quote...' : isBatchMode ? 'Batch Swap ⚡' : 'Swap'}
      </button>

      {/* Privacy Notice */}
      <div className="privacy-notice">
        🛡️ Your swap is protected by zero-knowledge proofs
      </div>

      {/* Error */}
      {error && (
        <div className="error-message">{error}</div>
      )}
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
    border-radius: 12px;
    padding: 16px;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    .zkswap-swap-form {
      border-radius: 16px;
      padding: 20px;
      max-width: 480px;
    }
  }

  @media (min-width: 768px) {
    .zkswap-swap-form {
      padding: 24px;
    }
  }

  .zkswap-swap-form .form-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .zkswap-swap-form .form-header h2 {
    margin: 0;
    color: #e5e7eb;
    font-size: 20px;
  }

  .zkswap-swap-form .header-actions {
    display: flex;
    gap: 8px;
  }

  .zkswap-swap-form .batch-toggle,
  .zkswap-swap-form .settings-button {
    padding: 8px;
    border: none;
    border-radius: 8px;
    background: #374151;
    color: #9ca3af;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-swap-form .batch-toggle.active {
    background: #6366f1;
    color: white;
  }

  .zkswap-swap-form .settings-panel {
    background: #111827;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .zkswap-swap-form .settings-panel label {
    display: block;
    color: #9ca3af;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .zkswap-swap-form .slippage-options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  @media (min-width: 640px) {
    .zkswap-swap-form .slippage-options {
      gap: 8px;
    }
  }

  .zkswap-swap-form .slippage-options button {
    padding: 6px 12px;
    border: 1px solid #374151;
    border-radius: 6px;
    background: transparent;
    color: #9ca3af;
    cursor: pointer;
    font-size: 13px;
  }

  @media (min-width: 640px) {
    .zkswap-swap-form .slippage-options button {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
    }
  }

  .zkswap-swap-form .slippage-options button.active {
    background: #6366f1;
    border-color: #6366f1;
    color: white;
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

  .zkswap-swap-form .connect-prompt {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
  }

  .zkswap-swap-form .token-input {
    background: #111827;
    border: 1px solid #374151;
    border-radius: 12px;
    padding: 16px;
  }

  .zkswap-swap-form .input-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    color: #9ca3af;
    font-size: 14px;
  }

  .zkswap-swap-form .input-row {
    display: flex;
    gap: 12px;
  }

  .zkswap-swap-form .input-row input {
    flex: 1;
    padding: 8px 0;
    border: none;
    background: transparent;
    color: #e5e7eb;
    font-size: 18px;
    outline: none;
  }

  @media (min-width: 640px) {
    .zkswap-swap-form .input-row input {
      padding: 12px 0;
      font-size: 24px;
    }
  }

  .zkswap-swap-form .input-row select {
    padding: 6px 8px;
    border: 1px solid #374151;
    border-radius: 8px;
    background: #374151;
    color: #e5e7eb;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  @media (min-width: 640px) {
    .zkswap-swap-form .input-row select {
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 16px;
    }
  }

  .zkswap-swap-form .swap-direction {
    display: block;
    margin: -8px auto;
    padding: 8px;
    border: 4px solid #1f2937;
    border-radius: 12px;
    background: #374151;
    color: #9ca3af;
    font-size: 16px;
    cursor: pointer;
    position: relative;
    z-index: 1;
  }

  .zkswap-swap-form .swap-info {
    background: #111827;
    border-radius: 12px;
    padding: 12px 16px;
    margin-top: 16px;
  }

  .zkswap-swap-form .info-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    color: #9ca3af;
    font-size: 14px;
  }

  .zkswap-swap-form .info-row .warning {
    color: #f59e0b;
  }

  .zkswap-swap-form .swap-button {
    width: 100%;
    margin-top: 16px;
    padding: 16px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-swap-form .swap-button:disabled {
    background: #374151;
    color: #6b7280;
    cursor: not-allowed;
  }

  .zkswap-swap-form .privacy-notice {
    text-align: center;
    margin-top: 16px;
    padding: 12px;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 8px;
    color: #9ca3af;
    font-size: 13px;
  }

  .zkswap-swap-form .error-message {
    background: #7f1d1d;
    color: #fca5a5;
    padding: 12px;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 14px;
    text-align: center;
  }
`;

export default SwapForm;
