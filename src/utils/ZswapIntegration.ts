/**
 * ZKSwap Vault DApp - Zswap Integration
 *
 * This module provides integration with Midnight's Zswap protocol
 * for privacy-preserving token transfers.
 *
 * Zswap enables:
 * - Shielded transfers (hidden sender, recipient, amount)
 * - Commitment-based verification
 * - Nullifier-based double-spend prevention
 *
 * @module utils
 */

import {
  Bytes32,
  ZswapCommitment,
  ZswapTransferProof,
  ZKSwapError,
  ZKSwapErrorCode,
} from '../types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Zswap protocol parameters
 */
const ZSWAP_PARAMS = {
  /** Merkle tree depth for commitment storage */
  MERKLE_TREE_DEPTH: 32,
  /** Number of input/output notes per transaction */
  MAX_NOTES: 2,
  /** Minimum gas for shielded transfer */
  MIN_GAS: 100000n,
} as const;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Note representing a private balance
 */
interface Note {
  /** Token ID */
  tokenId: Bytes32;
  /** Amount (private) */
  amount: bigint;
  /** Owner address (private) */
  owner: Bytes32;
  /** Random salt */
  salt: Bytes32;
  /** Commitment to this note */
  commitment: Bytes32;
  /** Nullifier (derived from salt and owner) */
  nullifier: Bytes32;
}

/**
 * Merkle proof for note membership
 */
interface MerkleProof {
  /** Sibling hashes from leaf to root */
  siblings: Bytes32[];
  /** Path indices (0 = left, 1 = right) */
  pathIndices: number[];
  /** Root hash */
  root: Bytes32;
}

/**
 * Shielded transfer parameters
 */
interface ShieldedTransferParams {
  /** Input notes to spend */
  inputNotes: Note[];
  /** Output notes to create */
  outputNotes: Note[];
  /** Merkle proofs for input notes */
  merkleProofs: MerkleProof[];
}

// ============================================================================
// ZSWAP INTEGRATION CLASS
// ============================================================================

/**
 * Zswap Integration
 *
 * Handles interaction with Midnight's Zswap protocol for
 * private token transfers.
 *
 * @example
 * ```typescript
 * const zswap = new ZswapIntegration('https://rpc.midnight.network');
 *
 * // Create a commitment for private transfer
 * const commitment = await zswap.createCommitment(
 *   tokenId,
 *   amount,
 *   recipientAddress
 * );
 *
 * // Execute shielded transfer
 * await zswap.shieldedTransfer(commitment);
 * ```
 */
export class ZswapIntegration {
  private readonly rpcUrl: string;
  private readonly noteStore: Map<Bytes32, Note>;
  private readonly nullifierSet: Set<string>;

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
    this.noteStore = new Map();
    this.nullifierSet = new Set();
  }

  // ==========================================================================
  // PUBLIC METHODS
  // ==========================================================================

  /**
   * Create a Zswap commitment for a token transfer
   *
   * The commitment hides the token amount and can only be
   * spent by the recipient who knows the secret.
   *
   * @param tokenId - Token being transferred
   * @param amount - Amount to transfer (will be hidden)
   * @param recipient - Recipient address
   * @returns Zswap commitment for the transfer
   *
   * @example
   * ```typescript
   * const commitment = await zswap.createCommitment(
   *   NIGHT_TOKEN,
   *   1000000000n,
   *   recipientAddress
   * );
   * ```
   */
  async createCommitment(
    tokenId: Bytes32,
    amount: bigint,
    recipient: Bytes32
  ): Promise<ZswapCommitment> {
    // Generate random salt
    const salt = this.generateRandomBytes32();

    // Create note
    const note = this.createNote(tokenId, amount, recipient, salt);

    // Store note for later spending
    this.noteStore.set(note.commitment, note);

    // Return commitment
    return {
      commitment: note.commitment,
      nullifier: note.nullifier,
      encryptedNote: this.encryptNote(note, recipient),
    };
  }

  /**
   * Execute a shielded transfer using a commitment
   *
   * This spends input notes and creates output notes
   * without revealing amounts or parties.
   *
   * @param commitment - The commitment to use for transfer
   * @returns Transaction hash
   */
  async shieldedTransfer(commitment: ZswapCommitment): Promise<Bytes32> {
    // Verify commitment exists
    const note = this.noteStore.get(commitment.commitment);
    if (!note) {
      throw new ZKSwapError(
        ZKSwapErrorCode.PROOF_VERIFICATION_FAILED,
        'Commitment not found'
      );
    }

    // Check nullifier hasn't been spent
    if (this.nullifierSet.has(commitment.nullifier)) {
      throw new ZKSwapError(
        ZKSwapErrorCode.PROOF_VERIFICATION_FAILED,
        'Note already spent (nullifier exists)'
      );
    }

    // Generate transfer proof
    const proof = await this.generateTransferProof([note], [note]);

    // Submit to network
    const txHash = await this.submitShieldedTransfer(proof);

    // Mark nullifier as spent
    this.nullifierSet.add(commitment.nullifier);

    return txHash;
  }

  /**
   * Generate a transfer proof for spending notes
   *
   * @param inputNotes - Notes being spent
   * @param outputNotes - Notes being created
   * @returns Transfer proof
   */
  async generateTransferProof(
    inputNotes: Note[],
    outputNotes: Note[]
  ): Promise<ZswapTransferProof> {
    // Get merkle proofs for input notes
    const merkleProofs = await Promise.all(
      inputNotes.map(note => this.getMerkleProof(note.commitment))
    );

    // Generate ZK proof
    const proof = await this.proveTransfer({
      inputNotes,
      outputNotes,
      merkleProofs,
    });

    return {
      inputCommitments: inputNotes.map(n => ({
        commitment: n.commitment,
        nullifier: n.nullifier,
        encryptedNote: new Uint8Array(0),
      })),
      outputCommitments: outputNotes.map(n => ({
        commitment: n.commitment,
        nullifier: n.nullifier,
        encryptedNote: this.encryptNote(n, n.owner),
      })),
      proof,
    };
  }

  /**
   * Verify a transfer proof is valid
   *
   * @param proof - Transfer proof to verify
   * @returns Whether proof is valid
   */
  async verifyTransferProof(proof: ZswapTransferProof): Promise<boolean> {
    // Verify nullifiers haven't been spent
    for (const input of proof.inputCommitments) {
      if (this.nullifierSet.has(input.nullifier)) {
        return false;
      }
    }

    // Verify ZK proof (simplified)
    const isValid = await this.verifyProof(proof.proof);

    return isValid;
  }

  /**
   * Get the current Merkle root
   *
   * @returns Current commitment tree root
   */
  async getMerkleRoot(): Promise<Bytes32> {
    const response = await this.rpcCall('zswap_getMerkleRoot', []);
    return response.result as Bytes32;
  }

  /**
   * Check if a nullifier has been spent
   *
   * @param nullifier - Nullifier to check
   * @returns Whether nullifier has been spent
   */
  async isNullifierSpent(nullifier: Bytes32): Promise<boolean> {
    if (this.nullifierSet.has(nullifier)) {
      return true;
    }

    const response = await this.rpcCall('zswap_isNullifierSpent', [nullifier]);
    return response.result as boolean;
  }

  /**
   * Scan for notes belonging to an address
   *
   * @param viewingKey - User's viewing key for decryption
   * @param fromBlock - Starting block
   * @param toBlock - Ending block
   * @returns Array of notes belonging to user
   */
  async scanForNotes(
    viewingKey: Bytes32,
    fromBlock: number,
    toBlock?: number
  ): Promise<Note[]> {
    // Query commitment events
    const events = await this.queryCommitmentEvents(fromBlock, toBlock);

    const notes: Note[] = [];

    for (const event of events) {
      try {
        // Try to decrypt with viewing key
        const decrypted = this.tryDecryptNote(event.encryptedNote, viewingKey);
        if (decrypted) {
          notes.push(decrypted);
        }
      } catch {
        // Not our note, continue
      }
    }

    return notes;
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Create a note structure
   */
  private createNote(
    tokenId: Bytes32,
    amount: bigint,
    owner: Bytes32,
    salt: Bytes32
  ): Note {
    const commitment = this.computeCommitment(tokenId, amount, owner, salt);
    const nullifier = this.computeNullifier(commitment, owner, salt);

    return {
      tokenId,
      amount,
      owner,
      salt,
      commitment,
      nullifier,
    };
  }

  /**
   * Compute commitment hash
   */
  private computeCommitment(
    tokenId: Bytes32,
    amount: bigint,
    owner: Bytes32,
    salt: Bytes32
  ): Bytes32 {
    // Poseidon hash: H(tokenId, amount, owner, salt)
    const data = this.packCommitmentData(tokenId, amount, owner, salt);
    return this.poseidonHash(data);
  }

  /**
   * Compute nullifier
   */
  private computeNullifier(
    commitment: Bytes32,
    owner: Bytes32,
    salt: Bytes32
  ): Bytes32 {
    // Nullifier: H(commitment, owner, salt)
    const data = this.packNullifierData(commitment, owner, salt);
    return this.poseidonHash(data);
  }

  /**
   * Pack commitment data for hashing
   */
  private packCommitmentData(
    tokenId: Bytes32,
    amount: bigint,
    owner: Bytes32,
    salt: Bytes32
  ): Uint8Array {
    const data = new Uint8Array(128);
    data.set(this.hexToBytes(tokenId), 0);
    data.set(this.bigintToBytes(amount), 32);
    data.set(this.hexToBytes(owner), 64);
    data.set(this.hexToBytes(salt), 96);
    return data;
  }

  /**
   * Pack nullifier data for hashing
   */
  private packNullifierData(
    commitment: Bytes32,
    owner: Bytes32,
    salt: Bytes32
  ): Uint8Array {
    const data = new Uint8Array(96);
    data.set(this.hexToBytes(commitment), 0);
    data.set(this.hexToBytes(owner), 32);
    data.set(this.hexToBytes(salt), 64);
    return data;
  }

  /**
   * Poseidon hash (placeholder implementation)
   */
  private poseidonHash(data: Uint8Array): Bytes32 {
    // In production, use proper Poseidon hash
    let hash = 0n;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash * 31n) + BigInt(data[i])) % (2n ** 256n);
    }
    return this.bigintToBytes32(hash);
  }

  /**
   * Encrypt note for recipient
   */
  private encryptNote(note: Note, recipient: Bytes32): Uint8Array {
    // In production, use proper encryption (e.g., ECIES)
    const plaintext = new Uint8Array(128);
    plaintext.set(this.hexToBytes(note.tokenId), 0);
    plaintext.set(this.bigintToBytes(note.amount), 32);
    plaintext.set(this.hexToBytes(note.owner), 64);
    plaintext.set(this.hexToBytes(note.salt), 96);

    // Simple XOR encryption (placeholder)
    const key = this.deriveEncryptionKey(recipient);
    const ciphertext = new Uint8Array(128);
    for (let i = 0; i < 128; i++) {
      ciphertext[i] = plaintext[i] ^ key[i % 32];
    }

    return ciphertext;
  }

  /**
   * Try to decrypt note with viewing key
   */
  private tryDecryptNote(
    encryptedNote: Uint8Array,
    viewingKey: Bytes32
  ): Note | null {
    try {
      const key = this.hexToBytes(viewingKey);
      const plaintext = new Uint8Array(128);

      for (let i = 0; i < 128; i++) {
        plaintext[i] = encryptedNote[i] ^ key[i % 32];
      }

      // Parse note
      const tokenId = this.bytesToHex(plaintext.slice(0, 32));
      const amount = this.bytesToBigint(plaintext.slice(32, 64));
      const owner = this.bytesToHex(plaintext.slice(64, 96));
      const salt = this.bytesToHex(plaintext.slice(96, 128));

      return this.createNote(tokenId, amount, owner, salt);
    } catch {
      return null;
    }
  }

  /**
   * Derive encryption key from address
   */
  private deriveEncryptionKey(address: Bytes32): Uint8Array {
    return this.hexToBytes(address);
  }

  /**
   * Get Merkle proof for a commitment
   */
  private async getMerkleProof(commitment: Bytes32): Promise<MerkleProof> {
    const response = await this.rpcCall<{
      siblings: string[];
      pathIndices: number[];
      root: string;
    }>('zswap_getMerkleProof', [commitment]);

    const result = response.result || { siblings: [], pathIndices: [], root: '0x' };
    return {
      siblings: result.siblings as Bytes32[],
      pathIndices: result.pathIndices,
      root: result.root as Bytes32,
    };
  }

  /**
   * Generate ZK transfer proof
   */
  private async proveTransfer(
    params: ShieldedTransferParams
  ): Promise<Uint8Array> {
    // In production, this would generate actual ZK proof
    // For now, return a placeholder proof

    const proof = new Uint8Array(256);

    // Encode input commitments
    let offset = 0;
    for (const note of params.inputNotes) {
      proof.set(this.hexToBytes(note.commitment), offset);
      offset += 32;
    }

    // Encode output commitments
    for (const note of params.outputNotes) {
      proof.set(this.hexToBytes(note.commitment), offset);
      offset += 32;
    }

    // Add random padding
    crypto.getRandomValues(proof.subarray(offset));

    return proof;
  }

  /**
   * Verify ZK proof
   */
  private async verifyProof(proof: Uint8Array): Promise<boolean> {
    // In production, verify with on-chain verifier
    return proof.length >= 256;
  }

  /**
   * Submit shielded transfer to network
   */
  private async submitShieldedTransfer(
    proof: ZswapTransferProof
  ): Promise<Bytes32> {
    const response = await this.rpcCall<string>('zswap_submitTransfer', [
      {
        inputCommitments: proof.inputCommitments.map(c => c.commitment),
        outputCommitments: proof.outputCommitments.map(c => c.commitment),
        nullifiers: proof.inputCommitments.map(c => c.nullifier),
        proof: Buffer.from(proof.proof).toString('hex'),
      },
    ]);

    return (response.result || '0x') as Bytes32;
  }

  /**
   * Query commitment events from blockchain
   */
  private async queryCommitmentEvents(
    fromBlock: number,
    toBlock?: number
  ): Promise<Array<{ commitment: Bytes32; encryptedNote: Uint8Array }>> {
    const response = await this.rpcCall<Array<{ commitment: string; encryptedNote: string }>>('zswap_getCommitmentEvents', [
      fromBlock,
      toBlock || 'latest',
    ]);

    return (response.result || []).map(evt => ({
      commitment: evt.commitment as Bytes32,
      encryptedNote: this.hexToBytes(evt.encryptedNote as Bytes32),
    }));
  }

  /**
   * Make RPC call
   */
  private async rpcCall<T = unknown>(
    method: string,
    params: unknown[]
  ): Promise<{ result: T | undefined; error?: { code: number; message: string } }> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id: Date.now(),
      }),
    });

    return response.json() as Promise<{ result: T | undefined; error?: { code: number; message: string } }>;
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Generate random 32 bytes
   */
  private generateRandomBytes32(): Bytes32 {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return ('0x' + Buffer.from(bytes).toString('hex')) as Bytes32;
  }

  /**
   * Convert hex string to bytes
   */
  private hexToBytes(hex: Bytes32): Uint8Array {
    const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16) || 0;
    }
    return bytes;
  }

  /**
   * Convert bytes to hex string
   */
  private bytesToHex(bytes: Uint8Array): Bytes32 {
    return ('0x' + Buffer.from(bytes).toString('hex')) as Bytes32;
  }

  /**
   * Convert bigint to bytes
   */
  private bigintToBytes(value: bigint): Uint8Array {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      bytes[31 - i] = Number((value >> (BigInt(i) * 8n)) & 0xffn);
    }
    return bytes;
  }

  /**
   * Convert bigint to Bytes32
   */
  private bigintToBytes32(value: bigint): Bytes32 {
    const bytes = this.bigintToBytes(value);
    return this.bytesToHex(bytes);
  }

  /**
   * Convert bytes to bigint
   */
  private bytesToBigint(bytes: Uint8Array): bigint {
    let value = 0n;
    for (const byte of bytes) {
      value = (value << 8n) | BigInt(byte);
    }
    return value;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ZswapIntegration;
