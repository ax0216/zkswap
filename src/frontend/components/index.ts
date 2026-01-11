/**
 * ZKSwap Vault - Frontend Components
 *
 * Export all React components for the ZKSwap Vault DApp.
 */

// Components
export { WalletConnect, walletConnectStyles } from './WalletConnect';
export { SwapForm, swapFormStyles } from './SwapForm';
export { StakePanel, stakePanelStyles } from './StakePanel';
export { LiquidityPanel, liquidityPanelStyles } from './LiquidityPanel';
export { PoolStats, poolStatsStyles } from './PoolStats';

// Combined styles export for easy injection
export const allStyles = `
  /* ZKSwap Vault - Complete Stylesheet */

  /* Base reset for ZKSwap components */
  [class^="zkswap-"] *,
  [class^="zkswap-"] *::before,
  [class^="zkswap-"] *::after {
    box-sizing: border-box;
  }

  [class^="zkswap-"] {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Import all component styles */
  ${walletConnectStyles}
  ${swapFormStyles}
  ${stakePanelStyles}
  ${liquidityPanelStyles}
  ${poolStatsStyles}
`;

// Default export as component map
export default {
  WalletConnect,
  SwapForm,
  StakePanel,
  LiquidityPanel,
  PoolStats,
};
