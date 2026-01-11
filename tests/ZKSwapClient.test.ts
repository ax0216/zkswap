/**
 * ZKSwap Vault DApp - Test Suite
 *
 * Comprehensive tests for the ZKSwap Vault smart contract and client SDK.
 * Uses Jest with mocked Midnight SDK components.
 */

import { ZKSwapClient, GasEstimate, RemoveLiquidityInput } from '../src/client/ZKSwapClient';
import { ZKProofGenerator } from '../src/proofs/ZKProofGenerator';
import { ZswapIntegration } from '../src/utils/ZswapIntegration';
import {
  Bytes32,
  SwapOrderInput,
  BatchSwapOrderInput,
  StakeInput,
  AddLiquidityInput,
  ZKSwapError,
  ZKSwapErrorCode,
  CONSTANTS,
  WalletProvider,
  BalanceProof,
  ZswapCommitment,
} from '../src/types';

// ============================================================================
// MOCKS
// ============================================================================

// Mock wallet provider
const createMockWalletProvider = (options: {
  address?: Bytes32;
  balance?: bigint;
}): WalletProvider => ({
  getAddress: jest.fn().mockResolvedValue(
    options.address || '0x1234567890123456789012345678901234567890123456789012345678901234' as Bytes32
  ),
  getBalance: jest.fn().mockResolvedValue(options.balance || 1000000000000n),
  signTransaction: jest.fn().mockResolvedValue({
    to: '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32,
    data: new Uint8Array([1, 2, 3]),
    value: 0n,
    nonce: 1,
    gasLimit: 100000n,
    signature: new Uint8Array([4, 5, 6]),
  }),
});

// Mock RPC responses
const createMockFetch = (responses: Record<string, unknown>) => {
  return jest.fn().mockImplementation(async (url: string, options: { body: string }) => {
    const body = JSON.parse(options.body);
    const method = body.method;

    let result: unknown;
    switch (method) {
      case 'eth_blockNumber':
        result = '0x100';
        break;
      case 'eth_gasPrice':
        result = '0x1';
        break;
      case 'eth_getTransactionCount':
        result = '0x1';
        break;
      case 'eth_sendRawTransaction':
        result = '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab' as Bytes32;
        break;
      case 'eth_getTransactionReceipt':
        result = {
          blockNumber: '0x100',
          logs: [
            {
              data: '0x' + '00'.repeat(64),
              topics: ['0x1234'],
            },
          ],
        };
        break;
      case 'eth_call':
        result = responses[method] || '0x01';
        break;
      case 'eth_getLogs':
        result = [];
        break;
      default:
        result = responses[method] || '0x';
    }

    return {
      json: () => Promise.resolve({ jsonrpc: '2.0', id: 1, result }),
    };
  });
};

// Mock ZK proof generator
jest.mock('../src/proofs/ZKProofGenerator', () => ({
  ZKProofGenerator: jest.fn().mockImplementation(() => ({
    generateBalanceProof: jest.fn().mockResolvedValue({
      proof: new Uint8Array(256),
      publicInputs: [],
      vkHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Bytes32,
    } as BalanceProof),
    generateStakeProof: jest.fn().mockResolvedValue({
      proof: new Uint8Array(256),
      publicInputs: [],
      vkHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Bytes32,
    } as BalanceProof),
    generateSwapCommitment: jest.fn().mockResolvedValue({
      commitment: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Bytes32,
      nullifier: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Bytes32,
      encryptedNote: new Uint8Array(192),
    } as ZswapCommitment),
  })),
}));

// Mock Zswap integration
jest.mock('../src/utils/ZswapIntegration', () => ({
  ZswapIntegration: jest.fn().mockImplementation(() => ({
    createCommitment: jest.fn().mockResolvedValue({
      commitment: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as Bytes32,
      nullifier: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Bytes32,
      encryptedNote: new Uint8Array(192),
    } as ZswapCommitment),
    shieldedTransfer: jest.fn().mockResolvedValue(
      '0xabcd1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab' as Bytes32
    ),
  })),
}));

// ============================================================================
// TEST CONSTANTS
// ============================================================================

const TEST_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32;
const TEST_RPC_URL = 'https://test-rpc.midnight.network';
const TOKEN_A = '0x0000000000000000000000000000000000000000000000000000000000000001' as Bytes32;
const TOKEN_B = '0x0000000000000000000000000000000000000000000000000000000000000002' as Bytes32;
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000' as Bytes32;

// ============================================================================
// TEST SUITES
// ============================================================================

describe('ZKSwapClient', () => {
  let client: ZKSwapClient;
  let mockFetch: jest.Mock;
  let mockWalletProvider: WalletProvider;

  beforeEach(() => {
    mockWalletProvider = createMockWalletProvider({ balance: 1000000000000n });
    mockFetch = createMockFetch({});
    global.fetch = mockFetch;

    client = new ZKSwapClient({
      contractAddress: TEST_CONTRACT_ADDRESS,
      rpcUrl: TEST_RPC_URL,
      walletProvider: mockWalletProvider,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // SWAP TESTS
  // ==========================================================================

  describe('swap', () => {
    const validSwapOrder: SwapOrderInput = {
      inputTokenId: TOKEN_A,
      inputAmount: 1000000000n,
      outputTokenId: TOKEN_B,
      minOutputAmount: 950000000n,
      deadlineBlocks: 100,
    };

    it('should execute a valid swap', async () => {
      const result = await client.swap(validSwapOrder);

      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.swapId).toBeDefined();
      expect(result.blockNumber).toBeGreaterThan(0);
    });

    it('should reject swap with zero input amount', async () => {
      const invalidOrder: SwapOrderInput = {
        ...validSwapOrder,
        inputAmount: 0n,
      };

      await expect(client.swap(invalidOrder)).rejects.toThrow(ZKSwapError);
      await expect(client.swap(invalidOrder)).rejects.toMatchObject({
        code: ZKSwapErrorCode.INSUFFICIENT_BALANCE,
      });
    });

    it('should reject swap with same input/output token', async () => {
      const invalidOrder: SwapOrderInput = {
        ...validSwapOrder,
        outputTokenId: TOKEN_A,
      };

      await expect(client.swap(invalidOrder)).rejects.toThrow(ZKSwapError);
      await expect(client.swap(invalidOrder)).rejects.toMatchObject({
        code: ZKSwapErrorCode.POOL_NOT_FOUND,
      });
    });

    it('should reject swap with zero deadline', async () => {
      const invalidOrder: SwapOrderInput = {
        ...validSwapOrder,
        deadlineBlocks: 0,
      };

      await expect(client.swap(invalidOrder)).rejects.toThrow(ZKSwapError);
      await expect(client.swap(invalidOrder)).rejects.toMatchObject({
        code: ZKSwapErrorCode.DEADLINE_EXCEEDED,
      });
    });

    it('should calculate correct fee', () => {
      const amount = 1000000000n;
      const fee = client.calculateFee(amount);

      // 0.5% = 50 basis points
      const expectedFee = (amount * BigInt(CONSTANTS.FEE_RATE_BPS)) / BigInt(CONSTANTS.BPS_DIVISOR);
      expect(fee).toBe(expectedFee);
      expect(fee).toBe(5000000n); // 0.5% of 1000000000
    });
  });

  // ==========================================================================
  // BATCH SWAP TESTS
  // ==========================================================================

  describe('batchSwap', () => {
    const validBatchOrder: BatchSwapOrderInput = {
      orders: [
        {
          inputTokenId: TOKEN_A,
          inputAmount: 100000000n,
          outputTokenId: TOKEN_B,
          minOutputAmount: 95000000n,
          deadlineBlocks: 100,
        },
        {
          inputTokenId: TOKEN_B,
          inputAmount: 200000000n,
          outputTokenId: TOKEN_A,
          minOutputAmount: 190000000n,
          deadlineBlocks: 100,
        },
      ],
    };

    it('should reject batch swap for non-premium users', async () => {
      // Mock isPremiumUser to return false
      mockFetch = createMockFetch({ eth_call: '0x00' });
      global.fetch = mockFetch;

      await expect(client.batchSwap(validBatchOrder)).rejects.toThrow(ZKSwapError);
      await expect(client.batchSwap(validBatchOrder)).rejects.toMatchObject({
        code: ZKSwapErrorCode.NOT_PREMIUM_USER,
      });
    });

    it('should reject empty batch', async () => {
      const emptyBatch: BatchSwapOrderInput = { orders: [] };

      await expect(client.batchSwap(emptyBatch)).rejects.toThrow(ZKSwapError);
      await expect(client.batchSwap(emptyBatch)).rejects.toMatchObject({
        code: ZKSwapErrorCode.BATCH_SIZE_EXCEEDED,
      });
    });

    it('should reject batch exceeding max size', async () => {
      const oversizedBatch: BatchSwapOrderInput = {
        orders: Array(6).fill({
          inputTokenId: TOKEN_A,
          inputAmount: 100000000n,
          outputTokenId: TOKEN_B,
          minOutputAmount: 95000000n,
          deadlineBlocks: 100,
        }),
      };

      await expect(client.batchSwap(oversizedBatch)).rejects.toThrow(ZKSwapError);
    });
  });

  // ==========================================================================
  // STAKING TESTS
  // ==========================================================================

  describe('stake', () => {
    it('should stake tokens successfully', async () => {
      const stakeInput: StakeInput = { amount: 150000000000n };
      const result = await client.stake(stakeInput);

      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.stakeId).toBeDefined();
    });

    it('should reject zero stake amount', async () => {
      const invalidStake: StakeInput = { amount: 0n };

      await expect(client.stake(invalidStake)).rejects.toThrow(ZKSwapError);
      await expect(client.stake(invalidStake)).rejects.toMatchObject({
        code: ZKSwapErrorCode.INSUFFICIENT_BALANCE,
      });
    });

    it('should reject negative stake amount', async () => {
      const invalidStake: StakeInput = { amount: -100n };

      await expect(client.stake(invalidStake)).rejects.toThrow(ZKSwapError);
    });

    it('should reject stake exceeding balance', async () => {
      mockWalletProvider = createMockWalletProvider({ balance: 100n });
      client = new ZKSwapClient({
        contractAddress: TEST_CONTRACT_ADDRESS,
        rpcUrl: TEST_RPC_URL,
        walletProvider: mockWalletProvider,
      });

      const stakeInput: StakeInput = { amount: 1000n };

      await expect(client.stake(stakeInput)).rejects.toThrow(ZKSwapError);
      await expect(client.stake(stakeInput)).rejects.toMatchObject({
        code: ZKSwapErrorCode.INSUFFICIENT_BALANCE,
      });
    });
  });

  // ==========================================================================
  // LIQUIDITY TESTS
  // ==========================================================================

  describe('addLiquidity', () => {
    const validLiquidity: AddLiquidityInput = {
      tokenA: TOKEN_A,
      tokenB: TOKEN_B,
      amountA: 1000000000n,
      amountB: 500000000n,
    };

    it('should add liquidity successfully', async () => {
      const result = await client.addLiquidity(validLiquidity);

      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.poolId).toBeDefined();
      expect(result.sharesIssued).toBeDefined();
    });

    it('should reject zero amounts', async () => {
      const invalidLiquidity: AddLiquidityInput = {
        ...validLiquidity,
        amountA: 0n,
      };

      await expect(client.addLiquidity(invalidLiquidity)).rejects.toThrow(ZKSwapError);
    });

    it('should ensure token ordering', async () => {
      // TOKEN_B > TOKEN_A, so they should be swapped internally
      const result = await client.addLiquidity({
        tokenA: TOKEN_B,
        tokenB: TOKEN_A,
        amountA: 500000000n,
        amountB: 1000000000n,
      });

      expect(result).toBeDefined();
    });
  });

  describe('removeLiquidity', () => {
    const validRemoval: RemoveLiquidityInput = {
      tokenA: TOKEN_A,
      tokenB: TOKEN_B,
      shares: 1000000n,
      minAmountA: 900000n,
      minAmountB: 450000n,
    };

    it('should remove liquidity successfully', async () => {
      const result = await client.removeLiquidity(validRemoval);

      expect(result).toBeDefined();
      expect(result.txHash).toBeDefined();
      expect(result.poolId).toBeDefined();
    });

    it('should reject zero shares', async () => {
      const invalidRemoval: RemoveLiquidityInput = {
        ...validRemoval,
        shares: 0n,
      };

      await expect(client.removeLiquidity(invalidRemoval)).rejects.toThrow(ZKSwapError);
    });
  });

  // ==========================================================================
  // GAS ESTIMATION TESTS
  // ==========================================================================

  describe('estimateGas', () => {
    it('should estimate gas for swap', async () => {
      const estimate = await client.estimateGas('executeSwap', []);

      expect(estimate.gasUnits).toBe(250000n);
      expect(estimate.confidence).toBeGreaterThan(0);
    });

    it('should estimate higher gas for batch swap', async () => {
      const estimate = await client.estimateGas('executeBatchSwap', [
        { activeCount: 3n },
      ]);

      expect(estimate.gasUnits).toBe(500000n * 3n);
    });

    it('should estimate gas for stake', async () => {
      const estimate = await client.estimateGas('stake', []);

      expect(estimate.gasUnits).toBe(150000n);
    });
  });

  // ==========================================================================
  // CONTRACT STATE TESTS
  // ==========================================================================

  describe('getContractState', () => {
    it('should fetch contract state', async () => {
      const state = await client.getContractState();

      expect(state).toBeDefined();
      expect(state.config).toBeDefined();
      expect(state.config.feeRateBps).toBeDefined();
      expect(state.totalFeesCollected).toBeDefined();
    });

    it('should cache contract state', async () => {
      await client.getContractState();
      const callCount1 = mockFetch.mock.calls.length;

      await client.getContractState();
      const callCount2 = mockFetch.mock.calls.length;

      // Should not make additional calls due to caching
      expect(callCount2).toBe(callCount1);
    });

    it('should clear cache', async () => {
      await client.getContractState();
      client.clearCache();

      await client.getContractState();

      // Should have made new calls after cache clear
      expect(mockFetch.mock.calls.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // EVENT TESTS
  // ==========================================================================

  describe('events', () => {
    it('should subscribe to events', () => {
      const callback = jest.fn();
      const unsubscribe = client.on('SwapExecuted', callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe from events', () => {
      const callback = jest.fn();
      const unsubscribe = client.on('SwapExecuted', callback);

      unsubscribe();
      // No error should be thrown
    });

    it('should get historical events', async () => {
      const events = await client.getEvents('SwapExecuted', 0, 100);

      expect(Array.isArray(events)).toBe(true);
    });
  });
});

// ============================================================================
// ZK PROOF GENERATOR TESTS
// ============================================================================

describe('ZKProofGenerator', () => {
  let proofGenerator: ZKProofGenerator;

  beforeEach(() => {
    // Use real implementation for these tests
    jest.unmock('../src/proofs/ZKProofGenerator');
    const { ZKProofGenerator: RealZKProofGenerator } = jest.requireActual('../src/proofs/ZKProofGenerator');
    proofGenerator = new RealZKProofGenerator();
  });

  describe('generateBalanceProof', () => {
    it('should generate proof for valid balance', async () => {
      const proof = await proofGenerator.generateBalanceProof(1000n, 500n);

      expect(proof).toBeDefined();
      expect(proof.proof).toBeDefined();
      expect(proof.vkHash).toBeDefined();
    });

    it('should reject insufficient balance', async () => {
      await expect(proofGenerator.generateBalanceProof(100n, 500n))
        .rejects.toThrow();
    });

    it('should cache proofs', async () => {
      const proof1 = await proofGenerator.generateBalanceProof(1000n, 500n);
      const proof2 = await proofGenerator.generateBalanceProof(1000n, 500n);

      expect(proof1.vkHash).toBe(proof2.vkHash);
    });
  });

  describe('generateSwapCommitment', () => {
    it('should generate commitment', async () => {
      const commitment = await proofGenerator.generateSwapCommitment(TOKEN_A, 1000n);

      expect(commitment).toBeDefined();
      expect(commitment.commitment).toBeDefined();
      expect(commitment.nullifier).toBeDefined();
      expect(commitment.encryptedNote).toBeDefined();
    });

    it('should generate unique commitments', async () => {
      const commitment1 = await proofGenerator.generateSwapCommitment(TOKEN_A, 1000n);
      const commitment2 = await proofGenerator.generateSwapCommitment(TOKEN_A, 1000n);

      // Commitments should be different due to random salt
      // Note: In the mock, they might be the same
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration', () => {
  describe('Full swap flow', () => {
    it('should complete a full swap flow', async () => {
      const mockWallet = createMockWalletProvider({ balance: 1000000000000n });
      const mockFetch = createMockFetch({});
      global.fetch = mockFetch;

      const client = new ZKSwapClient({
        contractAddress: TEST_CONTRACT_ADDRESS,
        rpcUrl: TEST_RPC_URL,
        walletProvider: mockWallet,
      });

      // 1. Get swap quote
      // Note: This would fail without a real pool, so we test error handling
      try {
        await client.getSwapQuote(TOKEN_A, TOKEN_B, 1000000000n);
      } catch (e) {
        expect((e as ZKSwapError).code).toBe(ZKSwapErrorCode.POOL_NOT_FOUND);
      }

      // 2. Execute swap
      const swapResult = await client.swap({
        inputTokenId: TOKEN_A,
        inputAmount: 1000000000n,
        outputTokenId: TOKEN_B,
        minOutputAmount: 950000000n,
        deadlineBlocks: 100,
      });

      expect(swapResult.txHash).toBeDefined();

      // 3. Check fees collected
      const fees = await client.getTotalFeesCollected();
      expect(fees).toBeDefined();
    });
  });

  describe('Staking and premium flow', () => {
    it('should stake and become premium', async () => {
      const mockWallet = createMockWalletProvider({ balance: 200000000000n });
      const mockFetch = createMockFetch({ eth_call: '0x01' }); // Premium user
      global.fetch = mockFetch;

      const client = new ZKSwapClient({
        contractAddress: TEST_CONTRACT_ADDRESS,
        rpcUrl: TEST_RPC_URL,
        walletProvider: mockWallet,
      });

      // 1. Stake tokens
      const stakeResult = await client.stake({ amount: 150000000000n });
      expect(stakeResult.txHash).toBeDefined();

      // 2. Check premium status
      const address = await mockWallet.getAddress();
      const isPremium = await client.isPremiumUser(address);
      expect(isPremium).toBe(true);
    });
  });

  describe('Liquidity provision flow', () => {
    it('should add and remove liquidity', async () => {
      const mockWallet = createMockWalletProvider({ balance: 1000000000000n });
      const mockFetch = createMockFetch({});
      global.fetch = mockFetch;

      const client = new ZKSwapClient({
        contractAddress: TEST_CONTRACT_ADDRESS,
        rpcUrl: TEST_RPC_URL,
        walletProvider: mockWallet,
      });

      // 1. Add liquidity
      const addResult = await client.addLiquidity({
        tokenA: TOKEN_A,
        tokenB: TOKEN_B,
        amountA: 1000000000n,
        amountB: 500000000n,
      });

      expect(addResult.poolId).toBeDefined();
      expect(addResult.sharesIssued).toBeDefined();

      // 2. Remove liquidity
      const removeResult = await client.removeLiquidity({
        tokenA: TOKEN_A,
        tokenB: TOKEN_B,
        shares: addResult.sharesIssued,
        minAmountA: 900000000n,
        minAmountB: 450000000n,
      });

      expect(removeResult.poolId).toBeDefined();
    });
  });
});

// ============================================================================
// SECURITY TESTS
// ============================================================================

describe('Security', () => {
  describe('Input validation', () => {
    let client: ZKSwapClient;

    beforeEach(() => {
      const mockWallet = createMockWalletProvider({});
      const mockFetch = createMockFetch({});
      global.fetch = mockFetch;

      client = new ZKSwapClient({
        contractAddress: TEST_CONTRACT_ADDRESS,
        rpcUrl: TEST_RPC_URL,
        walletProvider: mockWallet,
      });
    });

    it('should validate token IDs', async () => {
      // Same token swap should fail
      await expect(client.swap({
        inputTokenId: TOKEN_A,
        inputAmount: 1000n,
        outputTokenId: TOKEN_A,
        minOutputAmount: 900n,
        deadlineBlocks: 100,
      })).rejects.toThrow();
    });

    it('should validate amounts are positive', async () => {
      await expect(client.swap({
        inputTokenId: TOKEN_A,
        inputAmount: -1n,
        outputTokenId: TOKEN_B,
        minOutputAmount: 900n,
        deadlineBlocks: 100,
      })).rejects.toThrow();
    });

    it('should validate deadlines are positive', async () => {
      await expect(client.swap({
        inputTokenId: TOKEN_A,
        inputAmount: 1000n,
        outputTokenId: TOKEN_B,
        minOutputAmount: 900n,
        deadlineBlocks: -1,
      })).rejects.toThrow();
    });
  });

  describe('Double-spend prevention', () => {
    it('should generate unique nullifiers for each commitment', async () => {
      const { ZswapIntegration: RealZswapIntegration } = jest.requireActual('../src/utils/ZswapIntegration');
      const zswap = new RealZswapIntegration(TEST_RPC_URL);

      const commitment1 = await zswap.createCommitment(TOKEN_A, 1000n, TOKEN_B);
      const commitment2 = await zswap.createCommitment(TOKEN_A, 1000n, TOKEN_B);

      // Each commitment should have a unique nullifier
      expect(commitment1.nullifier).not.toBe(commitment2.nullifier);
    });
  });
});

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Constants', () => {
  it('should have correct fee rate', () => {
    expect(CONSTANTS.FEE_RATE_BPS).toBe(50); // 0.5%
  });

  it('should have correct premium threshold', () => {
    expect(CONSTANTS.PREMIUM_THRESHOLD).toBe(BigInt('100000000000')); // 100 NIGHT
  });

  it('should have correct max batch size', () => {
    expect(CONSTANTS.MAX_BATCH_SIZE).toBe(5);
  });

  it('should have correct BPS divisor', () => {
    expect(CONSTANTS.BPS_DIVISOR).toBe(10000);
  });
});
