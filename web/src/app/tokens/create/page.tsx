'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';

export default function CreateTokenPage() {
  const router = useRouter();
  const { account, isConnected } = useWeb3();
  const { createToken, getUserInfo } = useContract();
  const { toast, showToast, hideToast } = useToast();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (!isConnected || !account) {
      router.push('/');
      return;
    }
    fetchUserRole();
  }, [isConnected, account]);

  const fetchUserRole = async () => {
    if (!account) return;
    try {
      const user = await getUserInfo(account);
      setUserRole(user[2]);
    } catch (error) {
      console.error('[CreateToken] Error fetching user role:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !quantity) {
      showToast('Please fill all fields', 'error');
      return;
    }

    const qty = BigInt(quantity);
    if (qty <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }

    setLoading(true);
    try {
      console.log('[CreateToken] Creating token:', { name, quantity: qty });
      await createToken(name, qty);
      showToast('Token created successfully!', 'success');
      setTimeout(() => router.push('/tokens'), 1000);
    } catch (error: any) {
      console.error('[CreateToken] Error:', error);
      showToast('Failed to create token: ' + (error.reason || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create New Token</CardTitle>
            <p className="text-sm text-gray-500 mt-2">Role: {userRole}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Token Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Raw Cotton, T-Shirt"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="quantity">Total Supply</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g., 1000"
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Token'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/tokens')}
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
