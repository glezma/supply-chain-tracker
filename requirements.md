# Requirements Document

## Introduction

This document specifies the requirements for the Supply Chain Tracker system. The system is an educational blockchain-based decentralized application (DApp) that enables transparent and immutable tracking of products through a supply chain, from raw material producers to end consumers. The system implements role-based access control, tokenization of physical products, and a two-phase transfer approval mechanism to ensure secure and traceable product movement across the supply chain.

## Glossary

- **DApp (Decentralized Application)**: A web application that interacts with smart contracts on a blockchain, consisting of a frontend and blockchain backend
- **Smart Contract**: Self-executing code deployed on the Ethereum blockchain that enforces business rules and manages state
- **Token**: A digital representation of a physical product or raw material in the supply chain, with metadata and ownership tracking
- **Tokenization**: The process of creating a digital token to represent a physical asset on the blockchain
- **MetaMask**: A browser extension wallet that manages Ethereum accounts and signs transactions
- **Anvil**: A local Ethereum development network provided by Foundry for testing and development
- **Foundry**: An Ethereum development toolkit including forge (compiler/tester), anvil (local network), and cast (CLI tool)
- **ethers.js**: A JavaScript library for interacting with Ethereum smart contracts from web applications
- **Gas**: The computational fee required to execute transactions on the Ethereum network
- **ABI (Application Binary Interface)**: The interface definition that describes how to interact with a smart contract's functions
- **Traceability**: The ability to track a product's complete history from origin to current owner through the blockchain
- **Role-Based Access Control (RBAC)**: A permission system where users are assigned roles that determine what actions they can perform
- **Two-Phase Transfer**: A transfer mechanism requiring both sender initiation and recipient acceptance before tokens change ownership
- **Parent Token**: The source token from which a derived product token is created, enabling supply chain lineage tracking
- **Raw Material**: A token with parentId = 0, representing the initial input to the supply chain (created by Producers)
- **Derived Product**: A token with parentId > 0, representing a product created from raw materials or other products
- **User Status**: The approval state of a user (Pending, Approved, Rejected, Canceled) managed by the admin
- **Transfer Status**: The state of a token transfer (Pending, Accepted, Rejected) managed by the recipient
- **Admin**: The unique system administrator role assigned to the smart contract deployer
- **Producer**: A role that creates raw material tokens and transfers them to Factories
- **Factory**: A role that receives raw materials, creates derived products, and transfers them to Retailers
- **Retailer**: A role that receives products from Factories and transfers them to Consumers
- **Consumer**: A role that receives final products and can view complete traceability but cannot transfer
- **localStorage**: Browser storage mechanism used to persist user session data across page reloads
- **RPC Provider**: A service that provides access to the Ethereum network (Anvil in development)
- **Signature**: Cryptographic proof that a transaction was authorized by the account owner's private key
- **Chain ID**: A unique identifier for an Ethereum network (31337 for Anvil local network)

## Requirements

### Requirement 1: User Registration and Role Request

**User Story:** As a new user, I want to connect my MetaMask wallet and request a role in the system, so that I can participate in the supply chain once approved by the administrator.

#### Acceptance Criteria

1. WHEN a user visits the application without a connected wallet, THE system SHALL display a "Connect MetaMask" button
2. WHEN the user clicks "Connect MetaMask", THE system SHALL trigger the MetaMask connection popup
3. WHEN the user approves the connection in MetaMask, THE system SHALL retrieve and store the connected wallet address
4. WHEN the wallet is connected and the user is not registered, THE system SHALL display a role selection form with options: Producer, Factory, Retailer, Consumer
5. WHEN the user selects a role and submits the form, THE system SHALL call the smart contract's `requestUserRole(role)` function
6. WHEN the transaction is confirmed, THE system SHALL emit a `UserRoleRequested` event with the user's address and selected role
7. WHEN the registration is complete, THE system SHALL set the user's status to Pending and display a "Waiting for approval" message
8. WHEN the user's status is Pending, THE system SHALL prevent access to all operational features until approved

### Requirement 2: Admin User Approval

**User Story:** As an administrator, I want to review and approve or reject user role requests, so that I can control who has access to the supply chain system.

#### Acceptance Criteria

1. WHEN the admin connects their wallet, THE system SHALL verify that the address matches the contract deployer address
2. WHEN the admin is verified, THE system SHALL display an "Admin Panel" navigation option
3. WHEN the admin navigates to the user management page, THE system SHALL display all registered users with their addresses, roles, and statuses
4. WHEN the admin views pending users, THE system SHALL provide "Approve" and "Reject" buttons for each pending user
5. WHEN the admin clicks "Approve", THE system SHALL call `changeStatusUser(address, UserStatus.Approved)`
6. WHEN the admin clicks "Reject", THE system SHALL call `changeStatusUser(address, UserStatus.Rejected)`
7. WHEN the status change transaction is confirmed, THE system SHALL emit a `UserStatusChanged` event
8. WHEN a user's status changes to Approved, THE system SHALL grant access to role-specific features
9. WHEN a user's status changes to Rejected, THE system SHALL display a rejection message and prevent system access
10. WHEN a non-admin user attempts to access admin functions, THE system SHALL revert the transaction with an error

### Requirement 3: Token Creation by Producer

**User Story:** As a Producer, I want to create tokens representing raw materials, so that I can register the initial products entering the supply chain.

#### Acceptance Criteria

1. WHEN a Producer navigates to the token creation page, THE system SHALL display a form with fields: name, totalSupply, features (JSON)
2. WHEN the Producer is creating a raw material token, THE system SHALL automatically set parentId to 0
3. WHEN the Producer submits the form, THE system SHALL validate that all required fields are filled
4. WHEN validation passes, THE system SHALL call `createToken(name, totalSupply, features, 0)`
5. WHEN the transaction is confirmed, THE system SHALL emit a `TokenCreated` event with tokenId, creator address, name, and totalSupply
6. WHEN the token is created, THE system SHALL assign the full totalSupply balance to the Producer's address
7. WHEN the token is created, THE system SHALL increment the nextTokenId counter
8. WHEN the Producer views their tokens, THE system SHALL display the newly created token with its metadata
9. WHEN an unapproved user attempts to create a token, THE system SHALL revert the transaction
10. WHEN a non-Producer role attempts to create a token with parentId = 0, THE system SHALL allow it (all roles can create tokens)

### Requirement 4: Token Creation by Factory/Retailer

**User Story:** As a Factory or Retailer, I want to create tokens representing derived products with a parent token reference, so that I can track product transformation and maintain supply chain lineage.

#### Acceptance Criteria

1. WHEN a Factory or Retailer navigates to the token creation page, THE system SHALL display a form including a parent token selector
2. WHEN the user views the parent token selector, THE system SHALL display only tokens they currently own
3. WHEN the user selects a parent token, THE system SHALL display the parent token's details for reference
4. WHEN the user submits the form with a valid parentId, THE system SHALL call `createToken(name, totalSupply, features, parentId)`
5. WHEN the transaction is confirmed, THE system SHALL create the token with the specified parentId
6. WHEN the token is created, THE system SHALL store the parent-child relationship permanently
7. WHEN a user views a derived product token, THE system SHALL display the parent token information
8. WHEN a user attempts to create a token with a non-existent parentId, THE system SHALL revert the transaction
9. WHEN a user attempts to create a token with a parentId they don't own, THE system SHALL allow it (ownership of parent not required)
10. WHEN the token is created, THE system SHALL enable traceability queries through the parent chain

### Requirement 5: Token Transfer Initiation

**User Story:** As a token owner, I want to initiate a transfer to another user in the next supply chain stage, so that I can move products forward in the supply chain.

#### Acceptance Criteria

1. WHEN a token owner views their token details, THE system SHALL display a "Transfer" button
2. WHEN the user clicks "Transfer", THE system SHALL display a transfer form with recipient address and amount fields
3. WHEN a Producer initiates a transfer, THE system SHALL validate that the recipient has the Factory role
4. WHEN a Factory initiates a transfer, THE system SHALL validate that the recipient has the Retailer role
5. WHEN a Retailer initiates a transfer, THE system SHALL validate that the recipient has the Consumer role
6. WHEN a Consumer attempts to initiate a transfer, THE system SHALL prevent the action (Consumers cannot transfer)
7. WHEN the user submits the transfer form, THE system SHALL validate that they own sufficient token balance
8. WHEN validation passes, THE system SHALL call `transfer(to, tokenId, amount)`
9. WHEN the transaction is confirmed, THE system SHALL create a Transfer record with status = Pending
10. WHEN the transfer is created, THE system SHALL emit a `TransferRequested` event
11. WHEN the transfer is created, THE system SHALL NOT move tokens yet (tokens remain with sender)
12. WHEN the transfer is created, THE system SHALL increment the nextTransferId counter
13. WHEN a user attempts to transfer to an invalid role, THE system SHALL revert the transaction
14. WHEN a user attempts to transfer more than their balance, THE system SHALL revert the transaction
15. WHEN a user attempts to transfer to their own address, THE system SHALL revert the transaction

### Requirement 6: Token Transfer Acceptance

**User Story:** As a transfer recipient, I want to review and accept incoming token transfers, so that I can confirm receipt of products before they are added to my inventory.

#### Acceptance Criteria

1. WHEN a user has pending incoming transfers, THE system SHALL display them in the transfers page
2. WHEN the user views a pending transfer, THE system SHALL display transfer details: sender, token, amount, date
3. WHEN the user clicks "Accept", THE system SHALL call `acceptTransfer(transferId)`
4. WHEN the acceptance transaction is confirmed, THE system SHALL update the transfer status to Accepted
5. WHEN the transfer is accepted, THE system SHALL move tokens: sender balance -= amount, recipient balance += amount
6. WHEN the transfer is accepted, THE system SHALL emit a `TransferAccepted` event
7. WHEN a non-recipient attempts to accept a transfer, THE system SHALL revert the transaction
8. WHEN a user attempts to accept an already processed transfer, THE system SHALL revert the transaction
9. WHEN a user attempts to accept a non-existent transfer, THE system SHALL revert the transaction
10. WHEN the transfer is accepted, THE system SHALL update the UI to reflect the new token balances

### Requirement 7: Token Transfer Rejection

**User Story:** As a transfer recipient, I want to reject incoming token transfers that I don't want to accept, so that I can decline products that don't meet my requirements.

#### Acceptance Criteria

1. WHEN a user views a pending incoming transfer, THE system SHALL display a "Reject" button
2. WHEN the user clicks "Reject", THE system SHALL call `rejectTransfer(transferId)`
3. WHEN the rejection transaction is confirmed, THE system SHALL update the transfer status to Rejected
4. WHEN the transfer is rejected, THE system SHALL NOT move any tokens (tokens remain with sender)
5. WHEN the transfer is rejected, THE system SHALL emit a `TransferRejected` event
6. WHEN a non-recipient attempts to reject a transfer, THE system SHALL revert the transaction
7. WHEN a user attempts to reject an already processed transfer, THE system SHALL revert the transaction
8. WHEN the transfer is rejected, THE system SHALL update the UI to show the rejection status

### Requirement 8: Token Balance and Ownership Tracking

**User Story:** As a user, I want to view my token balances and ownership details, so that I can track my inventory in the supply chain.

#### Acceptance Criteria

1. WHEN a user navigates to the tokens page, THE system SHALL call `getUserTokens(address)` to retrieve their token IDs
2. WHEN the token IDs are retrieved, THE system SHALL call `getToken(tokenId)` for each token to get details
3. WHEN the token details are retrieved, THE system SHALL call `getTokenBalance(tokenId, address)` to get the user's balance
4. WHEN all data is loaded, THE system SHALL display a list of tokens with name, balance, and creation date
5. WHEN a user clicks on a token, THE system SHALL navigate to the token details page
6. WHEN the token details page loads, THE system SHALL display complete token information including metadata
7. WHEN a token has a parentId > 0, THE system SHALL display the parent token information
8. WHEN a user views their balance, THE system SHALL show only their individual balance, not the total supply
9. WHEN a token has multiple owners, THE system SHALL track each owner's balance independently
10. WHEN a user has zero balance of a token, THE system SHALL NOT display that token in their list

### Requirement 9: Transfer History and Traceability

**User Story:** As a user, I want to view the complete transfer history of a token, so that I can trace the product's journey through the supply chain.

#### Acceptance Criteria

1. WHEN a user views a token's details page, THE system SHALL display a "Transfer History" section
2. WHEN the transfer history loads, THE system SHALL call `getUserTransfers(address)` for all addresses that owned the token
3. WHEN transfer IDs are retrieved, THE system SHALL call `getTransfer(transferId)` for each relevant transfer
4. WHEN transfer details are loaded, THE system SHALL display them in chronological order
5. WHEN displaying a transfer, THE system SHALL show: sender, recipient, amount, date, status
6. WHEN a transfer is Pending, THE system SHALL display it with a yellow indicator
7. WHEN a transfer is Accepted, THE system SHALL display it with a green indicator
8. WHEN a transfer is Rejected, THE system SHALL display it with a red indicator
9. WHEN a token has a parent token, THE system SHALL provide a link to view the parent's history
10. WHEN viewing traceability, THE system SHALL enable users to trace back to the original raw material (parentId = 0)

### Requirement 10: MetaMask Integration and Session Management

**User Story:** As a user, I want my wallet connection to persist across page reloads and be notified of account changes, so that I have a seamless experience using the application.

#### Acceptance Criteria

1. WHEN a user connects their wallet, THE system SHALL store the connected address in localStorage
2. WHEN the page reloads, THE system SHALL check localStorage for a previously connected address
3. WHEN a stored address is found, THE system SHALL automatically reconnect to MetaMask
4. WHEN the user clicks "Disconnect", THE system SHALL clear the address from localStorage
5. WHEN the user changes accounts in MetaMask, THE system SHALL detect the `accountsChanged` event
6. WHEN an account change is detected, THE system SHALL update the connected address and reload user data
7. WHEN the user switches networks in MetaMask, THE system SHALL detect the `chainChanged` event
8. WHEN a network change is detected, THE system SHALL validate the Chain ID is 31337 (Anvil)
9. WHEN the Chain ID is incorrect, THE system SHALL display an error message prompting the user to switch networks
10. WHEN MetaMask is not installed, THE system SHALL display a message with a link to install MetaMask

### Requirement 11: Dashboard and Role-Based UI

**User Story:** As a user, I want to see a personalized dashboard based on my role, so that I can quickly access the features relevant to my position in the supply chain.

#### Acceptance Criteria

1. WHEN an approved user logs in, THE system SHALL navigate to the dashboard page
2. WHEN the dashboard loads, THE system SHALL call `getUserInfo(address)` to retrieve the user's role
3. WHEN the user is a Producer, THE system SHALL display: "Create Raw Material Token" button, owned tokens count, pending outgoing transfers
4. WHEN the user is a Factory, THE system SHALL display: "Create Product Token" button, owned tokens count, pending incoming/outgoing transfers
5. WHEN the user is a Retailer, THE system SHALL display: "Create Product Token" button, owned tokens count, pending incoming/outgoing transfers
6. WHEN the user is a Consumer, THE system SHALL display: owned tokens count, pending incoming transfers, traceability viewer
7. WHEN the user is an Admin, THE system SHALL display: total users count, pending approvals count, system statistics
8. WHEN the dashboard displays statistics, THE system SHALL retrieve data from the smart contract in real-time
9. WHEN the user clicks a quick action button, THE system SHALL navigate to the appropriate page
10. WHEN the user's role changes, THE system SHALL update the dashboard to reflect the new role's features

### Requirement 12: Admin User Management Interface

**User Story:** As an administrator, I want a dedicated interface to manage user approvals and view system activity, so that I can efficiently oversee the supply chain system.

#### Acceptance Criteria

1. WHEN the admin navigates to /admin/users, THE system SHALL display all registered users
2. WHEN the user list loads, THE system SHALL retrieve all user records from the smart contract
3. WHEN displaying users, THE system SHALL show: address, role, status, registration date
4. WHEN the admin filters by "Pending", THE system SHALL display only users with status = Pending
5. WHEN the admin filters by "Approved", THE system SHALL display only users with status = Approved
6. WHEN the admin filters by "Rejected", THE system SHALL display only users with status = Rejected
7. WHEN the admin clicks on a user, THE system SHALL display detailed user information
8. WHEN viewing a pending user, THE system SHALL display "Approve" and "Reject" buttons prominently
9. WHEN the admin approves/rejects a user, THE system SHALL show a confirmation dialog before submitting the transaction
10. WHEN the status change is confirmed, THE system SHALL update the UI to reflect the new status
11. WHEN a non-admin user attempts to access /admin/users, THE system SHALL redirect to the dashboard with an error message

### Requirement 13: Responsive UI and Error Handling

**User Story:** As a user, I want the application to work on different devices and provide clear error messages, so that I can use the system effectively regardless of my device or when issues occur.

#### Acceptance Criteria

1. WHEN a user accesses the application on mobile (320px+), THE system SHALL display a responsive layout optimized for small screens
2. WHEN a user accesses the application on tablet (768px+), THE system SHALL display a responsive layout optimized for medium screens
3. WHEN a user accesses the application on desktop (1024px+), THE system SHALL display a responsive layout optimized for large screens
4. WHEN a transaction fails, THE system SHALL display the error message from the smart contract
5. WHEN a user rejects a transaction in MetaMask, THE system SHALL display "Transaction rejected by user"
6. WHEN a network error occurs, THE system SHALL display "Network error. Please check your connection."
7. WHEN a transaction is pending, THE system SHALL display a loading indicator with the message "Transaction pending..."
8. WHEN a transaction is confirmed, THE system SHALL display a success message with the transaction hash
9. WHEN form validation fails, THE system SHALL display field-specific error messages
10. WHEN an unexpected error occurs, THE system SHALL display a generic error message and log the error to the console

### Requirement 14: Smart Contract Testing

**User Story:** As a developer, I want comprehensive tests for all smart contract functions, so that I can ensure the system works correctly and securely before deployment.

#### Acceptance Criteria

1. WHEN running `forge test`, THE system SHALL execute all test functions and report results
2. WHEN testing user registration, THE system SHALL verify that `requestUserRole` creates a user with status = Pending
3. WHEN testing admin approval, THE system SHALL verify that only the admin can call `changeStatusUser`
4. WHEN testing token creation, THE system SHALL verify that only approved users can create tokens
5. WHEN testing token creation by Producer, THE system SHALL verify that parentId = 0 is set correctly
6. WHEN testing token creation by Factory/Retailer, THE system SHALL verify that parentId > 0 is required
7. WHEN testing transfers, THE system SHALL verify that role-based transfer rules are enforced
8. WHEN testing transfer acceptance, THE system SHALL verify that only the recipient can accept
9. WHEN testing transfer rejection, THE system SHALL verify that only the recipient can reject
10. WHEN testing balance updates, THE system SHALL verify that balances are updated correctly on transfer acceptance
11. WHEN testing events, THE system SHALL verify that all events are emitted with correct parameters
12. WHEN testing edge cases, THE system SHALL verify that invalid inputs are rejected with appropriate errors
13. WHEN testing complete flows, THE system SHALL verify that the entire supply chain flow works end-to-end
14. WHEN running `forge coverage`, THE system SHALL report at least 90% code coverage
15. WHEN all tests pass, THE system SHALL exit with code 0

### Requirement 15: Smart Contract Deployment

**User Story:** As a developer, I want to deploy the smart contract to a local Anvil network, so that I can test the complete DApp in a development environment.

#### Acceptance Criteria

1. WHEN running `anvil`, THE system SHALL start a local Ethereum network on port 8545
2. WHEN Anvil starts, THE system SHALL provide 10 test accounts with 10,000 ETH each
3. WHEN running the deployment script, THE system SHALL compile the smart contract using `forge build`
4. WHEN the contract is compiled, THE system SHALL generate the ABI in the `out/` directory
5. WHEN the deployment script executes, THE system SHALL deploy the contract to the Anvil network
6. WHEN the contract is deployed, THE system SHALL set the deployer address as the admin
7. WHEN the deployment is complete, THE system SHALL output the contract address
8. WHEN the deployment is complete, THE system SHALL initialize all state variables (nextTokenId = 1, nextTransferId = 1, nextUserId = 1)
9. WHEN the contract address is obtained, THE system SHALL update the frontend configuration file with the new address
10. WHEN the ABI is generated, THE system SHALL copy it to the frontend contracts directory

### Requirement 16: Frontend Configuration and Build

**User Story:** As a developer, I want to configure the frontend with the deployed contract details, so that the application can interact with the smart contract.

#### Acceptance Criteria

1. WHEN the contract is deployed, THE system SHALL create a `contracts/config.ts` file in the frontend
2. WHEN the config file is created, THE system SHALL include the contract address
3. WHEN the config file is created, THE system SHALL include the contract ABI
4. WHEN the config file is created, THE system SHALL include the admin address (Account #0 from Anvil)
5. WHEN the config file is created, THE system SHALL include the network configuration (Chain ID: 31337, RPC URL: http://localhost:8545)
6. WHEN running `npm run build`, THE system SHALL compile the Next.js application without errors
7. WHEN running `npm run dev`, THE system SHALL start the development server on port 3000
8. WHEN the application loads, THE system SHALL connect to the Anvil network using the configured RPC URL
9. WHEN the application loads, THE system SHALL instantiate the contract using the configured address and ABI
10. WHEN the configuration is incorrect, THE system SHALL display an error message indicating the configuration issue

### Requirement 17: Token Metadata and Features

**User Story:** As a user, I want to store and view detailed product information in JSON format, so that I can track important characteristics of products in the supply chain.

#### Acceptance Criteria

1. WHEN creating a token, THE system SHALL accept a features parameter as a JSON string
2. WHEN the features JSON is provided, THE system SHALL store it in the token struct without validation
3. WHEN viewing a token, THE system SHALL parse the features JSON and display it in a readable format
4. WHEN the features JSON is invalid, THE system SHALL display the raw string
5. WHEN the features JSON is empty, THE system SHALL display "No features specified"
6. WHEN creating a token, THE system SHALL provide example JSON format: `{"origin": "Colombia", "type": "Arabica", "organic": true}`
7. WHEN displaying features, THE system SHALL format them as key-value pairs
8. WHEN features include nested objects, THE system SHALL display them hierarchically
9. WHEN features include arrays, THE system SHALL display them as lists
10. WHEN features are displayed, THE system SHALL preserve the original data types (string, number, boolean)

### Requirement 18: Complete Supply Chain Flow

**User Story:** As a system user, I want to execute a complete supply chain flow from raw material to consumer, so that I can verify the entire system works end-to-end.

#### Acceptance Criteria

1. WHEN a Producer creates a raw material token, THE system SHALL allow the token to be created with parentId = 0
2. WHEN the Producer transfers the token to a Factory, THE system SHALL create a pending transfer
3. WHEN the Factory accepts the transfer, THE system SHALL move the tokens to the Factory's balance
4. WHEN the Factory creates a derived product token, THE system SHALL require a valid parentId referencing the raw material
5. WHEN the Factory transfers the product to a Retailer, THE system SHALL create a pending transfer
6. WHEN the Retailer accepts the transfer, THE system SHALL move the tokens to the Retailer's balance
7. WHEN the Retailer creates a final product token, THE system SHALL require a valid parentId referencing the Factory product
8. WHEN the Retailer transfers the product to a Consumer, THE system SHALL create a pending transfer
9. WHEN the Consumer accepts the transfer, THE system SHALL move the tokens to the Consumer's balance
10. WHEN the Consumer views the token, THE system SHALL display the complete traceability chain: Consumer ← Retailer ← Factory ← Producer
11. WHEN any step in the flow fails validation, THE system SHALL revert the transaction and display an appropriate error message
12. WHEN the complete flow is executed, THE system SHALL emit all relevant events in the correct order

## Technical Constraints

1. The system SHALL use Solidity version 0.8.0 or higher for smart contract development
2. The system SHALL use Foundry (forge, anvil, cast) for smart contract compilation, testing, and deployment
3. The system SHALL use Next.js 15+ with App Router for the frontend framework
4. The system SHALL use TypeScript for type safety in the frontend
5. The system SHALL use ethers.js v6 for blockchain interaction
6. The system SHALL use Tailwind CSS for styling
7. The system SHALL use Shadcn/ui for UI components
8. The system SHALL run on Anvil local network (Chain ID: 31337) for development
9. The system SHALL require Node.js 18+ for frontend development
10. The system SHALL require MetaMask browser extension for user authentication
11. The smart contract SHALL be immutable after deployment (no upgrade mechanism)
12. The system SHALL NOT implement token burning or minting after initial creation
13. The system SHALL NOT implement multi-signature wallet support
14. The system SHALL NOT comply with ERC-20 or ERC-721 token standards
15. The system SHALL NOT include a backend server or traditional database

## Success Criteria

### Minimum Viable Product (MVP)
- Smart contract deployed with all required functions implemented
- All smart contract tests passing (100% of test suite)
- Frontend successfully connects to MetaMask
- User registration and admin approval functional
- Token creation functional for all roles
- Transfer system functional (request, accept, reject)
- At least 3 main pages operational (landing, dashboard, tokens)

### Complete Product
- All 11 pages implemented and functional
- Responsive design working on mobile, tablet, and desktop
- Complete supply chain flow executable end-to-end
- Traceability visible and accurate
- Error handling comprehensive and user-friendly
- Code documented with inline comments
- README with complete setup instructions

### Excellent Product (Bonus)
- Frontend tests implemented with good coverage
- Advanced error handling with retry mechanisms
- Performance optimizations (lazy loading, caching)
- Deployment to Ethereum testnet (Sepolia or Goerli)
- Video demonstration (maximum 5 minutes)

## Out of Scope

The following features are explicitly excluded from this project:
- Token burning or minting after initial creation
- Smart contract upgradability or proxy patterns
- Multi-signature wallet support
- ERC-20 or ERC-721 token standard compliance
- Mainnet deployment with real cryptocurrency
- Mobile native applications (iOS/Android)
- Backend server or traditional database
- User authentication beyond MetaMask wallet connection
- Email or push notifications
- File upload functionality for token metadata
- Advanced analytics or reporting dashboards
- Token marketplace or trading features
- Governance or voting mechanisms
- Integration with external APIs or oracles
- Automated testing in CI/CD pipeline (optional bonus)
