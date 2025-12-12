'use client';

import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Token } from '@/lib/types';

interface TokenCardProps {
  token: Token;
  balance?: bigint;
}

export function TokenCard({ token, balance }: TokenCardProps) {
  const date = new Date(Number(token.timestamp) * 1000).toLocaleDateString();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{token.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Token ID:</span>
            <span className="font-medium">{token.id.toString()}</span>
          </div>
          {balance !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Balance:</span>
              <span className="font-medium">{balance.toString()}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Total Supply:</span>
            <span className="font-medium">{token.totalSupply.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">{date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Creator:</span>
            <span className="font-medium text-xs">
              {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
