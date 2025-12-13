'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';

export default function TransferTokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { account, isConnected, contract } = useWeb3();
  const { transfer, getToken } = useContract();
  const { toast, showToast, hideToast } = useToast();
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
      showToast('Please fill all fields', 'error');
      return;
    }

    const amt = BigInt(amount);
    if (amt <= 0) {
      showToast('Amount must be greater than 0', 'error');
      return;
    }

    if (amt > balance) {
      showToast('Insufficient balance', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('[Transfer] Transferring:', { tokenId: id, recipient, amount: amt });
      await transfer(BigInt(id), recipient, amt);
      showToast('Transfer request sent! Waiting for recipient to accept.', 'success');
      setTimeout(() => router.push('/transfers'), 1500);
    } catch (error: any) {
      console.error('[Transfer] Error:', error);
      showToast('Transfer failed: ' + (error.reason || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
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
    </>
  );
}
