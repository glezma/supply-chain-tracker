'use client';

import { useWeb3 } from '@/contexts/Web3Context';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface NetworkGuardProps {
    children: React.ReactNode;
}

const SUPPORTED_CHAINS = [
    { id: BigInt(31337), name: 'Anvil Localhost', hex: '0x7a69' },
    { id: BigInt(11155111), name: 'Sepolia Testnet', hex: '0xaa36a7' }
];

export function NetworkGuard({ children }: NetworkGuardProps) {
    const { isConnected, chainId } = useWeb3();

    // If not connected, or we don't have chainId (yet), assume safe or handled by connect flow (UI usually handles disconnected state)
    // However, if connected AND chainId is known AND invalid, block.

    const isWrongNetwork = isConnected && chainId && !SUPPORTED_CHAINS.some(c => c.id === chainId);

    const switchNetwork = async (hexCode: string) => {
        if (!window.ethereum) return;
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: hexCode }],
            });
        } catch (error: any) {
            if (error.code === 4902) {
                // Add network if needed, simplistic implementation for Anvil
                if (hexCode === '0x7a69') {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x7a69',
                            chainName: 'Anvil Local',
                            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                            rpcUrls: ['http://localhost:8545'],
                        }],
                    });
                }
            }
        }
    };

    if (isWrongNetwork) {
        return (
            <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-[9999] backdrop-blur-sm flex items-center justify-center">
                <Card className="w-full max-w-md border-orange-200 shadow-2xl bg-white">
                    <CardContent className="pt-6 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wrong Network</h2>
                            <p className="text-gray-500">
                                Please switch to a supported network to use this application.
                            </p>
                        </div>

                        <div className="space-y-3">
                            {SUPPORTED_CHAINS.map(chain => (
                                <Button
                                    key={chain.hex}
                                    onClick={() => switchNetwork(chain.hex)}
                                    className="w-full h-12 text-base font-medium flex items-center justify-center gap-2"
                                    variant="outline"
                                >
                                    Switch to {chain.name}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}
