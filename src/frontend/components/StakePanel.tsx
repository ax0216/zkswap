/**
 * ZKSwap Vault - Stake Panel Component
 *
 * Staking interface for NIGHT tokens to unlock premium features.
 * Shows current stake, premium status, and rewards.
 */

import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useZKSwap } from '../hooks/useZKSwap';

// ============================================================================
// Types
// ============================================================================

interface StakePanelProps {
  className?: string;
  onStakeComplete?: (txHash: string) => void;
}

interface StakeInfo {
  stakedAmount: bigint;
  rewards: bigint;
  lastStakeTime: Date;
  isPremium: boolean;
  tier: 'basic' | 'premium' | 'vip';
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
  const { stake, unstake, claimRewards, getStakeInfo, isLoading, error } = useZKSwap();

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
  const formatAmount = (amount: bigint): string => {
    const divisor = 10n ** BigInt(DECIMALS);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    const fractionStr = fraction.toString().padStart(DECIMALS, '0').slice(0, 4);
    return `${whole.toLocaleString()}.${fractionStr}`;
  };

  // Parse amount from input
  const parseAmount = (value: string): bigint => {
    const [whole, fraction = ''] = value.split('.');
    const paddedFraction = fraction.padEnd(DECIMALS, '0').slice(0, DECIMALS);
    return BigInt(whole || '0') * 10n ** BigInt(DECIMALS) + BigInt(paddedFraction);
  };

  // Calculate tier
  const getTier = (amount: bigint): 'basic' | 'premium' | 'vip' => {
    if (amount >= VIP_THRESHOLD) return 'vip';
    if (amount >= PREMIUM_THRESHOLD) return 'premium';
    return 'basic';
  };

  // Calculate progress to next tier
  const getProgressToNextTier = (amount: bigint): { percent: number; remaining: bigint; nextTier: string } => {
    if (amount >= VIP_THRESHOLD) {
      return { percent: 100, remaining: 0n, nextTier: 'VIP' };
    }
    if (amount >= PREMIUM_THRESHOLD) {
      const progress = Number((amount - PREMIUM_THRESHOLD) * 100n / (VIP_THRESHOLD - PREMIUM_THRESHOLD));
      return { percent: progress, remaining: VIP_THRESHOLD - amount, nextTier: 'VIP' };
    }
    const progress = Number(amount * 100n / PREMIUM_THRESHOLD);
    return { percent: progress, remaining: PREMIUM_THRESHOLD - amount, nextTier: 'Premium' };
  };

  // Handle stake
  const handleStake = async () => {
    if (!stakeAmount) return;

    try {
      const amount = parseAmount(stakeAmount);
      const txHash = await stake(amount);
      onStakeComplete?.(txHash);
      setStakeAmount('');
      // Refresh stake info
      const info = await getStakeInfo(address!);
      setStakeInfo(info);
    } catch (err) {
      console.error('Stake failed:', err);
    }
  };

  // Handle unstake
  const handleUnstake = async () => {
    if (!unstakeAmount) return;

    try {
      const amount = parseAmount(unstakeAmount);
      const txHash = await unstake(amount);
      onStakeComplete?.(txHash);
      setUnstakeAmount('');
      // Refresh stake info
      const info = await getStakeInfo(address!);
      setStakeInfo(info);
    } catch (err) {
      console.error('Unstake failed:', err);
    }
  };

  // Handle claim rewards
  const handleClaimRewards = async () => {
    if (!stakeInfo || stakeInfo.rewards <= 0n) return;

    try {
      const txHash = await claimRewards();
      onStakeComplete?.(txHash);
      // Refresh stake info
      const info = await getStakeInfo(address!);
      setStakeInfo(info);
    } catch (err) {
      console.error('Claim failed:', err);
    }
  };

  // Set max amount
  const setMaxStake = () => {
    if (balance?.night) {
      setStakeAmount(formatAmount(balance.night));
    }
  };

  const setMaxUnstake = () => {
    if (stakeInfo?.stakedAmount) {
      setUnstakeAmount(formatAmount(stakeInfo.stakedAmount));
    }
  };

  if (!isConnected) {
    return (
      <div className={`zkswap-stake-panel ${className}`}>
        <div className="stake-header">
          <h2>Stake NIGHT</h2>
        </div>
        <div className="connect-prompt">
          <p>Connect your wallet to stake NIGHT and unlock premium features</p>
        </div>
      </div>
    );
  }

  const progress = stakeInfo ? getProgressToNextTier(stakeInfo.stakedAmount) : null;

  return (
    <div className={`zkswap-stake-panel ${className}`}>
      {/* Header */}
      <div className="stake-header">
        <h2>Stake NIGHT</h2>
        {stakeInfo && (
          <span className={`tier-badge tier-${stakeInfo.tier}`}>
            {stakeInfo.tier.toUpperCase()}
          </span>
        )}
      </div>

      {/* Stake Info Card */}
      {isLoadingInfo ? (
        <div className="loading-state">Loading stake info...</div>
      ) : stakeInfo ? (
        <div className="stake-info-card">
          <div className="info-row">
            <span className="label">Your Stake</span>
            <span className="value">{formatAmount(stakeInfo.stakedAmount)} NIGHT</span>
          </div>
          <div className="info-row">
            <span className="label">Pending Rewards</span>
            <span className="value rewards">{formatAmount(stakeInfo.rewards)} NIGHT</span>
          </div>

          {/* Progress to next tier */}
          {progress && progress.percent < 100 && (
            <div className="tier-progress">
              <div className="progress-header">
                <span>Progress to {progress.nextTier}</span>
                <span>{progress.percent.toFixed(1)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <span className="remaining">
                {formatAmount(progress.remaining)} NIGHT remaining
              </span>
            </div>
          )}

          {/* Claim Rewards Button */}
          {stakeInfo.rewards > 0n && (
            <button
              className="claim-button"
              onClick={handleClaimRewards}
              disabled={isLoading}
            >
              {isLoading ? 'Claiming...' : `Claim ${formatAmount(stakeInfo.rewards)} NIGHT`}
            </button>
          )}
        </div>
      ) : (
        <div className="stake-info-card empty">
          <p>No stake found. Stake NIGHT to unlock premium features!</p>
        </div>
      )}

      {/* Premium Benefits */}
      <div className="benefits-section">
        <h3>Premium Benefits</h3>
        <ul className="benefits-list">
          <li className={stakeInfo?.isPremium ? 'unlocked' : ''}>
            <span className="check">{stakeInfo?.isPremium ? '✓' : '○'}</span>
            Batch swaps (up to 5 assets at once)
          </li>
          <li className={stakeInfo?.tier === 'vip' ? 'unlocked' : ''}>
            <span className="check">{stakeInfo?.tier === 'vip' ? '✓' : '○'}</span>
            Reduced fees (0.3% instead of 0.5%)
          </li>
          <li className={stakeInfo?.tier === 'vip' ? 'unlocked' : ''}>
            <span className="check">{stakeInfo?.tier === 'vip' ? '✓' : '○'}</span>
            Priority transaction processing
          </li>
        </ul>
      </div>

      {/* Tabs */}
      <div className="stake-tabs">
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

      {/* Stake/Unstake Form */}
      <div className="stake-form">
        {activeTab === 'stake' ? (
          <>
            <div className="input-group">
              <label>Amount to Stake</label>
              <div className="input-row">
                <input
                  type="number"
                  placeholder="0.0"
                  value={stakeAmount}
                  onChange={e => setStakeAmount(e.target.value)}
                />
                <button className="max-button" onClick={setMaxStake}>
                  MAX
                </button>
              </div>
              {balance && (
                <span className="balance-hint">
                  Available: {formatAmount(balance.night)} NIGHT
                </span>
              )}
            </div>
            <button
              className="action-button stake"
              onClick={handleStake}
              disabled={!stakeAmount || isLoading}
            >
              {isLoading ? 'Staking...' : 'Stake NIGHT'}
            </button>
          </>
        ) : (
          <>
            <div className="input-group">
              <label>Amount to Unstake</label>
              <div className="input-row">
                <input
                  type="number"
                  placeholder="0.0"
                  value={unstakeAmount}
                  onChange={e => setUnstakeAmount(e.target.value)}
                />
                <button className="max-button" onClick={setMaxUnstake}>
                  MAX
                </button>
              </div>
              {stakeInfo && (
                <span className="balance-hint">
                  Staked: {formatAmount(stakeInfo.stakedAmount)} NIGHT
                </span>
              )}
            </div>
            <button
              className="action-button unstake"
              onClick={handleUnstake}
              disabled={!unstakeAmount || isLoading}
            >
              {isLoading ? 'Unstaking...' : 'Unstake NIGHT'}
            </button>
          </>
        )}
      </div>

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

export const stakePanelStyles = `
  .zkswap-stake-panel {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 16px;
    padding: 24px;
    max-width: 480px;
  }

  .zkswap-stake-panel .stake-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .zkswap-stake-panel .stake-header h2 {
    margin: 0;
    color: #e5e7eb;
    font-size: 20px;
  }

  .zkswap-stake-panel .tier-badge {
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .zkswap-stake-panel .tier-basic {
    background: #374151;
    color: #9ca3af;
  }

  .zkswap-stake-panel .tier-premium {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
  }

  .zkswap-stake-panel .tier-vip {
    background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
    color: white;
  }

  .zkswap-stake-panel .connect-prompt {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
  }

  .zkswap-stake-panel .loading-state {
    text-align: center;
    padding: 20px;
    color: #9ca3af;
  }

  .zkswap-stake-panel .stake-info-card {
    background: #111827;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .zkswap-stake-panel .stake-info-card.empty {
    text-align: center;
    color: #9ca3af;
  }

  .zkswap-stake-panel .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
  }

  .zkswap-stake-panel .info-row .label {
    color: #9ca3af;
    font-size: 14px;
  }

  .zkswap-stake-panel .info-row .value {
    color: #e5e7eb;
    font-size: 16px;
    font-weight: 600;
  }

  .zkswap-stake-panel .info-row .value.rewards {
    color: #10b981;
  }

  .zkswap-stake-panel .tier-progress {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #374151;
  }

  .zkswap-stake-panel .progress-header {
    display: flex;
    justify-content: space-between;
    color: #9ca3af;
    font-size: 12px;
    margin-bottom: 8px;
  }

  .zkswap-stake-panel .progress-bar {
    height: 8px;
    background: #374151;
    border-radius: 4px;
    overflow: hidden;
  }

  .zkswap-stake-panel .progress-fill {
    height: 100%;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .zkswap-stake-panel .remaining {
    display: block;
    margin-top: 4px;
    color: #6b7280;
    font-size: 11px;
  }

  .zkswap-stake-panel .claim-button {
    width: 100%;
    margin-top: 16px;
    padding: 12px;
    border: none;
    border-radius: 8px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-stake-panel .claim-button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .zkswap-stake-panel .benefits-section {
    margin-bottom: 20px;
  }

  .zkswap-stake-panel .benefits-section h3 {
    color: #9ca3af;
    font-size: 14px;
    margin: 0 0 12px 0;
  }

  .zkswap-stake-panel .benefits-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .zkswap-stake-panel .benefits-list li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    color: #6b7280;
    font-size: 14px;
  }

  .zkswap-stake-panel .benefits-list li.unlocked {
    color: #10b981;
  }

  .zkswap-stake-panel .benefits-list li .check {
    width: 20px;
    text-align: center;
  }

  .zkswap-stake-panel .stake-tabs {
    display: flex;
    gap: 4px;
    background: #111827;
    padding: 4px;
    border-radius: 10px;
    margin-bottom: 16px;
  }

  .zkswap-stake-panel .stake-tabs button {
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

  .zkswap-stake-panel .stake-tabs button.active {
    background: #374151;
    color: #e5e7eb;
  }

  .zkswap-stake-panel .stake-form {
    margin-bottom: 16px;
  }

  .zkswap-stake-panel .input-group {
    margin-bottom: 16px;
  }

  .zkswap-stake-panel .input-group label {
    display: block;
    color: #9ca3af;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .zkswap-stake-panel .input-row {
    display: flex;
    gap: 8px;
  }

  .zkswap-stake-panel .input-row input {
    flex: 1;
    padding: 14px;
    border: 1px solid #374151;
    border-radius: 10px;
    background: #111827;
    color: #e5e7eb;
    font-size: 18px;
    outline: none;
  }

  .zkswap-stake-panel .input-row input:focus {
    border-color: #6366f1;
  }

  .zkswap-stake-panel .max-button {
    padding: 14px 16px;
    border: 1px solid #374151;
    border-radius: 10px;
    background: transparent;
    color: #6366f1;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-stake-panel .max-button:hover {
    background: rgba(99, 102, 241, 0.1);
  }

  .zkswap-stake-panel .balance-hint {
    display: block;
    margin-top: 8px;
    color: #6b7280;
    font-size: 12px;
  }

  .zkswap-stake-panel .action-button {
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .zkswap-stake-panel .action-button.stake {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
  }

  .zkswap-stake-panel .action-button.unstake {
    background: #374151;
    color: #e5e7eb;
  }

  .zkswap-stake-panel .action-button:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  .zkswap-stake-panel .action-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .zkswap-stake-panel .error-message {
    background: #7f1d1d;
    color: #fca5a5;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
    text-align: center;
  }
`;

export default StakePanel;
