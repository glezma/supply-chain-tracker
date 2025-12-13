'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserStatus } from '@/lib/types';
import { CONTRACT_CONFIG } from '@/contracts/config';

interface TokenData {
  id: bigint;
  name: string;
  balance: bigint;
}

export default function ProfilePage() {
  const router = useRouter();
  const { account, isConnected, contract } = useWeb3();
  const { getUserInfo, getUserTokens, getToken } = useContract();
  const [userRole, setUserRole] = useState('');
  const [userStatus, setUserStatus] = useState<number>(0);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Profile] useEffect - isConnected:', isConnected, 'account:', account, 'contract:', !!contract);
    if (!isConnected || !account) {
      router.push('/');
      return;
    }
    if (!contract) {
      console.log('[Profile] Waiting for contract...');
      return;
    }
    console.log('[Profile] Calling fetchProfile');
    fetchProfile();
  }, [isConnected, account, contract]);

  const fetchProfile = async () => {
    console.log('[Profile] fetchProfile started');
    if (!account || !contract) {
      console.log('[Profile] Missing account or contract');
      return;
    }
    
    setLoading(true);
    try {
      // Check if admin
      if (account.toLowerCase() === CONTRACT_CONFIG.adminAddress.toLowerCase()) {
        console.log('[Profile] Admin account detected');
        setUserRole('Admin');
        setUserStatus(1); // Approved
        setLoading(false);
        return;
      }

      console.log('[Profile] Fetching user info...');
      const user = await getUserInfo(account);
      console.log('[Profile] User info:', user);
      setUserRole(user[2]);
      setUserStatus(Number(user[3]));

      console.log('[Profile] Fetching tokens...');
      const tokenIds = await getUserTokens(account);
      console.log('[Profile] Token IDs:', tokenIds);
      const tokenList: TokenData[] = [];
      for (const id of tokenIds) {
        const token = await getToken(id);
        const balance = await contract.getTokenBalance(id, account);
        tokenList.push({
          id: token[0],
          name: token[2],
          balance: balance,
        });
      }
      setTokens(tokenList);
      console.log('[Profile] Done fetching');
    } catch (error: any) {
      console.error('[Profile] Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case UserStatus.Pending: return 'Pending';
      case UserStatus.Approved: return 'Approved';
      case UserStatus.Rejected: return 'Rejected';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">My Profile</h1>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-gray-600">Address:</span>
              <span className="ml-2 font-mono">{account}</span>
            </div>
            <div>
              <span className="text-gray-600">Role:</span>
              <span className="ml-2 font-semibold">{userRole}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-semibold">{getStatusLabel(userStatus)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Token Portfolio */}
        <Card>
          <CardHeader>
            <CardTitle>Token Portfolio ({tokens.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {tokens.length === 0 ? (
              <p className="text-gray-600">No tokens yet.</p>
            ) : (
              <div className="space-y-2">
                {tokens.map((token) => (
                  <div 
                    key={token.id.toString()} 
                    className="flex justify-between items-center p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => router.push(`/tokens/${token.id}`)}
                  >
                    <span className="font-semibold">{token.name}</span>
                    <span className="text-gray-600">Balance: {token.balance.toString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
