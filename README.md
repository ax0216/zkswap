# ZKSwap Vault DApp

A privacy-preserving decentralized exchange (DEX) protocol built on Midnight blockchain.

## Features

- **Private Asset Swaps**: Use Zswap for anonymous token transfers where sender, recipient, and amounts are hidden
- **ZK Balance Proofs**: Verify sufficient balance without revealing actual holdings
- **0.5% Swap Fee**: Collected in DUST tokens and sent to developer wallet
- **Premium Tier**: Stake >100 NIGHT tokens to unlock batch swaps (up to 5 assets per transaction)
- **On-Chain Events**: Comprehensive event emission for tracking and analytics

## Architecture

```
zkswap-vault/
├── src/
│   ├── contracts/           # Compact smart contracts
│   │   └── zkswap_vault.compact
│   ├── client/              # TypeScript client SDK
│   │   └── ZKSwapClient.ts
│   ├── proofs/              # ZK proof generation
│   │   └── ZKProofGenerator.ts
│   ├── utils/               # Utility modules
│   │   └── ZswapIntegration.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   └── index.ts             # Main exports
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

```bash
npm install zkswap-vault
```

## Quick Start

```typescript
import { ZKSwapClient, TOKEN_IDS, RPC_ENDPOINTS } from 'zkswap-vault';

// Initialize client
const client = new ZKSwapClient({
  contractAddress: CONTRACT_ADDRESS,
  rpcUrl: RPC_ENDPOINTS.MAINNET,
  walletProvider: myWallet,
});

// Execute a private swap
const result = await client.swap({
  inputTokenId: TOKEN_IDS.NIGHT,
  inputAmount: 1000000000n,  // 1 NIGHT (9 decimals)
  outputTokenId: TOKEN_IDS.DUST,
  minOutputAmount: 950000000n,  // 5% slippage tolerance
  deadlineBlocks: 100,
});

console.log('Swap ID:', result.swapId);
console.log('Fee paid:', result.feeCollected, 'DUST');
```

## Premium Features

Stake more than 100 NIGHT tokens to unlock premium features:

```typescript
// Stake NIGHT tokens
const stakeResult = await client.stake({
  amount: 150000000000n,  // 150 NIGHT
});

console.log('Premium eligible:', stakeResult.isPremiumEligible);

// Execute batch swap (premium only)
const batchResult = await client.batchSwap({
  orders: [
    { inputTokenId: TOKEN_A, inputAmount: 100n, outputTokenId: TOKEN_B, minOutputAmount: 95n, deadlineBlocks: 100 },
    { inputTokenId: TOKEN_C, inputAmount: 200n, outputTokenId: TOKEN_D, minOutputAmount: 190n, deadlineBlocks: 100 },
    { inputTokenId: TOKEN_E, inputAmount: 300n, outputTokenId: TOKEN_F, minOutputAmount: 285n, deadlineBlocks: 100 },
  ],
});

console.log('Batch ID:', batchResult.batchId);
console.log('Swaps executed:', batchResult.swapCount);
```

## Contract Functions

### Swap Operations

| Function | Description | Access |
|----------|-------------|--------|
| `executeSwap` | Execute a private token swap | Public |
| `executeBatchSwap` | Execute up to 5 swaps in one tx | Premium |
| `addLiquidity` | Add liquidity to a pool | Public |

### Staking Operations

| Function | Description | Access |
|----------|-------------|--------|
| `stake` | Stake NIGHT tokens | Public |
| `unstake` | Withdraw staked NIGHT | Public |
| `isPremiumUser` | Check premium status | View |

### View Functions

| Function | Description |
|----------|-------------|
| `getTotalFeesCollected` | Total DUST fees collected |
| `getDeveloperWallet` | Developer wallet address |
| `getFeeRate` | Current fee rate (basis points) |
| `getPremiumThreshold` | NIGHT required for premium |

## Events

| Event | Emitted When |
|-------|--------------|
| `SwapExecuted` | Single swap completed |
| `BatchSwapExecuted` | Batch swap completed |
| `Staked` | User stakes NIGHT |
| `Unstaked` | User unstakes NIGHT |
| `FeesCollected` | Fees transferred to dev wallet |
| `LiquidityAdded` | Liquidity added to pool |

## Fee Structure

- **Swap Fee**: 0.5% (50 basis points) per swap
- **Fee Token**: DUST
- **Recipient**: Developer wallet (configurable)

## Premium Tier

| Requirement | Benefit |
|-------------|---------|
| Stake >100 NIGHT | Batch swaps (up to 5 assets) |

## Privacy Model

ZKSwap Vault uses Midnight's ZK proof system for privacy:

1. **Balance Proofs**: Prove you have sufficient funds without revealing your balance
2. **Zswap Commitments**: Hide transfer amounts using cryptographic commitments
3. **Nullifiers**: Prevent double-spending while maintaining privacy
4. **Shielded Transfers**: Complete transactions without revealing parties or amounts

## Development

### Build

```bash
npm run build
```

### Compile Compact Contract

```bash
npm run compile:compact
```

### Test

```bash
npm test
```

## Security Considerations

- All swap amounts are kept private using witness fields
- Balance verification uses ZK proofs (no amount revealed)
- Zswap nullifiers prevent double-spending
- Pool reserves are private (not publicly visible)
- Admin functions require developer wallet signature

## License

MIT
