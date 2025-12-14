'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Contract, Eip1193Provider } from 'ethers';
import { CONTRACT_CONFIG, NETWORK_CONFIG } from '@/contracts/config';

interface Web3ContextType {
  provider: BrowserProvider | null;
  signer: any;
  contract: Contract | null;
  account: string | null;
  chainId: bigint | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<bigint | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    console.log('[Web3] Starting wallet connection...');

    if (typeof window.ethereum !== 'undefined') {
      try {
        console.log('[Web3] MetaMask detected');
        const browserProvider = new BrowserProvider(window.ethereum as Eip1193Provider);

        // Request accounts
        console.log('[Web3] Requesting accounts...');
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        console.log('[Web3] Accounts received:', accounts);

        // Check network
        const network = await browserProvider.getNetwork();
        setChainId(network.chainId);
        console.log('[Web3] Current network:', { chainId: network.chainId.toString(), name: network.name });

        // Network switching logic removed from here to let NetworkGuard handle it

        const signer = await browserProvider.getSigner();
        const signerAddress = await signer.getAddress();
        console.log('[Web3] Signer address:', signerAddress);

        const contract = new Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
        console.log('[Web3] Contract initialized at:', CONTRACT_CONFIG.address);

        setProvider(browserProvider);
        setSigner(signer);
        setContract(contract);
        setAccount(accounts[0]);
        setIsConnected(true);

        console.log('[Web3] ✅ Connection successful');
      } catch (error) {
        console.error('[Web3] ❌ Failed to connect wallet:', error);
      }
    } else {
      console.error('[Web3] ❌ MetaMask not installed');
      alert('Please install MetaMask!');
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContract(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      console.log('[Web3] Setting up event listeners');

      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        // ... existing logic ...
      });

      window.ethereum.on('chainChanged', (chainIdHex: string) => {
        console.log('[Web3] Chain changed to:', chainIdHex);
        setChainId(BigInt(chainIdHex));
        // Reload is often recommended by MetaMask but we handle state
        // window.location.reload(); 
      });
    }
  }, [provider]);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        account,
        chainId,
        isConnected,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}
