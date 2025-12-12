'use client';

import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';

export function Header() {
  const router = useRouter();
  const { account, isConnected, disconnectWallet } = useWeb3();

  if (!isConnected) {
    return null;
  }

  const displayAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <h1 
            className="text-xl font-bold cursor-pointer"
            onClick={() => router.push('/dashboard')}
          >
            Supply Chain Tracker
          </h1>
          <nav className="flex gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-gray-600 hover:text-gray-900"
            >
              Dashboard
            </button>
            <button 
              onClick={() => router.push('/tokens')}
              className="text-gray-600 hover:text-gray-900"
            >
              Tokens
            </button>
            <button 
              onClick={() => router.push('/transfers')}
              className="text-gray-600 hover:text-gray-900"
            >
              Transfers
            </button>
            <button 
              onClick={() => router.push('/profile')}
              className="text-gray-600 hover:text-gray-900"
            >
              Profile
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 font-mono">{displayAddress}</span>
          <Button variant="outline" size="sm" onClick={disconnectWallet}>
            Disconnect
          </Button>
        </div>
      </div>
    </header>
  );
}
