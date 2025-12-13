'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { useTransfers } from '@/hooks/useTransfers';
import { useAdmin } from '@/hooks/useAdmin';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TransferList } from '@/components/TransferList';
import { UserTable } from '@/components/UserTable';
import { UserRole, UserStatus, Token } from '@/lib/types';
import { CONTRACT_CONFIG } from '@/contracts/config';

export default function Dashboard() {
  const router = useRouter();
  const { account, isConnected } = useWeb3();
  const { getUserInfo, getUserTokens, getToken } = useContract();
  const { transfers, acceptTransfer, rejectTransfer } = useTransfers();
  const { isAdmin, users, fetchUsers, approveUser, rejectUser } = useAdmin();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }
    fetchUserData();
  }, [isConnected, account]);

  const fetchUserData = async () => {
    if (!account) return;
    
    // Check if admin - skip user data fetch
    if (account.toLowerCase() === CONTRACT_CONFIG.adminAddress.toLowerCase()) {
      console.log('[Dashboard] Admin account - skipping user data fetch');
      setUserRole(null);
      setUserStatus(UserStatus.Approved);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const user = await getUserInfo(account);
      console.log('[Dashboard] User data:', user);
      // User struct: [id, userAddress, role, status]
      setUserRole(user[2]);
      setUserStatus(Number(user[3]) as UserStatus);

      if (Number(user[3]) === UserStatus.Approved) {
        const tokenIds = await getUserTokens(account);
        const tokensData = await Promise.all(
          tokenIds.map(async (id: bigint) => {
            const token = await getToken(id);
            return {
              id: token[0],
              name: token[1],
              creator: token[2],
              totalSupply: token[3],
              timestamp: token[4],
            };
          })
        );
        setTokens(tokensData);
      }
    } catch (error: any) {
      console.error('[Dashboard] Failed to fetch user data:', error);
      // If user doesn't exist, redirect to registration
      if (error.message?.includes('User does not exist')) {
        console.log('[Dashboard] User not registered, redirecting to /');
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (userStatus !== UserStatus.Approved) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p>Your account is not approved. Please wait for admin approval.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">
              {isAdmin ? 'Role: Admin' : userRole !== null ? `Role: ${userRole}` : ''}
            </p>
          </div>
          {!isAdmin && userRole !== 'Consumer' && (
            <Button onClick={() => router.push('/tokens/create')}>
              Create Token
            </Button>
          )}
        </div>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/admin/users')}>
                Manage Users
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Tokens Owned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{tokens.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {transfers.filter((t) => t.status === 0).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{transfers.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            {transfers.length > 0 ? (
              <TransferList
                transfers={transfers}
                onAccept={acceptTransfer}
                onReject={rejectTransfer}
              />
            ) : (
              <p className="text-gray-600">No transfers yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
