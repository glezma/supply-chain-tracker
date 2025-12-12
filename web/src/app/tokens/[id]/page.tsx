'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TokenDetails {
  id: bigint;
  creator: string;
  name: string;
  totalSupply: bigint;
  balance: bigint;
}

export default function TokenDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { account, isConnected, contract } = useWeb3();
  const { getToken } = useContract();
  const [token, setToken] = useState<TokenDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !account || !contract) {
      if (!isConnected || !account) {
        router.push('/');
      }
      return;
    }
    fetchToken();
  }, [isConnected, account, contract, id]);

  const fetchToken = async () => {
    if (!contract || !account) return;
    
    setLoading(true);
    try {
      const tokenId = BigInt(id);
      const tokenData = await getToken(tokenId);
      const balance = await contract.getTokenBalance(tokenId, account);

      setToken({
        id: tokenData[0],
        creator: tokenData[1],
        name: tokenData[2],
        totalSupply: tokenData[3],
        balance: balance,
      });
    } catch (error) {
      console.error('[TokenDetails] Error fetching token:', error);
      alert('Token not found');
      router.push('/tokens');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading token...</p>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => router.push('/tokens')}
          className="mb-4"
        >
          ← Back to Tokens
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{token.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Token ID</p>
                <p className="font-semibold">{token.id.toString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Balance</p>
                <p className="font-semibold text-lg">{token.balance.toString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Supply</p>
                <p className="font-semibold">{token.totalSupply.toString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Creator</p>
                <p className="font-mono text-sm">
                  {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
                </p>
              </div>
            </div>

            {token.balance > 0 && (
              <Button 
                onClick={() => router.push(`/tokens/${id}/transfer`)}
                className="w-full mt-4"
              >
                Transfer Tokens
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
