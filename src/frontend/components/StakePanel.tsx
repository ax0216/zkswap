/**
 * ZKSwap Vault - Stake Panel Component
 *
 * Staking interface for NIGHT tokens to unlock premium features.
 * Shows current stake, premium status, and rewards.
 */

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useWallet } from '../context/WalletContext';
import { useZKSwap, StakeInfo } from '../hooks/useZKSwap';

// ============================================================================
// Types
// ============================================================================

interface StakePanelProps {
  className?: string;
  onStakeComplete?: (txHash: string) => void;
}

// ============================================================================
// Constants
// ============================================================================

const PREMIUM_THRESHOLD = 100n * 10n ** 9n; // 100 NIGHT
const VIP_THRESHOLD = 1000n * 10n ** 9n; // 1000 NIGHT
const DECIMALS = 9;

// ============================================================================
// Component
// ============================================================================

export function StakePanel({
  className = '',
  onStakeComplete,
}: StakePanelProps): JSX.Element {
  const { isConnected, address, balance } = useWallet();
  const zkSwap = useZKSwap();
  const { stake, unstake, claimRewards, getStakeInfo, isStaking, error } = zkSwap;

  // State
  const [stakeInfo, setStakeInfo] = useState<StakeInfo | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'stake' | 'unstake'>('stake');
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  // Fetch stake info
  useEffect(() => {
    const fetchStakeInfo = async () => {
      if (!isConnected || !address) return;

      setIsLoadingInfo(true);
      try {
        const info = await getStakeInfo(address);
        setStakeInfo(info);
      } catch (err) {
        console.error('Failed to fetch stake info:', err);
      } finally {
        setIsLoadingInfo(false);
      }
    };

    fetchStakeInfo();
    const interval = setInterval(fetchStakeInfo, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [isConnected, address, getStakeInfo]);

  // Format amount for display
  const formatAmount = useCallback((amount: bigint): string => {
    const divisor = 10n ** BigInt(DECIMALS);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    const fractionStr = fraction.toString().padStart(DECIMALS, '0').slice(0, 4);
    return `${whole.toLocaleString()}.${fractionStr}`;
  }, []);

  // Parse amount from input
  const parseAmount = useCallback((value: string): bigint => {
    if (!value) return 0n;
    const [whole, fraction = ''] = value.split('.');
    const paddedFraction = fraction.padEnd(DECIMALS, '0').slice(0, DECIMALS);
    return BigInt(whole || '0') * 10n ** BigInt(DECIMALS) + BigInt(paddedFraction);
  }, []);

  // Calculate tier
  const getTier = useCallback((amount: bigint): 'basic' | 'premium' | 'vip' => {
    if (amount >= VIP_THRESHOLD) return 'vip';
    if (amount >= PREMIUM_THRESHOLD) return 'premium';
    return 'basic';
  }, []);

  // Calculate progress to next tier
  const getProgressToNextTier = useCallback((amount: bigint): { percent: number; remaining: bigint; nextTier: string } => {
    if (amount >= VIP_THRESHOLD) {
      return { percent: 100, remaining: 0n, nextTier: 'VIP' };
    }
    if (amount >= PREMIUM_THRESHOLD) {
      const progress = Number((amount - PREMIUM_THRESHOLD) * 100n / (VIP_THRESHOLD - PREMIUM_THRESHOLD));
      return { percent: progress, remaining: VIP_THRESHOLD - amount, nextTier: 'VIP' };
    }
    const progress = Number(amount * 100n / PREMIUM_THRESHOLD);
    return { percent: progress, remaining: PREMIUM_THRESHOLD - amount, nextTier: 'Premium' };
  }, []);

  // Handle stake
  const handleStake = useCallback(async () => {
    if (!stakeAmount) return;

    try {
      const amount = parseAmount(stakeAmount);
      const result = await stake({ amount });
      onStakeComplete?.(result.txHash);
      setStakeAmount('');
      // Refresh stake info
      if (address) {
        const info = await getStakeInfo(address);
        setStakeInfo(info);
      }
    } catch (err) {
      console.error('Stake failed:', err);
    }
  }, [stakeAmount, parseAmount, stake, onStakeComplete, address, getStakeInfo]);

  // Handle unstake
  const handleUnstake = useCallback(async () => {
    if (!unstakeAmount) return;

    try {
      const amount = parseAmount(unstakeAmount);
      const result = await unstake({ amount });
      onStakeComplete?.(result.txHash);
      setUnstakeAmount('');
      // Refresh stake info
      if (address) {
        const info = await getStakeInfo(address);
        setStakeInfo(info);
      }
    } catch (err) {
      console.error('Unstake failed:', err);
    }
  }, [unstakeAmount, parseAmount, unstake, onStakeComplete, address, getStakeInfo]);

  // Handle claim rewards
  const handleClaimRewards = useCallback(async () => {
    try {
      const result = await claimRewards();
      onStakeComplete?.(result.txHash);
      // Refresh stake info
      if (address) {
        const info = await getStakeInfo(address);
        setStakeInfo(info);
      }
    } catch (err) {
      console.error('Claim rewards failed:', err);
    }
  }, [claimRewards, onStakeComplete, address, getStakeInfo]);

  // Handle input changes
  const handleStakeAmountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setStakeAmount(e.target.value);
  }, []);

  const handleUnstakeAmountChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setUnstakeAmount(e.target.value);
  }, []);

  // Set max stake amount
  const handleMaxStake = useCallback(() => {
    if (balance) {
      setStakeAmount(formatAmount(balance.night));
    }
  }, [balance, formatAmount]);

  // Set max unstake amount
  const handleMaxUnstake = useCallback(() => {
    if (stakeInfo) {
      setUnstakeAmount(formatAmount(stakeInfo.stakedAmount));
    }
  }, [stakeInfo, formatAmount]);

  // Not connected state
  if (!isConnected) {
    return (
      <div className={`zkswap-stake-panel ${className}`}>
        <div className="panel-header">
          <h2>Stake NIGHT</h2>
        </div>
        <div className="connect-prompt">
          <p>Connect your wallet to stake NIGHT tokens</p>
        </div>
      </div>
    );
  }

  const currentStaked = stakeInfo?.stakedAmount || 0n;
  const tier = getTier(currentStaked);
  const progress = getProgressToNextTier(currentStaked);

  return (
    <div className={`zkswap-stake-panel ${className}`}>
      {/* Header */}
      <div className="panel-header">
        <h2>Stake NIGHT</h2>
        <div className={`tier-badge ${tier}`}>{tier.toUpperCase()}</div>
      </div>

      {/* Staking Stats */}
      <div className="staking-stats">
        <div className="stat-row">
          <span className="stat-label">Your Stake</span>
          <span className="stat-value">{formatAmount(currentStaked)} NIGHT</span>
        </div>
        {stakeInfo && stakeInfo.rewards > 0n && (
          <div className="stat-row">
            <span className="stat-label">Pending Rewards</span>
            <span className="stat-value rewards">{formatAmount(stakeInfo.rewards)} NIGHT</span>
          </div>
        )}
        {balance && (
          <div className="stat-row">
            <span className="stat-label">Available Balance</span>
            <span className="stat-value">{formatAmount(balance.night)} NIGHT</span>
          </div>
        )}
      </div>

      {/* Tier Progress */}
      {tier !== 'vip' && (
        <div className="tier-progress">
          <div className="progress-header">
            <span>Progress to {progress.nextTier}</span>
            <span>{progress.percent.toFixed(1)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
          </div>
          <div className="progress-remaining">
            {formatAmount(progress.remaining)} NIGHT remaining
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={activeTab === 'stake' ? 'active' : ''}
          onClick={() => setActiveTab('stake')}
        >
          Stake
        </button>
        <button
          className={activeTab === 'unstake' ? 'active' : ''}
          onClick={() => setActiveTab('unstake')}
        >
          Unstake
        </button>
      </div>

      {/* Stake Form */}
      {activeTab === 'stake' && (
        <div className="stake-form">
          <div className="input-group">
            <input
              type="number"
              placeholder="0.0"
              value={stakeAmount}
              onChange={handleStakeAmountChange}
            />
            <button className="max-button" onClick={handleMaxStake}>MAX</button>
          </div>
          <button
            className="action-button"
            onClick={handleStake}
            disabled={!stakeAmount || isStaking}
          >
            {isStaking ? 'Staking...' : 'Stake NIGHT'}
          </button>
        </div>
      )}

      {/* Unstake Form */}
      {activeTab === 'unstake' && (
        <div className="unstake-form">
          <div className="input-group">
            <input
              type="number"
              placeholder="0.0"
              value={unstakeAmount}
              onChange={handleUnstakeAmountChange}
            />
            <button className="max-button" onClick={handleMaxUnstake}>MAX</button>
          </div>
          <button
            className="action-button"
            onClick={handleUnstake}
            disabled={!unstakeAmount || isStaking}
          >
            {isStaking ? 'Unstaking...' : 'Unstake NIGHT'}
          </button>
        </div>
      )}

      {/* Claim Rewards */}
      {stakeInfo && stakeInfo.rewards > 0n && (
        <button className="claim-button" onClick={handleClaimRewards}>
          Claim {formatAmount(stakeInfo.rewards)} NIGHT Rewards
        </button>
      )}

      {/* Premium Benefits */}
      <div className="benefits-section">
        <h3>Premium Benefits</h3>
        <div className="benefit-list">
          <div className={`benefit ${tier !== 'basic' ? 'unlocked' : ''}`}>
            <span className="benefit-icon">{tier !== 'basic' ? '✓' : '○'}</span>
            <span>Batch Swaps (up to 5)</span>
            <span className="benefit-threshold">100+ NIGHT</span>
          </div>
          <div className={`benefit ${tier === 'vip' ? 'unlocked' : ''}`}>
            <span className="benefit-icon">{tier === 'vip' ? '✓' : '○'}</span>
            <span>Reduced Fees (0.3%)</span>
            <span className="benefit-threshold">1000+ NIGHT</span>
          </div>
          <div className={`benefit ${tier === 'vip' ? 'unlocked' : ''}`}>
            <span className="benefit-icon">{tier === 'vip' ? '✓' : '○'}</span>
            <span>Priority Processing</span>
            <span className="benefit-threshold">1000+ NIGHT</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

// ============================================================================
// Styles
// ============================================================================

export const stakePanelStyles = `
  .zkswap-stake-panel {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 16px;
    padding: 24px;
    max-width: 480px;
  }

  .zkswap-stake-panel .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .zkswap-stake-panel .panel-header h2 {
    margin: 0;
    color: #e5e7eb;
    font-size: 20px;
  }

  .zkswap-stake-panel .tier-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .zkswap-stake-panel .tier-badge.basic {
    background: #374151;
    color: #9ca3af;
  }

  .zkswap-stake-panel .tier-badge.premium {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
  }

  .zkswap-stake-panel .tier-badge.vip {
    background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
    color: white;
  }

  .zkswap-stake-panel .staking-stats {
    background: #111827;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .zkswap-stake-panel .stat-row {
    display: flex;
    justify-content: space-between;
    padding: 6px 0;
  }

  .zkswap-stake-panel .stat-label {
    color: #9ca3af;
    font-size: 14px;
  }

  .zkswap-stake-panel .stat-value {
    color: #e5e7eb;
    font-size: 14px;
    font-weight: 500;
  }

  .zkswap-stake-panel .stat-value.rewards {
    color: #10b981;
  }

  .zkswap-stake-panel .tier-progress {
    background: #111827;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .zkswap-stake-panel .progress-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    color: #9ca3af;
    font-size: 13px;
  }

  .zkswap-stake-panel .progress-bar {
    height: 8px;
    background: #374151;
    border-radius: 4px;
    overflow: hidden;
  }

  .zkswap-stake-panel .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .zkswap-stake-panel .progress-remaining {
    margin-top: 8px;
    text-align: center;
    color: #6b7280;
    font-size: 12px;
  }

  .zkswap-stake-panel .panel-tabs {
    display: flex;
    gap: 4px;
    background: #111827;
    padding: 4px;
    border-radius: 10px;
    margin-bottom: 16px;
  }

  .zkswap-stake-panel .panel-tabs button {
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
  }

  .zkswap-stake-panel .panel-tabs button.active {
    background: #374151;
    color: #e5e7eb;
  }

  .zkswap-stake-panel .connect-prompt {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
  }

  .zkswap-stake-panel .input-group {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .zkswap-stake-panel .input-group input {
    flex: 1;
    padding: 14px;
    border: 1px solid #374151;
    border-radius: 10px;
    background: #111827;
    color: #e5e7eb;
    font-size: 16px;
    outline: none;
  }

  .zkswap-stake-panel .max-button {
    padding: 0 16px;
    border: 1px solid #6366f1;
    border-radius: 10px;
    background: transparent;
    color: #6366f1;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }

  .zkswap-stake-panel .action-button {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-stake-panel .action-button:disabled {
    background: #374151;
    color: #6b7280;
    cursor: not-allowed;
  }

  .zkswap-stake-panel .claim-button {
    width: 100%;
    margin-top: 12px;
    padding: 12px;
    border: 1px solid #10b981;
    border-radius: 10px;
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }

  .zkswap-stake-panel .benefits-section {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #374151;
  }

  .zkswap-stake-panel .benefits-section h3 {
    margin: 0 0 12px 0;
    color: #e5e7eb;
    font-size: 14px;
  }

  .zkswap-stake-panel .benefit-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .zkswap-stake-panel .benefit {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px;
    background: #111827;
    border-radius: 8px;
    color: #6b7280;
    font-size: 13px;
  }

  .zkswap-stake-panel .benefit.unlocked {
    color: #e5e7eb;
  }

  .zkswap-stake-panel .benefit-icon {
    width: 16px;
    text-align: center;
  }

  .zkswap-stake-panel .benefit.unlocked .benefit-icon {
    color: #10b981;
  }

  .zkswap-stake-panel .benefit-threshold {
    margin-left: auto;
    color: #6b7280;
    font-size: 11px;
  }

  .zkswap-stake-panel .error-message {
    background: #7f1d1d;
    color: #fca5a5;
    padding: 12px;
    border-radius: 8px;
    margin-top: 16px;
    font-size: 14px;
    text-align: center;
  }
`;

export default StakePanel;
