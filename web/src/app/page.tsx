'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { UserRole, UserStatus } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const { account, isConnected, connectWallet } = useWeb3();
  const { requestUserRole, getUserInfo } = useContract();
  const [selectedRole, setSelectedRole] = useState<string>('Producer');
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && account) {
      fetchUserStatus();
    }
  }, [isConnected, account]);

  const fetchUserStatus = async () => {
    if (!account) return;
    
    // Check if admin first
    if (account.toLowerCase() === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266') {
      console.log('[Page] Admin account detected, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }
    
    try {
      console.log('[Page] Fetching user status for:', account);
      const user = await getUserInfo(account);
      console.log('[Page] Raw user data:', user);
      console.log('[Page] user[0] (id):', user[0]);
      console.log('[Page] user[1] (address):', user[1]);
      console.log('[Page] user[2] (role):', user[2]);
      console.log('[Page] user[3] (status):', user[3]);
      
      // User struct: [id, userAddress, role, status]
      const status = Number(user[3]);
      console.log('[Page] Status as number:', status);
      setUserStatus(status as UserStatus);
    } catch (error: any) {
      console.log('[Page] User not registered yet:', error.message);
      setUserStatus(null);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      console.log('[Page] Registering with role:', selectedRole);
      await requestUserRole(selectedRole);
      console.log('[Page] Registration successful, fetching status...');
      await fetchUserStatus();
    } catch (error: any) {
      console.error('[Page] Registration failed:', error);
      alert('Registration failed: ' + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Welcome to Supply Chain Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Connect your MetaMask wallet to get started
            </p>
            <Button onClick={connectWallet} className="w-full">
              Connect MetaMask
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

  if (userStatus === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Register Your Role</CardTitle>
            <p className="text-sm text-gray-500 mt-2">Connected: {displayAddress}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Your Role</Label>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mt-2"
              >
                <option value="Producer">Producer</option>
                <option value="Factory">Factory</option>
                <option value="Retailer">Retailer</option>
                <option value="Consumer">Consumer</option>
              </Select>
            </div>
            <Button onClick={handleRegister} disabled={loading} className="w-full">
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userStatus === UserStatus.Pending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Waiting for Approval</CardTitle>
            <p className="text-sm text-gray-500 mt-2">Connected: {displayAddress}</p>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Your registration is pending admin approval. Please check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (userStatus === UserStatus.Approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <p className="text-sm text-gray-500 mt-2">Connected: {displayAddress}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Your account has been approved. Access your dashboard to get started.
            </p>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <p className="text-sm text-gray-500 mt-2">Connected: {displayAddress}</p>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Your registration was rejected. Please contact the administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
