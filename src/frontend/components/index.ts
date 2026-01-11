/**
 * ZKSwap Vault - Frontend Components
 *
 * Export all React components for the ZKSwap Vault DApp.
 */

// Import components and styles
import { WalletConnect, walletConnectStyles } from './WalletConnect';
import { SwapForm, swapFormStyles } from './SwapForm';
import { StakePanel, stakePanelStyles } from './StakePanel';
import { LiquidityPanel, liquidityPanelStyles } from './LiquidityPanel';
import { PoolStats, poolStatsStyles } from './PoolStats';

// Re-export components
export { WalletConnect, walletConnectStyles };
export { SwapForm, swapFormStyles };
export { StakePanel, stakePanelStyles };
export { LiquidityPanel, liquidityPanelStyles };
export { PoolStats, poolStatsStyles };

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
