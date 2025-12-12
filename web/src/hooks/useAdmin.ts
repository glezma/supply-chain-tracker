'use client';

import { useState } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from './useContract';
import { User, UserStatus } from '@/lib/types';
import { CONTRACT_CONFIG } from '@/contracts/config';

export function useAdmin() {
  const { account, contract } = useWeb3();
  const { changeStatusUser, getUserInfo } = useContract();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = account?.toLowerCase() === CONTRACT_CONFIG.adminAddress.toLowerCase();

  const fetchUsers = async (addresses: string[]) => {
    if (!isAdmin) {
      setError('Not authorized');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const usersData = await Promise.all(
        addresses.map(async (addr) => {
          const user = await getUserInfo(addr);
          return {
            userAddress: user[0] as string,
            role: user[1] as UserRole,
            status: user[2] as UserStatus,
          };
        })
      );
      setUsers(usersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userAddress: string) => {
    if (!isAdmin) throw new Error('Not authorized');
    setLoading(true);
    setError(null);
    try {
      await changeStatusUser(userAddress, UserStatus.Approved);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectUser = async (userAddress: string) => {
    if (!isAdmin) throw new Error('Not authorized');
    setLoading(true);
    setError(null);
    try {
      await changeStatusUser(userAddress, UserStatus.Rejected);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    isAdmin,
    fetchUsers,
    approveUser,
    rejectUser,
  };
}
