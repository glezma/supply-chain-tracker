'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { Web3Provider } from '@/contexts/Web3Context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NetworkGuard } from '@/components/NetworkGuard';

export function Providers({ children }: { children: ReactNode }) {
    // Create a new QueryClient for each session to avoid data leaking between requests during SSR 
    // (though this is Client Component, standard practice)
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // Data is fresh for 1 minute
                retry: 1,
            },
        },
    }));

    return (
        <Web3Provider>
            <QueryClientProvider client={queryClient}>
                <ErrorBoundary>
                    <NetworkGuard>
                        {children}
                    </NetworkGuard>
                </ErrorBoundary>
            </QueryClientProvider>
        </Web3Provider>
    );
}
