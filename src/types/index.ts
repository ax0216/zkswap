/**
 * ZKSwap Vault DApp - TypeScript Type Definitions
 *
 * These types mirror the Compact contract types and provide
 * type-safe interfaces for client-side interaction.
 *
 * @module types
 */

// ============================================================================
// PRIMITIVE TYPES
// ============================================================================

/**
 * 32-byte hex string representing addresses and token IDs
 */
export type Bytes32 = `0x${string}`;

/**
 * Field element - represents large integers in the ZK circuit
 */
export type Field = bigint;

/**
 * Witness field - private data that's hidden in ZK proofs
 */
export type WitnessField = {
  value: bigint;
  isPrivate: true;
};

// ============================================================================
// ASSET TYPES
// ============================================================================

/**
 * Represents an asset with its token ID and amount
 * The amount is kept private using witness fields
 */
export interface Asset {
  /** Unique identifier for the token (32 bytes) */
  tokenId: Bytes32;
  /** Private amount hidden in ZK proof */
  amount: WitnessField;
}

/**
 * Public asset information (without private amount)
 */
export interface PublicAsset {
  tokenId: Bytes32;
  symbol: string;
  name: string;
  decimals: number;
}

// ============================================================================
// SWAP TYPES
// ============================================================================

/**
 * Swap order structure containing input/output assets
 */
export interface SwapOrder {
  /** Asset being swapped in */
  inputAsset: Asset;
  /** Asset being received */
  outputAsset: Asset;
  /** Minimum expected output (slippage protection) */
  minOutputAmount: WitnessField;
  /** Block number deadline for swap execution */
  deadline: Field;
}

/**
 * Client-side swap order (before witness conversion)
 */
export interface SwapOrderInput {
  inputTokenId: Bytes32;
  inputAmount: bigint;
  outputTokenId: Bytes32;
  minOutputAmount: bigint;
  deadlineBlocks: number;
}

/**
 * Batch swap order for premium users (up to 5 assets)
 */
export interface BatchSwapOrder {
  /** Array of 5 swap orders (unused slots have zero values) */
  orders: SwapOrder[];
  /** Number of active orders (1-5) */
  activeCount: Field;
}

/**
 * Client-side batch swap input
 */
export interface BatchSwapOrderInput {
  orders: SwapOrderInput[];
}

/**
 * Swap execution result
 */
export interface SwapResult {
  /** Unique swap identifier */
  swapId: Bytes32;
  /** Transaction hash */
  txHash: Bytes32;
  /** Fee collected in DUST */
  feeCollected: bigint;
  /** Block number when executed */
  blockNumber: number;
  /** Timestamp of execution */
  timestamp: number;
}

/**
 * Batch swap execution result
 */
export interface BatchSwapResult {
  /** Unique batch identifier */
  batchId: Bytes32;
  /** Transaction hash */
  txHash: Bytes32;
  /** Number of swaps executed */
  swapCount: number;
  /** Total fees collected in DUST */
  totalFeeCollected: bigint;
  /** Timestamp of execution */
  timestamp: number;
}

// ============================================================================
// STAKING TYPES
// ============================================================================

/**
 * User stake information for premium tier
 */
export interface StakeInfo {
  /** Staked NIGHT amount (private) */
  amount: WitnessField;
  /** Block number when staked */
  stakedAt: Field;
  /** Whether user has premium tier (>100 NIGHT) */
  isPremium: boolean;
}

/**
 * Public stake information
 */
export interface PublicStakeInfo {
  /** Whether user has premium tier */
  isPremium: boolean;
  /** Block number when staked */
  stakedAt: number;
}

/**
 * Stake input parameters
 */
export interface StakeInput {
  /** Amount of NIGHT to stake */
  amount: bigint;
}

/**
 * Unstake input parameters
 */
export interface UnstakeInput {
  /** Amount of NIGHT to unstake */
  amount: bigint;
}

/**
 * Stake result
 */
export interface StakeResult {
  /** Unique stake identifier */
  stakeId: Bytes32;
  /** Transaction hash */
  txHash: Bytes32;
  /** Whether user now has premium status */
  isPremiumEligible: boolean;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// LIQUIDITY POOL TYPES
// ============================================================================

/**
 * Liquidity pool for a token pair
 */
export interface LiquidityPool {
  /** First token ID */
  tokenA: Bytes32;
  /** Second token ID */
  tokenB: Bytes32;
  /** Private reserve amount for token A */
  reserveA: WitnessField;
  /** Private reserve amount for token B */
  reserveB: WitnessField;
  /** Total LP shares issued */
  totalShares: Field;
  /** Fee rate in basis points (50 = 0.5%) */
  feeRate: Field;
}

/**
 * Public pool information
 */
export interface PublicPoolInfo {
  /** Pool identifier */
  poolId: Bytes32;
  /** First token */
  tokenA: PublicAsset;
  /** Second token */
  tokenB: PublicAsset;
  /** Total LP shares */
  totalShares: bigint;
  /** Fee rate in basis points */
  feeRate: number;
}

/**
 * Add liquidity input parameters
 */
export interface AddLiquidityInput {
  tokenA: Bytes32;
  tokenB: Bytes32;
  amountA: bigint;
  amountB: bigint;
}

/**
 * Add liquidity result
 */
export interface AddLiquidityResult {
  /** Pool identifier */
  poolId: Bytes32;
  /** Transaction hash */
  txHash: Bytes32;
  /** LP shares issued */
  sharesIssued: bigint;
  /** Timestamp */
  timestamp: number;
}

// ============================================================================
// ZK PROOF TYPES
// ============================================================================

/**
 * ZK proof for balance verification
 */
export interface BalanceProof {
  /** The proof data */
  proof: Uint8Array;
  /** Public inputs to the circuit */
  publicInputs: Field[];
  /** Verification key hash */
  vkHash: Bytes32;
}

/**
 * Zswap commitment for shielded transfers
 */
export interface ZswapCommitment {
  /** Commitment hash */
  commitment: Bytes32;
  /** Nullifier to prevent double-spending */
  nullifier: Bytes32;
  /** Encrypted note for recipient */
  encryptedNote: Uint8Array;
}

/**
 * Zswap transfer proof
 */
export interface ZswapTransferProof {
  /** Input commitments being spent */
  inputCommitments: ZswapCommitment[];
  /** Output commitments being created */
  outputCommitments: ZswapCommitment[];
  /** ZK proof of valid transfer */
  proof: Uint8Array;
}

// ============================================================================
// EVENT TYPES
// ============================================================================

/**
 * Base event interface
 */
export interface BaseEvent {
  /** Block number when event was emitted */
  blockNumber: number;
  /** Transaction hash */
  txHash: Bytes32;
  /** Log index within transaction */
  logIndex: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * SwapExecuted event
 */
export interface SwapExecutedEvent extends BaseEvent {
  type: 'SwapExecuted';
  swapId: Bytes32;
  inputTokenId: Bytes32;
  outputTokenId: Bytes32;
  feeCollected: bigint;
}

/**
 * BatchSwapExecuted event
 */
export interface BatchSwapExecutedEvent extends BaseEvent {
  type: 'BatchSwapExecuted';
  batchId: Bytes32;
  swapCount: number;
  totalFeeCollected: bigint;
}

/**
 * Staked event
 */
export interface StakedEvent extends BaseEvent {
  type: 'Staked';
  stakeId: Bytes32;
  isPremiumEligible: boolean;
}

/**
 * Unstaked event
 */
export interface UnstakedEvent extends BaseEvent {
  type: 'Unstaked';
  stakeId: Bytes32;
}

/**
 * FeesCollected event
 */
export interface FeesCollectedEvent extends BaseEvent {
  type: 'FeesCollected';
  amount: bigint;
  recipient: Bytes32;
}

/**
 * LiquidityAdded event
 */
export interface LiquidityAddedEvent extends BaseEvent {
  type: 'LiquidityAdded';
  poolId: Bytes32;
  sharesIssued: bigint;
}

/**
 * Union type of all events
 */
export type ZKSwapEvent =
  | SwapExecutedEvent
  | BatchSwapExecutedEvent
  | StakedEvent
  | UnstakedEvent
  | FeesCollectedEvent
  | LiquidityAddedEvent;

// ============================================================================
// CONTRACT STATE TYPES
// ============================================================================

/**
 * Contract configuration
 */
export interface ContractConfig {
  /** Developer wallet address */
  developerWallet: Bytes32;
  /** NIGHT token ID for staking */
  nightTokenId: Bytes32;
  /** DUST token ID for fees */
  dustTokenId: Bytes32;
  /** Fee rate in basis points (50 = 0.5%) */
  feeRateBps: number;
  /** Premium threshold in NIGHT tokens */
  premiumThreshold: bigint;
  /** Maximum batch size for premium users */
  maxBatchSize: number;
}

/**
 * Contract state (public view)
 */
export interface ContractState {
  /** Contract configuration */
  config: ContractConfig;
  /** Total fees collected */
  totalFeesCollected: bigint;
  /** Whether contract is paused */
  isPaused: boolean;
}

// ============================================================================
// CLIENT CONFIGURATION
// ============================================================================

/**
 * ZKSwap client configuration
 */
export interface ZKSwapClientConfig {
  /** Contract address */
  contractAddress: Bytes32;
  /** Midnight network RPC URL */
  rpcUrl: string;
  /** Wallet provider */
  walletProvider: WalletProvider;
  /** Optional: Custom ZK prover */
  prover?: ZKProver;
}

/**
 * Wallet provider interface
 */
export interface WalletProvider {
  /** Get connected wallet address */
  getAddress(): Promise<Bytes32>;
  /** Sign a transaction */
  signTransaction(tx: UnsignedTransaction): Promise<SignedTransaction>;
  /** Get wallet balance for a token */
  getBalance(tokenId: Bytes32): Promise<bigint>;
}

/**
 * ZK prover interface
 */
export interface ZKProver {
  /** Generate balance proof */
  generateBalanceProof(
    balance: bigint,
    required: bigint
  ): Promise<BalanceProof>;
  /** Generate swap commitment */
  generateSwapCommitment(
    tokenId: Bytes32,
    amount: bigint
  ): Promise<ZswapCommitment>;
  /** Generate batch proof */
  generateBatchProof(
    orders: SwapOrderInput[]
  ): Promise<BalanceProof>;
}

/**
 * Unsigned transaction
 */
export interface UnsignedTransaction {
  to: Bytes32;
  data: Uint8Array;
  value: bigint;
  nonce: number;
  gasLimit: bigint;
}

/**
 * Signed transaction
 */
export interface SignedTransaction extends UnsignedTransaction {
  signature: Uint8Array;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * ZKSwap error codes
 */
export enum ZKSwapErrorCode {
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  DEADLINE_EXCEEDED = 'DEADLINE_EXCEEDED',
  NOT_PREMIUM_USER = 'NOT_PREMIUM_USER',
  BATCH_SIZE_EXCEEDED = 'BATCH_SIZE_EXCEEDED',
  POOL_NOT_FOUND = 'POOL_NOT_FOUND',
  CONTRACT_PAUSED = 'CONTRACT_PAUSED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  PROOF_VERIFICATION_FAILED = 'PROOF_VERIFICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}

/**
 * ZKSwap error
 */
export class ZKSwapError extends Error {
  constructor(
    public code: ZKSwapErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ZKSwapError';
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Contract constants
 */
export const CONSTANTS = {
  /** Fee rate: 0.5% = 50 basis points */
  FEE_RATE_BPS: 50,
  /** Premium threshold: 100 NIGHT (assuming 9 decimals) */
  PREMIUM_THRESHOLD: BigInt('100000000000'),
  /** Maximum batch size for premium users */
  MAX_BATCH_SIZE: 5,
  /** Basis points divisor */
  BPS_DIVISOR: 10000,
} as const;
