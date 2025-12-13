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
import { ROLE_CONFIG } from '@/lib/roleConfig';

export default function Home() {
  const router = useRouter();
  const { account, isConnected, connectWallet } = useWeb3();
  const { requestUserRole, getUserInfo } = useContract();
  const [selectedRole, setSelectedRole] = useState<string>('Producer');
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [userRole, setUserRole] = useState<string>('');
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

      // User struct: [id, userAddress, role, status]
      const status = Number(user[3]);
      console.log('[Page] Status as number:', status);
      setUserRole(user[2]); // Store role
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
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-12 pb-12 px-8 flex flex-col items-center text-center">
            {/* Logo/Icon */}
            <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Supply Chain Tracker</h1>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto text-base">
              Secure, transparent, and efficient supply chain management on the blockchain.
            </p>

            <Button
              onClick={connectWallet}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-medium shadow-blue-200 shadow-lg transition-all hover:shadow-xl"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Connect MetaMask
              </div>
            </Button>

            <p className="mt-6 text-xs text-gray-400">

            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayAddress = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '';

  if (userStatus === null) {


    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardContent className="p-12">
            {/* User Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                <svg
                  className="w-12 h-12 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">
                Register for Access
              </h1>
              <p className="text-lg text-gray-500">
                Select your role in the supply chain to request access
              </p>
            </div>

            {/* Role Selection */}
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold text-gray-700 mb-3 block">
                  Select Your Role
                </Label>
                <Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full text-base"
                >
                  <option value="">Choose a role...</option>
                  <option value="Producer">Producer</option>
                  <option value="Factory">Factory</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Consumer">Consumer</option>
                </Select>
              </div>

              {/* Role Descriptions */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[110px]">Producer:</span>
                  <span className="text-gray-600">{ROLE_CONFIG.Producer.description}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[110px]">Factory:</span>
                  <span className="text-gray-600">{ROLE_CONFIG.Factory.description}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[110px]">Retailer:</span>
                  <span className="text-gray-600">{ROLE_CONFIG.Retailer.description}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 min-w-[110px]">Consumer:</span>
                  <span className="text-gray-600">{ROLE_CONFIG.Consumer.description}</span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleRegister}
                disabled={loading || !selectedRole}
                className="w-full py-6 text-lg font-semibold"
              >
                {loading ? 'Requesting Registration...' : 'Request Registration'}
              </Button>

              {/* Connected Address */}
              <p className="text-center text-sm text-gray-400 mt-4">
                Connected: {displayAddress}
              </p>
            </div>
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
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-12 pb-12 px-8 flex flex-col items-center text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
            <p className="text-gray-500 mb-6">
              You are logged in as a {userRole}
            </p>

            <div className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 mb-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approved {userRole}
            </div>

            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-900 hover:bg-black text-white py-6 text-base"
            >
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
