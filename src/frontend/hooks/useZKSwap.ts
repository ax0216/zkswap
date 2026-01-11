/**
 * ZKSwap Vault - React Hook
 *
 * Custom React hook for interacting with the ZKSwap Vault contract.
 * Provides swap, stake, and liquidity operations with loading states.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { ZKSwapClient } from '../../client/ZKSwapClient';
import { useWallet } from '../context/WalletContext';
import type {
  SwapInput,
  SwapResult,
  BatchSwapInput,
  BatchSwapResult,
  StakeInput,
  StakeResult,
  UnstakeInput,
  UnstakeResult,
  AddLiquidityInput,
  AddLiquidityResult,
  RemoveLiquidityInput,
  RemoveLiquidityResult,
  ClaimRewardsResult,
  PoolInfo,
  GasEstimate,
} from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface UseZKSwapConfig {
  contractAddress: string;
  rpcUrl: string;
}

export interface UseZKSwapReturn {
  // Client instance
  client: ZKSwapClient | null;
  isInitialized: boolean;

  // Loading states
  isSwapping: boolean;
  isStaking: boolean;
  isAddingLiquidity: boolean;
  isRemovingLiquidity: boolean;
  isClaimingRewards: boolean;

  // User state
  isPremiumUser: boolean;
  stakedAmount: bigint;
  pendingRewards: bigint;

  // Contract state
  totalFeesCollected: bigint;
  feeRate: number;
  premiumThreshold: bigint;

  // Operations
  swap: (input: SwapInput) => Promise<SwapResult>;
  batchSwap: (input: BatchSwapInput) => Promise<BatchSwapResult>;
  stake: (input: StakeInput) => Promise<StakeResult>;
  unstake: (input: UnstakeInput) => Promise<UnstakeResult>;
  addLiquidity: (input: AddLiquidityInput) => Promise<AddLiquidityResult>;
  removeLiquidity: (input: RemoveLiquidityInput) => Promise<RemoveLiquidityResult>;
  claimRewards: () => Promise<ClaimRewardsResult>;

  // Queries
  getPoolInfo: (tokenA: string, tokenB: string) => Promise<PoolInfo | null>;
  estimateSwapOutput: (tokenIn: string, tokenOut: string, amountIn: bigint) => Promise<bigint>;
  estimateGas: (method: string, params: unknown[]) => Promise<GasEstimate>;

  // Refresh
  refreshState: () => Promise<void>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useZKSwap(config: UseZKSwapConfig): UseZKSwapReturn {
  const { provider, address, isConnected } = useWallet();

  // Client instance
  const [client, setClient] = useState<ZKSwapClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Loading states
  const [isSwapping, setIsSwapping] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);

  // User state
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [stakedAmount, setStakedAmount] = useState(0n);
  const [pendingRewards, setPendingRewards] = useState(0n);

  // Contract state
  const [totalFeesCollected, setTotalFeesCollected] = useState(0n);
  const [feeRate, setFeeRate] = useState(50); // 0.5% = 50 basis points
  const [premiumThreshold, setPremiumThreshold] = useState(100_000_000_000n); // 100 NIGHT

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Initialize client when wallet connects
  useEffect(() => {
    if (isConnected && provider && address) {
      const zkClient = new ZKSwapClient({
        contractAddress: config.contractAddress,
        rpcUrl: config.rpcUrl,
        walletProvider: provider,
      });

      setClient(zkClient);
      setIsInitialized(true);
    } else {
      setClient(null);
      setIsInitialized(false);
    }
  }, [isConnected, provider, address, config.contractAddress, config.rpcUrl]);

  // Refresh contract state
  const refreshState = useCallback(async () => {
    if (!client) return;

    try {
      const [fees, rate, threshold, premium, staked, rewards] = await Promise.all([
        client.getTotalFeesCollected(),
        client.getFeeRate(),
        client.getPremiumThreshold(),
        client.isPremiumUser(),
        client.getStakedAmount(),
        client.getPendingRewards(),
      ]);

      setTotalFeesCollected(fees);
      setFeeRate(rate);
      setPremiumThreshold(threshold);
      setIsPremiumUser(premium);
      setStakedAmount(staked);
      setPendingRewards(rewards);
    } catch (err) {
      console.error('Failed to refresh state:', err);
    }
  }, [client]);

  // Refresh state when client initializes
  useEffect(() => {
    if (isInitialized) {
      refreshState();
    }
  }, [isInitialized, refreshState]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Swap operation
  const swap = useCallback(async (input: SwapInput): Promise<SwapResult> => {
    if (!client) throw new Error('Client not initialized');

    setIsSwapping(true);
    setError(null);

    try {
      const result = await client.swap(input);
      await refreshState();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Swap failed';
      setError(message);
      throw err;
    } finally {
      setIsSwapping(false);
    }
  }, [client, refreshState]);

  // Batch swap operation
  const batchSwap = useCallback(async (input: BatchSwapInput): Promise<BatchSwapResult> => {
    if (!client) throw new Error('Client not initialized');

    setIsSwapping(true);
    setError(null);

    try {
      const result = await client.batchSwap(input);
      await refreshState();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Batch swap failed';
      setError(message);
      throw err;
    } finally {
      setIsSwapping(false);
    }
  }, [client, refreshState]);

  // Stake operation
  const stake = useCallback(async (input: StakeInput): Promise<StakeResult> => {
    if (!client) throw new Error('Client not initialized');

    setIsStaking(true);
    setError(null);

    try {
      const result = await client.stake(input);
      await refreshState();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stake failed';
      setError(message);
      throw err;
    } finally {
      setIsStaking(false);
    }
  }, [client, refreshState]);

  // Unstake operation
  const unstake = useCallback(async (input: UnstakeInput): Promise<UnstakeResult> => {
    if (!client) throw new Error('Client not initialized');

    setIsStaking(true);
    setError(null);

    try {
      const result = await client.unstake(input);
      await refreshState();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unstake failed';
      setError(message);
      throw err;
    } finally {
      setIsStaking(false);
    }
  }, [client, refreshState]);

  // Add liquidity operation
  const addLiquidity = useCallback(async (input: AddLiquidityInput): Promise<AddLiquidityResult> => {
    if (!client) throw new Error('Client not initialized');

    setIsAddingLiquidity(true);
    setError(null);

    try {
      const result = await client.addLiquidity(input);
      await refreshState();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Add liquidity failed';
      setError(message);
      throw err;
    } finally {
      setIsAddingLiquidity(false);
    }
  }, [client, refreshState]);

  // Remove liquidity operation
  const removeLiquidity = useCallback(async (input: RemoveLiquidityInput): Promise<RemoveLiquidityResult> => {
    if (!client) throw new Error('Client not initialized');

    setIsRemovingLiquidity(true);
    setError(null);

    try {
      const result = await client.removeLiquidity(input);
      await refreshState();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Remove liquidity failed';
      setError(message);
      throw err;
    } finally {
      setIsRemovingLiquidity(false);
    }
  }, [client, refreshState]);

  // Claim rewards operation
  const claimRewards = useCallback(async (): Promise<ClaimRewardsResult> => {
    if (!client) throw new Error('Client not initialized');

    setIsClaimingRewards(true);
    setError(null);

    try {
      const result = await client.claimRewards();
      await refreshState();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Claim rewards failed';
      setError(message);
      throw err;
    } finally {
      setIsClaimingRewards(false);
    }
  }, [client, refreshState]);

  // Get pool info
  const getPoolInfo = useCallback(async (tokenA: string, tokenB: string): Promise<PoolInfo | null> => {
    if (!client) return null;
    return client.getPoolInfo(tokenA, tokenB);
  }, [client]);

  // Estimate swap output
  const estimateSwapOutput = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<bigint> => {
    if (!client) throw new Error('Client not initialized');
    return client.estimateSwapOutput(tokenIn, tokenOut, amountIn);
  }, [client]);

  // Estimate gas
  const estimateGas = useCallback(async (method: string, params: unknown[]): Promise<GasEstimate> => {
    if (!client) throw new Error('Client not initialized');
    return client.estimateGas(method, params);
  }, [client]);

  return {
    client,
    isInitialized,
    isSwapping,
    isStaking,
    isAddingLiquidity,
    isRemovingLiquidity,
    isClaimingRewards,
    isPremiumUser,
    stakedAmount,
    pendingRewards,
    totalFeesCollected,
    feeRate,
    premiumThreshold,
    swap,
    batchSwap,
    stake,
    unstake,
    addLiquidity,
    removeLiquidity,
    claimRewards,
    getPoolInfo,
    estimateSwapOutput,
    estimateGas,
    refreshState,
    error,
    clearError,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for polling pool info
 */
export function usePoolInfo(
  zkSwap: UseZKSwapReturn,
  tokenA: string,
  tokenB: string,
  pollInterval = 30000
) {
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPoolInfo = async () => {
      if (!zkSwap.isInitialized) return;

      try {
        const info = await zkSwap.getPoolInfo(tokenA, tokenB);
        if (mounted) {
          setPoolInfo(info);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch pool info:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPoolInfo();
    const interval = setInterval(fetchPoolInfo, pollInterval);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [zkSwap, tokenA, tokenB, pollInterval]);

  return { poolInfo, isLoading };
}

/**
 * Hook for swap quote
 */
export function useSwapQuote(
  zkSwap: UseZKSwapReturn,
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  debounceMs = 500
) {
  const [quote, setQuote] = useState<bigint>(0n);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!zkSwap.isInitialized || amountIn === 0n) {
      setQuote(0n);
      return;
    }

    setIsLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const output = await zkSwap.estimateSwapOutput(tokenIn, tokenOut, amountIn);
        setQuote(output);
      } catch (err) {
        console.error('Failed to get swap quote:', err);
        setQuote(0n);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [zkSwap, tokenIn, tokenOut, amountIn, debounceMs]);

  return { quote, isLoading };
}
