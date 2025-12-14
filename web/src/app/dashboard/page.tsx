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
import { ROLE_CONFIG } from '@/lib/roleConfig';

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
      setUserRole('Admin');
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
              creator: token[1],
              name: token[2],
              totalSupply: token[3],
              // feature is token[4], tokenType is token[5], parentId is token[6], dateCreated is token[7]
              features: token[4],
              tokenType: Number(token[5]),
              parentId: token[6],
              timestamp: token[7],
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

  // Role-specific information
  const getRoleInfo = () => {
    if (isAdmin) {
      return {
        role: 'Admin',
        ...ROLE_CONFIG.Admin
      };
    }

    const config = ROLE_CONFIG[userRole || ''] || {
      description: 'Manage your tokens and transfers',
      nextSteps: [],
      createTokenGuidance: ''
    };

    return {
      role: userRole || 'User',
      ...config
    };
  };

  const roleInfo = getRoleInfo();
  const pendingTransfers = transfers.filter((t) => t.status === 0).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* My Tokens - Hidden for Admin */}
          {!isAdmin && (
            <Card
              className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-none shadow-sm rounded-xl"
              onClick={() => router.push('/tokens')}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                    Active
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">My Tokens</h3>
                <p className="text-3xl font-bold text-gray-900">{tokens.length}</p>
                <p className="text-xs text-blue-600 mt-2 font-medium flex items-center">
                  View details →
                </p>
              </CardContent>
            </Card>
          )}

          {/* Create Token - Hidden for Admin & Consumer */}
          {!isAdmin && userRole !== 'Consumer' && (
            <Card
              className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-none shadow-sm rounded-xl"
              onClick={() => router.push('/tokens/create')}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Create Token</h3>
                <p className="text-3xl font-bold text-gray-900">+</p>
                <p className="text-xs text-green-600 mt-2 font-medium flex items-center">
                  Mint new assets →
                </p>
              </CardContent>
            </Card>
          )}

          {/* Transfers - Hidden for Admin */}
          {!isAdmin && (
            <Card
              className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-none shadow-sm rounded-xl"
              onClick={() => router.push('/transfers')}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  {pendingTransfers > 0 && (
                    <div className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded-full">
                      {pendingTransfers} New
                    </div>
                  )}
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Total Transfers</h3>
                <p className="text-3xl font-bold text-gray-900">{transfers.length}</p>
                <p className="text-xs text-purple-600 mt-2 font-medium flex items-center">
                  Review pending →
                </p>
              </CardContent>
            </Card>
          )}

          {/* Admin: Manage Users Card */}
          {isAdmin && (
            <Card
              className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-none shadow-sm rounded-xl"
              onClick={() => router.push('/admin/users')}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-gray-900 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Admin</h3>
                <p className="text-3xl font-bold text-gray-900">Users</p>
                <p className="text-xs text-gray-600 mt-2 font-medium flex items-center">
                  Manage Access →
                </p>
              </CardContent>
            </Card>
          )}

          {/* Profile */}
          <Card
            className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-none shadow-sm rounded-xl"
            onClick={() => router.push('/profile')}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Profile</h3>
              <p className="text-3xl font-bold text-gray-900">User</p>
              <p className="text-xs text-gray-600 mt-2 font-medium flex items-center">
                Account settings →
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Banner */}
        <Card className="bg-white border-none shadow-sm rounded-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="p-8 md:w-2/3 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome to Supply Chain Tracker
                  </h1>
                  <p className="text-gray-500">
                    Manage your tokens and transfers in the decentralized supply chain system.
                  </p>
                </div>

                <div className="inline-block p-4 bg-gray-50 rounded-xl border border-gray-100 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                      {roleInfo.role.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Your Role</p>
                      <p className="font-bold text-gray-900">{roleInfo.role}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-3">
                    {roleInfo.description}
                  </p>
                </div>
              </div>

              <div className="p-8 bg-gray-50 md:w-1/3 border-l border-gray-100">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Next Steps
                </h2>
                <ul className="space-y-3">
                  {roleInfo.nextSteps.map((step, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-600 group">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 mr-3 group-hover:bg-blue-500 transition-colors"></div>
                      <span className="group-hover:text-gray-900 transition-colors">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Section */}
        {isAdmin && (
          <Card className="border-none shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/admin/users')} className="bg-gray-900 text-white hover:bg-black">
                Manage Users
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Transfers */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-100 p-6">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <CardTitle className="text-lg">Recent Transfers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transfers.length > 0 ? (
              <div className="p-2">
                <TransferList
                  transfers={transfers}
                  onAccept={acceptTransfer}
                  onReject={rejectTransfer}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900">No transfers yet</p>
                <p className="text-sm">Initiate a transfer to see it here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
