/**
 * Stub type declarations for Midnight Network packages
 * These declarations allow TypeScript to compile without the actual packages
 */

declare module '@midnight-ntwrk/compact-runtime' {
  export interface CompactContract {
    address: string;
    call(method: string, args: unknown[]): Promise<unknown>;
  }

  export interface CompactRuntime {
    connect(config: unknown): Promise<void>;
    getContract(address: string): CompactContract;
  }

  export function createRuntime(config: unknown): CompactRuntime;
}

declare module '@midnight-ntwrk/ledger' {
  export interface LedgerState {
    getBalance(address: string, tokenId: string): Promise<bigint>;
    getBlockNumber(): Promise<number>;
  }

  export interface Transaction {
    hash: string;
    from: string;
    to: string;
    data: Uint8Array;
  }

  export interface TransactionReceipt {
    status: 'success' | 'failed';
    blockNumber: number;
    timestamp: number;
    logs: unknown[];
  }

  export class Ledger {
    constructor(config: unknown);
    getState(): Promise<LedgerState>;
    sendTransaction(tx: Transaction): Promise<string>;
    waitForTransaction(hash: string): Promise<TransactionReceipt>;
  }
}

declare module '@midnight-ntwrk/wallet-api' {
  export interface WalletAccount {
    address: string;
    publicKey: string;
  }

  export interface WalletProvider {
    connect(): Promise<WalletAccount[]>;
    signTransaction(tx: unknown): Promise<unknown>;
    signMessage(message: string): Promise<string>;
    getBalance(tokenId: string): Promise<bigint>;
  }

  export function createWalletProvider(config: unknown): WalletProvider;
}

declare module '@midnight-ntwrk/zswap' {
  export interface ZswapCommitment {
    commitment: string;
    nullifier: string;
    encryptedNote: Uint8Array;
  }

  export interface ZswapProof {
    proof: Uint8Array;
    publicInputs: bigint[];
  }

  export interface MerkleProof {
    root: string;
    path: string[];
    indices: number[];
  }

  export class Zswap {
    constructor(config: unknown);
    createCommitment(tokenId: string, amount: bigint, recipient: string): Promise<ZswapCommitment>;
    createTransferProof(inputs: unknown[], outputs: unknown[]): Promise<ZswapProof>;
    getMerkleProof(commitment: string): Promise<MerkleProof>;
    verifyProof(proof: ZswapProof): Promise<boolean>;
  }
}
