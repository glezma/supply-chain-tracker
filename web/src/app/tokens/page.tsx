'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TokenCard } from '@/components/TokenCard';

interface TokenData {
  id: bigint;
  name: string;
  creator: string;
  totalSupply: bigint;
  balance: bigint;
  timestamp: bigint;
  tokenType: number;
  features?: string;
}

export default function TokensPage() {
  const router = useRouter();
  const { account, isConnected, contract } = useWeb3();
  const { getUserTokens, getToken } = useContract();
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !account || !contract) {
      if (!isConnected || !account) {
        router.push('/');
      }
      return;
    }
    console.log('[Tokens] useEffect triggered, fetching tokens');
    fetchTokens();
  }, [isConnected, account, contract]);

  const fetchTokens = async () => {
    if (!account || !contract) return;

    console.log('[Tokens] Starting fetch for account:', account);
    setLoading(true);
    try {
      console.log('[Tokens] Getting user tokens...');
      const tokenIds = await getUserTokens(account);
      console.log('[Tokens] Token IDs:', tokenIds);
      const tokenList: TokenData[] = [];

      for (const id of tokenIds) {
        console.log('[Tokens] Fetching token:', id);
        const token = await getToken(id);
        console.log('[Tokens] Token data:', token);
        const balance = await contract.getTokenBalance(id, account);
        console.log('[Tokens] Balance:', balance);

        tokenList.push({
          id: token[0],
          name: token[2], // Name is at index 2
          creator: token[1], // Creator is at index 1
          totalSupply: token[3], // Supply at 3
          tokenType: Number(token[5]), // New Type at 5
          timestamp: token[7], // Timestamp shifted to 7
          features: token[4], // Features at 4 (unchanged)
          balance: balance,
        });
      }

      console.log('[Tokens] Total tokens:', tokenList.length);
      setTokens(tokenList);
    } catch (error) {
      console.error('[Tokens] Error fetching tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading tokens...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Tokens</h1>
          <Button onClick={() => router.push('/tokens/create')}>
            Create Token
          </Button>
        </div>

        {tokens.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-600">
              No tokens yet. Create your first token!
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tokens.map((token) => (
              <TokenCard
                key={token.id.toString()}
                token={token}
                balance={token.balance}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
