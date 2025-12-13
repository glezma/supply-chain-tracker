'use client';

import { Transfer, TransferStatus } from '@/lib/types';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useWeb3 } from '@/contexts/Web3Context';

interface TransferListProps {
  transfers: Transfer[];
  onAccept: (transferId: bigint) => Promise<void>;
  onReject: (transferId: bigint) => Promise<void>;
  loading?: boolean;
}

export function TransferList({ transfers, onAccept, onReject, loading }: TransferListProps) {
  const { account } = useWeb3();

  const getStatusBadge = (status: TransferStatus) => {
    const colors = {
      [TransferStatus.Pending]: 'bg-yellow-100 text-yellow-800',
      [TransferStatus.Accepted]: 'bg-green-100 text-green-800',
      [TransferStatus.Rejected]: 'bg-red-100 text-red-800',
    };
    const labels = {
      [TransferStatus.Pending]: 'Pending',
      [TransferStatus.Accepted]: 'Accepted',
      [TransferStatus.Rejected]: 'Rejected',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Token ID</TableHead>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transfers.map((transfer) => {
          const date = new Date(Number(transfer.timestamp) * 1000).toLocaleDateString();
          const toAddress = typeof transfer.to === 'string' ? transfer.to : String(transfer.to);
          const fromAddress = typeof transfer.from === 'string' ? transfer.from : String(transfer.from);
          const isRecipient = toAddress.toLowerCase() === account?.toLowerCase();
          const isPending = transfer.status === TransferStatus.Pending;

          return (
            <TableRow key={transfer.id.toString()}>
              <TableCell>{transfer.id.toString()}</TableCell>
              <TableCell>{transfer.tokenId.toString()}</TableCell>
              <TableCell className="text-xs">
                {fromAddress.slice(0, 6)}...{fromAddress.slice(-4)}
              </TableCell>
              <TableCell className="text-xs">
                {toAddress.slice(0, 6)}...{toAddress.slice(-4)}
              </TableCell>
              <TableCell>{transfer.quantity.toString()}</TableCell>
              <TableCell>{getStatusBadge(transfer.status)}</TableCell>
              <TableCell>{date}</TableCell>
              <TableCell>
                {isRecipient && isPending && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onAccept(transfer.id)}
                      disabled={loading}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(transfer.id)}
                      disabled={loading}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
