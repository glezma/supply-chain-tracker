'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateTokenPage() {
  const router = useRouter();
  const { account, isConnected } = useWeb3();
  const { createToken, getUserInfo } = useContract();
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
      alert('Please fill all fields');
      return;
    }

    const qty = BigInt(quantity);
    if (qty <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      console.log('[CreateToken] Creating token:', { name, quantity: qty });
      await createToken(name, qty);
      alert('Token created successfully!');
      router.push('/tokens');
    } catch (error: any) {
      console.error('[CreateToken] Error:', error);
      alert('Failed to create token: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}
