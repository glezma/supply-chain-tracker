export const ROLE_CONFIG: Record<string, {
    description: string;
    createTokenGuidance: string;
    nextSteps: string[];
}> = {
    Producer: {
        description: 'Create raw material tokens and transfer to factories',
        createTokenGuidance: 'You can create raw material tokens and transfer them to factories.',
        nextSteps: [
            'View your current tokens',
            'Create new tokens',
            'Transfer tokens to factories',
            'Track supply chain history'
        ]
    },
    Factory: {
        description: 'Transform materials into products and transfer to retailers',
        createTokenGuidance: 'You can create processed product tokens and transfer them to retailers.',
        nextSteps: [
            'View your current tokens',
            'Create new tokens',
            'Transfer tokens to retailers',
            'Approve transfers from producers',
            'Track supply chain history'
        ]
    },
    Retailer: {
        description: 'Distribute products to consumers and transfer to consumers',
        createTokenGuidance: 'You can create retail batch tokens and sell them to consumers.',
        nextSteps: [
            'View your current tokens',
            'Create new tokens',
            'Transfer tokens to consumers',
            'Approve transfers from factories',
            'Track supply chain history'
        ]
    },
    Consumer: {
        description: 'Final recipient of products and verify authenticity',
        createTokenGuidance: 'Consumers typically do not create tokens, but can verify and hold them.',
        nextSteps: [
            'View your current tokens',
            'Verify product authenticity',
            'Track product history',
            'View supply chain journey'
        ]
    },
    Admin: {
        description: 'Manage users, approve registrations, and oversee the entire supply chain system',
        createTokenGuidance: 'Admins can oversee token creation.',
        nextSteps: [
            'Manage users',
            'Track supply chain history'
        ]
    }
};
