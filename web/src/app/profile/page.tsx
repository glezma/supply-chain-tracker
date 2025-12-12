'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserStatus } from '@/lib/types';

interface TokenData {
  id: bigint;
  name: string;
  balance: bigint;
}

interface TransferData {
  id: bigint;
  tokenId: bigint;
  from: string;
  to: string;
  amount: bigint;
  status: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { account, isConnected } = useWeb3();
  const { getUserInfo, getUserTokens, getToken, getUserTransfers, getTransfer, contract } = useContract();
  const [userRole, setUserRole] = useState('');
  const [userStatus, setUserStatus] = useState<number>(0);
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !account) {
      router.push('/');
      return;
    }
    fetchProfile();
  }, [isConnected, account]);

  const fetchProfile = async () => {
    if (!account || !contract) return;
    
    setLoading(true);
    try {
      // Fetch user info
      const user = await getUserInfo(account);
      setUserRole(user[2]);
      setUserStatus(Number(user[3]));

      // Fetch tokens
      const tokenIds = await getUserTokens(account);
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

      // Fetch transfers
      const transferIds = await getUserTransfers(account);
      const transferList: TransferData[] = [];
      for (const id of transferIds) {
        const transfer = await getTransfer(id);
        transferList.push({
          id: transfer[0],
          tokenId: transfer[2],
          from: transfer[3],
          to: transfer[4],
          amount: transfer[5],
          status: Number(transfer[6]),
        });
      }
      setTransfers(transferList);
    } catch (error) {
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

  const getTransferStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Accepted';
      case 2: return 'Rejected';
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

        {/* Transfer History */}
        <Card>
          <CardHeader>
            <CardTitle>Transfer History ({transfers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {transfers.length === 0 ? (
              <p className="text-gray-600">No transfers yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">ID</th>
                      <th className="text-left p-2">From</th>
                      <th className="text-left p-2">To</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((transfer) => (
                      <tr key={transfer.id.toString()} className="border-b">
                        <td className="p-2">{transfer.id.toString()}</td>
                        <td className="p-2 font-mono text-xs">
                          {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}
                        </td>
                        <td className="p-2 font-mono text-xs">
                          {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}
                        </td>
                        <td className="p-2">{transfer.amount.toString()}</td>
                        <td className="p-2">{getTransferStatusLabel(transfer.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
