'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';
import { UserStatus } from '@/lib/types';

interface ScUser {
  id: bigint;
  userAddress: string;
  role: string;
  status: UserStatus;
}

export default function TransferTokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { account, isConnected } = useWeb3();
  const { transfer, getToken, getTokenBalance, getAllUsers, getUserInfo } = useContract();
  const { toast, showToast, hideToast } = useToast();

  const [tokenName, setTokenName] = useState('');
  const [balance, setBalance] = useState(BigInt(0));
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [availableRecipients, setAvailableRecipients] = useState<ScUser[]>([]);

  useEffect(() => {
    if (!isConnected || !account) {
      router.push('/');
      return;
    }
    fetchData();
  }, [isConnected, account, id]);

  const fetchData = async () => {
    if (!account) return;

    try {
      // 1. Fetch User Role
      const userInfo = await getUserInfo(account);
      const myRole = userInfo[2]; // role at index 2
      setUserRole(myRole);

      // 2. Fetch Token Info
      const tokenId = BigInt(id);
      const tokenData = await getToken(tokenId);
      const bal = await getTokenBalance(tokenId, account);
      setTokenName(tokenData[2]); // name at index 2
      setBalance(bal);

      // 3. Fetch Potential Recipients
      const targetRole = getTargetRole(myRole);
      if (targetRole) {
        const allUsers = await getAllUsers();
        const validRecipients = allUsers.filter((u: ScUser) =>
          u.role === targetRole &&
          u.status === UserStatus.Approved &&
          u.userAddress.toLowerCase() !== account.toLowerCase()
        );
        setAvailableRecipients(validRecipients);
      }
    } catch (error) {
      console.error('[Transfer] Error fetching data:', error);
    }
  };

  const getTargetRole = (role: string) => {
    switch (role) {
      case 'Producer': return 'Factory';
      case 'Factory': return 'Retailer';
      case 'Retailer': return 'Consumer';
      default: return null;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'Producer': return 'Send raw materials to factories for processing';
      case 'Factory': return 'Send processed goods to retailers for distribution';
      case 'Retailer': return 'Sell final products to consumers';
      default: return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) {
      showToast('Please fill all fields', 'error');
      return;
    }
    const amt = BigInt(amount);
    if (amt <= 0 || amt > balance) {
      showToast('Invalid amount', 'error');
      return;
    }

    setLoading(true);
    try {
      await transfer(BigInt(id), recipient, amt);
      showToast('Transfer request sent!', 'success');
      setTimeout(() => router.push('/transfers'), 1500);
    } catch (error: any) {
      showToast('Transfer failed: ' + (error.reason || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const targetRole = getTargetRole(userRole);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/tokens/${id}`)}
              className="bg-white"
            >
              ← Back to Token
            </Button>
            <h1 className="text-2xl font-bold">Transfer Token</h1>
          </div>

          {/* Token Info Card */}
          <Card className="rounded-xl border-gray-200 overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold">{tokenName}</h2>
                <p className="text-gray-500">Token #{id.toString()} • Balance: {balance.toString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Rules */}
          <Card className="rounded-xl border-gray-200 overflow-hidden">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-semibold text-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Transfer Rules
              </div>
              <div className="pl-8 space-y-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Your Role: <span className="font-semibold">{userRole}</span></span>
                </div>
                <div className="text-gray-600">
                  You can transfer to: <span className="font-semibold text-gray-900">{targetRole}s </span>
                  ({availableRecipients.length} available)
                </div>
                <p className="text-sm text-gray-500 italic">
                  {getRoleDescription(userRole)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Transfer Form */}
          <Card className="rounded-xl border-gray-200 overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Send Transfer Request</h2>
                  <p className="text-gray-500">The recipient will need to accept the transfer</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 pl-12">
                <div>
                  <Label htmlFor="recipient">Recipient ({targetRole}) <span className="text-red-500">*</span></Label>
                  <select
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                  >
                    <option value="">Select a recipient...</option>
                    {availableRecipients.map((user) => (
                      <option key={user.userAddress} value={user.userAddress}>
                        {user.userAddress}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount <span className="text-red-500">*</span></Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount to transfer"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum: {balance.toString()} tokens</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 rounded-md p-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-yellow-800 text-sm">Important</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        This will create a transfer request. The recipient must accept the transfer before
                        the tokens are actually moved. You can cancel the transfer if needed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/tokens/${id}`)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !recipient || !amount}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {loading ? (
                      'Sending...'
                    ) : (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Send Transfer Request
                      </div>
                    )}
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
