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
      case TransferStatus.Pending: return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case TransferStatus.Accepted: return 'bg-green-100 text-green-700 border border-green-200';
      case TransferStatus.Rejected: return 'bg-red-100 text-red-700 border border-red-200';
      default: return 'bg-gray-100 text-gray-700';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500">Loading transfers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Transfer Management</h1>
          <p className="text-gray-500 mt-2">View and manage your token transfers history</p>
        </div>

        {/* Pending Incoming Transfers Actionable Area */}
        {pendingIncoming.length > 0 && (
          <Card className="border-none shadow-md rounded-xl overflow-hidden bg-white border-l-4 border-yellow-400">
            <CardHeader className="bg-yellow-50/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-lg text-yellow-900">Pending Incoming Transfers ({pendingIncoming.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {pendingIncoming.map((transfer) => (
                  <div key={transfer.id.toString()} className="flex items-center justify-between p-5 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Token</p>
                        <p className="font-bold text-gray-900">{transfer.tokenName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">From</p>
                        <p className="font-mono text-sm text-gray-600">{transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Amount</p>
                        <p className="font-bold text-gray-900">{transfer.amount.toString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 pl-6 border-l border-gray-100">
                      <Button
                        onClick={() => handleAccept(transfer.id)}
                        disabled={processingId === transfer.id}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-green-200 shadow-sm"
                        size="sm"
                      >
                        {processingId === transfer.id ? '...' : (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Accept
                          </span>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleReject(transfer.id)}
                        disabled={processingId === transfer.id}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white shadow-red-200 shadow-sm"
                      >
                        {processingId === transfer.id ? '...' : (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            Reject
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transfer History */}
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-white border-b border-gray-100 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Transfer History ({filteredTransfers.length})</CardTitle>
              </div>

              <div className="flex p-1 bg-gray-100 rounded-lg">
                {(['all', 'pending', 'accepted', 'rejected'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`
                            px-4 py-2 text-sm font-medium rounded-md transition-all
                            ${filter === status
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                      }
                        `}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTransfers.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <p className="text-gray-500 font-medium">No transfers found</p>
                <p className="text-sm text-gray-400 mt-1">Try changing the filter or create a new transfer</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4">Token</th>
                      <th className="px-6 py-4">From</th>
                      <th className="px-6 py-4">To</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransfers.map((transfer) => (
                      <tr key={transfer.id.toString()} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{transfer.tokenName}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {transfer.from.slice(0, 6)}...{transfer.from.slice(-4)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                            {transfer.to.slice(0, 6)}...{transfer.to.slice(-4)}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{transfer.amount.toString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                            {getStatusLabel(transfer.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`
                             text-xs font-semibold px-2 py-1 rounded-md
                             ${transfer.to.toLowerCase() === account?.toLowerCase()
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-orange-50 text-orange-700'}
                          `}>
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
