'use client';

import { Card, CardContent } from './ui/card';
import { Token } from '@/lib/types';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface TokenCardProps {
  token: Token;
  balance?: bigint;
}

export function TokenCard({ token, balance }: TokenCardProps) {
  const router = useRouter();
  const { account } = useWeb3();
  const date = new Date(Number(token.timestamp) * 1000).toLocaleDateString();

  const isCreator = account && token.creator.toLowerCase() === account.toLowerCase();
  const displayAddress = `${token.creator.slice(0, 6)}...${token.creator.slice(-4)}`;

  // Parse features if it's JSON, or display as string
  let featuresDisplay = token.features;
  try {
    if (token.features) {
      const parsed = JSON.parse(token.features);
      // If it's a simple object, maybe show the first value or stringify prettily? 
      // The image shows a simple string. If JSON, let's show a preview.
      featuresDisplay = JSON.stringify(parsed, null, 2);
      // If it's just a string in JSON, use that
      if (typeof parsed === 'string') featuresDisplay = parsed;
    }
  } catch (e) {
    // Not JSON, use as is
  }

  return (
    <Card className="hover:shadow-lg transition-shadow bg-white rounded-xl overflow-hidden border border-gray-100">
      <CardContent className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{token.name}</h3>
            <p className="text-sm text-gray-500">Token #{token.id.toString()}</p>
          </div>
          {balance !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {balance.toString()}
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Balance</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Supply</p>
            <p className="font-medium text-gray-900">{token.totalSupply.toString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <p className="font-medium text-gray-900">{date}</p>
          </div>
        </div>

        {/* Creator Section */}
        <div>
          <p className="text-xs text-gray-500 mb-1">Creator</p>
          <div className="font-mono text-sm text-gray-700 mb-2">
            {displayAddress}
          </div>
          {isCreator && (
            <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
              Owned by you
            </span>
          )}
        </div>

        {/* Features Section */}
        {featuresDisplay && (
          <div>
            <p className="text-xs text-gray-500 mb-1">Features</p>
            <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed">
              {featuresDisplay.replace(/["{}]/g, '') /* Simple cleanup for display */}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1 border-gray-200"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/tokens/${token.id}`);
            }}
          >
            <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Details
          </Button>
          <Button
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/tokens/${token.id}/transfer`);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Transfer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
