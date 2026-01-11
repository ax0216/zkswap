/**
 * ZKSwap Vault - Frontend Module
 *
 * Complete React frontend for the ZKSwap Vault DApp.
 * Provides wallet connection, swaps, staking, and liquidity management.
 *
 * @example
 * ```tsx
 * import { WalletProvider, SwapForm, WalletConnect } from '@zkswap/frontend';
 *
 * function App() {
 *   return (
 *     <WalletProvider autoConnect>
 *       <WalletConnect />
 *       <SwapForm onSwapComplete={(tx) => console.log('Swap:', tx)} />
 *     </WalletProvider>
 *   );
 * }
 * ```
 */

// Context & Providers
export { WalletProvider, WalletContext, useWallet } from './context/WalletContext';
export type { WalletState, WalletBalance, WalletContextValue } from './context/WalletContext';

// Hooks
export { useZKSwap, usePoolInfo, useSwapQuote } from './hooks/useZKSwap';
export type { UseZKSwapConfig, UseZKSwapReturn } from './hooks/useZKSwap';

// Components
export {
  WalletConnect,
  walletConnectStyles,
  SwapForm,
  swapFormStyles,
  StakePanel,
  stakePanelStyles,
  LiquidityPanel,
  liquidityPanelStyles,
  PoolStats,
  poolStatsStyles,
  allStyles,
} from './components';

// Default export with all components
export { default as Components } from './components';
