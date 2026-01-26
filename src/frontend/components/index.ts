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

  /* App Container */
  .zkswap-app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Header */
  .app-header {
    background: rgba(15, 15, 35, 0.95);
    border-bottom: 1px solid #374151;
    padding: 16px 24px;
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(10px);
  }

  .header-content {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .logo-icon {
    font-size: 32px;
  }

  .logo h1 {
    font-size: 24px;
    font-weight: 700;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .network-badge {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  /* Notification */
  .notification {
    position: fixed;
    top: 80px;
    right: 24px;
    background: rgba(16, 185, 129, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
    z-index: 200;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .notification-icon {
    font-size: 18px;
  }

  /* Main Content */
  .app-main {
    flex: 1;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    padding: 24px;
  }

  /* Tab Navigation */
  .tab-nav {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    background: rgba(31, 41, 55, 0.5);
    padding: 8px;
    border-radius: 16px;
    border: 1px solid #374151;
  }

  .tab-button {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    background: transparent;
    border: none;
    border-radius: 12px;
    color: #9ca3af;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-button:hover {
    color: #e5e7eb;
    background: rgba(55, 65, 81, 0.5);
  }

  .tab-button.active {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
  }

  .tab-icon {
    font-size: 18px;
  }

  /* Tab Content */
  .tab-content {
    animation: fadeIn 0.3s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Privacy Info */
  .privacy-info {
    margin-top: 32px;
  }

  .privacy-badge {
    display: flex;
    align-items: center;
    gap: 16px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
    border: 1px solid rgba(99, 102, 241, 0.2);
    border-radius: 16px;
    padding: 20px 24px;
  }

  .privacy-badge .shield {
    font-size: 40px;
  }

  .privacy-badge strong {
    display: block;
    color: #e5e7eb;
    font-size: 16px;
    margin-bottom: 4px;
  }

  .privacy-badge p {
    color: #9ca3af;
    font-size: 14px;
    margin: 0;
  }

  /* Footer */
  .app-footer {
    background: rgba(15, 15, 35, 0.95);
    border-top: 1px solid #374151;
    padding: 24px;
    margin-top: auto;
  }

  .footer-content {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #9ca3af;
    font-size: 14px;
  }

  .footer-links {
    display: flex;
    gap: 24px;
  }

  .footer-links a {
    color: #9ca3af;
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-links a:hover {
    color: #6366f1;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 16px;
    }

    .logo h1 {
      font-size: 20px;
    }

    .tab-nav {
      flex-wrap: wrap;
    }

    .tab-button {
      flex: 1 1 calc(50% - 4px);
    }

    .tab-label {
      display: none;
    }

    .tab-icon {
      font-size: 24px;
    }

    .footer-content {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }

    .privacy-badge {
      flex-direction: column;
      text-align: center;
    }
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
