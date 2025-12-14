import { describe, it, expect } from 'vitest';
import { ROLE_CONFIG } from './roleConfig';
import { UserRole } from './types';

describe('ROLE_CONFIG', () => {
    it('should have configuration for all user roles', () => {
        const roles = ['Producer', 'Factory', 'Retailer', 'Consumer', 'Admin'];

        roles.forEach(role => {
            expect(ROLE_CONFIG[role]).toBeDefined();
            expect(ROLE_CONFIG[role].description).toBeDefined();
            expect(ROLE_CONFIG[role].nextSteps).toBeInstanceOf(Array);
        });
    });

    it('should have correct description for Producer', () => {
        expect(ROLE_CONFIG['Producer'].description).toContain('Create raw material');
    });

    it('should have distinct descriptions for each role', () => {
        const producerDesc = ROLE_CONFIG['Producer'].description;
        const consumerDesc = ROLE_CONFIG['Consumer'].description;
        expect(producerDesc).not.toBe(consumerDesc);
    });
});
