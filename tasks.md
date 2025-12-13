# Implementation Plan

## Phase 1: Smart Contract Development

- [x] 1. Set up Foundry project structure
  - Initialize Foundry project in `sc/` directory
  - Create `foundry.toml` configuration file
  - Install forge-std dependency
  - Create directory structure: `src/`, `test/`, `script/`
  - Verify compilation with `forge build`
  - _Requirements: 15_

- [x] 2. Implement core data structures in SupplyChain.sol
  - [x] 2.1 Define enums
    - Create `UserStatus` enum (Pending, Approved, Rejected, Canceled)
    - Create `TransferStatus` enum (Pending, Accepted, Rejected)
    - _Requirements: 1, 5_
  
  - [x] 2.2 Define structs
    - Create `Token` struct with all fields including balance mapping
    - Create `Transfer` struct with all fields
    - Create `User` struct with all fields
    - _Requirements: 3, 4, 5, 8_
  
  - [x] 2.3 Define state variables
    - Declare `address public admin`
    - Declare counters: `nextTokenId`, `nextTransferId`, `nextUserId` (initialize to 1)
    - Declare mappings: `tokens`, `transfers`, `users`, `addressToUserId`
    - _Requirements: 1, 2, 3, 5_
  
  - [x] 2.4 Define events
    - Create `TokenCreated` event
    - Create `TransferRequested` event
    - Create `TransferAccepted` event
    - Create `TransferRejected` event
    - Create `UserRoleRequested` event
    - Create `UserStatusChanged` event
    - _Requirements: 1, 2, 3, 5, 6, 7_

- [x] 3. Implement user management functions
  - [x] 3.1 Implement constructor
    - Set `admin = msg.sender`
    - Initialize counters to 1
    - _Requirements: 2_
  
  - [x] 3.2 Implement requestUserRole()
    - Validate role is valid (Producer, Factory, Retailer, Consumer)
    - Check user is not already registered
    - Create User struct with status = Pending
    - Store in users mapping and addressToUserId
    - Increment nextUserId
    - Emit UserRoleRequested event
    - _Requirements: 1_
  
  - [x] 3.3 Implement changeStatusUser()
    - Validate msg.sender is admin
    - Validate user exists
    - Update user status
    - Emit UserStatusChanged event
    - _Requirements: 2_
  
  - [x] 3.4 Implement getUserInfo()
    - Return User struct for given address
    - Handle non-existent users
    - _Requirements: 1, 2_
  
  - [x] 3.5 Implement isAdmin()
    - Return true if address equals admin
    - _Requirements: 2_

- [x] 4. Implement token management functions
  - [x] 4.1 Implement createToken()
    - Validate user is approved
    - Validate name is not empty
    - Validate totalSupply > 0
    - If parentId > 0, validate parent token exists
    - Create Token struct
    - Set balance[msg.sender] = totalSupply
    - Store in tokens mapping
    - Increment nextTokenId
    - Emit TokenCreated event
    - _Requirements: 3, 4_
  
  - [x] 4.2 Implement getToken()
    - Validate token exists
    - Return Token struct (note: cannot return mapping, handle separately)
    - _Requirements: 8_
  
  - [x] 4.3 Implement getTokenBalance()
    - Validate token exists
    - Return balance for given address
    - _Requirements: 8_
  
  - [x] 4.4 Implement getUserTokens()
    - Iterate through all tokens
    - Check if user has balance > 0
    - Return array of token IDs
    - _Requirements: 8_

- [x] 5. Implement transfer management functions
  - [x] 5.1 Implement transfer()
    - Validate user is approved
    - Validate token exists
    - Validate amount > 0
    - Validate sender has sufficient balance
    - Validate to address is not sender
    - Validate role-based transfer rules:
      - Producer can only transfer to Factory
      - Factory can only transfer to Retailer
      - Retailer can only transfer to Consumer
      - Consumer cannot transfer
    - Create Transfer struct with status = Pending
    - Store in transfers mapping
    - Increment nextTransferId
    - Emit TransferRequested event
    - Note: Do NOT move tokens yet
    - _Requirements: 5_
  
  - [x] 5.2 Implement acceptTransfer()
    - Validate transfer exists
    - Validate msg.sender is recipient
    - Validate transfer status is Pending
    - Update sender balance: -= amount
    - Update recipient balance: += amount
    - Update transfer status to Accepted
    - Emit TransferAccepted event
    - _Requirements: 6_
  
  - [x] 5.3 Implement rejectTransfer()
    - Validate transfer exists
    - Validate msg.sender is recipient
    - Validate transfer status is Pending
    - Update transfer status to Rejected
    - Emit TransferRejected event
    - Note: Tokens remain with sender
    - _Requirements: 7_
  
  - [x] 5.4 Implement getTransfer()
    - Validate transfer exists
    - Return Transfer struct
    - _Requirements: 9_
  
  - [x] 5.5 Implement getUserTransfers()
    - Iterate through all transfers
    - Check if user is sender or recipient
    - Return array of transfer IDs
    - _Requirements: 9_

- [x] 6. Write comprehensive smart contract tests
  - [x] 6.1 Set up test file structure
  - [x] 6.2 Write user management tests (8 tests passing)
  - [x] 6.3 Write token creation tests (3 tests passing)
  - [x] 6.4 Write transfer tests (4 tests passing)
  - [x] 6.5 Write edge case tests (covered in above)
  - [x] 6.6 Write event tests (implicit in tests)
  - [x] 6.7 Write integration tests (2 tests passing)
  - [x] 6.8 Run tests and achieve coverage (17/17 tests passing ✅)

**Test Results: 17 tests passed, 0 failed**

- [x] 7. Create deployment script
  - Create Deploy.s.sol in script/ directory
  - Import Script from forge-std
  - Implement run() function that deploys SupplyChain
  - Log deployed contract address
  - Test deployment on Anvil
  - _Requirements: 15_

## Phase 2: Frontend Setup

- [x] 8. Initialize Next.js project
  - Run `npx create-next-app@latest web --typescript`
  - Configure with App Router, TypeScript, Tailwind CSS, ESLint
  - Install dependencies: ethers, @radix-ui components
  - Verify project builds with `npm run build`
  - _Requirements: 16_

- [x] 9. Set up project structure
  - Create directory structure:
    - `src/app/` (pages)
    - `src/components/` (React components)
    - `src/components/ui/` (Shadcn components)
    - `src/contexts/` (React contexts)
    - `src/hooks/` (custom hooks)
    - `src/lib/` (utilities)
    - `src/contracts/` (contract config and ABI)
  - Configure Tailwind CSS
  - Install Shadcn/ui components (button, card, input, label, select, table)
  - _Requirements: 16_

- [x] 10. Configure contract integration
  - [x] 10.1 Copy contract ABI
    - Copy ABI from `sc/out/SupplyChain.sol/SupplyChain.json`
    - Save to `web/src/contracts/SupplyChain.json`
    - _Requirements: 16_
  
  - [x] 10.2 Create contract configuration
    - Create `web/src/contracts/config.ts`
    - Export CONTRACT_CONFIG with address, ABI, adminAddress
    - Export NETWORK_CONFIG with Chain ID 31337, RPC URL
    - _Requirements: 16_

## Phase 3: Web3 Integration Layer

- [x] 11. Implement Web3Context
  - [x] 11.1 Create context structure
    - Create `web/src/contexts/Web3Context.tsx`
    - Define Web3ContextType interface
    - Create Web3Context with createContext
    - _Requirements: 10_
  
  - [x] 11.2 Implement Web3Provider component
    - Initialize state: isConnected, address, provider, signer, contract
    - Implement connectWallet() function
    - Implement disconnectWallet() function
    - Handle loading and error states
    - _Requirements: 10_
  
  - [x] 11.3 Implement MetaMask event listeners
    - Listen for accountsChanged event
    - Listen for chainChanged event
    - Update state when events fire
    - _Requirements: 10_
  
  - [x] 11.4 Create useWeb3 hook
    - Export useWeb3() hook to access context
    - Throw error if used outside provider
    - _Requirements: 10_

- [x] 12. Implement useContract hook
  - [x] 12.1 Create hook structure
    - Create `web/src/hooks/useContract.ts`
    - Use Web3Context for contract access
    - Manage loading and error states
    - _Requirements: 10_
  
  - [x] 12.2 Implement user management methods
    - requestUserRole(role) - Call smart contract function
    - changeStatusUser(address, status) - Admin only
    - getUserInfo(address) - Get user details
    - _Requirements: 1, 2_
  
  - [x] 12.3 Implement token management methods
    - createToken(name, quantity) - Create token
    - getToken(tokenId) - Get token details
    - getUserTokens(address) - Get user's token IDs
    - _Requirements: 3, 4, 8_
  
  - [x] 12.4 Implement transfer management methods
    - transfer(tokenId, to, quantity) - Initiate transfer
    - acceptTransfer(transferId) - Accept transfer
    - rejectTransfer(transferId) - Reject transfer
    - getTransfer(transferId) - Get transfer details
    - getUserTransfers(address) - Get user's transfer IDs
    - _Requirements: 5, 6, 7, 9_

- [x] 13. Create TypeScript types
  - [x] 13.1 Create types file
    - Create `web/src/lib/types.ts`
    - Define UserRole enum
    - Define UserStatus enum
    - Define TransferStatus enum
    - Define User interface
    - Define Token interface
    - Define Transfer interface
    - _Requirements: 1, 3, 5_
  
  - [x] 13.2 Create ethereum type declaration
    - Create `web/src/types/ethereum.d.ts`
    - Declare Window.ethereum interface
    - _Requirements: 10_
  
  - [x] 13.3 Create useTransfers hook
    - Create `web/src/hooks/useTransfers.ts`
    - Implement fetchTransfers() - Get user's transfers
    - Implement acceptTransfer() - Accept pending transfer
    - Implement rejectTransfer() - Reject pending transfer
    - Manage loading and error states
    - _Requirements: 5, 6, 7, 9_
  
  - [x] 13.4 Create useAdmin hook
    - Create `web/src/hooks/useAdmin.ts`
    - Implement fetchUsers() - Get all users
    - Implement approveUser() - Approve pending user
    - Implement rejectUser() - Reject pending user
    - Check isAdmin before operations
    - _Requirements: 2, 12_

## Phase 4: UI Components

- [x] 14. Create base UI components
  - [x] 14.1 Install Shadcn/ui components
    - Install button, card, input, label, select, table components
    - Configure components in `components/ui/`
    - _Requirements: 13_
  
  - [x] 14.2 Create Header component
    - Create `web/src/components/Header.tsx`
    - Display logo and app name
    - Show navigation links (role-based)
    - Display connected address
    - Add disconnect button
    - _Requirements: 11_
  
  - [x] 14.3 Create TokenCard component
    - Create `web/src/components/TokenCard.tsx`
    - Display token name, balance, creation date
    - Link to token details page
    - _Requirements: 8, 11_
  
  - [x] 14.4 Create TransferList component
    - Create `web/src/components/TransferList.tsx`
    - Display list of transfers with status indicators
    - Show sender, recipient, token, amount, date
    - Add Accept/Reject buttons for pending transfers
    - _Requirements: 9, 11_
  
  - [x] 14.5 Create UserTable component
    - Create `web/src/components/UserTable.tsx`
    - Display users in table format
    - Show address, role, status
    - Add Approve/Reject buttons for pending users
    - _Requirements: 12_

## Phase 5: Page Implementation

- [x] 15. Implement landing page
  - Create `web/src/app/page.tsx`
  - Show different UI based on connection status:
    - Not connected: "Connect MetaMask" button
    - Connected, not registered: Registration form with role selection
    - Connected, pending: "Waiting for approval" message
    - Connected, approved: Welcome message with dashboard link
  - Handle form submission for registration
  - _Requirements: 1, 11_

- [x] 16. Implement dashboard page
  - Create `web/src/app/dashboard/page.tsx`
  - Fetch user info and display role
  - Show role-specific statistics:
    - Producer: Create raw material button, owned tokens, outgoing transfers
    - Factory: Create product button, owned tokens, incoming/outgoing transfers
    - Retailer: Create product button, owned tokens, incoming/outgoing transfers
    - Consumer: Owned tokens, incoming transfers, traceability viewer
    - Admin: System stats, pending approvals count
  - Add quick action buttons
  - _Requirements: 11_

- [x] 17. Implement token pages
  - [x] 17.1 Create token list page
    - Create `web/src/app/tokens/page.tsx`
    - Fetch and display user's tokens
    - Show TokenCard for each token
    - Add "Create Token" button
    - _Requirements: 8, 11_
  
  - [x] 17.2 Create token creation page
    - Create `web/src/app/tokens/create/page.tsx`
    - Form with fields: name, totalSupply, features (JSON)
    - If Factory/Retailer: add parent token selector
    - Validate form inputs
    - Submit to createToken()
    - Show success/error messages
    - _Requirements: 3, 4, 11_
  
  - [x] 17.3 Create token details page
    - Create `web/src/app/tokens/[id]/page.tsx`
    - Use `use(params)` to get token ID
    - Fetch and display complete token information
    - Show parent token if parentId > 0
    - Display transfer history
    - Add "Transfer" button
    - _Requirements: 8, 9, 11, 17_
  
  - [x] 17.4 Create token transfer page
    - Create `web/src/app/tokens/[id]/transfer/page.tsx`
    - Form with recipient address and amount
    - Validate recipient role based on sender role
    - Validate amount <= balance
    - Submit to transfer()
    - Show success/error messages
    - _Requirements: 5, 11_

- [x] 18. Implement transfer management page
  - Create `web/src/app/transfers/page.tsx`
  - Display pending incoming transfers with Accept/Reject buttons
  - Display transfer history (sent and received)
  - Show status indicators (Pending, Accepted, Rejected)
  - Filter by status
  - _Requirements: 6, 7, 9, 11_

- [x] 19. Implement admin pages
  - [ ] 19.1 Create admin dashboard
    - Create `web/src/app/admin/page.tsx`
    - Check if user is admin, redirect if not
    - Display system statistics
    - Link to user management page
    - _Requirements: 12_
  
  - [x] 19.2 Create user management page
    - Create `web/src/app/admin/users/page.tsx`
    - Check if user is admin, redirect if not
    - Fetch and display all users
    - Filter by status (Pending, Approved, Rejected)
    - Show UserTable component
    - Handle approve/reject actions
    - _Requirements: 2, 12_

- [x] 20. Implement profile page
  - Create `web/src/app/profile/page.tsx`
  - Display user information (address, role, status)
  - Show token portfolio
  - Display transfer history
  - _Requirements: 11_

- [x] 21. Create root layout
  - Create `web/src/app/layout.tsx`
  - Wrap app with Web3Provider
  - Include Header component
  - Add global styles
  - Configure metadata
  - _Requirements: 11, 13_

## Phase 6: Testing and Refinement

- [ ] 22. Test complete user flows
  - [ ] 22.1 Test user registration flow
    - Connect MetaMask
    - Register as Producer
    - Admin approves user
    - Verify access to dashboard
    - _Requirements: 1, 2_
  
  - [ ] 22.2 Test token creation flow
    - Producer creates raw material token
    - Factory creates derived product token
    - Verify tokens appear in token list
    - Verify balances are correct
    - _Requirements: 3, 4, 8_
  
  - [ ] 22.3 Test transfer flow
    - Producer transfers to Factory
    - Factory accepts transfer
    - Verify balances updated
    - Verify transfer history
    - _Requirements: 5, 6, 9_
  
  - [ ] 22.4 Test complete supply chain flow
    - Producer creates raw material
    - Producer transfers to Factory
    - Factory accepts and creates product
    - Factory transfers to Retailer
    - Retailer accepts and creates final product
    - Retailer transfers to Consumer
    - Consumer accepts
    - Verify complete traceability
    - _Requirements: 18_
  
  - [ ] 22.5 Test error scenarios
    - Unapproved user tries to create token
    - Invalid role transfer attempt
    - Insufficient balance transfer
    - Consumer tries to transfer
    - Non-admin tries to approve user
    - _Requirements: 13_

- [ ] 23. Implement responsive design
  - Test on mobile (320px+)
  - Test on tablet (768px+)
  - Test on desktop (1024px+)
  - Adjust layouts with Tailwind breakpoints
  - Ensure all features work on all screen sizes
  - _Requirements: 13_

- [ ] 24. Add error handling and loading states
  - Add loading spinners for async operations
  - Display error messages for failed transactions
  - Handle MetaMask errors gracefully
  - Show transaction pending states
  - Display success messages after confirmations
  - _Requirements: 13_

- [ ] 25. Optimize performance
  - Implement lazy loading for token lists
  - Cache user info to reduce blockchain reads
  - Optimize re-renders with useMemo and useCallback
  - Test page load times
  - _Requirements: 13_

## Phase 7: Documentation and Deployment

- [ ] 26. Update documentation
  - Update README.md with setup instructions
  - Document environment variables
  - Add troubleshooting section
  - Include screenshots
  - _Requirements: All_

- [ ] 27. Create demo video
  - Record 5-minute demo video
  - Show complete supply chain flow
  - Demonstrate all user roles
  - Show admin approval process
  - Highlight traceability features
  - _Requirements: All_

- [ ] 28. Final testing and cleanup
  - Run all smart contract tests
  - Test frontend build (`npm run build`)
  - Fix any TypeScript errors
  - Remove console.log statements
  - Clean up commented code
  - Verify all requirements met
  - _Requirements: All_

## Optional Enhancements

- [ ] 29. Deploy to testnet (Bonus)
  - Deploy smart contract to Sepolia or Goerli
  - Update frontend configuration
  - Test with testnet ETH
  - Document testnet deployment
  - _Requirements: Bonus_

- [ ] 30. Implement frontend tests (Bonus)
  - Write unit tests for Web3Service
  - Write tests for custom hooks
  - Write component tests
  - Achieve good test coverage
  - _Requirements: Bonus_

- [ ] 31. Add advanced features (Bonus)
  - Implement batch transfers
  - Add transfer notes/comments
  - Generate QR codes for tokens
  - Export traceability reports
  - _Requirements: Bonus_

---

## Progress Tracking

**Phase 1 (Smart Contract):** 5/7 tasks complete (71%)
**Phase 2 (Frontend Setup):** 0/3 tasks complete (0%)
**Phase 3 (Web3 Integration):** 0/3 tasks complete (0%)
**Phase 4 (UI Components):** 0/1 tasks complete (0%)
**Phase 5 (Pages):** 0/7 tasks complete (0%)
**Phase 6 (Testing):** 0/4 tasks complete (0%)
**Phase 7 (Documentation):** 0/3 tasks complete (0%)

**Overall Progress:** 5/28 core tasks complete (18%)

---

## Notes

- Each task includes requirement references for traceability
- Tasks are ordered by dependency (must complete in sequence within phases)
- Phases can overlap (e.g., start frontend while finalizing smart contract tests)
- Mark tasks with `[x]` when complete, `[-]` when in progress
- Update progress tracking as tasks are completed
- Refer to requirements.md and design.md for detailed specifications
