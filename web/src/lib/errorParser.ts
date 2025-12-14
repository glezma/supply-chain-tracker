
interface ErrorMapping {
    match: string;
    message: string;
    solution?: string;
}

const ERROR_MAPPINGS: ErrorMapping[] = [
    { match: "User not approved", message: "Your account is still pending approval.", solution: "Please wait for an administrator to approve your registration." },
    { match: "User already registered", message: "This wallet address is already registered.", solution: "You cannot register twice with the same account." },
    { match: "Insufficient balance", message: "You do not have enough tokens for this transfer.", solution: "Check your balance and try a smaller amount." },
    { match: "Producer can only transfer to Factory", message: "Invalid supply chain flow.", solution: "Producers can only transfer goods to Factories." },
    { match: "Factory can only transfer to Retailer", message: "Invalid supply chain flow.", solution: "Factories can only transfer processed goods to Retailers." },
    { match: "Retailer can only transfer to Consumer", message: "Invalid supply chain flow.", solution: "Retailers can only transfer products to Consumers." },
    { match: "Consumer cannot transfer", message: "Consumers are the end of the chain.", solution: "You cannot transfer purchased items further." },
    { match: "Cannot transfer to yourself", message: "You are trying to transfer to your own address.", solution: "Please select a different recipient." },
    { match: "Amount must be greater than 0", message: "Transfer amount is invalid.", solution: "Please enter a positive number." },
    { match: "Recipient not approved", message: "The recipient is not approved to receive goods.", solution: "Ensure the recipient has a valid, approved account." },
    { match: "User rejected the request", message: "Transaction cancelled.", solution: "You rejected the transaction in your wallet." },
];

export function parseContractError(error: any): { title: string; description: string } {
    // Extract string from various error shapes
    let errorString = '';

    if (typeof error === 'string') {
        errorString = error;
    } else if (error?.reason) {
        errorString = error.reason;
    } else if (error?.message) {
        errorString = error.message;
    } else if (error?.data?.message) {
        errorString = error.data.message;
    }

    // Find match
    for (const mapping of ERROR_MAPPINGS) {
        if (errorString.includes(mapping.match)) {
            return {
                title: mapping.message,
                description: mapping.solution || ''
            };
        }
    }

    // Fallback
    return {
        title: "An unexpected error occurred",
        description: "See console for technical details."
    };
}
