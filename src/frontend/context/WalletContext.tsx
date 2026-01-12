/**
 * ZKSwap Vault - Wallet Context Provider
 *
 * Provides wallet connection state and methods to all child components.
 * Integrates with Midnight wallet providers.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Midnight wallet provider interface
 */
export interface MidnightWalletProvider {
  getBalance(address: string, tokenId: string): Promise<string>;
  signTransaction(tx: unknown): Promise<unknown>;
  signMessage(message: string, address: string): Promise<string>;
}

export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: WalletBalance | null;
  provider: MidnightWalletProvider | null;
  error: string | null;
}

export interface WalletBalance {
  night: bigint;
  dust: bigint;
  other: Map<string, bigint>;
}

export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  /** Whether user has premium status (for display purposes, actual check is in contract) */
  isPremium: boolean;
}

// ============================================================================
// Context
// ============================================================================

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface WalletProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export function WalletProvider({ children, autoConnect = false }: WalletProviderProps): JSX.Element {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    balance: null,
    provider: null,
    error: null,
  });

  // Connect to wallet
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Check for Cardano wallets (Lace, Eternl, etc.)
      const windowObj = window as any;
      const lace = windowObj.lace;
      const eternl = windowObj.eternl;
      const cardano = windowObj.cardano;

      // Try Lace first (preferred for Midnight)
      let walletApi = null;
      let walletName = '';

      if (lace) {
        walletApi = lace;
        walletName = 'Lace';
      } else if (eternl) {
        walletApi = eternl;
        walletName = 'Eternl';
      } else if (cardano) {
        // Try generic Cardano wallets
        const availableWallets = Object.keys(cardano);
        if (availableWallets.length > 0) {
          walletApi = cardano[availableWallets[0]];
          walletName = availableWallets[0];
        }
      }

      if (!walletApi) {
        throw new Error(
          'No Cardano wallet detected. Please install Lace wallet and enable the Midnight Testnet profile. Get Lace at: https://lace.io'
        );
      }

      // Enable wallet API
      const api = await walletApi.enable();

      if (!api) {
        throw new Error(`Failed to enable ${walletName} wallet. Please try again.`);
      }

      // Get wallet addresses
      const addresses = await api.getUsedAddresses();
      if (!addresses || addresses.length === 0) {
        throw new Error(
          `No addresses found in ${walletName}. Make sure your Midnight Testnet profile is active in wallet settings.`
        );
      }

      const address = addresses[0];

      // Create mock provider for now (until Midnight API is fully available)
      const provider = {
        getBalance: async (addr: string, tokenId: string) => '0',
        signTransaction: async (tx: unknown) => tx,
        signMessage: async (message: string, addr: string) => '',
      } as MidnightWalletProvider;

      // Mock balance for demo (replace with actual Midnight API calls when available)
      const balance = {
        night: 0n,
        dust: 0n,
        other: new Map(),
      };

      setState({
        isConnected: true,
        isConnecting: false,
        address: address.toString(),
        balance,
        provider,
        error: null,
      });

      // Store connection preference
      localStorage.setItem('zkswap_wallet_connected', 'true');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: message,
      }));
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      isConnected: false,
      isConnecting: false,
      address: null,
      balance: null,
      provider: null,
      error: null,
    });
    localStorage.removeItem('zkswap_wallet_connected');
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!state.provider || !state.address) return;

    try {
      const balance = await fetchBalance(state.provider, state.address);
      setState(prev => ({ ...prev, balance }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [state.provider, state.address]);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.provider || !state.address) {
      throw new Error('Wallet not connected');
    }

    try {
      const windowObj = window as any;
      const lace = windowObj.lace;

      if (!lace) {
        throw new Error('Wallet not available');
      }

      const api = await lace.enable();
      const signature = await api.signData(state.address, Buffer.from(message).toString('hex'));

      return signature.signature;
    } catch (error) {
      throw new Error('Failed to sign message: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [state.provider, state.address]);

  // Auto-connect on mount if previously connected
  useEffect(() => {
    if (autoConnect) {
      const wasConnected = localStorage.getItem('zkswap_wallet_connected') === 'true';
      if (wasConnected) {
        connect();
      }
    }
  }, [autoConnect, connect]);

  // Listen for account changes (Cardano wallet events)
  useEffect(() => {
    const windowObj = window as any;
    const lace = windowObj.lace;

    if (!lace || !state.isConnected) return;

    const handleAccountsChanged = () => {
      // Reconnect when account changes
      connect();
    };

    // Listen for wallet events if available
    if (lace.on) {
      lace.on('accountChange', handleAccountsChanged);

      return () => {
        lace.off?.('accountChange', handleAccountsChanged);
      };
    }
  }, [state.isConnected, state.address, connect]);

  // Check if user has premium status (>100 NIGHT staked)
  const isPremium = state.balance ? state.balance.night >= 100_000_000_000n : false;

  const value: WalletContextValue = {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    signMessage,
    isPremium,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function fetchBalance(provider: MidnightWalletProvider, address: string): Promise<WalletBalance> {
  // Token IDs for NIGHT and DUST
  const NIGHT_TOKEN_ID = '0x' + '00'.repeat(31) + '01';
  const DUST_TOKEN_ID = '0x' + '00'.repeat(31) + '02';

  const nightBalance = await provider.getBalance(address, NIGHT_TOKEN_ID);
  const dustBalance = await provider.getBalance(address, DUST_TOKEN_ID);

  return {
    night: BigInt(nightBalance || '0'),
    dust: BigInt(dustBalance || '0'),
    other: new Map(),
  };
}

// ============================================================================
// Exports
// ============================================================================

export { WalletContext };
