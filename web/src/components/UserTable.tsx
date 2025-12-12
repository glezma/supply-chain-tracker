'use client';

import { User, UserRole, UserStatus } from '@/lib/types';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface UserTableProps {
  users: User[];
  onApprove: (address: string) => Promise<void>;
  onReject: (address: string) => Promise<void>;
  loading?: boolean;
}

export function UserTable({ users, onApprove, onReject, loading }: UserTableProps) {
  const getRoleLabel = (role: UserRole) => {
    const labels = {
      [UserRole.Producer]: 'Producer',
      [UserRole.Factory]: 'Factory',
      [UserRole.Retailer]: 'Retailer',
      [UserRole.Consumer]: 'Consumer',
    };
    return labels[role];
  };

  const getStatusBadge = (status: UserStatus) => {
    const colors = {
      [UserStatus.Pending]: 'bg-yellow-100 text-yellow-800',
      [UserStatus.Approved]: 'bg-green-100 text-green-800',
      [UserStatus.Rejected]: 'bg-red-100 text-red-800',
      [UserStatus.Revoked]: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      [UserStatus.Pending]: 'Pending',
      [UserStatus.Approved]: 'Approved',
      [UserStatus.Rejected]: 'Rejected',
      [UserStatus.Revoked]: 'Revoked',
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
          <TableHead>Address</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isPending = user.status === UserStatus.Pending;

          return (
            <TableRow key={user.userAddress}>
              <TableCell className="font-mono text-xs">
                {user.userAddress.slice(0, 10)}...{user.userAddress.slice(-8)}
              </TableCell>
              <TableCell>{getRoleLabel(user.role)}</TableCell>
              <TableCell>{getStatusBadge(user.status)}</TableCell>
              <TableCell>
                {isPending && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onApprove(user.userAddress)}
                      disabled={loading}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReject(user.userAddress)}
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
