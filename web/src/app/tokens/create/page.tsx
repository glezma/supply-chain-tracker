'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWeb3 } from '@/contexts/Web3Context';
import { useContract } from '@/hooks/useContract';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';
import { ROLE_CONFIG } from '@/lib/roleConfig';
import { TokenType } from '@/lib/types';

export default function CreateTokenPage() {
  const router = useRouter();
  const { account, isConnected } = useWeb3();
  const { createToken, getUserInfo, getUserTokens, getToken } = useContract();
  const { toast, showToast, hideToast } = useToast();
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [features, setFeatures] = useState('');
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [parentId, setParentId] = useState('');
  const [availableTokens, setAvailableTokens] = useState<{ id: bigint; name: string }[]>([]);

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

      // Fetch tokens for parent selection ONLY if Factory or Retailer
      if (user[2] === 'Factory' || user[2] === 'Retailer') {
        const tokenIds = await getUserTokens(account);
        const tokens = await Promise.all(
          tokenIds.map(async (id: bigint) => {
            const t = await getToken(id);
            // t mapping: 0:id, 1:creator, 2:name, 3:supply, 4:features, 5:type, 6:parent, 7:date
            return { id: t[0], name: t[2], type: Number(t[5]) };
          })
        );

        // Filter valid parents
        const validParents = tokens.filter(t => {
          if (user[2] === 'Factory') return t.type === TokenType.RawMaterial;
          if (user[2] === 'Retailer') return t.type === TokenType.ProcessedProduct;
          return false;
        });

        setAvailableTokens(validParents);
      }
    } catch (error) {
      console.error('[CreateToken] Error fetching user role:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !quantity) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    const qty = BigInt(quantity);
    if (qty <= 0) {
      showToast('Quantity must be greater than 0', 'error');
      return;
    }

    // Validate JSON if provided
    if (features.trim()) {
      try {
        JSON.parse(features);
      } catch (e) {
        showToast('Invalid JSON format in Features', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      const pId = parentId ? BigInt(parentId) : BigInt(0);
      console.log('[CreateToken] Creating token:', { name, quantity: qty, features, parentId: pId });
      await createToken(name, qty, features, pId);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-xl">
          <CardContent className="p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Token</h1>
                <p className="text-gray-500">Create a new token for your role as {userRole}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Token Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Token Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter token name (e.g., Premium Coffee Beans)"
                  className="w-full"
                />
              </div>

              {/* Total Supply */}
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                  Total Supply <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter total supply (e.g., 1000)"
                  className="w-full"
                />
              </div>

              {/* Parent Token Selection - Only for Factory and Retailer */}
              {(userRole === 'Factory' || userRole === 'Retailer') && (
                <div className="space-y-2">
                  <Label htmlFor="parent" className="text-sm font-medium text-gray-700">
                    Parent Token <span className="text-gray-500 font-normal">(Optional, for traceability)</span>
                  </Label>
                  <Select
                    id="parent"
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                  >
                    <option value="">None (No parent token)</option>
                    {availableTokens.map((token) => (
                      <option key={token.id.toString()} value={token.id.toString()}>
                        #{token.id.toString()} - {token.name}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-gray-500">
                    {userRole === 'Factory'
                      ? "Select the Raw Material used to produce this product."
                      : "Select the Factory Product being distributed."}
                  </p>
                </div>
              )}

              {/* Features JSON */}
              <div className="space-y-2">
                <Label htmlFor="features" className="text-sm font-medium text-gray-700">
                  Features (JSON)
                </Label>
                <textarea
                  id="features"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder={`Enter features as JSON, e.g.:
{
  "origin": "Colombia",
  "quality": "Premium",
  "certification": "Organic",
  "harvest_date": "2024-03-15"
}`}
                  className="flex min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                />
                <p className="text-xs text-gray-500">
                  Optional: Add product characteristics in JSON format
                </p>
              </div>

              {/* Role Info Box */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-blue-900">Creating as {userRole}</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {ROLE_CONFIG[userRole]?.createTokenGuidance || 'Create and manage your supply chain tokens.'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/tokens')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Token
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
