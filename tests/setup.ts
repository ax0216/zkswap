/**
 * ZKSwap Vault - Jest Test Setup
 *
 * Global test setup and mocks for the test environment.
 */

// Mock Midnight SDK modules
jest.mock('@midnight-ntwrk/compact-runtime', () => ({
  CompactRuntime: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    call: jest.fn().mockResolvedValue({ success: true }),
    deploy: jest.fn().mockResolvedValue({ contractAddress: '0x' + '01'.repeat(32) }),
  })),
  CompactContract: jest.fn(),
}));

jest.mock('@midnight-ntwrk/ledger', () => ({
  Ledger: jest.fn().mockImplementation(() => ({
    getState: jest.fn().mockResolvedValue({}),
    subscribe: jest.fn().mockReturnValue({ unsubscribe: jest.fn() }),
  })),
  Transaction: jest.fn(),
  Block: jest.fn(),
}));

jest.mock('@midnight-ntwrk/wallet-api', () => ({
  WalletProvider: jest.fn(),
  WalletConnector: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({ address: '0x' + '02'.repeat(32) }),
    disconnect: jest.fn().mockResolvedValue(undefined),
    signTransaction: jest.fn().mockResolvedValue('signature'),
    getBalance: jest.fn().mockResolvedValue('1000000000000'),
  })),
}));

jest.mock('@midnight-ntwrk/zswap', () => ({
  Zswap: jest.fn().mockImplementation(() => ({
    createCommitment: jest.fn().mockResolvedValue({
      commitment: '0x' + 'aa'.repeat(32),
      nullifier: '0x' + 'bb'.repeat(32),
      randomness: '0x' + 'cc'.repeat(32),
    }),
    verifyCommitment: jest.fn().mockResolvedValue(true),
    createShieldedTransfer: jest.fn().mockResolvedValue({
      proof: '0x' + 'dd'.repeat(64),
      inputs: [],
      outputs: [],
    }),
  })),
  ZswapProof: jest.fn(),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log during tests unless debugging
  log: process.env.DEBUG ? console.log : jest.fn(),
  debug: process.env.DEBUG ? console.debug : jest.fn(),
  info: process.env.DEBUG ? console.info : jest.fn(),
  // Keep warnings and errors visible
  warn: console.warn,
  error: console.error,
};

// Mock crypto for test environment
if (typeof global.crypto === 'undefined') {
  const nodeCrypto = require('crypto');
  Object.defineProperty(global, 'crypto', {
    value: {
      getRandomValues: (arr: Uint8Array) => nodeCrypto.randomBytes(arr.length),
      subtle: nodeCrypto.webcrypto?.subtle,
    },
  });
}

// Mock TextEncoder/TextDecoder if not available
if (typeof TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Test timeout configuration
jest.setTimeout(30000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});

// Export test utilities
export const mockAddress = '0x' + '01'.repeat(32);
export const mockTxHash = '0x' + '02'.repeat(32);
export const mockContractAddress = '0x' + '03'.repeat(32);

export const createMockWalletProvider = () => ({
  connect: jest.fn().mockResolvedValue({ address: mockAddress }),
  disconnect: jest.fn().mockResolvedValue(undefined),
  signTransaction: jest.fn().mockResolvedValue('0xsignature'),
  signMessage: jest.fn().mockResolvedValue('0xmessagesig'),
  getBalance: jest.fn().mockResolvedValue('1000000000000'),
  getAddress: jest.fn().mockReturnValue(mockAddress),
});

export const createMockRpcClient = () => ({
  call: jest.fn().mockResolvedValue({ result: {} }),
  send: jest.fn().mockResolvedValue({ txHash: mockTxHash }),
  getBlock: jest.fn().mockResolvedValue({ height: 1000 }),
  getTransaction: jest.fn().mockResolvedValue({ status: 'confirmed' }),
});
