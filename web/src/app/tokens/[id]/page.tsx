'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Token, Transfer, TransferStatus } from '@/lib/types';
import { formatDate } from '@/lib/formatters';

interface TokenDetails extends Token {
  balance: bigint;
}

export default function TokenDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { account, isConnected } = useWeb3();
  const { getToken, getTokenBalance, getTokenTransfers } = useContract();

  const [token, setToken] = useState<TokenDetails | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !account) {
      router.push('/');
      return;
    }
    fetchData();
  }, [isConnected, account, id]);

  const fetchData = async () => {
    if (!account) return;

    setLoading(true);
    try {
      const tokenId = BigInt(id);

      // Fetch Token
      const tokenData = await getToken(tokenId);
      const balance = await getTokenBalance(tokenId, account);

      // Token struct mappings based on previous checks:
      // [id, creator, name, totalSupply, features, parentId, dateCreated]
      // Wait, ensure mapping is correct. 
      // getToken return: [id, creator, name, totalSupply, features, parentId, dateCreated]

      setToken({
        id: tokenData[0],
        creator: tokenData[1],
        name: tokenData[2],
        totalSupply: tokenData[3],
        timestamp: tokenData[7], // dateCreated is at 7 (Shifted)
        features: tokenData[4],  // features at 4
        tokenType: Number(tokenData[5]), // tokenType at 5
        parentId: tokenData[6],  // parentId at 6
        balance: balance,
      });

      // Fetch History
      const history = await getTokenTransfers(tokenId);
      setTransfers(history);

    } catch (error) {
      console.error('[TokenDetails] Error fetching data:', error);
      // alert('Token not found or error loading');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!token) return null;

  const isCreator = account && token.creator.toLowerCase() === account.toLowerCase();
  const date = formatDate(token.timestamp);

  // Get token type display info
  const getTokenTypeInfo = (type: number) => {
    switch (type) {
      case 0:
        return { label: 'Raw Material', color: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 1:
        return { label: 'Processed Product', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 2:
        return { label: 'Final Product', color: 'bg-purple-100 text-purple-700 border-purple-200' };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const tokenTypeInfo = getTokenTypeInfo(token.tokenType);

  // Format features
  let featuresDisplay = token.features;
  try {
    if (token.features) {
      const parsed = JSON.parse(token.features);
      if (typeof parsed === 'string') featuresDisplay = `"${parsed}"`;
      else featuresDisplay = JSON.stringify(parsed, null, 2);
    }
  } catch (e) { }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Actions */}
        {/* Removed back button from main layout to match image cleaner look, or kept if needed. Image doesn't show it clearly but usually good UX. */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Token Info */}
          <div className="space-y-6">
            <Card className="rounded-xl overflow-hidden shadow-sm border-gray-100">
              <CardContent className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{token.name}</h2>
                    <p className="text-sm text-gray-500">Token #{token.id.toString()}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{token.balance.toString()}</p>
                    <p className="text-xs text-gray-600 font-medium mt-1">Your Balance</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-800">{token.totalSupply.toString()}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">Total Supply</p>
                  </div>
                </div>

                {/* Token Type */}
                <div className="pt-2">
                  <p className="text-xs text-gray-500 mb-2">Token Type</p>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium border ${tokenTypeInfo.color}`}>
                    {tokenTypeInfo.label}
                  </span>
                </div>

                {/* Parent Token */}
                {token.parentId && Number(token.parentId) > 0 ? (
                  <div className="pt-2">
                    <p className="text-xs text-gray-500 mb-2">Parent Token</p>
                    <button
                      onClick={() => router.push(`/tokens/${token.parentId}`)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      Token #{token.parentId.toString()}
                    </button>
                  </div>
                ) : null}

                {/* Creator */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Creator</p>
                      <p className="text-sm font-mono text-gray-800">
                        {token.creator.slice(0, 6)}...{token.creator.slice(-4)}
                      </p>
                    </div>
                  </div>
                  {isCreator && (
                    <div className="ml-11">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        Created by you
                      </span>
                    </div>
                  )}
                </div>

                {/* Created Date */}
                <div className="flex items-center gap-3 pt-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm text-gray-800">{date}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="rounded-xl overflow-hidden shadow-sm border-gray-100">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Features</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
                  {featuresDisplay || <span className="text-gray-400 italic">No features defined</span>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: History */}
          <div className="lg:col-span-2">
            <Card className="rounded-xl overflow-hidden shadow-sm border-gray-100 h-full">
              <CardHeader className="border-b border-gray-50 bg-white p-6">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <CardTitle className="text-lg">Transfer History</CardTitle>
                    <p className="text-sm text-gray-500 font-normal">Complete traceability history for this token</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {transfers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <span className="text-3xl text-gray-300 font-bold">#</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No transfer history available</h3>
                    <p className="text-gray-500 mt-1">This token hasn't been transferred yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {transfers.map((tx, index) => (
                      <div key={tx.id.toString()} className="relative pl-8 pb-6 last:pb-0 border-l-2 border-gray-100 last:border-0 ml-4">
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${Number(tx.status) === TransferStatus.Accepted ? 'bg-green-500' :
                          Number(tx.status) === TransferStatus.Rejected ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></div>

                        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${Number(tx.status) === TransferStatus.Accepted ? 'bg-green-100 text-green-800' :
                                Number(tx.status) === TransferStatus.Rejected ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {Number(tx.status) === TransferStatus.Accepted ? 'Completed' :
                                  Number(tx.status) === TransferStatus.Rejected ? 'Rejected' : 'Pending'}
                              </span>
                              <span className="text-sm text-gray-500 ml-3">
                                {formatDate(tx.timestamp)}
                              </span>
                            </div>
                            <div className="text-sm font-bold text-gray-900">
                              {tx.quantity.toString()} Tokens
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide">From</p>
                              <div className="font-mono text-gray-800 truncate" title={tx.from}>
                                {account && tx.from.toLowerCase() === account.toLowerCase() ? 'You' : tx.from}
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500 text-xs uppercase tracking-wide">To</p>
                              <div className="font-mono text-gray-800 truncate" title={tx.to}>
                                {account && tx.to.toLowerCase() === account.toLowerCase() ? 'You' : tx.to}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
