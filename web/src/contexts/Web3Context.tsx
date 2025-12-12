'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserProvider, Contract, Eip1193Provider } from 'ethers';
import { CONTRACT_CONFIG, NETWORK_CONFIG } from '@/contracts/config';

interface Web3ContextType {
  provider: BrowserProvider | null;
  signer: any;
  contract: Contract | null;
  account: string | null;
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
        
        // Check and switch to Anvil network
        const network = await browserProvider.getNetwork();
        console.log('[Web3] Current network:', { chainId: network.chainId.toString(), name: network.name });
        
        if (network.chainId !== BigInt(31337)) {
          console.log('[Web3] Wrong network, switching to Anvil...');
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x7a69' }], // 31337 in hex
            });
            console.log('[Web3] Switched to Anvil network');
          } catch (switchError: any) {
            // Network doesn't exist, add it
            if (switchError.code === 4902) {
              console.log('[Web3] Anvil network not found, adding...');
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x7a69',
                  chainName: 'Anvil Local',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['http://localhost:8545'],
                }],
              });
              console.log('[Web3] Anvil network added');
            } else {
              throw switchError;
            }
          }
        } else {
          console.log('[Web3] Already on Anvil network');
        }
        
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
    setIsConnected(false);
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      console.log('[Web3] Setting up event listeners');
      
      window.ethereum.on('accountsChanged', async (accounts: string[]) => {
        console.log('[Web3] Account changed:', accounts);
        if (accounts.length === 0) {
          console.log('[Web3] No accounts, disconnecting');
          disconnectWallet();
        } else {
          console.log('[Web3] Switching to account:', accounts[0]);
          setAccount(accounts[0]);
          
          // Update signer and contract with new account
          if (provider) {
            const newSigner = await provider.getSigner();
            const newContract = new Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, newSigner);
            setSigner(newSigner);
            setContract(newContract);
            console.log('[Web3] Signer and contract updated for new account');
          }
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        console.log('[Web3] Chain changed to:', chainId);
        window.location.reload();
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
