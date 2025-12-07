# Design Document

## Overview

The Supply Chain Tracker is a blockchain-based decentralized application (DApp) that enables transparent and immutable tracking of products through a supply chain. The system uses Ethereum smart contracts to enforce role-based access control, tokenize physical products, and implement a two-phase transfer approval mechanism. The architecture eliminates the need for a traditional backend server by leveraging the blockchain as both the API and database layer.

The system follows a three-tier architecture:
1. **Smart Contract Layer** - Business logic and state management on Ethereum blockchain
2. **Web3 Integration Layer** - ethers.js library bridging frontend and blockchain
3. **Frontend Layer** - Next.js React application providing user interface

Key architectural decisions:
- **No backend server**: Smart contract replaces traditional API server
- **No database**: Blockchain serves as distributed, immutable database
- **Cryptographic authentication**: MetaMask signatures replace JWT tokens
- **Event-driven updates**: Smart contract events trigger UI updates
- **Local development**: Anvil provides instant blockchain for testing

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MetaMask Extension                          │  │
│  │  • Private key storage (encrypted)                       │  │
│  │  • Transaction signing (local)                           │  │
│  │  • Account management                                    │  │
│  │  • Network switching                                     │  │
│  └────────────────┬─────────────────────────────────────────┘  │
│                   │ window.ethereum API                        │
│                   ▼                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Frontend (Next.js + React + TypeScript)          │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Pages (App Router)                                │ │  │
│  │  │  • / (Landing/Register)                            │ │  │
│  │  │  • /dashboard                                      │ │  │
│  │  │  • /tokens, /tokens/create, /tokens/[id]          │ │  │
│  │  │  • /transfers                                      │ │  │
│  │  │  • /admin/users                                    │ │  │
│  │  │  • /profile                                        │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Web3 Context (Global State)                       │ │  │
│  │  │  • Connected address                               │ │  │
│  │  │  • User info (role, status)                        │ │  │
│  │  │  • Contract instance                               │ │  │
│  │  │  • Network info                                    │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  Web3 Service (ethers.js)                          │ │  │
│  │  │  • Provider (read blockchain)                      │ │  │
│  │  │  • Signer (sign transactions)                      │ │  │
│  │  │  • Contract (interact with smart contract)         │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │  localStorage                                       │ │  │
│  │  │  • connectedAddress                                │ │  │
│  │  │  • lastConnectedTime                               │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────┬───────────────────────────────────────┘  │
│                     │ JSON-RPC over HTTP                       │
└─────────────────────┼──────────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │   RPC Provider (Anvil)     │
         │   localhost:8545           │
         │   Chain ID: 31337          │
         └────────────┬───────────────┘
                      │ Ethereum Protocol
                      ▼
         ┌────────────────────────────────────────────────┐
         │         Ethereum Blockchain (Anvil)            │
         │                                                │
         │  ┌──────────────────────────────────────────┐ │
         │  │  Smart Contract: SupplyChain.sol         │ │
         │  │                                          │ │
         │  │  State Variables:                        │ │
         │  │  • admin                                 │ │
         │  │  • nextTokenId, nextTransferId, nextUserId│ │
         │  │  • mapping(uint => Token) tokens         │ │
         │  │  • mapping(uint => Transfer) transfers   │ │
         │  │  • mapping(uint => User) users           │ │
         │  │  • mapping(address => uint) addressToUserId│ │
         │  │                                          │ │
         │  │  Functions:                              │ │
         │  │  • requestUserRole(role)                 │ │
         │  │  • changeStatusUser(address, status)     │ │
         │  │  • createToken(name, supply, features, parentId)│ │
         │  │  • transfer(to, tokenId, amount)         │ │
         │  │  • acceptTransfer(transferId)            │ │
         │  │  • rejectTransfer(transferId)            │ │
         │  │  • getToken(tokenId)                     │ │
         │  │  • getUserInfo(address)                  │ │
         │  │  • getUserTokens(address)                │ │
         │  │  • getUserTransfers(address)             │ │
         │  └──────────────────────────────────────────┘ │
         │                                                │
         │  ┌──────────────────────────────────────────┐ │
         │  │  Blockchain State                        │ │
         │  │  • Blocks (immutable chain)              │ │
         │  │  • Transactions (signed operations)      │ │
         │  │  • Events (TokenCreated, TransferRequested, etc)│ │
         │  │  • Account balances                      │ │
         │  └──────────────────────────────────────────┘ │
         └────────────────────────────────────────────────┘
```

### Component Interaction Flow

```
User Action Flow:
1. User clicks "Create Token" button
   └─▶ Frontend: TokenCreatePage component

2. User fills form and clicks "Submit"
   └─▶ Frontend: Form validation
       └─▶ Web3Service.createToken(name, supply, features, parentId)
           └─▶ ethers.js: contract.createToken(...)
               └─▶ MetaMask: Shows transaction popup
                   └─▶ User: Reviews and signs transaction
                       └─▶ MetaMask: Signs with private key (local)
                           └─▶ ethers.js: Sends signed transaction
                               └─▶ Anvil: Validates signature
                                   └─▶ Smart Contract: Executes createToken()
                                       ├─▶ Validates user is approved
                                       ├─▶ Creates Token struct
                                       ├─▶ Sets balance[creator] = totalSupply
                                       ├─▶ Emits TokenCreated event
                                       └─▶ Returns transaction receipt
                                           └─▶ ethers.js: tx.wait() confirms
                                               └─▶ Frontend: Updates UI
                                                   └─▶ User: Sees success message

Read Data Flow:
1. User navigates to /tokens page
   └─▶ Frontend: TokensPage component loads
       └─▶ Web3Service.getUserTokens(address)
           └─▶ ethers.js: contract.getUserTokens(address)
               └─▶ Anvil: Reads blockchain state (no transaction)
                   └─▶ Smart Contract: Returns array of token IDs
                       └─▶ Frontend: For each tokenId:
                           └─▶ Web3Service.getToken(tokenId)
                               └─▶ ethers.js: contract.getToken(tokenId)
                                   └─▶ Smart Contract: Returns Token struct
                                       └─▶ Web3Service.getTokenBalance(tokenId, address)
                                           └─▶ Smart Contract: Returns balance
                                               └─▶ Frontend: Displays token list
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    WRITE OPERATIONS (State Changes)             │
└─────────────────────────────────────────────────────────────────┘

Frontend Form
    │
    ├─▶ Validation (client-side)
    │
    ▼
Web3Service.functionName(params)
    │
    ├─▶ ethers.js encodes function call
    │
    ▼
MetaMask Popup
    │
    ├─▶ User reviews transaction
    ├─▶ User signs with private key (local)
    │
    ▼
Signed Transaction → Anvil RPC
    │
    ├─▶ Validates signature
    ├─▶ Checks nonce
    ├─▶ Verifies gas
    │
    ▼
Smart Contract Function Execution
    │
    ├─▶ Validates permissions (require statements)
    ├─▶ Updates state variables
    ├─▶ Emits events
    │
    ▼
Transaction Receipt
    │
    ├─▶ Block number
    ├─▶ Transaction hash
    ├─▶ Gas used
    ├─▶ Events emitted
    │
    ▼
Frontend Update
    │
    ├─▶ Show success message
    ├─▶ Refresh data
    └─▶ Navigate to next page

┌─────────────────────────────────────────────────────────────────┐
│                    READ OPERATIONS (View Functions)             │
└─────────────────────────────────────────────────────────────────┘

Frontend Component
    │
    ▼
Web3Service.viewFunction(params)
    │
    ├─▶ ethers.js encodes function call
    │
    ▼
Anvil RPC (no transaction)
    │
    ├─▶ Reads blockchain state
    ├─▶ No signature required
    ├─▶ No gas cost
    ├─▶ Instant response
    │
    ▼
Smart Contract View Function
    │
    ├─▶ Reads state variables
    ├─▶ Returns data
    │
    ▼
Frontend Component
    │
    ├─▶ Processes data
    ├─▶ Updates UI
    └─▶ Displays to user
```

## Components and Interfaces

### 1. Smart Contract Module (SupplyChain.sol)

**Purpose:** Enforce business rules, manage state, and provide the "API" for the DApp.

**Interface:**
```solidity
contract SupplyChain {
    // State Variables
    address public admin;
    uint256 public nextTokenId;
    uint256 public nextTransferId;
    uint256 public nextUserId;
    
    // User Management
    function requestUserRole(string memory role) public;
    function changeStatusUser(address userAddress, UserStatus newStatus) public;
    function getUserInfo(address userAddress) public view returns (User memory);
    function isAdmin(address userAddress) public view returns (bool);
    
    // Token Management
    function createToken(string memory name, uint totalSupply, string memory features, uint parentId) public;
    function getToken(uint tokenId) public view returns (Token memory);
    function getTokenBalance(uint tokenId, address userAddress) public view returns (uint);
    function getUserTokens(address userAddress) public view returns (uint[] memory);
    
    // Transfer Management
    function transfer(address to, uint tokenId, uint amount) public;
    function acceptTransfer(uint transferId) public;
    function rejectTransfer(uint transferId) public;
    function getTransfer(uint transferId) public view returns (Transfer memory);
    function getUserTransfers(address userAddress) public view returns (uint[] memory);
}
```

**Key Responsibilities:**
- Validate user permissions before operations
- Enforce role-based transfer rules
- Maintain token ownership and balances
- Implement two-phase transfer approval
- Emit events for all state changes

### 2. Web3 Service Module (lib/web3.ts)

**Purpose:** Provide abstraction layer for blockchain interactions using ethers.js.

**Key Methods:**
- `connectWallet()` - Connect to MetaMask
- `createToken()` - Create new token
- `transfer()` - Initiate transfer
- `acceptTransfer()` - Accept pending transfer
- `getUserTokens()` - Get user's tokens
- Event listeners for blockchain events

### 3. Web3 Context Module (contexts/Web3Context.tsx)

**Purpose:** Provide global state management for Web3 connection and user data.

**State:**
- `isConnected` - Wallet connection status
- `address` - Connected wallet address
- `user` - User info from smart contract
- `contract` - ethers.js contract instance

**Actions:**
- `connect()` - Connect wallet
- `disconnect()` - Disconnect wallet
- `refreshUserInfo()` - Reload user data

### 4. Page Components

**Key Pages:**
- `/` - Landing/Registration
- `/dashboard` - Role-based dashboard
- `/tokens` - Token list
- `/tokens/create` - Create token
- `/tokens/[id]` - Token details
- `/transfers` - Transfer management
- `/admin/users` - User management (admin only)

## Data Models

### Smart Contract Data Structures

```solidity
enum UserStatus { Pending, Approved, Rejected, Canceled }
enum TransferStatus { Pending, Accepted, Rejected }

struct Token {
    uint256 id;
    address creator;
    string name;
    uint256 totalSupply;
    string features; // JSON string
    uint256 parentId;
    uint256 dateCreated;
    mapping(address => uint256) balance;
}

struct Transfer {
    uint256 id;
    address from;
    address to;
    uint256 tokenId;
    uint256 dateCreated;
    uint256 amount;
    TransferStatus status;
}

struct User {
    uint256 id;
    address userAddress;
    string role; // "Producer", "Factory", "Retailer", "Consumer"
    UserStatus status;
}
```

### Frontend TypeScript Interfaces

```typescript
interface User {
    id: number;
    userAddress: string;
    role: 'Producer' | 'Factory' | 'Retailer' | 'Consumer';
    status: 'Pending' | 'Approved' | 'Rejected' | 'Canceled';
}

interface Token {
    id: number;
    creator: string;
    name: string;
    totalSupply: number;
    features: string; // JSON string
    parentId: number;
    dateCreated: number;
}

interface TokenWithBalance extends Token {
    balance: number;
}

interface Transfer {
    id: number;
    from: string;
    to: string;
    tokenId: number;
    dateCreated: number;
    amount: number;
    status: 'Pending' | 'Accepted' | 'Rejected';
}

interface TransactionReceipt {
    blockNumber: number;
    transactionHash: string;
    gasUsed: bigint;
    events: Event[];
}
```

## Correctness Properties

### Property 1: Role-Based Transfer Enforcement

*For any* transfer initiated, the system must validate that the sender's role can transfer to the recipient's role according to the supply chain flow (Producer→Factory→Retailer→Consumer), and reject any transfer that violates this rule.

**Validates: Requirements 5, 18**

### Property 2: Two-Phase Transfer Atomicity

*For any* transfer, tokens must remain with the sender until the recipient explicitly accepts the transfer, and the transfer must be atomic (either fully complete or fully reverted).

**Validates: Requirements 5, 6, 7**

### Property 3: User Approval Prerequisite

*For any* operation that modifies state (create token, transfer), the system must verify that the user's status is Approved, and reject operations from Pending, Rejected, or Canceled users.

**Validates: Requirements 1, 2, 3, 4, 5**

### Property 4: Admin Exclusivity

*For any* call to `changeStatusUser`, the system must verify that `msg.sender` equals the admin address, and reject calls from any other address.

**Validates: Requirement 2**

### Property 5: Balance Consistency

*For any* token, the sum of all user balances must equal the token's totalSupply at all times, and no balance can be negative.

**Validates: Requirements 3, 4, 6, 8**

### Property 6: Parent Token Validity

*For any* token created with parentId > 0, the parent token must exist in the system, and the parentId must reference a valid token ID.

**Validates: Requirements 4, 18**

### Property 7: Transfer Status Progression

*For any* transfer, the status can only progress from Pending to Accepted or Pending to Rejected, and once Accepted or Rejected, the status cannot change.

**Validates: Requirements 6, 7**

### Property 8: Event Emission Completeness

*For any* state-changing operation, the system must emit the corresponding event (TokenCreated, TransferRequested, TransferAccepted, TransferRejected, UserRoleRequested, UserStatusChanged) before the transaction completes.

**Validates: All requirements**

### Property 9: Consumer Transfer Restriction

*For any* user with role "Consumer", the system must reject any attempt to initiate a transfer, as Consumers are the end of the supply chain.

**Validates: Requirement 5**

### Property 10: Session Persistence

*For any* page reload, if a valid address exists in localStorage and MetaMask is connected to that address, the system must automatically reconnect and restore the user's session.

**Validates: Requirement 10**

## Error Handling

### Error Categories

1. **MetaMask Connection Errors**
   - MetaMask not installed
   - User rejects connection
   - Wrong network selected
   - **Handling:** Display user-friendly message with instructions

2. **Transaction Errors**
   - User rejects transaction in MetaMask
   - Insufficient gas
   - Transaction reverted (smart contract validation failed)
   - **Handling:** Parse error message, display specific reason

3. **Smart Contract Validation Errors**
   - User not approved
   - Invalid role for transfer
   - Insufficient balance
   - Invalid token/transfer ID
   - **Handling:** Display validation error from `require()` statement

4. **Network Errors**
   - RPC connection failed
   - Timeout waiting for transaction
   - Network congestion
   - **Handling:** Retry with exponential backoff, show loading state

5. **Data Parsing Errors**
   - Invalid JSON in token features
   - BigInt conversion errors
   - Unexpected data format
   - **Handling:** Log error, display fallback UI

### Error Handling Strategy

```typescript
class ErrorHandler {
    static handleMetaMaskError(error: any): string {
        if (error.code === 4001) {
            return "Transaction rejected by user";
        }
        if (error.code === -32002) {
            return "MetaMask connection request pending. Please check MetaMask.";
        }
        if (error.code === 4902) {
            return "Please add Anvil network to MetaMask";
        }
        return "MetaMask error: " + error.message;
    }
    
    static handleContractError(error: any): string {
        // Parse revert reason from error
        const reason = error.reason || error.message;
        
        if (reason.includes("User not approved")) {
            return "Your account is not approved. Please wait for admin approval.";
        }
        if (reason.includes("Invalid role")) {
            return "You cannot transfer to this role. Check supply chain flow.";
        }
        if (reason.includes("Insufficient balance")) {
            return "You don't have enough tokens for this transfer.";
        }
        
        return "Transaction failed: " + reason;
    }
    
    static handleNetworkError(error: any): string {
        if (error.code === 'NETWORK_ERROR') {
            return "Network connection failed. Please check Anvil is running.";
        }
        if (error.code === 'TIMEOUT') {
            return "Transaction timeout. Please try again.";
        }
        return "Network error: " + error.message;
    }
}
```

### Logging Strategy

```typescript
// Frontend logging
console.log('[Web3] Connected to address:', address);
console.log('[Web3] Transaction sent:', tx.hash);
console.log('[Web3] Transaction confirmed in block:', receipt.blockNumber);
console.error('[Web3] Error:', error);

// Smart contract events serve as audit log
// All state changes emit events that are permanently recorded on blockchain
```

## Testing Strategy

### Smart Contract Testing (Foundry)

**Test Structure:**
```solidity
contract SupplyChainTest is Test {
    SupplyChain public supplyChain;
    address admin;
    address producer;
    address factory;
    address retailer;
    address consumer;
    
    function setUp() public {
        admin = address(this);
        producer = address(0x1);
        factory = address(0x2);
        retailer = address(0x3);
        consumer = address(0x4);
        
        supplyChain = new SupplyChain();
    }
    
    // User Management Tests
    function testUserRegistration() public { }
    function testAdminApproval() public { }
    function testOnlyApprovedUsersCanOperate() public { }
    
    // Token Creation Tests
    function testCreateTokenByProducer() public { }
    function testCreateTokenWithParent() public { }
    function testUnapprovedUserCannotCreateToken() public { }
    
    // Transfer Tests
    function testTransferFlow() public { }
    function testAcceptTransfer() public { }
    function testRejectTransfer() public { }
    function testInvalidRoleTransfer() public { }
    
    // Complete Flow Test
    function testCompleteSupplyChainFlow() public { }
}
```

**Test Coverage Target:** 100% of smart contract functions

**Key Test Categories:**
- User registration and approval
- Token creation (all roles)
- Transfer initiation and validation
- Transfer acceptance and rejection
- Permission checks
- Edge cases (zero amounts, invalid IDs, etc.)
- Event emission
- Complete end-to-end flows

### Frontend Testing (Optional)

**Unit Tests:**
- Web3Service methods
- Custom hooks
- Utility functions

**Integration Tests:**
- Component rendering with mock data
- Form submissions
- Navigation flows

**E2E Tests:**
- Complete user flows with local Anvil
- MetaMask interaction (using test accounts)

## Implementation Notes

### Smart Contract Development

**Solidity Version:** ^0.8.0 (automatic overflow protection)

**Key Patterns:**
- Checks-Effects-Interactions (validate, update state, emit events)
- Pull over Push (users retrieve their data)
- Access Control (modifiers for admin-only functions)

**Gas Optimization:**
- Use `uint256` instead of smaller uints (cheaper on EVM)
- Pack struct variables efficiently
- Use events instead of storing logs
- Minimize storage writes

### Frontend Development

**Next.js 15 App Router:**
- Server Components by default
- Client Components with `'use client'`
- Dynamic routes with `[id]` folders
- Params as Promise (use `use()` hook)

**ethers.js v6:**
- `BrowserProvider` instead of `Web3Provider`
- `Contract` instance with signer for writes
- `Contract` instance with provider for reads
- Handle BigInt conversions

**State Management:**
- Context API for global Web3 state
- useState for local component state
- useEffect for data fetching
- Custom hooks for reusable logic

### Deployment Process

**1. Start Anvil:**
```bash
anvil
# Provides 10 accounts with 10,000 ETH each
# Runs on localhost:8545
# Chain ID: 31337
```

**2. Deploy Smart Contract:**
```bash
cd sc
forge script script/Deploy.s.sol \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

**3. Copy Contract Address and ABI:**
```bash
# Contract address from deployment output
# ABI from sc/out/SupplyChain.sol/SupplyChain.json
```

**4. Update Frontend Config:**
```typescript
// web/src/contracts/config.ts
export const CONTRACT_CONFIG = {
  address: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // From deployment
  abi: SupplyChainABI, // From Foundry output
  adminAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // Account #0
};
```

**5. Start Frontend:**
```bash
cd web
npm run dev
# Opens on localhost:3000
```

### File Organization

```
supply-chain-tracker/
├── sc/                          # Smart contracts
│   ├── src/
│   │   └── SupplyChain.sol     # Main contract
│   ├── test/
│   │   └── SupplyChain.t.sol   # Tests
│   ├── script/
│   │   └── Deploy.s.sol        # Deployment script
│   ├── out/                     # Compiled contracts (generated)
│   └── foundry.toml            # Foundry config
│
├── web/                         # Frontend
│   ├── src/
│   │   ├── app/                # Pages (App Router)
│   │   │   ├── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── tokens/
│   │   │   ├── transfers/
│   │   │   ├── admin/
│   │   │   └── profile/
│   │   ├── components/         # React components
│   │   │   ├── ui/            # Shadcn components
│   │   │   ├── Header.tsx
│   │   │   ├── TokenCard.tsx
│   │   │   └── TransferList.tsx
│   │   ├── contexts/          # React contexts
│   │   │   └── Web3Context.tsx
│   │   ├── hooks/             # Custom hooks
│   │   │   ├── useWallet.ts
│   │   │   ├── useTokens.ts
│   │   │   └── useTransfers.ts
│   │   ├── lib/               # Utilities
│   │   │   └── web3.ts        # Web3Service
│   │   └── contracts/         # Contract config
│   │       ├── config.ts
│   │       └── SupplyChain.json # ABI
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── requirements.md
├── design.md
└── README.md
```

## Dependencies

### Smart Contract Dependencies
```toml
# foundry.toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.20"

[dependencies]
forge-std = "^1.7.0"
```

### Frontend Dependencies
```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "ethers": "^6.9.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.10.0"
  }
}
```

### System Requirements
- Node.js 18+
- Foundry (forge, anvil, cast)
- MetaMask browser extension
- Modern browser with JavaScript enabled

## Future Enhancements

1. **Token Metadata Enhancements**
   - Image upload for tokens
   - Rich text descriptions
   - Attachments (certificates, documents)

2. **Advanced Traceability**
   - Visual supply chain graph
   - Timeline view of token history
   - Export traceability reports (PDF)

3. **Notifications**
   - Browser notifications for pending transfers
   - Email notifications (requires backend)
   - In-app notification center

4. **Analytics Dashboard**
   - Token creation trends
   - Transfer volume metrics
   - User activity statistics

5. **Multi-Language Support**
   - i18n for Spanish/English
   - Localized date/time formats

6. **Mobile Optimization**
   - Progressive Web App (PWA)
   - Mobile-specific UI components
   - Touch-optimized interactions

7. **Testnet Deployment**
   - Deploy to Sepolia or Goerli
   - Faucet integration for test ETH
   - Public demo instance

8. **Advanced Features**
   - Batch transfers (multiple tokens at once)
   - Transfer with notes/comments
   - Token splitting (divide supply)
   - QR code generation for tokens




