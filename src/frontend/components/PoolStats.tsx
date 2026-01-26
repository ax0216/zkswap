/**
 * ZKSwap Vault - Pool Stats Component
 *
 * Displays protocol statistics and pool information.
 */

import React, { useState, useEffect } from 'react';
import { useZKSwap } from '../hooks/useZKSwap';

// ============================================================================
// Types
// ============================================================================

interface PoolStatsProps {
  className?: string;
}

interface ProtocolStats {
  totalValueLocked: bigint;
  totalVolume24h: bigint;
  totalSwaps: number;
  totalPools: number;
  totalUsers: number;
  feesCollected24h: bigint;
}

interface PoolInfo {
  id: string;
  tokenA: { symbol: string; icon?: string };
  tokenB: { symbol: string; icon?: string };
  tvl: bigint;
  volume24h: bigint;
  apy: number;
  feeRate: number;
}

// ============================================================================
// Constants
// ============================================================================

const DECIMALS = 9;

// ============================================================================
// Component
// ============================================================================

export function PoolStats({ className = '' }: PoolStatsProps): JSX.Element {
  const { getProtocolStats, getPools } = useZKSwap();

  // State
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [pools, setPools] = useState<PoolInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'tvl' | 'volume' | 'apy'>('tvl');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsData, poolsData] = await Promise.all([
          getProtocolStats(),
          getPools(),
        ]);
        setStats(statsData);
        setPools(poolsData);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [getProtocolStats, getPools]);

  // Format currency
  const formatCurrency = (amount: bigint): string => {
    const divisor = 10n ** BigInt(DECIMALS);
    const value = Number(amount / divisor);

    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Format number
  const formatNumber = (num: number): string => {
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toLocaleString();
  };

  // Sort pools
  const sortedPools = [...pools].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'tvl':
        comparison = Number(a.tvl - b.tvl);
        break;
      case 'volume':
        comparison = Number(a.volume24h - b.volume24h);
        break;
      case 'apy':
        comparison = a.apy - b.apy;
        break;
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Handle sort click
  const handleSort = (column: 'tvl' | 'volume' | 'apy') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  if (isLoading) {
    return (
      <div className={`zkswap-pool-stats ${className}`}>
        <div className="loading-state">
          <div className="spinner" />
          <span>Loading statistics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`zkswap-pool-stats ${className}`}>
      {/* Protocol Overview */}
      {stats && (
        <div className="protocol-overview">
          <h2>Protocol Overview</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Value Locked</span>
              <span className="stat-value">{formatCurrency(stats.totalValueLocked)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">24h Volume</span>
              <span className="stat-value">{formatCurrency(stats.totalVolume24h)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Swaps</span>
              <span className="stat-value">{formatNumber(stats.totalSwaps)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Active Pools</span>
              <span className="stat-value">{stats.totalPools}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Total Users</span>
              <span className="stat-value">{formatNumber(stats.totalUsers)}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">24h Fees</span>
              <span className="stat-value fees">{formatCurrency(stats.feesCollected24h)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Pool Table */}
      <div className="pool-table-container">
        <h2>All Pools</h2>
        <div className="pool-table">
          <div className="table-header">
            <div className="col-pool">Pool</div>
            <div
              className={`col-tvl sortable ${sortBy === 'tvl' ? 'active' : ''}`}
              onClick={() => handleSort('tvl')}
            >
              TVL {sortBy === 'tvl' && (sortOrder === 'desc' ? '↓' : '↑')}
            </div>
            <div
              className={`col-volume sortable ${sortBy === 'volume' ? 'active' : ''}`}
              onClick={() => handleSort('volume')}
            >
              24h Volume {sortBy === 'volume' && (sortOrder === 'desc' ? '↓' : '↑')}
            </div>
            <div
              className={`col-apy sortable ${sortBy === 'apy' ? 'active' : ''}`}
              onClick={() => handleSort('apy')}
            >
              APY {sortBy === 'apy' && (sortOrder === 'desc' ? '↓' : '↑')}
            </div>
            <div className="col-fee">Fee</div>
          </div>
          <div className="table-body">
            {sortedPools.map(pool => (
              <div key={pool.id} className="table-row">
                <div className="col-pool">
                  <div className="pool-pair">
                    <span className="token-icons">
                      <span className="token-icon">{pool.tokenA.symbol[0]}</span>
                      <span className="token-icon">{pool.tokenB.symbol[0]}</span>
                    </span>
                    <span className="pair-name">
                      {pool.tokenA.symbol}/{pool.tokenB.symbol}
                    </span>
                  </div>
                </div>
                <div className="col-tvl">{formatCurrency(pool.tvl)}</div>
                <div className="col-volume">{formatCurrency(pool.volume24h)}</div>
                <div className="col-apy">
                  <span className="apy-value">{pool.apy.toFixed(2)}%</span>
                </div>
                <div className="col-fee">{pool.feeRate}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="privacy-banner">
        <span className="shield-icon">🛡️</span>
        <div className="privacy-text">
          <h4>Privacy-First DEX</h4>
          <p>All swaps are protected by zero-knowledge proofs. Your balances and transaction amounts remain private.</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

export const poolStatsStyles = `
  .zkswap-pool-stats {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
  }

  .zkswap-pool-stats .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: #9ca3af;
    gap: 16px;
  }

  .zkswap-pool-stats .loading-state .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #374151;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .zkswap-pool-stats .protocol-overview {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .zkswap-pool-stats .protocol-overview h2 {
    margin: 0 0 20px 0;
    color: #e5e7eb;
    font-size: 18px;
  }

  .zkswap-pool-stats .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
  }

  .zkswap-pool-stats .stat-card {
    background: #111827;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .zkswap-pool-stats .stat-label {
    color: #9ca3af;
    font-size: 13px;
  }

  .zkswap-pool-stats .stat-value {
    color: #e5e7eb;
    font-size: 24px;
    font-weight: 700;
  }

  .zkswap-pool-stats .stat-value.fees {
    color: #10b981;
  }

  .zkswap-pool-stats .pool-table-container {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    overflow: hidden;
  }

  .zkswap-pool-stats .pool-table-container h2 {
    margin: 0 0 20px 0;
    color: #e5e7eb;
    font-size: 18px;
  }

  .zkswap-pool-stats .pool-table {
    overflow-x: auto;
  }

  .zkswap-pool-stats .table-header {
    display: flex;
    padding: 12px 16px;
    background: #111827;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .zkswap-pool-stats .table-header > div {
    color: #9ca3af;
    font-size: 13px;
    font-weight: 500;
  }

  .zkswap-pool-stats .sortable {
    cursor: pointer;
    user-select: none;
    transition: color 0.2s ease;
  }

  .zkswap-pool-stats .sortable:hover,
  .zkswap-pool-stats .sortable.active {
    color: #e5e7eb;
  }

  .zkswap-pool-stats .table-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .zkswap-pool-stats .table-row {
    display: flex;
    padding: 16px;
    background: #111827;
    border-radius: 8px;
    transition: background 0.2s ease;
  }

  .zkswap-pool-stats .table-row:hover {
    background: #1f2937;
  }

  .zkswap-pool-stats .col-pool {
    flex: 2;
    min-width: 160px;
  }

  .zkswap-pool-stats .col-tvl,
  .zkswap-pool-stats .col-volume {
    flex: 1;
    min-width: 100px;
    text-align: right;
    color: #e5e7eb;
  }

  .zkswap-pool-stats .col-apy {
    flex: 1;
    min-width: 80px;
    text-align: right;
  }

  .zkswap-pool-stats .col-fee {
    flex: 0.5;
    min-width: 60px;
    text-align: right;
    color: #9ca3af;
  }

  .zkswap-pool-stats .pool-pair {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .zkswap-pool-stats .token-icons {
    display: flex;
  }

  .zkswap-pool-stats .token-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: 600;
    border: 2px solid #1f2937;
  }

  .zkswap-pool-stats .token-icon:nth-child(2) {
    margin-left: -8px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  }

  .zkswap-pool-stats .pair-name {
    color: #e5e7eb;
    font-weight: 600;
  }

  .zkswap-pool-stats .apy-value {
    color: #10b981;
    font-weight: 600;
  }

  .zkswap-pool-stats .privacy-banner {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .zkswap-pool-stats .shield-icon {
    font-size: 40px;
  }

  .zkswap-pool-stats .privacy-text h4 {
    margin: 0 0 8px 0;
    color: #e5e7eb;
    font-size: 18px;
  }

  .zkswap-pool-stats .privacy-text p {
    margin: 0;
    color: #9ca3af;
    font-size: 14px;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    .zkswap-pool-stats .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .zkswap-pool-stats .table-header,
    .zkswap-pool-stats .table-row {
      min-width: 600px;
    }

    .zkswap-pool-stats .privacy-banner {
      flex-direction: column;
      text-align: center;
    }
  }
`;

export default PoolStats;
