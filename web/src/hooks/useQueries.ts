import { useQuery } from '@tanstack/react-query';
import { useWeb3 } from '@/contexts/Web3Context';
import { Token, User } from '@/lib/types';

export const QUERY_KEYS = {
    userTokens: (address: string) => ['userTokens', address],
    userTransfers: (address: string) => ['userTransfers', address],
    token: (id: string) => ['token', id],
    tokenTransfers: (id: string) => ['tokenTransfers', id],
    allUsers: ['allUsers'],
    userInfo: (address: string) => ['userInfo', address],
};

// --- QUERIES ---

export function useUserInfo(address?: string) {
    const { contract } = useWeb3();

    return useQuery({
        queryKey: QUERY_KEYS.userInfo(address || ''),
        queryFn: async () => {
            if (!contract || !address) return null;
            try {
                const user = await contract.getUserInfo(address);
                return {
                    id: user.id,
                    userAddress: user.userAddress,
                    role: user.role,
                    status: Number(user.status)
                };
            } catch (error: any) {
                if (error.message?.includes('User does not exist')) {
                    return null;
                }
                throw error;
            }
        },
        enabled: !!contract && !!address,
        retry: false
    });
}

export function useUserTokens(address?: string) {
    const { contract } = useWeb3();

    return useQuery({
        queryKey: QUERY_KEYS.userTokens(address || ''),
        queryFn: async () => {
            if (!contract || !address) return [];
            const ids: bigint[] = await contract.getUserTokens(address);
            return ids.map(id => id.toString());
        },
        enabled: !!contract && !!address,
    });
}

export function useUserTransfersQuery(address?: string) {
    const { contract } = useWeb3();

    return useQuery({
        queryKey: QUERY_KEYS.userTransfers(address || ''),
        queryFn: async () => {
            if (!contract || !address) return [];
            const ids: bigint[] = await contract.getUserTransfers(address);
            return ids.map(id => id.toString());
        },
        enabled: !!contract && !!address,
    });
}

export function useTokenDetails(tokenId?: string) {
    const { contract } = useWeb3();

    return useQuery({
        queryKey: QUERY_KEYS.token(tokenId || ''),
        queryFn: async () => {
            if (!contract || !tokenId) throw new Error("No contract or token ID");
            const data = await contract.getToken(BigInt(tokenId));
            return {
                id: data.id,
                creator: data.creator,
                name: data.name,
                totalSupply: data.totalSupply,
                features: data.features,
                timestamp: data.dateCreated
            } as Token;
        },
        enabled: !!contract && !!tokenId
    });
}

export function useAllUsersQuery() {
    const { contract } = useWeb3();

    return useQuery({
        queryKey: QUERY_KEYS.allUsers,
        queryFn: async () => {
            if (!contract) return [];
            const count = await contract.nextUserId();
            const users: User[] = [];
            for (let i = 1; i < count; i++) { // user IDs start at 1
                const u = await contract.users(i);
                users.push({
                    userAddress: u.userAddress,
                    role: u.role,
                    status: Number(u.status)
                } as any);
            }
            return users;
        },
        enabled: !!contract
    });
}
