import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TokenCard } from './TokenCard';
import { Token } from '../lib/types';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}));

// Mock useWeb3
vi.mock('../contexts/Web3Context', () => ({
    useWeb3: () => ({
        account: '0x1234567890123456789012345678901234567890',
    }),
}));

describe('TokenCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const mockToken: Token = {
        id: BigInt(1),
        name: 'Test Token',
        creator: '0x1234567890123456789012345678901234567890',
        totalSupply: BigInt(100),
        timestamp: BigInt(Math.floor(Date.now() / 1000)),
        features: '{"color": "red"}',
    };

    it('renders token information correctly', () => {
        render(<TokenCard token={mockToken} balance={BigInt(50)} />);

        expect(screen.getByText('Test Token')).toBeDefined();
        expect(screen.getByText('Token #1')).toBeDefined();
        expect(screen.getByText('50')).toBeDefined(); // balance
        expect(screen.getByText('100')).toBeDefined(); // total supply
        expect(screen.getByText('Owned by you')).toBeDefined();
    });

    it('formats creator address correctly', () => {
        render(<TokenCard token={mockToken} />);
        // 0x1234...7890
        expect(screen.getByText(/0x1234...7890/)).toBeDefined();
    });

    it('navigates to details on button click', () => {
        render(<TokenCard token={mockToken} />);

        // Find details button (SVG logic or text)
        const detailsBtn = screen.getByText('Details').closest('button');
        fireEvent.click(detailsBtn!);

        expect(mockPush).toHaveBeenCalledWith('/tokens/1');
    });

    it('navigates to transfer on button click', () => {
        render(<TokenCard token={mockToken} />);

        const transferBtn = screen.getByText('Transfer').closest('button');
        fireEvent.click(transferBtn!);

        expect(mockPush).toHaveBeenCalledWith('/tokens/1/transfer');
    });
});
