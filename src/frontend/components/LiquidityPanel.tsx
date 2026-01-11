/**
 * ZKSwap Vault - Liquidity Panel Component
 *
 * Interface for adding/removing liquidity to pools.
 * Shows LP positions and yield farming rewards.
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useZKSwap } from '../hooks/useZKSwap';

// ============================================================================
// Types
// ============================================================================

interface LiquidityPanelProps {
  className?: string;
  onComplete?: (txHash: string) => void;
}

interface Pool {
  id: string;
  tokenA: { symbol: string; address: string };
  tokenB: { symbol: string; address: string };
  reserveA: bigint;
  reserveB: bigint;
  totalShares: bigint;
  apy: number;
}

interface LPPosition {
  poolId: string;
  shares: bigint;
  valueA: bigint;
  valueB: bigint;
  pendingRewards: bigint;
}

// ============================================================================
// Constants
// ============================================================================

const DECIMALS = 9;

// ============================================================================
// Component
// ============================================================================

export function LiquidityPanel({
  className = '',
  onComplete,
}: LiquidityPanelProps): JSX.Element {
  const { isConnected, address } = useWallet();
  const {
    addLiquidity,
    removeLiquidity,
    getPools,
    getLPPositions,
    isLoading,
    error,
  } = useZKSwap();

  // State
  const [pools, setPools] = useState<Pool[]>([]);
  const [positions, setPositions] = useState<LPPosition[]>([]);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'remove' | 'positions'>('add');
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [removePercent, setRemovePercent] = useState(50);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch pools and positions
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const poolData = await getPools();
        setPools(poolData);
        if (poolData.length > 0 && !selectedPool) {
          setSelectedPool(poolData[0]);
        }

        if (isConnected && address) {
          const positionData = await getLPPositions(address);
          setPositions(positionData);
        }
      } catch (err) {
        console.error('Failed to fetch pool data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [isConnected, address, getPools, getLPPositions, selectedPool]);

  // Format amount
  const formatAmount = (amount: bigint): string => {
    const divisor = 10n ** BigInt(DECIMALS);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    const fractionStr = fraction.toString().padStart(DECIMALS, '0').slice(0, 4);
    return `${whole.toLocaleString()}.${fractionStr}`;
  };

  // Parse amount
  const parseAmount = (value: string): bigint => {
    const [whole, fraction = ''] = value.split('.');
    const paddedFraction = fraction.padEnd(DECIMALS, '0').slice(0, DECIMALS);
    return BigInt(whole || '0') * 10n ** BigInt(DECIMALS) + BigInt(paddedFraction);
  };

  // Calculate share of pool
  const calculatePoolShare = (shares: bigint, totalShares: bigint): string => {
    if (totalShares === 0n) return '0';
    const percent = Number(shares * 10000n / totalShares) / 100;
    return percent.toFixed(2);
  };

  // Handle add liquidity
  const handleAddLiquidity = async () => {
    if (!selectedPool || !amountA || !amountB) return;

    try {
      const txHash = await addLiquidity({
        poolId: selectedPool.id,
        amountA: parseAmount(amountA),
        amountB: parseAmount(amountB),
      });
      onComplete?.(txHash);
      setAmountA('');
      setAmountB('');
      // Refresh positions
      if (address) {
        const positionData = await getLPPositions(address);
        setPositions(positionData);
      }
    } catch (err) {
      console.error('Add liquidity failed:', err);
    }
  };

  // Handle remove liquidity
  const handleRemoveLiquidity = async (position: LPPosition) => {
    try {
      const sharesToRemove = position.shares * BigInt(removePercent) / 100n;
      const txHash = await removeLiquidity({
        poolId: position.poolId,
        shares: sharesToRemove,
      });
      onComplete?.(txHash);
      // Refresh positions
      if (address) {
        const positionData = await getLPPositions(address);
        setPositions(positionData);
      }
    } catch (err) {
      console.error('Remove liquidity failed:', err);
    }
  };

  // Auto-calculate paired amount based on pool ratio
  const handleAmountAChange = (value: string) => {
    setAmountA(value);
    if (selectedPool && value) {
      const amountABigInt = parseAmount(value);
      const amountBBigInt = amountABigInt * selectedPool.reserveB / selectedPool.reserveA;
      setAmountB(formatAmount(amountBBigInt));
    }
  };

  const handleAmountBChange = (value: string) => {
    setAmountB(value);
    if (selectedPool && value) {
      const amountBBigInt = parseAmount(value);
      const amountABigInt = amountBBigInt * selectedPool.reserveA / selectedPool.reserveB;
      setAmountA(formatAmount(amountABigInt));
    }
  };

  if (!isConnected) {
    return (
      <div className={`zkswap-liquidity-panel ${className}`}>
        <div className="panel-header">
          <h2>Liquidity</h2>
        </div>
        <div className="connect-prompt">
          <p>Connect your wallet to manage liquidity positions</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`zkswap-liquidity-panel ${className}`}>
      {/* Header */}
      <div className="panel-header">
        <h2>Liquidity</h2>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={activeTab === 'add' ? 'active' : ''}
          onClick={() => setActiveTab('add')}
        >
          Add
        </button>
        <button
          className={activeTab === 'remove' ? 'active' : ''}
          onClick={() => setActiveTab('remove')}
        >
          Remove
        </button>
        <button
          className={activeTab === 'positions' ? 'active' : ''}
          onClick={() => setActiveTab('positions')}
        >
          Positions
          {positions.length > 0 && (
            <span className="position-count">{positions.length}</span>
          )}
        </button>
      </div>

      {isLoadingData ? (
        <div className="loading-state">Loading...</div>
      ) : (
        <>
          {/* Add Liquidity */}
          {activeTab === 'add' && (
            <div className="add-liquidity">
              {/* Pool Selector */}
              <div className="pool-selector">
                <label>Select Pool</label>
                <select
                  value={selectedPool?.id || ''}
                  onChange={e => {
                    const pool = pools.find(p => p.id === e.target.value);
                    setSelectedPool(pool || null);
                    setAmountA('');
                    setAmountB('');
                  }}
                >
                  {pools.map(pool => (
                    <option key={pool.id} value={pool.id}>
                      {pool.tokenA.symbol}/{pool.tokenB.symbol} - APY: {pool.apy.toFixed(2)}%
                    </option>
                  ))}
                </select>
              </div>

              {selectedPool && (
                <>
                  {/* Pool Info */}
                  <div className="pool-info">
                    <div className="info-row">
                      <span>Pool Reserves</span>
                      <span>
                        {formatAmount(selectedPool.reserveA)} {selectedPool.tokenA.symbol} /{' '}
                        {formatAmount(selectedPool.reserveB)} {selectedPool.tokenB.symbol}
                      </span>
                    </div>
                    <div className="info-row">
                      <span>APY</span>
                      <span className="apy">{selectedPool.apy.toFixed(2)}%</span>
                    </div>
                  </div>

                  {/* Token A Input */}
                  <div className="token-input">
                    <label>{selectedPool.tokenA.symbol}</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={amountA}
                      onChange={e => handleAmountAChange(e.target.value)}
                    />
                  </div>

                  {/* Plus Icon */}
                  <div className="plus-icon">+</div>

                  {/* Token B Input */}
                  <div className="token-input">
                    <label>{selectedPool.tokenB.symbol}</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={amountB}
                      onChange={e => handleAmountBChange(e.target.value)}
                    />
                  </div>

                  {/* Add Button */}
                  <button
                    className="action-button"
                    onClick={handleAddLiquidity}
                    disabled={!amountA || !amountB || isLoading}
                  >
                    {isLoading ? 'Adding Liquidity...' : 'Add Liquidity'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Remove Liquidity */}
          {activeTab === 'remove' && (
            <div className="remove-liquidity">
              {positions.length === 0 ? (
                <div className="empty-state">
                  <p>You don&apos;t have any LP positions</p>
                  <button onClick={() => setActiveTab('add')}>Add Liquidity</button>
                </div>
              ) : (
                <>
                  {/* Remove Percentage Slider */}
                  <div className="remove-slider">
                    <label>Amount to Remove: {removePercent}%</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={removePercent}
                      onChange={e => setRemovePercent(parseInt(e.target.value))}
                    />
                    <div className="preset-buttons">
                      {[25, 50, 75, 100].map(percent => (
                        <button
                          key={percent}
                          className={removePercent === percent ? 'active' : ''}
                          onClick={() => setRemovePercent(percent)}
                        >
                          {percent}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position List */}
                  <div className="position-list">
                    {positions.map(position => {
                      const pool = pools.find(p => p.id === position.poolId);
                      if (!pool) return null;

                      return (
                        <div key={position.poolId} className="position-card">
                          <div className="position-header">
                            <span className="pair">
                              {pool.tokenA.symbol}/{pool.tokenB.symbol}
                            </span>
                            <span className="share">
                              {calculatePoolShare(position.shares, pool.totalShares)}% of pool
                            </span>
                          </div>
                          <div className="position-values">
                            <div className="value-row">
                              <span>{pool.tokenA.symbol}</span>
                              <span>{formatAmount(position.valueA)}</span>
                            </div>
                            <div className="value-row">
                              <span>{pool.tokenB.symbol}</span>
                              <span>{formatAmount(position.valueB)}</span>
                            </div>
                            {position.pendingRewards > 0n && (
                              <div className="value-row rewards">
                                <span>Pending Rewards</span>
                                <span>{formatAmount(position.pendingRewards)} NIGHT</span>
                              </div>
                            )}
                          </div>
                          <button
                            className="remove-button"
                            onClick={() => handleRemoveLiquidity(position)}
                            disabled={isLoading}
                          >
                            Remove {removePercent}%
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Positions Overview */}
          {activeTab === 'positions' && (
            <div className="positions-overview">
              {positions.length === 0 ? (
                <div className="empty-state">
                  <p>You don&apos;t have any LP positions yet</p>
                  <button onClick={() => setActiveTab('add')}>Add Liquidity</button>
                </div>
              ) : (
                <div className="position-list">
                  {positions.map(position => {
                    const pool = pools.find(p => p.id === position.poolId);
                    if (!pool) return null;

                    return (
                      <div key={position.poolId} className="position-card">
                        <div className="position-header">
                          <span className="pair">
                            {pool.tokenA.symbol}/{pool.tokenB.symbol}
                          </span>
                          <span className="apy-badge">APY: {pool.apy.toFixed(2)}%</span>
                        </div>
                        <div className="position-values">
                          <div className="value-row">
                            <span>Your Share</span>
                            <span>
                              {calculatePoolShare(position.shares, pool.totalShares)}%
                            </span>
                          </div>
                          <div className="value-row">
                            <span>Pooled {pool.tokenA.symbol}</span>
                            <span>{formatAmount(position.valueA)}</span>
                          </div>
                          <div className="value-row">
                            <span>Pooled {pool.tokenB.symbol}</span>
                            <span>{formatAmount(position.valueB)}</span>
                          </div>
                          {position.pendingRewards > 0n && (
                            <div className="value-row rewards">
                              <span>Pending Rewards</span>
                              <span>{formatAmount(position.pendingRewards)} NIGHT</span>
                            </div>
                          )}
                        </div>
                        <div className="position-actions">
                          <button onClick={() => setActiveTab('add')}>Add</button>
                          <button onClick={() => setActiveTab('remove')}>Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

export const liquidityPanelStyles = `
  .zkswap-liquidity-panel {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 16px;
    padding: 24px;
    max-width: 520px;
  }

  .zkswap-liquidity-panel .panel-header {
    margin-bottom: 20px;
  }

  .zkswap-liquidity-panel .panel-header h2 {
    margin: 0;
    color: #e5e7eb;
    font-size: 20px;
  }

  .zkswap-liquidity-panel .connect-prompt {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
  }

  .zkswap-liquidity-panel .loading-state {
    text-align: center;
    padding: 40px;
    color: #9ca3af;
  }

  .zkswap-liquidity-panel .panel-tabs {
    display: flex;
    gap: 4px;
    background: #111827;
    padding: 4px;
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .zkswap-liquidity-panel .panel-tabs button {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #9ca3af;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .zkswap-liquidity-panel .panel-tabs button.active {
    background: #374151;
    color: #e5e7eb;
  }

  .zkswap-liquidity-panel .position-count {
    background: #6366f1;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 11px;
  }

  .zkswap-liquidity-panel .pool-selector {
    margin-bottom: 16px;
  }

  .zkswap-liquidity-panel .pool-selector label {
    display: block;
    color: #9ca3af;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .zkswap-liquidity-panel .pool-selector select {
    width: 100%;
    padding: 12px;
    border: 1px solid #374151;
    border-radius: 10px;
    background: #111827;
    color: #e5e7eb;
    font-size: 14px;
    cursor: pointer;
  }

  .zkswap-liquidity-panel .pool-info {
    background: #111827;
    border-radius: 10px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }

  .zkswap-liquidity-panel .pool-info .info-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    color: #9ca3af;
    font-size: 13px;
  }

  .zkswap-liquidity-panel .pool-info .apy {
    color: #10b981;
    font-weight: 600;
  }

  .zkswap-liquidity-panel .token-input {
    background: #111827;
    border: 1px solid #374151;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 8px;
  }

  .zkswap-liquidity-panel .token-input label {
    display: block;
    color: #9ca3af;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .zkswap-liquidity-panel .token-input input {
    width: 100%;
    padding: 8px 0;
    border: none;
    background: transparent;
    color: #e5e7eb;
    font-size: 24px;
    outline: none;
  }

  .zkswap-liquidity-panel .plus-icon {
    text-align: center;
    color: #6b7280;
    font-size: 20px;
    margin: -4px 0;
    position: relative;
    z-index: 1;
  }

  .zkswap-liquidity-panel .action-button {
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

  .zkswap-liquidity-panel .action-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  }

  .zkswap-liquidity-panel .action-button:disabled {
    background: #374151;
    color: #6b7280;
    cursor: not-allowed;
  }

  .zkswap-liquidity-panel .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
  }

  .zkswap-liquidity-panel .empty-state button {
    margin-top: 16px;
    padding: 12px 24px;
    border: 1px solid #6366f1;
    border-radius: 8px;
    background: transparent;
    color: #6366f1;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-liquidity-panel .empty-state button:hover {
    background: rgba(99, 102, 241, 0.1);
  }

  .zkswap-liquidity-panel .remove-slider {
    background: #111827;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .zkswap-liquidity-panel .remove-slider label {
    display: block;
    color: #e5e7eb;
    font-size: 16px;
    margin-bottom: 12px;
  }

  .zkswap-liquidity-panel .remove-slider input[type="range"] {
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: #374151;
    outline: none;
    -webkit-appearance: none;
  }

  .zkswap-liquidity-panel .remove-slider input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #6366f1;
    cursor: pointer;
  }

  .zkswap-liquidity-panel .preset-buttons {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .zkswap-liquidity-panel .preset-buttons button {
    flex: 1;
    padding: 8px;
    border: 1px solid #374151;
    border-radius: 8px;
    background: transparent;
    color: #9ca3af;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-liquidity-panel .preset-buttons button.active {
    background: #6366f1;
    border-color: #6366f1;
    color: white;
  }

  .zkswap-liquidity-panel .position-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .zkswap-liquidity-panel .position-card {
    background: #111827;
    border: 1px solid #374151;
    border-radius: 12px;
    padding: 16px;
  }

  .zkswap-liquidity-panel .position-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .zkswap-liquidity-panel .position-header .pair {
    color: #e5e7eb;
    font-size: 16px;
    font-weight: 600;
  }

  .zkswap-liquidity-panel .position-header .share {
    color: #9ca3af;
    font-size: 12px;
  }

  .zkswap-liquidity-panel .position-header .apy-badge {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 12px;
  }

  .zkswap-liquidity-panel .position-values {
    border-top: 1px solid #374151;
    padding-top: 12px;
  }

  .zkswap-liquidity-panel .value-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    color: #9ca3af;
    font-size: 14px;
  }

  .zkswap-liquidity-panel .value-row.rewards {
    color: #10b981;
  }

  .zkswap-liquidity-panel .position-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .zkswap-liquidity-panel .position-actions button {
    flex: 1;
    padding: 10px;
    border: 1px solid #374151;
    border-radius: 8px;
    background: transparent;
    color: #e5e7eb;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-liquidity-panel .position-actions button:hover {
    background: #374151;
  }

  .zkswap-liquidity-panel .remove-button {
    width: 100%;
    margin-top: 12px;
    padding: 12px;
    border: none;
    border-radius: 8px;
    background: #374151;
    color: #e5e7eb;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-liquidity-panel .remove-button:hover:not(:disabled) {
    background: #4b5563;
  }

  .zkswap-liquidity-panel .remove-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .zkswap-liquidity-panel .error-message {
    background: #7f1d1d;
    color: #fca5a5;
    padding: 12px;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 14px;
    text-align: center;
  }
`;

export default LiquidityPanel;
