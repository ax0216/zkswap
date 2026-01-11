/**
 * ZKSwap Vault - Wallet Context Provider
 *
 * Provides wallet connection state and methods to all child components.
 * Integrates with Midnight wallet providers.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { WalletProvider as MidnightWalletProvider } from '@midnight-ntwrk/wallet-api';

// ============================================================================
// Types
// ============================================================================

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
      // Check if Midnight wallet extension is available
      const midnight = (window as any).midnight;
      if (!midnight) {
        throw new Error('Midnight wallet not found. Please install the Midnight browser extension.');
      }

      // Request wallet connection
      const accounts = await midnight.request({ method: 'midnight_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please create an account in your Midnight wallet.');
      }

      const address = accounts[0];

      // Create wallet provider
      const provider = midnight.provider as MidnightWalletProvider;

      // Get initial balance
      const balance = await fetchBalance(provider, address);

      setState({
        isConnected: true,
        isConnecting: false,
        address,
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

    const midnight = (window as any).midnight;
    const signature = await midnight.request({
      method: 'midnight_signMessage',
      params: [message, state.address],
    });

    return signature;
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

  // Listen for account changes
  useEffect(() => {
    const midnight = (window as any).midnight;
    if (!midnight) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== state.address) {
        connect();
      }
    };

    midnight.on?.('accountsChanged', handleAccountsChanged);

    return () => {
      midnight.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, [state.address, connect, disconnect]);

  const value: WalletContextValue = {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    signMessage,
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
