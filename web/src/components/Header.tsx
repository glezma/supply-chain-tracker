'use client';

import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useContract } from '@/hooks/useContract';
import { CONTRACT_CONFIG } from '@/contracts/config';

interface HeaderProps {
  userRole?: string | null;
}

export function Header({ userRole: propUserRole }: HeaderProps) {
  const router = useRouter();
  const { account, isConnected, disconnectWallet } = useWeb3();
  const { getUserInfo } = useContract();
  const [fetchedRole, setFetchedRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (!account || propUserRole !== undefined) return;

      // Check if admin
      if (account.toLowerCase() === CONTRACT_CONFIG.adminAddress.toLowerCase()) {
        setFetchedRole('Admin');
        return;
      }

      try {
        const user = await getUserInfo(account);
        setFetchedRole(user[2]); // role is at index 2
      } catch (error) {
        console.error('Failed to fetch user role for header:', error);
      }
    };

    if (isConnected && account) {
      fetchRole();
    }
  }, [isConnected, account, propUserRole]);

  if (!isConnected) {
    return null;
  }

  const roleDisplay = propUserRole !== undefined ? propUserRole : fetchedRole;
  const displayAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Left - Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1
              className="text-xl font-bold cursor-pointer text-gray-900"
              onClick={() => router.push('/dashboard')}
            >
              Supply Chain Tracker
            </h1>
          </div>

          {/* Right - Role, Address, Dashboard, Disconnect */}
          <div className="flex items-center gap-4">
            {roleDisplay && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{roleDisplay}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span className="font-mono">{displayAddress}</span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Dashboard</span>
            </button>
            <Button variant="outline" size="sm" onClick={disconnectWallet}>
              Disconnect
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
