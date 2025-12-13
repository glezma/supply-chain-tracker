'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';
import { UserStatus } from '@/lib/types';
import { CONTRACT_CONFIG } from '@/contracts/config';

interface UserData {
  id: bigint;
  address: string;
  role: string;
  status: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { account, isConnected } = useWeb3();
  const { changeStatusUser, getUserInfo } = useContract();
  const { toast, showToast, hideToast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AdminUsers] isConnected:', isConnected, 'account:', account);
    
    if (!isConnected) {
      console.log('[AdminUsers] Not connected, redirecting to /');
      router.push('/');
      return;
    }

    // Check if user is admin
    console.log('[AdminUsers] Checking admin:', account?.toLowerCase(), 'vs', CONTRACT_CONFIG.adminAddress.toLowerCase());
    if (account?.toLowerCase() !== CONTRACT_CONFIG.adminAddress.toLowerCase()) {
      console.log('[AdminUsers] Not admin, access denied');
      showToast('Access denied: Admin only', 'error');
      router.push('/');
      return;
    }

    console.log('[AdminUsers] Admin confirmed, fetching users');
    fetchUsers();
  }, [isConnected, account]);

  const fetchUsers = async () => {
    console.log('[AdminUsers] Starting fetchUsers');
    setLoading(true);
    try {
      // Get all registered users by checking events or iterating
      // For now, we'll use a simple approach - check known addresses
      const knownAddresses = [
        '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
      ];

      console.log('[AdminUsers] Checking addresses:', knownAddresses);
      const userList: UserData[] = [];
      for (const addr of knownAddresses) {
        try {
          console.log('[AdminUsers] Fetching user:', addr);
          const user = await getUserInfo(addr);
          console.log('[AdminUsers] User data:', user);
          userList.push({
            id: user[0],
            address: user[1],
            role: user[2],
            status: Number(user[3]),
          });
        } catch (error) {
          console.log('[AdminUsers] User does not exist:', addr);
        }
      }
      console.log('[AdminUsers] Total users found:', userList.length);
      setUsers(userList);
    } catch (error) {
      console.error('[AdminUsers] Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userAddress: string) => {
    try {
      console.log('[Admin] Approving user:', userAddress);
      await changeStatusUser(userAddress, UserStatus.Approved);
      console.log('[Admin] Approval transaction confirmed, refreshing...');
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchUsers();
      showToast('User approved successfully', 'success');
    } catch (error: any) {
      console.error('[Admin] Error approving user:', error);
      showToast('Failed to approve user: ' + (error.reason || error.message), 'error');
    }
  };

  const handleReject = async (userAddress: string) => {
    try {
      console.log('[Admin] Rejecting user:', userAddress);
      await changeStatusUser(userAddress, UserStatus.Rejected);
      await fetchUsers();
      showToast('User rejected', 'success');
    } catch (error: any) {
      console.error('[Admin] Error rejecting user:', error);
      showToast('Failed to reject user: ' + (error.reason || error.message), 'error');
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

  const getStatusColor = (status: number) => {
    switch (status) {
      case UserStatus.Pending: return 'text-yellow-600';
      case UserStatus.Approved: return 'text-green-600';
      case UserStatus.Rejected: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <p className="text-gray-600">No users registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Address</th>
                      <th className="text-left p-2">Role</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.address} className="border-b">
                        <td className="p-2 font-mono text-sm">
                          {user.address.slice(0, 6)}...{user.address.slice(-4)}
                        </td>
                        <td className="p-2">{user.role}</td>
                        <td className={`p-2 font-semibold ${getStatusColor(user.status)}`}>
                          {getStatusLabel(user.status)}
                        </td>
                        <td className="p-2 space-x-2">
                          {user.status === UserStatus.Pending && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApprove(user.address)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReject(user.address)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </td>
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
    </>
  );
}
