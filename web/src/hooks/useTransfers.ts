'use client';

import { useState, useEffect } from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from './useContract';
import { Transfer } from '@/lib/types';

export function useTransfers() {
  const { account, isConnected } = useWeb3();
  const { getUserTransfers, acceptTransfer, rejectTransfer, getTransfer } = useContract();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = async () => {
    if (!account) return;
    setLoading(true);
    setError(null);
    try {
      const transferIds = await getUserTransfers(account);
      const transfersData = await Promise.all(
        transferIds.map(async (id: bigint) => {
          const transfer = await getTransfer(id);
          return {
            id: transfer[0] as bigint,
            from: transfer[1] as string,
            to: transfer[2] as string,
            tokenId: transfer[3] as bigint,
            timestamp: transfer[4] as bigint,
            quantity: transfer[5] as bigint,
            status: transfer[6] as number,
          };
        })
      );
      setTransfers(transfersData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTransfer = async (transferId: bigint) => {
    setLoading(true);
    setError(null);
    try {
      await acceptTransfer(transferId);
      await fetchTransfers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTransfer = async (transferId: bigint) => {
    setLoading(true);
    setError(null);
    try {
      await rejectTransfer(transferId);
      await fetchTransfers();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && account) {
      fetchTransfers();
    }
  }, [isConnected, account]);

  return {
    transfers,
    loading,
    error,
    fetchTransfers,
    acceptTransfer: handleAcceptTransfer,
    rejectTransfer: handleRejectTransfer,
  };
}
