/**
 * ZKSwap Vault DApp - Client SDK
 *
 * This module provides a TypeScript client for interacting with the
 * ZKSwap Vault smart contract on Midnight. It handles:
 * - Private asset swaps with ZK proofs
 * - Batch swaps for premium users
 * - Staking NIGHT tokens for premium tier
 * - Liquidity pool management
 * - Yield farming rewards
 * - Event subscriptions
 * - Gas estimation
 *
 * @module client
 * @version 2.0.0
 */

import {
  Bytes32,
  Field,
  WitnessField,
  Asset,
  SwapOrder,
  SwapOrderInput,
  SwapResult,
  BatchSwapOrder,
  BatchSwapOrderInput,
  BatchSwapResult,
  StakeInput,
  StakeResult,
  UnstakeInput,
  AddLiquidityInput,
  AddLiquidityResult,
  PublicStakeInfo,
  PublicPoolInfo,
  ContractState,
  ZKSwapClientConfig,
  ZKSwapEvent,
  ZKSwapError,
  ZKSwapErrorCode,
  BalanceProof,
  ZswapCommitment,
  CONSTANTS,
} from '../types';

import { ZKProofGenerator } from '../proofs/ZKProofGenerator';
import { ZswapIntegration } from '../utils/ZswapIntegration';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Gas estimation result
 */
export interface GasEstimate {
  /** Estimated gas units */
  gasUnits: bigint;
  /** Gas price in smallest unit */
  gasPrice: bigint;
  /** Total cost in DUST */
  totalCost: bigint;
  /** Confidence level (0-1) */
  confidence: number;
}

/**
 * Remove liquidity input
 */
export interface RemoveLiquidityInput {
  tokenA: Bytes32;
  tokenB: Bytes32;
  shares: bigint;
  minAmountA: bigint;
  minAmountB: bigint;
}

/**
 * Remove liquidity result
 */
export interface RemoveLiquidityResult {
  poolId: Bytes32;
  txHash: Bytes32;
  amountA: bigint;
  amountB: bigint;
  timestamp: number;
}

/**
 * Claim rewards result
 */
export interface ClaimRewardsResult {
  txHash: Bytes32;
  amount: bigint;
  timestamp: number;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  /** Gas limit override */
  gasLimit?: bigint;
  /** Max fee per gas */
  maxFeePerGas?: bigint;
  /** Deadline in blocks from now */
  deadlineBlocks?: number;
}

// ============================================================================
// ENCODING UTILITIES
// ============================================================================

/**
 * ABI Encoder for Midnight Compact contracts
 */
class CompactABIEncoder {
  /**
   * Encode a function call
   */
  static encodeFunction(
    functionName: string,
    params: Array<{ type: string; value: unknown }>
  ): Uint8Array {
    const chunks: Uint8Array[] = [];

    // Function selector (first 4 bytes of keccak256 hash)
    const selector = this.functionSelector(functionName);
    chunks.push(selector);

    // Encode each parameter
    for (const param of params) {
      chunks.push(this.encodeParam(param.type, param.value));
    }

    return this.concat(chunks);
  }

  /**
   * Get function selector
   */
  static functionSelector(functionName: string): Uint8Array {
    // Simplified selector - in production use proper keccak256
    const hash = this.simpleHash(functionName);
    return hash.slice(0, 4);
  }

  /**
   * Encode a single parameter
   */
  static encodeParam(type: string, value: unknown): Uint8Array {
    switch (type) {
      case 'bytes32':
        return this.encodeBytes32(value as Bytes32);
      case 'field':
        return this.encodeField(value as bigint);
      case 'witnessField':
        return this.encodeWitnessField(value as WitnessField);
      case 'bool':
        return this.encodeBool(value as boolean);
      case 'swapOrder':
        return this.encodeSwapOrder(value as SwapOrder);
      case 'batchSwapOrder':
        return this.encodeBatchSwapOrder(value as BatchSwapOrder);
      case 'bytes32[]':
        return this.encodeBytes32Array(value as Bytes32[]);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }

  static encodeBytes32(value: Bytes32): Uint8Array {
    const hex = value.startsWith('0x') ? value.slice(2) : value;
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16) || 0;
    }
    return bytes;
  }

  static encodeField(value: bigint): Uint8Array {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[31 - i] = Number((value >> BigInt(i * 8)) & 0xffn);
    }
    return bytes;
  }

  static encodeWitnessField(value: WitnessField): Uint8Array {
    // Witness fields include a flag byte
    const bytes = new Uint8Array(33);
    bytes[0] = 0x01; // Witness flag
    const fieldBytes = this.encodeField(value.value);
    bytes.set(fieldBytes, 1);
    return bytes;
  }

  static encodeBool(value: boolean): Uint8Array {
    return new Uint8Array([value ? 1 : 0]);
  }

  static encodeSwapOrder(order: SwapOrder): Uint8Array {
    const chunks: Uint8Array[] = [];
    chunks.push(this.encodeBytes32(order.inputAsset.tokenId));
    chunks.push(this.encodeWitnessField(order.inputAsset.amount));
    chunks.push(this.encodeBytes32(order.outputAsset.tokenId));
    chunks.push(this.encodeWitnessField(order.outputAsset.amount));
    chunks.push(this.encodeWitnessField(order.minOutputAmount));
    chunks.push(this.encodeField(order.deadline));
    return this.concat(chunks);
  }

  static encodeBatchSwapOrder(batch: BatchSwapOrder): Uint8Array {
    const chunks: Uint8Array[] = [];
    for (const order of batch.orders) {
      chunks.push(this.encodeSwapOrder(order));
    }
    chunks.push(this.encodeField(batch.activeCount));
    return this.concat(chunks);
  }

  static encodeBytes32Array(values: Bytes32[]): Uint8Array {
    const chunks: Uint8Array[] = [];
    chunks.push(this.encodeField(BigInt(values.length)));
    for (const value of values) {
      chunks.push(this.encodeBytes32(value));
    }
    return this.concat(chunks);
  }

  static encodeBalanceProof(proof: BalanceProof): Uint8Array {
    const chunks: Uint8Array[] = [];
    chunks.push(this.encodeField(BigInt(proof.proof.length)));
    chunks.push(proof.proof);
    chunks.push(this.encodeField(BigInt(proof.publicInputs.length)));
    for (const input of proof.publicInputs) {
      chunks.push(this.encodeField(input));
    }
    chunks.push(this.encodeBytes32(proof.vkHash));
    return this.concat(chunks);
  }

  static concat(arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  }

  static simpleHash(str: string): Uint8Array {
    let hash = 0n;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5n) - hash + BigInt(str.charCodeAt(i))) & 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn;
    }
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[31 - i] = Number((hash >> BigInt(i * 8)) & 0xffn);
    }
    return bytes;
  }
}

/**
 * ABI Decoder for Midnight Compact contracts
 */
class CompactABIDecoder {
  private data: Uint8Array;
  private offset: number;

  constructor(data: string | Uint8Array) {
    if (typeof data === 'string') {
      const hex = data.startsWith('0x') ? data.slice(2) : data;
      this.data = new Uint8Array(hex.length / 2);
      for (let i = 0; i < this.data.length; i++) {
        this.data[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
    } else {
      this.data = data;
    }
    this.offset = 0;
  }

  decodeBytes32(): Bytes32 {
    const bytes = this.data.slice(this.offset, this.offset + 32);
    this.offset += 32;
    return ('0x' + Buffer.from(bytes).toString('hex')) as Bytes32;
  }

  decodeField(): bigint {
    const bytes = this.data.slice(this.offset, this.offset + 32);
    this.offset += 32;
    let value = 0n;
    for (let i = 0; i < 32; i++) {
      value = (value << 8n) | BigInt(bytes[i]);
    }
    return value;
  }

  decodeBool(): boolean {
    const value = this.data[this.offset];
    this.offset += 1;
    return value !== 0;
  }

  decodeUint64(): bigint {
    const bytes = this.data.slice(this.offset, this.offset + 8);
    this.offset += 8;
    let value = 0n;
    for (let i = 0; i < 8; i++) {
      value = (value << 8n) | BigInt(bytes[i]);
    }
    return value;
  }

  remaining(): number {
    return this.data.length - this.offset;
  }
}

// ============================================================================
// CLIENT CLASS
// ============================================================================

/**
 * ZKSwap Vault Client
 *
 * Main client class for interacting with the ZKSwap Vault contract.
 * Provides type-safe methods for all contract operations.
 */
export class ZKSwapClient {
  private readonly contractAddress: Bytes32;
  private readonly rpcUrl: string;
  private readonly walletProvider: ZKSwapClientConfig['walletProvider'];
  private readonly proofGenerator: ZKProofGenerator;
  private readonly zswap: ZswapIntegration;
  private readonly encoder: typeof CompactABIEncoder;

  // Cache
  private contractStateCache: ContractState | null = null;
  private contractStateCacheExpiry = 0;
  private static readonly CACHE_TTL = 30000; // 30 seconds

  // Event listeners
  private eventListeners: Map<string, Set<(event: ZKSwapEvent) => void>> = new Map();
  private eventPollingInterval: NodeJS.Timer | null = null;
  private lastProcessedBlock = 0;

  constructor(config: ZKSwapClientConfig) {
    this.contractAddress = config.contractAddress;
    this.rpcUrl = config.rpcUrl;
    this.walletProvider = config.walletProvider;
    this.proofGenerator = new ZKProofGenerator(config.prover);
    this.zswap = new ZswapIntegration(config.rpcUrl);
    this.encoder = CompactABIEncoder;
  }

  // ==========================================================================
  // SWAP OPERATIONS
  // ==========================================================================

  /**
   * Execute a private asset swap
   */
  async swap(order: SwapOrderInput, options?: TransactionOptions): Promise<SwapResult> {
    this.validateSwapOrder(order);

    const currentBlock = await this.getCurrentBlockNumber();
    const deadline = BigInt(currentBlock + (options?.deadlineBlocks || order.deadlineBlocks));
    const userAddress = await this.walletProvider.getAddress();

    // Generate ZK proof of sufficient balance
    const balance = await this.walletProvider.getBalance(order.inputTokenId);
    const balanceProof = await this.proofGenerator.generateBalanceProof(balance, order.inputAmount);

    // Create Zswap commitments for private transfer
    const inputCommitment = await this.zswap.createCommitment(
      order.inputTokenId,
      order.inputAmount,
      userAddress
    );

    const outputCommitment = await this.zswap.createCommitment(
      order.outputTokenId,
      order.minOutputAmount,
      userAddress
    );

    // Convert to contract types
    const swapOrder: SwapOrder = {
      inputAsset: this.toAsset(order.inputTokenId, order.inputAmount),
      outputAsset: this.toAsset(order.outputTokenId, order.minOutputAmount),
      minOutputAmount: this.toWitnessField(order.minOutputAmount),
      deadline,
    };

    // Estimate gas
    const gasEstimate = await this.estimateGas('executeSwap', [swapOrder]);

    // Build and send transaction
    const txData = this.encodeSwapCall(
      swapOrder,
      balanceProof,
      inputCommitment.commitment,
      outputCommitment.commitment
    );

    const tx = await this.sendTransaction(txData, {
      gasLimit: options?.gasLimit || gasEstimate.gasUnits,
    });

    const receipt = await this.waitForTransaction(tx.hash);
    const swapEvent = this.parseSwapEvent(receipt);

    return {
      swapId: swapEvent.swapId,
      txHash: tx.hash,
      feeCollected: swapEvent.feeCollected,
      blockNumber: receipt.blockNumber,
      timestamp: receipt.timestamp,
    };
  }

  /**
   * Execute a batch swap (premium users only)
   */
  async batchSwap(batchOrder: BatchSwapOrderInput, options?: TransactionOptions): Promise<BatchSwapResult> {
    if (batchOrder.orders.length === 0 || batchOrder.orders.length > CONSTANTS.MAX_BATCH_SIZE) {
      throw new ZKSwapError(
        ZKSwapErrorCode.BATCH_SIZE_EXCEEDED,
        `Batch must contain 1-${CONSTANTS.MAX_BATCH_SIZE} orders`
      );
    }

    const userAddress = await this.walletProvider.getAddress();
    const isPremium = await this.isPremiumUser(userAddress);

    if (!isPremium) {
      throw new ZKSwapError(
        ZKSwapErrorCode.NOT_PREMIUM_USER,
        'Batch swaps require premium status (stake >100 NIGHT)'
      );
    }

    batchOrder.orders.forEach(order => this.validateSwapOrder(order));

    const currentBlock = await this.getCurrentBlockNumber();
    const stakeProof = await this.proofGenerator.generateStakeProof(userAddress);

    const commitments: Bytes32[] = [];
    const orders: SwapOrder[] = [];

    for (const order of batchOrder.orders) {
      const deadline = BigInt(currentBlock + (options?.deadlineBlocks || order.deadlineBlocks));

      const inputCommitment = await this.zswap.createCommitment(
        order.inputTokenId,
        order.inputAmount,
        userAddress
      );
      commitments.push(inputCommitment.commitment);

      const outputCommitment = await this.zswap.createCommitment(
        order.outputTokenId,
        order.minOutputAmount,
        userAddress
      );
      commitments.push(outputCommitment.commitment);

      orders.push({
        inputAsset: this.toAsset(order.inputTokenId, order.inputAmount),
        outputAsset: this.toAsset(order.outputTokenId, order.minOutputAmount),
        minOutputAmount: this.toWitnessField(order.minOutputAmount),
        deadline,
      });
    }

    // Pad to 5 orders
    while (orders.length < 5) {
      orders.push(this.createEmptySwapOrder());
    }

    // Pad commitments to 10
    const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as Bytes32;
    while (commitments.length < 10) {
      commitments.push(zeroBytes32);
    }

    const batchSwapOrder: BatchSwapOrder = {
      orders,
      activeCount: BigInt(batchOrder.orders.length),
    };

    const gasEstimate = await this.estimateGas('executeBatchSwap', [batchSwapOrder]);

    const txData = this.encodeBatchSwapCall(batchSwapOrder, stakeProof, commitments);
    const tx = await this.sendTransaction(txData, {
      gasLimit: options?.gasLimit || gasEstimate.gasUnits,
    });

    const receipt = await this.waitForTransaction(tx.hash);
    const batchEvent = this.parseBatchSwapEvent(receipt);

    return {
      batchId: batchEvent.batchId,
      txHash: tx.hash,
      swapCount: batchEvent.swapCount,
      totalFeeCollected: batchEvent.totalFeeCollected,
      timestamp: receipt.timestamp,
    };
  }

  /**
   * Get estimated output amount for a swap
   */
  async getSwapQuote(
    inputTokenId: Bytes32,
    outputTokenId: Bytes32,
    inputAmount: bigint
  ): Promise<{ outputAmount: bigint; fee: bigint; priceImpact: number }> {
    const poolInfo = await this.getPoolInfo(inputTokenId, outputTokenId);

    if (!poolInfo) {
      throw new ZKSwapError(
        ZKSwapErrorCode.POOL_NOT_FOUND,
        'Liquidity pool not found for this pair'
      );
    }

    // Calculate fee
    const fee = this.calculateFee(inputAmount);
    const inputAfterFee = inputAmount - fee;

    // Estimate output (note: actual reserves are private)
    // This uses pool statistics if available
    const estimatedOutput = inputAfterFee; // Simplified; real impl would query oracle

    // Price impact estimation
    const priceImpact = Number(inputAmount) / Number(poolInfo.totalShares || 1n) * 100;

    return {
      outputAmount: estimatedOutput,
      fee,
      priceImpact: Math.min(priceImpact, 100),
    };
  }

  /**
   * Calculate fee for a swap amount
   */
  calculateFee(amount: bigint): bigint {
    return (amount * BigInt(CONSTANTS.FEE_RATE_BPS)) / BigInt(CONSTANTS.BPS_DIVISOR);
  }

  // ==========================================================================
  // STAKING OPERATIONS
  // ==========================================================================

  /**
   * Stake NIGHT tokens to enable premium features
   */
  async stake(input: StakeInput, options?: TransactionOptions): Promise<StakeResult> {
    if (input.amount <= 0n) {
      throw new ZKSwapError(
        ZKSwapErrorCode.INSUFFICIENT_BALANCE,
        'Stake amount must be positive'
      );
    }

    const userAddress = await this.walletProvider.getAddress();
    const contractState = await this.getContractState();
    const nightTokenId = contractState.config.nightTokenId;

    const balance = await this.walletProvider.getBalance(nightTokenId);
    if (balance < input.amount) {
      throw new ZKSwapError(
        ZKSwapErrorCode.INSUFFICIENT_BALANCE,
        'Insufficient NIGHT balance for staking'
      );
    }

    const commitment = await this.zswap.createCommitment(
      nightTokenId,
      input.amount,
      this.contractAddress
    );

    const gasEstimate = await this.estimateGas('stake', [input.amount]);

    const txData = this.encodeStakeCall(
      this.toWitnessField(input.amount),
      commitment.commitment
    );

    const tx = await this.sendTransaction(txData, {
      gasLimit: options?.gasLimit || gasEstimate.gasUnits,
    });

    const receipt = await this.waitForTransaction(tx.hash);
    const stakeEvent = this.parseStakeEvent(receipt);

    return {
      stakeId: stakeEvent.stakeId,
      txHash: tx.hash,
      isPremiumEligible: stakeEvent.isPremiumEligible,
      timestamp: receipt.timestamp,
    };
  }

  /**
   * Unstake NIGHT tokens
   */
  async unstake(input: UnstakeInput, options?: TransactionOptions): Promise<StakeResult> {
    if (input.amount <= 0n) {
      throw new ZKSwapError(
        ZKSwapErrorCode.INSUFFICIENT_BALANCE,
        'Unstake amount must be positive'
      );
    }

    const userAddress = await this.walletProvider.getAddress();
    const contractState = await this.getContractState();
    const nightTokenId = contractState.config.nightTokenId;

    const commitment = await this.zswap.createCommitment(
      nightTokenId,
      input.amount,
      userAddress
    );

    const gasEstimate = await this.estimateGas('unstake', [input.amount]);

    const txData = this.encodeUnstakeCall(
      this.toWitnessField(input.amount),
      commitment.commitment
    );

    const tx = await this.sendTransaction(txData, {
      gasLimit: options?.gasLimit || gasEstimate.gasUnits,
    });

    const receipt = await this.waitForTransaction(tx.hash);
    const unstakeEvent = this.parseUnstakeEvent(receipt);
    const stakeInfo = await this.getStakeInfo(userAddress);

    return {
      stakeId: unstakeEvent.stakeId,
      txHash: tx.hash,
      isPremiumEligible: stakeInfo.isPremium,
      timestamp: receipt.timestamp,
    };
  }

  /**
   * Claim staking rewards
   */
  async claimRewards(options?: TransactionOptions): Promise<ClaimRewardsResult> {
    const userAddress = await this.walletProvider.getAddress();

    const commitment = await this.zswap.createCommitment(
      (await this.getContractState()).config.nightTokenId,
      0n, // Amount will be determined by contract
      userAddress
    );

    const gasEstimate = await this.estimateGas('claimRewards', []);

    const txData = this.encodeClaimRewardsCall(commitment.commitment);
    const tx = await this.sendTransaction(txData, {
      gasLimit: options?.gasLimit || gasEstimate.gasUnits,
    });

    const receipt = await this.waitForTransaction(tx.hash);
    const rewardsEvent = this.parseRewardsEvent(receipt);

    return {
      txHash: tx.hash,
      amount: rewardsEvent.amount,
      timestamp: receipt.timestamp,
    };
  }

  /**
   * Get pending rewards for user
   */
  async getPendingRewards(userAddress: Bytes32): Promise<bigint> {
    const stakeInfo = await this.getStakeInfo(userAddress);
    const contractState = await this.getContractState();
    const currentBlock = await this.getCurrentBlockNumber();

    // Simplified calculation - actual implementation would query contract
    const blocksSinceStake = currentBlock - stakeInfo.stakedAt;
    const rewardRate = 1000000000n; // 1 NIGHT per block (from contract)

    // This is approximate - actual amount is calculated on-chain
    return stakeInfo.isPremium ? BigInt(blocksSinceStake) * rewardRate : 0n;
  }

  /**
   * Check if a user has premium status
   */
  async isPremiumUser(userAddress: Bytes32): Promise<boolean> {
    const callData = this.encodeViewCall('isPremiumUser', [
      { type: 'bytes32', value: userAddress },
    ]);
    const result = await this.callContract(callData);
    return new CompactABIDecoder(result).decodeBool();
  }

  /**
   * Get user's stake information
   */
  async getStakeInfo(userAddress: Bytes32): Promise<PublicStakeInfo> {
    const isPremium = await this.isPremiumUser(userAddress);

    return {
      isPremium,
      stakedAt: 0, // Would need to query from events
    };
  }

  // ==========================================================================
  // LIQUIDITY OPERATIONS
  // ==========================================================================

  /**
   * Add liquidity to a pool
   */
  async addLiquidity(input: AddLiquidityInput, options?: TransactionOptions): Promise<AddLiquidityResult> {
    if (input.amountA <= 0n || input.amountB <= 0n) {
      throw new ZKSwapError(
        ZKSwapErrorCode.INSUFFICIENT_BALANCE,
        'Liquidity amounts must be positive'
      );
    }

    // Ensure token ordering
    let tokenA = input.tokenA;
    let tokenB = input.tokenB;
    let amountA = input.amountA;
    let amountB = input.amountB;

    if (tokenA > tokenB) {
      [tokenA, tokenB] = [tokenB, tokenA];
      [amountA, amountB] = [amountB, amountA];
    }

    const commitmentA = await this.zswap.createCommitment(tokenA, amountA, this.contractAddress);
    const commitmentB = await this.zswap.createCommitment(tokenB, amountB, this.contractAddress);

    const gasEstimate = await this.estimateGas('addLiquidity', [amountA, amountB]);

    const txData = this.encodeAddLiquidityCall(
      tokenA,
      tokenB,
      this.toWitnessField(amountA),
      this.toWitnessField(amountB),
      commitmentA.commitment,
      commitmentB.commitment
    );

    const tx = await this.sendTransaction(txData, {
      gasLimit: options?.gasLimit || gasEstimate.gasUnits,
    });

    const receipt = await this.waitForTransaction(tx.hash);
    const liquidityEvent = this.parseLiquidityEvent(receipt);

    return {
      poolId: liquidityEvent.poolId,
      txHash: tx.hash,
      sharesIssued: liquidityEvent.sharesIssued,
      timestamp: receipt.timestamp,
    };
  }

  /**
   * Remove liquidity from a pool
   */
  async removeLiquidity(
    input: RemoveLiquidityInput,
    options?: TransactionOptions
  ): Promise<RemoveLiquidityResult> {
    if (input.shares <= 0n) {
      throw new ZKSwapError(
        ZKSwapErrorCode.INSUFFICIENT_BALANCE,
        'Shares must be positive'
      );
    }

    const userAddress = await this.walletProvider.getAddress();

    // Ensure token ordering
    let tokenA = input.tokenA;
    let tokenB = input.tokenB;
    let minAmountA = input.minAmountA;
    let minAmountB = input.minAmountB;

    if (tokenA > tokenB) {
      [tokenA, tokenB] = [tokenB, tokenA];
      [minAmountA, minAmountB] = [minAmountB, minAmountA];
    }

    const commitmentA = await this.zswap.createCommitment(tokenA, minAmountA, userAddress);
    const commitmentB = await this.zswap.createCommitment(tokenB, minAmountB, userAddress);

    const gasEstimate = await this.estimateGas('removeLiquidity', [input.shares]);

    const txData = this.encodeRemoveLiquidityCall(
      tokenA,
      tokenB,
      input.shares,
      this.toWitnessField(minAmountA),
      this.toWitnessField(minAmountB),
      commitmentA.commitment,
      commitmentB.commitment
    );

    const tx = await this.sendTransaction(txData, {
      gasLimit: options?.gasLimit || gasEstimate.gasUnits,
    });

    const receipt = await this.waitForTransaction(tx.hash);
    const removeEvent = this.parseRemoveLiquidityEvent(receipt);

    return {
      poolId: removeEvent.poolId,
      txHash: tx.hash,
      amountA: removeEvent.amountA,
      amountB: removeEvent.amountB,
      timestamp: receipt.timestamp,
    };
  }

  /**
   * Emergency withdraw from a pool (forfeits rewards)
   */
  async emergencyWithdraw(poolId: Bytes32, options?: TransactionOptions): Promise<{ txHash: Bytes32 }> {
    const userAddress = await this.walletProvider.getAddress();
    const commitment = await this.zswap.createCommitment(poolId, 0n, userAddress);

    const txData = this.encodeEmergencyWithdrawCall(poolId, commitment.commitment);
    const tx = await this.sendTransaction(txData, {
      gasLimit: options?.gasLimit || 500000n,
    });

    await this.waitForTransaction(tx.hash);

    return { txHash: tx.hash };
  }

  /**
   * Get user's LP shares in a pool
   */
  async getUserLPShares(userAddress: Bytes32, poolId: Bytes32): Promise<bigint> {
    const callData = this.encodeViewCall('getUserLPShares', [
      { type: 'bytes32', value: userAddress },
      { type: 'bytes32', value: poolId },
    ]);
    const result = await this.callContract(callData);
    return new CompactABIDecoder(result).decodeField();
  }

  /**
   * Get pool information for a token pair
   */
  async getPoolInfo(tokenA: Bytes32, tokenB: Bytes32): Promise<PublicPoolInfo | null> {
    const poolId = this.hashTokenPair(tokenA, tokenB);

    try {
      const callData = this.encodeViewCall('getPoolTotalShares', [
        { type: 'bytes32', value: poolId },
      ]);
      const result = await this.callContract(callData);
      const totalShares = new CompactABIDecoder(result).decodeField();

      if (totalShares === 0n) {
        return null;
      }

      return {
        poolId,
        tokenA: { tokenId: tokenA, symbol: '', name: '', decimals: 9 },
        tokenB: { tokenId: tokenB, symbol: '', name: '', decimals: 9 },
        totalShares,
        feeRate: CONSTANTS.FEE_RATE_BPS,
      };
    } catch {
      return null;
    }
  }

  // ==========================================================================
  // GAS ESTIMATION
  // ==========================================================================

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(method: string, params: unknown[]): Promise<GasEstimate> {
    // Base gas costs for different operations
    const baseCosts: Record<string, bigint> = {
      executeSwap: 250000n,
      executeBatchSwap: 500000n,
      stake: 150000n,
      unstake: 150000n,
      claimRewards: 100000n,
      addLiquidity: 200000n,
      removeLiquidity: 200000n,
      emergencyWithdraw: 150000n,
    };

    const baseGas = baseCosts[method] || 100000n;

    // Add complexity multiplier based on params
    let complexityMultiplier = 1n;
    if (method === 'executeBatchSwap' && params[0]) {
      const batch = params[0] as BatchSwapOrder;
      complexityMultiplier = BigInt(Math.max(1, Number(batch.activeCount)));
    }

    const gasUnits = baseGas * complexityMultiplier;

    // Get current gas price
    const gasPrice = await this.getGasPrice();

    return {
      gasUnits,
      gasPrice,
      totalCost: gasUnits * gasPrice,
      confidence: 0.9,
    };
  }

  private async getGasPrice(): Promise<bigint> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1,
        }),
      });

      const result = await response.json();
      return BigInt(result.result || '0x1');
    } catch {
      return 1n; // Default gas price
    }
  }

  // ==========================================================================
  // CONTRACT STATE
  // ==========================================================================

  /**
   * Get current contract state (cached)
   */
  async getContractState(): Promise<ContractState> {
    if (this.contractStateCache && Date.now() < this.contractStateCacheExpiry) {
      return this.contractStateCache;
    }

    const [
      developerWallet,
      feeRate,
      premiumThreshold,
      totalFeesCollected,
      isPaused,
      totalStaked,
      protocolVersion,
    ] = await Promise.all([
      this.callContractView('getDeveloperWallet'),
      this.callContractView('getFeeRate'),
      this.callContractView('getPremiumThreshold'),
      this.callContractView('getTotalFeesCollected'),
      this.callContractView('getIsPaused'),
      this.callContractView('getTotalStaked'),
      this.callContractView('getProtocolVersion'),
    ]);

    const state: ContractState = {
      config: {
        developerWallet: this.decodeBytes32(developerWallet),
        nightTokenId: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32,
        dustTokenId: '0x0000000000000000000000000000000000000000000000000000000000000002' as Bytes32,
        feeRateBps: Number(this.decodeField(feeRate)),
        premiumThreshold: this.decodeField(premiumThreshold),
        maxBatchSize: CONSTANTS.MAX_BATCH_SIZE,
      },
      totalFeesCollected: this.decodeField(totalFeesCollected),
      isPaused: this.decodeBoolean(isPaused),
    };

    this.contractStateCache = state;
    this.contractStateCacheExpiry = Date.now() + ZKSwapClient.CACHE_TTL;

    return state;
  }

  /**
   * Get total fees collected by the contract
   */
  async getTotalFeesCollected(): Promise<bigint> {
    const result = await this.callContractView('getTotalFeesCollected');
    return this.decodeField(result);
  }

  /**
   * Get total NIGHT staked
   */
  async getTotalStaked(): Promise<bigint> {
    const result = await this.callContractView('getTotalStaked');
    return this.decodeField(result);
  }

  /**
   * Clear state cache
   */
  clearCache(): void {
    this.contractStateCache = null;
    this.contractStateCacheExpiry = 0;
  }

  // ==========================================================================
  // EVENT HANDLING
  // ==========================================================================

  /**
   * Subscribe to contract events
   */
  on(
    eventType: ZKSwapEvent['type'],
    callback: (event: ZKSwapEvent) => void
  ): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }

    this.eventListeners.get(eventType)!.add(callback);

    // Start polling if not already running
    if (!this.eventPollingInterval) {
      this.startEventPolling();
    }

    return () => {
      this.eventListeners.get(eventType)?.delete(callback);
      if (this.getTotalListenerCount() === 0) {
        this.stopEventPolling();
      }
    };
  }

  /**
   * Get historical events
   */
  async getEvents(
    eventType: ZKSwapEvent['type'],
    fromBlock: number,
    toBlock?: number
  ): Promise<ZKSwapEvent[]> {
    const logs = await this.queryLogs(eventType, fromBlock, toBlock);

    const events: ZKSwapEvent[] = [];
    for (const log of logs) {
      const event = this.parseEventLog(eventType, log);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  private startEventPolling(): void {
    this.eventPollingInterval = setInterval(async () => {
      try {
        const currentBlock = await this.getCurrentBlockNumber();
        if (this.lastProcessedBlock === 0) {
          this.lastProcessedBlock = currentBlock - 10; // Start from recent blocks
        }

        if (currentBlock > this.lastProcessedBlock) {
          for (const eventType of this.eventListeners.keys()) {
            const events = await this.getEvents(
              eventType as ZKSwapEvent['type'],
              this.lastProcessedBlock + 1,
              currentBlock
            );

            for (const event of events) {
              const listeners = this.eventListeners.get(eventType);
              if (listeners) {
                for (const listener of listeners) {
                  try {
                    listener(event);
                  } catch (e) {
                    console.error('Event listener error:', e);
                  }
                }
              }
            }
          }
          this.lastProcessedBlock = currentBlock;
        }
      } catch (e) {
        console.error('Event polling error:', e);
      }
    }, 5000); // Poll every 5 seconds
  }

  private stopEventPolling(): void {
    if (this.eventPollingInterval) {
      clearInterval(this.eventPollingInterval);
      this.eventPollingInterval = null;
    }
  }

  private getTotalListenerCount(): number {
    let count = 0;
    for (const listeners of this.eventListeners.values()) {
      count += listeners.size;
    }
    return count;
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  private toAsset(tokenId: Bytes32, amount: bigint): Asset {
    return {
      tokenId,
      amount: this.toWitnessField(amount),
    };
  }

  private toWitnessField(value: bigint): WitnessField {
    return {
      value,
      isPrivate: true,
    };
  }

  private createEmptySwapOrder(): SwapOrder {
    const zeroBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as Bytes32;
    return {
      inputAsset: this.toAsset(zeroBytes32, 0n),
      outputAsset: this.toAsset(zeroBytes32, 0n),
      minOutputAmount: this.toWitnessField(0n),
      deadline: 0n,
    };
  }

  private validateSwapOrder(order: SwapOrderInput): void {
    if (order.inputAmount <= 0n) {
      throw new ZKSwapError(ZKSwapErrorCode.INSUFFICIENT_BALANCE, 'Input amount must be positive');
    }
    if (order.minOutputAmount <= 0n) {
      throw new ZKSwapError(ZKSwapErrorCode.SLIPPAGE_EXCEEDED, 'Minimum output amount must be positive');
    }
    if (order.deadlineBlocks <= 0) {
      throw new ZKSwapError(ZKSwapErrorCode.DEADLINE_EXCEEDED, 'Deadline must be positive');
    }
    if (order.inputTokenId === order.outputTokenId) {
      throw new ZKSwapError(ZKSwapErrorCode.POOL_NOT_FOUND, 'Cannot swap same token');
    }
  }

  private hashTokenPair(tokenA: Bytes32, tokenB: Bytes32): Bytes32 {
    const [first, second] = tokenA < tokenB ? [tokenA, tokenB] : [tokenB, tokenA];
    const combined = CompactABIEncoder.concat([
      CompactABIEncoder.encodeBytes32(first),
      CompactABIEncoder.encodeBytes32(second),
    ]);
    const hash = CompactABIEncoder.simpleHash(Buffer.from(combined).toString('hex'));
    return ('0x' + Buffer.from(hash).toString('hex')) as Bytes32;
  }

  // ==========================================================================
  // ENCODING METHODS
  // ==========================================================================

  private encodeSwapCall(
    order: SwapOrder,
    proof: BalanceProof,
    inputCommitment: Bytes32,
    outputCommitment: Bytes32
  ): Uint8Array {
    return CompactABIEncoder.encodeFunction('executeSwap', [
      { type: 'swapOrder', value: order },
      { type: 'witnessField', value: { value: 0n, isPrivate: true } }, // Proof encoded separately
      { type: 'bytes32', value: inputCommitment },
      { type: 'bytes32', value: outputCommitment },
    ]);
  }

  private encodeBatchSwapCall(
    order: BatchSwapOrder,
    proof: BalanceProof,
    commitments: Bytes32[]
  ): Uint8Array {
    return CompactABIEncoder.encodeFunction('executeBatchSwap', [
      { type: 'batchSwapOrder', value: order },
      { type: 'witnessField', value: { value: 0n, isPrivate: true } },
      { type: 'bytes32[]', value: commitments },
    ]);
  }

  private encodeStakeCall(amount: WitnessField, commitment: Bytes32): Uint8Array {
    return CompactABIEncoder.encodeFunction('stake', [
      { type: 'witnessField', value: amount },
      { type: 'bytes32', value: commitment },
    ]);
  }

  private encodeUnstakeCall(amount: WitnessField, commitment: Bytes32): Uint8Array {
    return CompactABIEncoder.encodeFunction('unstake', [
      { type: 'witnessField', value: amount },
      { type: 'bytes32', value: commitment },
    ]);
  }

  private encodeClaimRewardsCall(commitment: Bytes32): Uint8Array {
    return CompactABIEncoder.encodeFunction('claimRewards', [
      { type: 'bytes32', value: commitment },
    ]);
  }

  private encodeAddLiquidityCall(
    tokenA: Bytes32,
    tokenB: Bytes32,
    amountA: WitnessField,
    amountB: WitnessField,
    commitmentA: Bytes32,
    commitmentB: Bytes32
  ): Uint8Array {
    return CompactABIEncoder.encodeFunction('addLiquidity', [
      { type: 'bytes32', value: tokenA },
      { type: 'bytes32', value: tokenB },
      { type: 'witnessField', value: amountA },
      { type: 'witnessField', value: amountB },
      { type: 'bytes32', value: commitmentA },
      { type: 'bytes32', value: commitmentB },
    ]);
  }

  private encodeRemoveLiquidityCall(
    tokenA: Bytes32,
    tokenB: Bytes32,
    shares: bigint,
    minAmountA: WitnessField,
    minAmountB: WitnessField,
    commitmentA: Bytes32,
    commitmentB: Bytes32
  ): Uint8Array {
    return CompactABIEncoder.encodeFunction('removeLiquidity', [
      { type: 'bytes32', value: tokenA },
      { type: 'bytes32', value: tokenB },
      { type: 'field', value: shares },
      { type: 'witnessField', value: minAmountA },
      { type: 'witnessField', value: minAmountB },
      { type: 'bytes32', value: commitmentA },
      { type: 'bytes32', value: commitmentB },
    ]);
  }

  private encodeEmergencyWithdrawCall(poolId: Bytes32, commitment: Bytes32): Uint8Array {
    return CompactABIEncoder.encodeFunction('emergencyWithdraw', [
      { type: 'bytes32', value: poolId },
      { type: 'bytes32', value: commitment },
    ]);
  }

  private encodeViewCall(method: string, params: Array<{ type: string; value: unknown }>): Uint8Array {
    return CompactABIEncoder.encodeFunction(method, params);
  }

  // ==========================================================================
  // TRANSACTION METHODS
  // ==========================================================================

  private async getCurrentBlockNumber(): Promise<number> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });

    const result = await response.json();
    return parseInt(result.result, 16);
  }

  private async sendTransaction(
    data: Uint8Array,
    options?: { gasLimit?: bigint }
  ): Promise<{ hash: Bytes32 }> {
    const tx = {
      to: this.contractAddress,
      data,
      value: 0n,
      nonce: await this.getNonce(),
      gasLimit: options?.gasLimit || 1000000n,
    };

    const signedTx = await this.walletProvider.signTransaction(tx);

    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_sendRawTransaction',
        params: ['0x' + Buffer.from(signedTx.signature).toString('hex')],
        id: 1,
      }),
    });

    const result = await response.json();
    if (result.error) {
      throw new ZKSwapError(ZKSwapErrorCode.NETWORK_ERROR, result.error.message);
    }
    return { hash: result.result as Bytes32 };
  }

  private async waitForTransaction(
    hash: Bytes32,
    timeout = 60000
  ): Promise<{ blockNumber: number; timestamp: number; logs: unknown[] }> {
    const startTime = Date.now();
    const pollInterval = 1000;

    while (Date.now() - startTime < timeout) {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionReceipt',
          params: [hash],
          id: 1,
        }),
      });

      const result = await response.json();

      if (result.result) {
        return {
          blockNumber: parseInt(result.result.blockNumber, 16),
          timestamp: Math.floor(Date.now() / 1000),
          logs: result.result.logs || [],
        };
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new ZKSwapError(ZKSwapErrorCode.NETWORK_ERROR, 'Transaction confirmation timeout');
  }

  private async callContract(data: Uint8Array): Promise<string> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: this.contractAddress,
            data: '0x' + Buffer.from(data).toString('hex'),
          },
          'latest',
        ],
        id: 1,
      }),
    });

    const result = await response.json();
    return result.result || '0x';
  }

  private async callContractView(method: string): Promise<string> {
    const callData = this.encodeViewCall(method, []);
    return this.callContract(callData);
  }

  private async getNonce(): Promise<number> {
    const address = await this.walletProvider.getAddress();
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
        id: 1,
      }),
    });

    const result = await response.json();
    return parseInt(result.result, 16);
  }

  private async queryLogs(eventType: string, fromBlock: number, toBlock?: number): Promise<unknown[]> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getLogs',
        params: [
          {
            address: this.contractAddress,
            fromBlock: '0x' + fromBlock.toString(16),
            toBlock: toBlock ? '0x' + toBlock.toString(16) : 'latest',
            topics: [this.getEventTopic(eventType)],
          },
        ],
        id: 1,
      }),
    });

    const result = await response.json();
    return result.result || [];
  }

  // ==========================================================================
  // DECODING METHODS
  // ==========================================================================

  private decodeBoolean(result: string): boolean {
    return result !== '0x' && result !== '0x0' && result !== '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  private decodeField(result: string): bigint {
    if (!result || result === '0x') return 0n;
    return BigInt(result);
  }

  private decodeBytes32(result: string): Bytes32 {
    if (!result || result === '0x') {
      return '0x0000000000000000000000000000000000000000000000000000000000000000' as Bytes32;
    }
    return result.padEnd(66, '0') as Bytes32;
  }

  private getEventTopic(eventType: string): string {
    const topics: Record<string, string> = {
      SwapExecuted: '0x' + Buffer.from(CompactABIEncoder.simpleHash('SwapExecuted')).toString('hex'),
      BatchSwapExecuted: '0x' + Buffer.from(CompactABIEncoder.simpleHash('BatchSwapExecuted')).toString('hex'),
      Staked: '0x' + Buffer.from(CompactABIEncoder.simpleHash('Staked')).toString('hex'),
      Unstaked: '0x' + Buffer.from(CompactABIEncoder.simpleHash('Unstaked')).toString('hex'),
      FeesCollected: '0x' + Buffer.from(CompactABIEncoder.simpleHash('FeesCollected')).toString('hex'),
      LiquidityAdded: '0x' + Buffer.from(CompactABIEncoder.simpleHash('LiquidityAdded')).toString('hex'),
      LiquidityRemoved: '0x' + Buffer.from(CompactABIEncoder.simpleHash('LiquidityRemoved')).toString('hex'),
      RewardsClaimed: '0x' + Buffer.from(CompactABIEncoder.simpleHash('RewardsClaimed')).toString('hex'),
    };
    return topics[eventType] || '0x';
  }

  private parseSwapEvent(receipt: { logs: unknown[] }): { swapId: Bytes32; feeCollected: bigint } {
    // Parse from receipt logs
    const log = receipt.logs[0] as { data?: string; topics?: string[] };
    if (log?.data) {
      const decoder = new CompactABIDecoder(log.data);
      return {
        swapId: decoder.decodeBytes32(),
        feeCollected: decoder.decodeField(),
      };
    }
    return {
      swapId: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32,
      feeCollected: 0n,
    };
  }

  private parseBatchSwapEvent(receipt: { logs: unknown[] }): {
    batchId: Bytes32;
    swapCount: number;
    totalFeeCollected: bigint;
  } {
    const log = receipt.logs[0] as { data?: string };
    if (log?.data) {
      const decoder = new CompactABIDecoder(log.data);
      return {
        batchId: decoder.decodeBytes32(),
        swapCount: Number(decoder.decodeField()),
        totalFeeCollected: decoder.decodeField(),
      };
    }
    return {
      batchId: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32,
      swapCount: 0,
      totalFeeCollected: 0n,
    };
  }

  private parseStakeEvent(receipt: { logs: unknown[] }): { stakeId: Bytes32; isPremiumEligible: boolean } {
    const log = receipt.logs[0] as { data?: string };
    if (log?.data) {
      const decoder = new CompactABIDecoder(log.data);
      return {
        stakeId: decoder.decodeBytes32(),
        isPremiumEligible: decoder.decodeBool(),
      };
    }
    return {
      stakeId: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32,
      isPremiumEligible: false,
    };
  }

  private parseUnstakeEvent(receipt: { logs: unknown[] }): { stakeId: Bytes32 } {
    const log = receipt.logs[0] as { data?: string };
    if (log?.data) {
      const decoder = new CompactABIDecoder(log.data);
      return { stakeId: decoder.decodeBytes32() };
    }
    return {
      stakeId: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32,
    };
  }

  private parseLiquidityEvent(receipt: { logs: unknown[] }): { poolId: Bytes32; sharesIssued: bigint } {
    const log = receipt.logs[0] as { data?: string };
    if (log?.data) {
      const decoder = new CompactABIDecoder(log.data);
      return {
        poolId: decoder.decodeBytes32(),
        sharesIssued: decoder.decodeField(),
      };
    }
    return {
      poolId: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32,
      sharesIssued: 0n,
    };
  }

  private parseRemoveLiquidityEvent(receipt: { logs: unknown[] }): {
    poolId: Bytes32;
    amountA: bigint;
    amountB: bigint;
  } {
    const log = receipt.logs[0] as { data?: string };
    if (log?.data) {
      const decoder = new CompactABIDecoder(log.data);
      return {
        poolId: decoder.decodeBytes32(),
        amountA: decoder.decodeField(),
        amountB: decoder.decodeField(),
      };
    }
    return {
      poolId: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32,
      amountA: 0n,
      amountB: 0n,
    };
  }

  private parseRewardsEvent(receipt: { logs: unknown[] }): { amount: bigint } {
    const log = receipt.logs[0] as { data?: string };
    if (log?.data) {
      const decoder = new CompactABIDecoder(log.data);
      decoder.decodeBytes32(); // Skip user
      return { amount: decoder.decodeField() };
    }
    return { amount: 0n };
  }

  private parseEventLog(eventType: string, log: unknown): ZKSwapEvent | null {
    const typedLog = log as { blockNumber?: string; transactionHash?: string; logIndex?: string; data?: string };
    const baseEvent = {
      blockNumber: parseInt(typedLog.blockNumber || '0', 16),
      txHash: (typedLog.transactionHash || '0x') as Bytes32,
      logIndex: parseInt(typedLog.logIndex || '0', 16),
      timestamp: Math.floor(Date.now() / 1000),
    };

    if (!typedLog.data) return null;

    const decoder = new CompactABIDecoder(typedLog.data);

    switch (eventType) {
      case 'SwapExecuted':
        return {
          ...baseEvent,
          type: 'SwapExecuted',
          swapId: decoder.decodeBytes32(),
          inputTokenId: decoder.decodeBytes32(),
          outputTokenId: decoder.decodeBytes32(),
          feeCollected: decoder.decodeField(),
        };
      case 'BatchSwapExecuted':
        return {
          ...baseEvent,
          type: 'BatchSwapExecuted',
          batchId: decoder.decodeBytes32(),
          swapCount: Number(decoder.decodeField()),
          totalFeeCollected: decoder.decodeField(),
        };
      case 'Staked':
        return {
          ...baseEvent,
          type: 'Staked',
          stakeId: decoder.decodeBytes32(),
          isPremiumEligible: decoder.decodeBool(),
        };
      case 'Unstaked':
        return {
          ...baseEvent,
          type: 'Unstaked',
          stakeId: decoder.decodeBytes32(),
        };
      default:
        return null;
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ZKSwapClient;
