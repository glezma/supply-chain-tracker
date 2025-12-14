import { describe, it, expect } from 'vitest';
import { parseContractError } from './errorParser';

describe('errorParser', () => {
    it('parses raw execution reverted strings', () => {
        const error = { message: 'execution reverted: User not approved' };
        const result = parseContractError(error);
        expect(result.title).toBe('Your account is still pending approval.');
    });

    it('parses logical checks from contract', () => {
        const error = { reason: 'Producer can only transfer to Factory' };
        const result = parseContractError(error);
        expect(result.description).toContain('Producers can only transfer goods');
    });

    it('handles wallet rejections', () => {
        const error = "User rejected the request";
        const result = parseContractError(error);
        expect(result.title).toBe('Transaction cancelled.');
    });

    it('falls back gracefully on unknown errors', () => {
        const error = { message: 'Some obscure network failure' };
        const result = parseContractError(error);
        expect(result.title).toBe('An unexpected error occurred');
    });
});
