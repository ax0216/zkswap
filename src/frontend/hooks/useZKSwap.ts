/**
 * ZKSwap Vault - React Hook
 *
 * Custom React hook for interacting with the ZKSwap Vault contract.
 * Provides swap, stake, and liquidity operations with loading states.
 */

import { useState, useCallback, useEffect } from 'react';
import { ZKSwapClient } from '../../client/ZKSwapClient';
import { useWallet, MidnightWalletProvider } from '../context/WalletContext';
import type {
  SwapOrderInput,
  SwapResult,
  BatchSwapOrderInput,
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
  Bytes32,
  WalletProvider,
} from '../../types';

// ============================================================================
// Types
// ============================================================================

export interface UseZKSwapConfig {
  contractAddress?: string;
  rpcUrl?: string;
}

// Default configuration
const DEFAULT_CONFIG = {
  contractAddress: '0x0000000000000000000000000000000000000000000000000000000000000000' as const,
  rpcUrl: 'https://rpc.midnight.network',
};

// Protocol stats interface
export interface ProtocolStats {
  totalValueLocked: bigint;
  totalVolume24h: bigint;
  totalSwaps: number;
  totalPools: number;
  totalUsers: number;
  feesCollected24h: bigint;
}

// Pool display info
export interface PoolDisplayInfo {
  id: string;
  tokenA: { symbol: string; icon?: string };
  tokenB: { symbol: string; icon?: string };
  tvl: bigint;
  volume24h: bigint;
  apy: number;
  feeRate: number;
}

// LP Position
export interface LPPosition {
  poolId: string;
  shares: bigint;
  valueA: bigint;
  valueB: bigint;
  pendingRewards: bigint;
}

// Stake info
export interface StakeInfo {
  stakedAmount: bigint;
  rewards: bigint;
  lastStakeTime: Date;
  isPremium: boolean;
  tier: 'basic' | 'premium' | 'vip';
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
  isLoading: boolean;

  // User state
  isPremiumUser: boolean;
  stakedAmount: bigint;
  pendingRewards: bigint;

  // Contract state
  totalFeesCollected: bigint;
  feeRate: number;
  premiumThreshold: bigint;

  // Operations
  swap: (input: SwapOrderInput) => Promise<SwapResult>;
  batchSwap: (input: BatchSwapOrderInput) => Promise<BatchSwapResult>;
  stake: (input: StakeInput) => Promise<StakeResult>;
  unstake: (input: UnstakeInput) => Promise<UnstakeResult>;
  addLiquidity: (input: AddLiquidityInput) => Promise<AddLiquidityResult>;
  removeLiquidity: (input: RemoveLiquidityInput) => Promise<RemoveLiquidityResult>;
  claimRewards: () => Promise<ClaimRewardsResult>;

  // Queries
  getPoolInfo: (tokenA: string, tokenB: string) => Promise<PoolInfo | null>;
  getPools: () => Promise<PoolDisplayInfo[]>;
  getLPPositions: (address: string) => Promise<LPPosition[]>;
  getStakeInfo: (address: string) => Promise<StakeInfo>;
  getProtocolStats: () => Promise<ProtocolStats>;
  getQuote: (fromToken: string, toToken: string, amount: string) => Promise<{
    expectedOutput: string;
    priceImpact: number;
    fee: string;
  }>;
  estimateSwapOutput: (tokenIn: string, tokenOut: string, amountIn: bigint) => Promise<bigint>;
  estimateGas: (method: string, params: unknown[]) => Promise<GasEstimate>;

  // Refresh
  refreshState: () => Promise<void>;

  // Error handling
  error: string | null;
  clearError: () => void;
}

// ============================================================================
// Wallet Provider Adapter
// ============================================================================

function createWalletProviderAdapter(provider: MidnightWalletProvider, address: string): WalletProvider {
  return {
    getAddress: async () => address as Bytes32,
    signTransaction: async (tx) => {
      const signed = await provider.signTransaction(tx);
      return signed as any;
    },
    getBalance: async (tokenId: Bytes32) => {
      const balance = await provider.getBalance(address, tokenId);
      return BigInt(balance || '0');
    },
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useZKSwap(config: UseZKSwapConfig = {}): UseZKSwapReturn {
  const { provider, address, isConnected } = useWallet();

  // Merge with defaults
  const resolvedConfig = {
    contractAddress: config.contractAddress || DEFAULT_CONFIG.contractAddress,
    rpcUrl: config.rpcUrl || DEFAULT_CONFIG.rpcUrl,
  };

  // Client instance
  const [client, setClient] = useState<ZKSwapClient | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Loading states
  const [isSwapping, setIsSwapping] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [isRemovingLiquidity, setIsRemovingLiquidity] = useState(false);
  const [isClaimingRewards, setIsClaimingRewards] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      const walletAdapter = createWalletProviderAdapter(provider, address);

      const zkClient = new ZKSwapClient({
        contractAddress: resolvedConfig.contractAddress as Bytes32,
        rpcUrl: resolvedConfig.rpcUrl,
        walletProvider: walletAdapter,
      });

      setClient(zkClient);
      setIsInitialized(true);
    } else {
      setClient(null);
      setIsInitialized(false);
    }
  }, [isConnected, provider, address, resolvedConfig.contractAddress, resolvedConfig.rpcUrl]);

  // Refresh contract state
  const refreshState = useCallback(async () => {
    if (!client || !address) return;

    try {
      setIsLoading(true);
      const [fees, premium, staked, rewards] = await Promise.all([
        client.getTotalFeesCollected(),
        client.isPremiumUser(address as Bytes32),
        Promise.resolve(0n), // TODO: implement getStakedAmount
        Promise.resolve(0n), // TODO: implement getPendingRewards
      ]);

      setTotalFeesCollected(fees);
      setIsPremiumUser(premium);
      setStakedAmount(staked);
      setPendingRewards(rewards);
    } catch (err) {
      console.error('Failed to refresh state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [client, address]);

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
  const swap = useCallback(async (input: SwapOrderInput): Promise<SwapResult> => {
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
  const batchSwap = useCallback(async (input: BatchSwapOrderInput): Promise<BatchSwapResult> => {
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
    const publicInfo = await client.getPoolInfo(tokenA as Bytes32, tokenB as Bytes32);
    if (!publicInfo) return null;

    // Convert PublicPoolInfo to PoolInfo with reserve estimates
    return {
      poolId: publicInfo.poolId,
      tokenA: publicInfo.tokenA.tokenId,
      tokenB: publicInfo.tokenB.tokenId,
      reserveA: 0n, // Would need to query actual reserves
      reserveB: 0n,
      totalShares: publicInfo.totalShares,
      feeRate: publicInfo.feeRate,
    };
  }, [client]);

  // Get all pools
  const getPools = useCallback(async (): Promise<PoolDisplayInfo[]> => {
    // Mock implementation - in production this would query the contract
    return [
      {
        id: 'night-dust',
        tokenA: { symbol: 'NIGHT' },
        tokenB: { symbol: 'DUST' },
        tvl: 1000000000000000n,
        volume24h: 50000000000000n,
        apy: 12.5,
        feeRate: 0.5,
      },
      {
        id: 'night-usdc',
        tokenA: { symbol: 'NIGHT' },
        tokenB: { symbol: 'USDC' },
        tvl: 500000000000000n,
        volume24h: 25000000000000n,
        apy: 8.2,
        feeRate: 0.5,
      },
    ];
  }, []);

  // Get LP positions
  const getLPPositions = useCallback(async (_address: string): Promise<LPPosition[]> => {
    // Mock implementation - in production this would query the contract
    return [];
  }, []);

  // Get stake info
  const getStakeInfo = useCallback(async (_address: string): Promise<StakeInfo> => {
    return {
      stakedAmount,
      rewards: pendingRewards,
      lastStakeTime: new Date(),
      isPremium: isPremiumUser,
      tier: stakedAmount >= 1000_000_000_000n ? 'vip' : stakedAmount >= 100_000_000_000n ? 'premium' : 'basic',
    };
  }, [stakedAmount, pendingRewards, isPremiumUser]);

  // Get protocol stats
  const getProtocolStats = useCallback(async (): Promise<ProtocolStats> => {
    return {
      totalValueLocked: 1500000000000000n,
      totalVolume24h: 75000000000000n,
      totalSwaps: 15432,
      totalPools: 5,
      totalUsers: 1234,
      feesCollected24h: 375000000000n,
    };
  }, []);

  // Get swap quote
  const getQuote = useCallback(async (
    _fromToken: string,
    _toToken: string,
    amount: string
  ): Promise<{ expectedOutput: string; priceImpact: number; fee: string }> => {
    const amountNum = parseFloat(amount) || 0;
    const fee = amountNum * 0.005;
    const output = amountNum - fee;

    return {
      expectedOutput: output.toFixed(6),
      priceImpact: amountNum > 10000 ? 0.5 : 0.1,
      fee: fee.toFixed(6),
    };
  }, []);

  // Estimate swap output
  const estimateSwapOutput = useCallback(async (
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint
  ): Promise<bigint> => {
    const poolInfo = await getPoolInfo(tokenIn, tokenOut);
    if (!poolInfo) return 0n;

    // Simple constant product formula
    const fee = amountIn * 50n / 10000n; // 0.5% fee
    const amountInAfterFee = amountIn - fee;
    const output = (amountInAfterFee * poolInfo.reserveB) / (poolInfo.reserveA + amountInAfterFee);
    return output;
  }, [getPoolInfo]);

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
    isLoading,
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
    getPools,
    getLPPositions,
    getStakeInfo,
    getProtocolStats,
    getQuote,
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
