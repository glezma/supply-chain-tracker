'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TransferStatus } from '@/lib/types';

interface TransferData {
  id: bigint;
  tokenId: bigint;
  tokenName: string;
  from: string;
  to: string;
  amount: bigint;
  status: number;
  timestamp: bigint;
}

type FilterStatus = 'all' | 'pending' | 'accepted' | 'rejected';

export default function TransfersPage() {
  const router = useRouter();
  const { account, isConnected, contract } = useWeb3();
  const { getUserTransfers, getTransfer, getToken, acceptTransfer, rejectTransfer } = useContract();
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [processingId, setProcessingId] = useState<bigint | null>(null);

  useEffect(() => {
    if (!isConnected || !account || !contract) {
      if (!isConnected || !account) {
        router.push('/');
      }
      return;
    }
    fetchTransfers();
  }, [isConnected, account, contract]);

  const fetchTransfers = async () => {
    if (!account || !contract) return;
    
    console.log('[Transfers] Fetching transfers for:', account);
    setLoading(true);
    try {
      const transferIds = await getUserTransfers(account);
      console.log('[Transfers] Transfer IDs:', transferIds);
      const transferList: TransferData[] = [];

      for (const id of transferIds) {
        try {
          const transfer = await getTransfer(id);
          console.log('[Transfers] Transfer', id, 'raw data:', transfer);
          console.log('[Transfers] Transfer', id, 'status at [6]:', transfer[6], 'type:', typeof transfer[6]);
          const token = await getToken(transfer[3]); // tokenId is at index 3
          
          transferList.push({
            id: transfer[0],
            tokenId: transfer[3],
            tokenName: token[2],
            from: transfer[1],
            to: transfer[2],
            amount: transfer[5],
            status: Number(transfer[6]),
            timestamp: transfer[4],
          });
        } catch (err) {
          console.error('[Transfers] Error fetching transfer', id, err);
        }
      }
      
      console.log('[Transfers] Final transfer list:', transferList);
      setTransfers(transferList.sort((a, b) => Number(b.timestamp - a.timestamp)));
    } catch (error) {
      console.error('[Transfers] Error fetching transfers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (transferId: bigint) => {
    setProcessingId(transferId);
    try {
      await acceptTransfer(transferId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTransfers([]); // Clear state first
      await fetchTransfers();
    } catch (error) {
      console.error('[Transfers] Error accepting transfer:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (transferId: bigint) => {
    setProcessingId(transferId);
    try {
      await rejectTransfer(transferId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTransfers([]); // Clear state first
      await fetchTransfers();
    } catch (error) {
      console.error('[Transfers] Error rejecting transfer:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case TransferStatus.Pending: return 'Pending';
      case TransferStatus.Accepted: return 'Accepted';
      case TransferStatus.Rejected: return 'Rejected';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case TransferStatus.Pending: return 'bg-yellow-100 text-yellow-800';
      case TransferStatus.Accepted: return 'bg-green-100 text-green-800';
      case TransferStatus.Rejected: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    if (filter === 'all') return true;
    if (filter === 'pending') return transfer.status === TransferStatus.Pending;
    if (filter === 'accepted') return transfer.status === TransferStatus.Accepted;
    if (filter === 'rejected') return transfer.status === TransferStatus.Rejected;
    return true;
  });

  const pendingIncoming = transfers.filter(
    t => t.status === TransferStatus.Pending && t.to.toLowerCase() === account?.toLowerCase()
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading transfers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Transfer Management</h1>

        {/* Pending Incoming Transfers */}
        {pendingIncoming.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Pending Incoming Transfers ({pendingIncoming.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingIncoming.map((transfer) => (
                  <div key={transfer.id.toString()} className="flex items-center justify-between p-4 bg-yellow-50 rounded border border-yellow-200">
                    <div className="flex-1">
                      <div className="font-semibold">{transfer.tokenName}</div>
                      <div className="text-sm text-gray-600">
                        From: <span className="font-mono">{transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}</span>
                      </div>
                      <div className="text-sm text-gray-600">Amount: {transfer.amount.toString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAccept(transfer.id)}
                        disabled={processingId === transfer.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingId === transfer.id ? 'Processing...' : 'Accept'}
                      </Button>
                      <Button
                        onClick={() => handleReject(transfer.id)}
                        disabled={processingId === transfer.id}
                        variant="destructive"
                      >
                        {processingId === transfer.id ? 'Processing...' : 'Reject'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transfer History */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Transfer History ({filteredTransfers.length})</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setFilter('pending')}
                  size="sm"
                >
                  Pending
                </Button>
                <Button
                  variant={filter === 'accepted' ? 'default' : 'outline'}
                  onClick={() => setFilter('accepted')}
                  size="sm"
                >
                  Accepted
                </Button>
                <Button
                  variant={filter === 'rejected' ? 'default' : 'outline'}
                  onClick={() => setFilter('rejected')}
                  size="sm"
                >
                  Rejected
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransfers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No transfers found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Token</th>
                      <th className="text-left p-2">From</th>
                      <th className="text-left p-2">To</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransfers.map((transfer) => (
                      <tr key={transfer.id.toString()} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-semibold">{transfer.tokenName}</td>
                        <td className="p-2 font-mono text-xs">
                          {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}
                        </td>
                        <td className="p-2 font-mono text-xs">
                          {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}
                        </td>
                        <td className="p-2">{transfer.amount.toString()}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(transfer.status)}`}>
                            {getStatusLabel(transfer.status)}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="text-xs text-gray-600">
                            {transfer.to.toLowerCase() === account?.toLowerCase() ? 'Received' : 'Sent'}
                          </span>
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
  );
}
