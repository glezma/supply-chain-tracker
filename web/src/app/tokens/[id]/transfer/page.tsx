'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TransferTokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { account, isConnected, contract } = useWeb3();
  const { transfer, getToken } = useContract();
  const [tokenName, setTokenName] = useState('');
  const [balance, setBalance] = useState(BigInt(0));
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isConnected || !account || !contract) {
      if (!isConnected || !account) {
        router.push('/');
      }
      return;
    }
    fetchTokenInfo();
  }, [isConnected, account, contract, id]);

  const fetchTokenInfo = async () => {
    if (!contract || !account) return;
    
    try {
      const tokenId = BigInt(id);
      const tokenData = await getToken(tokenId);
      const bal = await contract.getTokenBalance(tokenId, account);
      
      setTokenName(tokenData[2]);
      setBalance(bal);
    } catch (error) {
      console.error('[Transfer] Error fetching token:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount) {
      alert('Please fill all fields');
      return;
    }

    const amt = BigInt(amount);
    if (amt <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (amt > balance) {
      alert('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      console.log('[Transfer] Transferring:', { tokenId: id, recipient, amount: amt });
      await transfer(BigInt(id), recipient, amt);
      alert('Transfer request sent! Waiting for recipient to accept.');
      router.push('/transfers');
    } catch (error: any) {
      console.error('[Transfer] Error:', error);
      alert('Transfer failed: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => router.push(`/tokens/${id}`)}
          className="mb-4"
        >
          ← Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Transfer {tokenName}</CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              Available Balance: {balance.toString()}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="0x..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g., 100"
                  max={balance.toString()}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Sending...' : 'Send Transfer Request'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push(`/tokens/${id}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
