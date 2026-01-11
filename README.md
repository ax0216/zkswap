# ZKSwap Vault DApp

A privacy-preserving decentralized exchange (DEX) protocol built on Midnight blockchain. Execute private token swaps with zero-knowledge proofs, stake NIGHT tokens for premium features, and provide liquidity to earn rewards.

## Features

- **Private Asset Swaps**: Use Zswap for anonymous token transfers where sender, recipient, and amounts are hidden
- **ZK Balance Proofs**: Verify sufficient balance without revealing actual holdings
- **0.5% Swap Fee**: Collected in DUST tokens and sent to developer wallet
- **Premium Tier**: Stake >100 NIGHT tokens to unlock batch swaps (up to 5 assets per transaction)
- **Yield Farming**: Earn rewards by providing liquidity to pools
- **On-Chain Events**: Comprehensive event emission for tracking and analytics
- **React Frontend**: Complete UI components for wallet connection, swaps, staking, and liquidity

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
│   ├── frontend/            # React components
│   │   ├── components/      # UI components
│   │   ├── context/         # Wallet context
│   │   └── hooks/           # React hooks
│   └── index.ts             # Main exports
├── tests/                   # Test suites
│   └── ZKSwapClient.test.ts
├── scripts/                 # Deployment scripts
│   └── deploy.ts
├── SECURITY_AUDIT.md        # Security analysis
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

```bash
npm install zkswap-vault
```

## Quick Start

### Backend SDK

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

### React Frontend

```tsx
import {
  WalletProvider,
  WalletConnect,
  SwapForm,
  StakePanel,
  LiquidityPanel,
  PoolStats,
  allStyles,
} from 'zkswap-vault/frontend';

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = allStyles;
document.head.appendChild(styleSheet);

function App() {
  return (
    <WalletProvider autoConnect>
      <header>
        <h1>ZKSwap Vault</h1>
        <WalletConnect />
      </header>

      <main>
        <SwapForm onSwapComplete={(tx) => console.log('Swap:', tx)} />
        <StakePanel />
        <LiquidityPanel />
        <PoolStats />
      </main>
    </WalletProvider>
  );
}
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
| `removeLiquidity` | Remove liquidity from a pool | Public |

### Staking Operations

| Function | Description | Access |
|----------|-------------|--------|
| `stake` | Stake NIGHT tokens | Public |
| `unstake` | Withdraw staked NIGHT | Public |
| `claimRewards` | Claim yield farming rewards | Public |
| `isPremiumUser` | Check premium status | View |

### Admin Functions

| Function | Description | Access |
|----------|-------------|--------|
| `setFeeRate` | Update swap fee rate | Admin |
| `setPremiumThreshold` | Update premium stake requirement | Admin |
| `setRewardConfig` | Configure yield farming rewards | Admin |
| `pause` / `unpause` | Emergency pause protocol | Admin |
| `emergencyWithdraw` | Emergency fund recovery | Admin |

### View Functions

| Function | Description |
|----------|-------------|
| `getTotalFeesCollected` | Total DUST fees collected |
| `getDeveloperWallet` | Developer wallet address |
| `getFeeRate` | Current fee rate (basis points) |
| `getPremiumThreshold` | NIGHT required for premium |
| `getTotalStaked` | Total NIGHT staked in protocol |
| `getPoolReserves` | Get pool liquidity reserves |
| `getLPBalance` | Get LP token balance |

## Events

| Event | Emitted When |
|-------|--------------|
| `SwapExecuted` | Single swap completed |
| `BatchSwapExecuted` | Batch swap completed |
| `Staked` | User stakes NIGHT |
| `Unstaked` | User unstakes NIGHT |
| `FeesCollected` | Fees transferred to dev wallet |
| `LiquidityAdded` | Liquidity added to pool |
| `LiquidityRemoved` | Liquidity removed from pool |
| `RewardsClaimed` | User claims yield rewards |

## Fee Structure

- **Swap Fee**: 0.5% (50 basis points) per swap
- **Fee Token**: DUST
- **Recipient**: Developer wallet (configurable)
- **Premium Discount**: VIP tier (1000+ NIGHT staked) gets 0.3% fee

## Premium Tiers

| Tier | Requirement | Benefits |
|------|-------------|----------|
| Basic | No staking | Standard swaps, 0.5% fee |
| Premium | Stake >100 NIGHT | Batch swaps (up to 5 assets) |
| VIP | Stake >1000 NIGHT | Reduced fees (0.3%), priority processing |

## Privacy Model

ZKSwap Vault uses Midnight's ZK proof system for privacy:

1. **Balance Proofs**: Prove you have sufficient funds without revealing your balance
2. **Zswap Commitments**: Hide transfer amounts using cryptographic commitments
3. **Nullifiers**: Prevent double-spending while maintaining privacy
4. **Shielded Transfers**: Complete transactions without revealing parties or amounts
5. **Private Pool State**: Pool reserves are kept private using witness fields

## Development

### Prerequisites

- Node.js 18+
- Midnight SDK 0.16+
- Compact compiler

### Build

```bash
npm run build
```

### Compile Compact Contract

```bash
npm run compile:compact
```

### Run Tests

```bash
npm test

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Deploy

```bash
# Testnet deployment
NETWORK=testnet npm run deploy

# Mainnet deployment (requires confirmation)
NETWORK=mainnet npm run deploy
```

### Lint

```bash
npm run lint
npm run lint:fix
```

## Security

### Audit Status

See [SECURITY_AUDIT.md](./SECURITY_AUDIT.md) for the complete security analysis.

### Key Security Features

- **Reentrancy Protection**: All state-changing functions use reentrancy guards
- **Safe Math**: Overflow/underflow protection on all arithmetic operations
- **ZK Soundness**: Proof verification ensures valid state transitions
- **Double-Spend Prevention**: Nullifier tracking prevents replay attacks
- **Access Control**: Admin functions require proper authorization
- **Emergency Controls**: Pause functionality and emergency withdrawal

### Responsible Disclosure

If you discover a security vulnerability, please email security@zkswap.example (do not create public issues).

## NPM Publishing

### Prepare for Publishing

```bash
# Update version
npm version patch|minor|major

# Build and test
npm run build
npm test

# Dry run
npm publish --dry-run
```

### Publish

```bash
# Login to npm
npm login

# Publish to npm registry
npm publish --access public
```

### Scoped Package (optional)

```bash
# Publish as @your-org/zkswap-vault
npm init --scope=@your-org
npm publish --access public
```

## Launch Plan

### Phase 1: Testnet Launch (Week 1-2)

1. **Deploy to Midnight Testnet**
   ```bash
   NETWORK=testnet npm run deploy
   ```

2. **Create Faucet Integration**
   - Request test NIGHT/DUST from Midnight faucet
   - Document faucet URLs in app

3. **Beta Testing**
   - Invite 50-100 beta testers
   - Create feedback form
   - Monitor transactions and logs

4. **Bug Bounty Program**
   - Launch private bug bounty
   - Reward: $500-$5000 based on severity

### Phase 2: Security & Audit (Week 3-4)

1. **External Audit**
   - Engage security firm for Compact contract audit
   - Focus on ZK circuit soundness

2. **Penetration Testing**
   - Test frontend for XSS/CSRF
   - Test RPC endpoints

3. **Fix & Retest**
   - Address all critical/high findings
   - Retest fixed issues

### Phase 3: Mainnet Launch (Week 5-6)

1. **Mainnet Deployment**
   ```bash
   NETWORK=mainnet npm run deploy
   ```

2. **Initial Liquidity**
   - Seed pools with initial liquidity
   - Partner with token projects

3. **Launch Marketing**
   - Announce on Midnight Discord
   - Twitter/X campaign
   - Medium article explaining privacy features

### Phase 4: Growth (Week 7+)

1. **Community Building**
   - Discord server
   - Governance discussions
   - Regular AMAs

2. **Feature Expansion**
   - Additional trading pairs
   - Limit orders
   - Cross-chain bridges

3. **Partnership Development**
   - DEX aggregators
   - Wallet integrations
   - DeFi protocols

## Promotion Ideas

### Midnight Community

- **Discord**: Post in #dapps and #developers channels
- **Forum**: Create detailed thread about privacy benefits
- **Twitter**: Tag @MidnightNtwrk with demo videos

### DeFi Community

- **DeFi Pulse**: Submit for listing
- **DefiLlama**: Add TVL tracking
- **Crypto Twitter**: Privacy-focused influencers

### Developer Outreach

- **GitHub**: Star/fork campaign
- **Dev.to**: Technical deep-dive article
- **YouTube**: Tutorial videos

### Incentive Programs

- **Liquidity Mining**: Reward LPs with NIGHT tokens
- **Trading Competition**: Weekly prizes for top traders
- **Referral Program**: Earn fees from referred users

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/zkswap-vault.git
cd zkswap-vault

# Install dependencies
npm install

# Start development
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [Website](https://zkswap.example)
- [Documentation](https://docs.zkswap.example)
- [Discord](https://discord.gg/zkswap)
- [Twitter](https://twitter.com/zkswap)
- [Midnight Network](https://midnight.network)
