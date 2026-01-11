/**
 * ZKSwap Vault DApp - Main Entry Point
 *
 * A privacy-preserving decentralized exchange protocol built on Midnight.
 *
 * Features:
 * - Private asset swaps using Zswap for anonymous transfers
 * - ZK proofs to verify balances without revealing them
 * - 0.5% fee in DUST per swap, collected to developer wallet
 * - Premium tier: Stake >100 NIGHT for batch swaps (up to 5 assets)
 * - Event emission for on-chain tracking
 *
 * @module zkswap-vault
 * @version 1.0.0
 * @author ZKSwap Team
 *
 * @example
 * ```typescript
 * import { ZKSwapClient, CONSTANTS } from 'zkswap-vault';
 *
 * // Initialize client
 * const client = new ZKSwapClient({
 *   contractAddress: CONTRACT_ADDRESS,
 *   rpcUrl: 'https://rpc.midnight.network',
 *   walletProvider: myWallet,
 * });
 *
 * // Execute a private swap
 * const result = await client.swap({
 *   inputTokenId: NIGHT_TOKEN,
 *   inputAmount: 1000000000n,
 *   outputTokenId: DUST_TOKEN,
 *   minOutputAmount: 950000000n,
 *   deadlineBlocks: 100,
 * });
 *
 * console.log('Swap completed:', result.swapId);
 * console.log('Fee paid:', result.feeCollected, 'DUST');
 * ```
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export {
  // Primitive types
  Bytes32,
  Field,
  WitnessField,

  // Asset types
  Asset,
  PublicAsset,

  // Swap types
  SwapOrder,
  SwapOrderInput,
  SwapResult,
  BatchSwapOrder,
  BatchSwapOrderInput,
  BatchSwapResult,

  // Staking types
  StakeInfo,
  PublicStakeInfo,
  StakeInput,
  StakeResult,
  UnstakeInput,

  // Liquidity types
  LiquidityPool,
  PublicPoolInfo,
  AddLiquidityInput,
  AddLiquidityResult,

  // ZK proof types
  BalanceProof,
  ZswapCommitment,
  ZswapTransferProof,

  // Event types
  BaseEvent,
  SwapExecutedEvent,
  BatchSwapExecutedEvent,
  StakedEvent,
  UnstakedEvent,
  FeesCollectedEvent,
  LiquidityAddedEvent,
  ZKSwapEvent,

  // Configuration types
  ContractConfig,
  ContractState,
  ZKSwapClientConfig,
  WalletProvider,
  ZKProver,

  // Error types
  ZKSwapError,
  ZKSwapErrorCode,

  // Constants
  CONSTANTS,
} from './types';

// ============================================================================
// CLIENT EXPORTS
// ============================================================================

export { ZKSwapClient } from './client/ZKSwapClient';
export { default as ZKSwapClientDefault } from './client/ZKSwapClient';

// ============================================================================
// PROOF EXPORTS
// ============================================================================

export { ZKProofGenerator } from './proofs/ZKProofGenerator';
export { default as ZKProofGeneratorDefault } from './proofs/ZKProofGenerator';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export { ZswapIntegration } from './utils/ZswapIntegration';
export { default as ZswapIntegrationDefault } from './utils/ZswapIntegration';

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

import { ZKSwapClient } from './client/ZKSwapClient';
import { ZKSwapClientConfig, Bytes32 } from './types';

/**
 * Create a new ZKSwap client instance
 *
 * Factory function for creating ZKSwapClient with default configuration.
 *
 * @param config - Client configuration
 * @returns Configured ZKSwapClient instance
 *
 * @example
 * ```typescript
 * const client = createZKSwapClient({
 *   contractAddress: '0x...',
 *   rpcUrl: 'https://rpc.midnight.network',
 *   walletProvider: myWallet,
 * });
 * ```
 */
export function createZKSwapClient(config: ZKSwapClientConfig): ZKSwapClient {
  return new ZKSwapClient(config);
}

/**
 * Default contract addresses for Midnight networks
 */
export const CONTRACT_ADDRESSES = {
  /** Mainnet contract address */
  MAINNET: '0x0000000000000000000000000000000000000000000000000000000000000000' as Bytes32,
  /** Testnet contract address */
  TESTNET: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32,
  /** Devnet contract address */
  DEVNET: '0x0000000000000000000000000000000000000000000000000000000000000002' as Bytes32,
} as const;

/**
 * Default token IDs for Midnight networks
 */
export const TOKEN_IDS = {
  /** NIGHT token (governance/staking) */
  NIGHT: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32,
  /** DUST token (utility/fees) */
  DUST: '0x0000000000000000000000000000000000000000000000000000000000000002' as Bytes32,
} as const;

/**
 * RPC endpoints for Midnight networks
 */
export const RPC_ENDPOINTS = {
  /** Mainnet RPC */
  MAINNET: 'https://rpc.midnight.network',
  /** Testnet RPC */
  TESTNET: 'https://testnet-rpc.midnight.network',
  /** Devnet RPC */
  DEVNET: 'https://devnet-rpc.midnight.network',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate fee for a given swap amount
 *
 * @param amount - Swap amount
 * @returns Fee amount (0.5%)
 *
 * @example
 * ```typescript
 * const fee = calculateSwapFee(1000000000n);
 * console.log('Fee:', fee); // 5000000n (0.5%)
 * ```
 */
export function calculateSwapFee(amount: bigint): bigint {
  return (amount * BigInt(50)) / BigInt(10000);
}

/**
 * Check if an amount qualifies for premium tier
 *
 * @param stakedAmount - Amount of NIGHT staked
 * @returns Whether amount qualifies for premium
 *
 * @example
 * ```typescript
 * const isPremium = isPremiumEligible(150000000000n);
 * console.log('Premium:', isPremium); // true (150 > 100 NIGHT)
 * ```
 */
export function isPremiumEligible(stakedAmount: bigint): boolean {
  return stakedAmount > BigInt('100000000000');
}

/**
 * Format token amount for display
 *
 * @param amount - Raw token amount
 * @param decimals - Token decimals (default: 9)
 * @returns Formatted string
 *
 * @example
 * ```typescript
 * const formatted = formatTokenAmount(1500000000n);
 * console.log(formatted); // "1.5"
 * ```
 */
export function formatTokenAmount(amount: bigint, decimals: number = 9): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;

  if (fraction === 0n) {
    return whole.toString();
  }

  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole}.${fractionStr}`;
}

/**
 * Parse token amount from string
 *
 * @param amountStr - Amount string (e.g., "1.5")
 * @param decimals - Token decimals (default: 9)
 * @returns Raw token amount
 *
 * @example
 * ```typescript
 * const amount = parseTokenAmount("1.5");
 * console.log(amount); // 1500000000n
 * ```
 */
export function parseTokenAmount(amountStr: string, decimals: number = 9): bigint {
  const parts = amountStr.split('.');
  const whole = BigInt(parts[0] || '0');

  if (parts.length === 1) {
    return whole * BigInt(10 ** decimals);
  }

  const fractionStr = (parts[1] || '0').padEnd(decimals, '0').slice(0, decimals);
  const fraction = BigInt(fractionStr);

  return whole * BigInt(10 ** decimals) + fraction;
}

// ============================================================================
// VERSION INFO
// ============================================================================

/**
 * Package version information
 */
export const VERSION = {
  /** Package version */
  version: '1.0.0',
  /** Compact contract version */
  contractVersion: '1.0.0',
  /** Minimum supported Midnight version */
  minMidnightVersion: '0.16.0',
} as const;
