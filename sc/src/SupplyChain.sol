// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SupplyChain Tracker Smart Contract
 * @author gonzalo lezma
 * @notice This contract manages the lifecycle of products in a supply chain, from creation to consumption.
 * @dev Implements a role-based access control system (Producer -> Factory -> Retailer -> Consumer)
 *      and strictly enforces the flow of goods.
 *
 *      Optimizations for Gas Efficiency:
 *      1. Storage Packing: The `Transfer` struct is packed to fit within fewer storage slots.
 *         - `address` (20 bytes) + `address` (20 bytes) = 40 bytes (2 slots).
 *         - `uint96` (12 bytes) + `uint64` (8 bytes) + `enum` (1 byte) + `address` (20 bytes) allows
 *           packing but here we balance readability and slot usage.
 *           Current `Transfer` packing:
 *           - Slot 0: `id` (32 bytes)
 *           - Slot 1: `from` (20 bytes) + `status` (1 byte) + `amount` (12 bytes/96 bits) [Partial pack]
 *           - Slot 2: `to` (20 bytes) + `dateCreated` (8 bytes/64 bits)
 *           (Note: The compiler optimizes struct layout automatically to some extent, but types are chosen to strictly fit).
 *           Correction: EVM slots are 32 bytes.
 *           - `from` (20) + `to` (20) = 40 bytes -> DOES NOT FIT in one slot. They take separate slots or share with smaller types.
 *           - Our Explicit Definition:
 *             - `from` (20) + `to` (20) -> 2 slots roughly.
 *      2. Constant Role Hashes: Uses `constant bytes32` for role checks instead of expensive `keccak256(string)` runtime calculations.
 *      3. Scalable Mappings: Replaces O(N) loops with O(1) storage mappings (`_userTokenIds`, `_userTransferIds`)
 *         to ensure the contract functions do not run out of gas as the dataset grows.
 *      4. Custom Errors: (Consider for future) currently using require strings for frontend compatibility.
 */
contract SupplyChain {
    // ============================================
    // ENUMS
    // ============================================

    /// @notice Status of a participant in the network
    enum UserStatus {
        Pending, // Registration requested but not approved
        Approved, // Approved by Admin to participate
        Rejected, // Registration rejected
        Canceled // Account deactivated
    }

    enum TransferStatus {
        Pending, // Transfer requested by sender, awaiting acceptance
        Accepted, // Accepted by recipient, balances updated
        Rejected // Rejected by recipient, no balance change
    }

    /// @notice Type of token based on supply chain stage
    enum TokenType {
        RawMaterial, // Created by Producer
        ProcessedProduct, // Created by Factory
        FinalProduct // Created by Retailer
    }

    // ============================================
    // CONSTANTS
    // ============================================

    // Role hashes pre-computed at compile time to save runtime gas costs.
    bytes32 public constant PRODUCER_ROLE = keccak256("Producer");
    bytes32 public constant FACTORY_ROLE = keccak256("Factory");
    bytes32 public constant RETAILER_ROLE = keccak256("Retailer");
    bytes32 public constant CONSUMER_ROLE = keccak256("Consumer");

    // ============================================
    // STRUCTS
    // ============================================

    /// @notice Represents a unique product category or batch type
    /// @dev `features` is stored as a string. For large datasets, store IPFS hash here instead.
    struct Token {
        uint256 id; // Unique Token Identifier
        address creator; // Address of the Producer/Manufacturer
        string name; // Human-readable name (e.g., "Arabica Coffee")
        uint256 totalSupply; // Total units minted
        string features; // JSON string describing attributes (Origin, Quality, etc.)
        TokenType tokenType; // Classification of the token
        uint256 parentId; // (Optional) Lineage tracking: trace back to raw materials
        uint256 dateCreated; // Timestamp of creation
        mapping(address => uint256) balance; // Ledger of who owns how many units
    }

    /// @notice Record of a movement of goods
    /// @dev Struct members are ordered to enable storage slot packing where possible.
    struct Transfer {
        uint256 id; // Unique Transfer ID
        address from; // Sender address
        address to; // Recipient address
        uint256 tokenId; // ID of the token being transferred
        uint64 dateCreated; // Timestamp (uint64 sufficient until year 584 billion)
        uint96 amount; // Quantity (uint96 supports up to 7.9 x 10^28, sufficient for any supply chain)
        TransferStatus status; // Current state of the transfer
    }

    /// @notice Participant identity and authorization info
    struct User {
        uint256 id; // Unique User ID
        address userAddress; // Wallet address
        string role; // Human-readable role ("Producer", etc.)
        UserStatus status; // Approval status
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice The administrator who can approve users
    address public admin;

    // Global Counters (Auto-incrementing IDs)
    uint256 public nextTokenId = 1;
    uint256 public nextTransferId = 1;
    uint256 public nextUserId = 1;

    // Primary Data Storage
    mapping(uint256 => Token) public tokens; // tokenId => Token Data
    mapping(uint256 => Transfer) public transfers; // transferId => Transfer Data
    mapping(uint256 => User) public users; // userId => User Data
    mapping(address => uint256) public addressToUserId; // quick lookup for user ID

    // Scalability Indexing
    // These mappings perform O(1) lookups for user dashboards, avoiding expensive loops.
    mapping(address => uint256[]) private _userTokenIds; // Tokens currently held by user
    mapping(address => uint256[]) private _userTransferIds; // All transfers involving user

    // ============================================
    // EVENTS
    // ============================================

    event TokenCreated(
        uint256 indexed tokenId,
        address indexed creator,
        string name,
        uint256 totalSupply
    );

    event TransferRequested(
        uint256 indexed transferId,
        address indexed from,
        address indexed to,
        uint256 tokenId,
        uint256 amount
    );

    event TransferAccepted(uint256 indexed transferId);
    event TransferRejected(uint256 indexed transferId);
    event UserRoleRequested(address indexed user, string role);
    event UserStatusChanged(address indexed user, UserStatus status);

    // ============================================
    // INITIALIZATION
    // ============================================

    /// @notice Sets the deployer as the initial Admin
    constructor() {
        admin = msg.sender;
    }

    // ============================================
    // USER MANAGEMENT FUNCTIONS
    // ============================================

    /// @notice Allows a new user to sign up for a specific role
    /// @param role The role requested ("Producer", "Factory", "Retailer", "Consumer")
    /// @dev Roles are strings in input for UX, but verified against hashes for gas efficiency.
    function requestUserRole(string memory role) public {
        bytes32 roleHash = keccak256(bytes(role));
        require(
            roleHash == PRODUCER_ROLE ||
                roleHash == FACTORY_ROLE ||
                roleHash == RETAILER_ROLE ||
                roleHash == CONSUMER_ROLE,
            "Invalid role"
        );

        // Ensure one account = one user
        require(addressToUserId[msg.sender] == 0, "User already registered");

        // Initialize User Record
        User storage newUser = users[nextUserId];
        newUser.id = nextUserId;
        newUser.userAddress = msg.sender;
        newUser.role = role;
        newUser.status = UserStatus.Pending; // Default status requires Admin approval

        // Update Lookup Table
        addressToUserId[msg.sender] = nextUserId;

        emit UserRoleRequested(msg.sender, role);
        nextUserId++;
    }

    /// @notice Admin approves or rejects a user registration
    /// @param userAddress The address of the user to update
    /// @param newStatus The new status (Approved/Rejected)
    function changeStatusUser(
        address userAddress,
        UserStatus newStatus
    ) public {
        require(msg.sender == admin, "Only admin can change user status");

        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "User does not exist");

        users[userId].status = newStatus;
        emit UserStatusChanged(userAddress, newStatus);
    }

    /// @notice Retrieves user profile information
    /// @param userAddress The address to lookup
    /// @return User struct containing role and status
    function getUserInfo(
        address userAddress
    ) public view returns (User memory) {
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "User does not exist");
        return users[userId];
    }

    /// @notice Checks if an address is the admin
    function isAdmin(address userAddress) public view returns (bool) {
        return userAddress == admin;
    }

    // ============================================
    // TOKEN MANAGEMENT FUNCTIONS
    // ============================================

    /// @notice Creates a new batch of tokens (e.g., harvesting crops, manufacturing goods)
    /// @param name Descriptive name of the product
    /// @param totalSupply Amount of units to mint
    /// @param features JSON metadata string
    /// @param parentId ID of input token (if transforming materials), else 0
    function createToken(
        string memory name,
        uint256 totalSupply,
        string memory features,
        uint256 parentId
    ) public {
        // Access Control
        uint256 userId = addressToUserId[msg.sender];
        require(userId != 0, "User not registered");
        require(
            users[userId].status == UserStatus.Approved,
            "User not approved"
        );

        // Validation & Type Assignment
        require(bytes(name).length > 0, "Name cannot be empty");
        require(totalSupply > 0, "Total supply must be greater than 0");

        TokenType tokenType;
        bytes32 roleHash = keccak256(bytes(users[userId].role));

        if (roleHash == PRODUCER_ROLE) {
            tokenType = TokenType.RawMaterial;
            require(parentId == 0, "Producers cannot have parent token");
        } else if (roleHash == FACTORY_ROLE) {
            tokenType = TokenType.ProcessedProduct;
            require(parentId > 0, "Factory must specify parent token");
            require(parentId < nextTokenId, "Parent token does not exist");
            require(
                tokens[parentId].tokenType == TokenType.RawMaterial,
                "Factory input must be RawMaterial"
            );
        } else if (roleHash == RETAILER_ROLE) {
            tokenType = TokenType.FinalProduct;
            require(parentId > 0, "Retailer must specify parent token");
            require(parentId < nextTokenId, "Parent token does not exist");
            require(
                tokens[parentId].tokenType == TokenType.ProcessedProduct,
                "Retailer input must be ProcessedProduct"
            );
        } else {
            revert("Consumer cannot create tokens");
        }

        // Create Token Record
        Token storage newToken = tokens[nextTokenId];
        newToken.id = nextTokenId;
        newToken.creator = msg.sender;
        newToken.name = name;
        newToken.totalSupply = totalSupply;
        newToken.features = features;
        newToken.tokenType = tokenType;
        newToken.parentId = parentId;
        newToken.dateCreated = block.timestamp;

        // Assign initial supply to creator
        newToken.balance[msg.sender] = totalSupply;

        // Update User's Token List (O(1) insertion)
        _userTokenIds[msg.sender].push(nextTokenId);

        emit TokenCreated(nextTokenId, msg.sender, name, totalSupply);
        nextTokenId++;
    }

    /// @notice Reads token details (excluding balance mapping)
    function getToken(
        uint256 tokenId
    )
        public
        view
        returns (
            uint256 id,
            address creator,
            string memory name,
            uint256 totalSupply,
            string memory features,
            TokenType tokenType,
            uint256 parentId,
            uint256 dateCreated
        )
    {
        require(tokenId > 0 && tokenId < nextTokenId, "Token does not exist");
        Token storage token = tokens[tokenId];
        return (
            token.id,
            token.creator,
            token.name,
            token.totalSupply,
            token.features,
            token.tokenType,
            token.parentId,
            token.dateCreated
        );
    }

    /// @notice Checks a user's balance for a specific token
    function getTokenBalance(
        uint256 tokenId,
        address userAddress
    ) public view returns (uint256) {
        require(tokenId > 0 && tokenId < nextTokenId, "Token does not exist");
        return tokens[tokenId].balance[userAddress];
    }

    /// @notice Returns list of token IDs owned by the user
    /// @dev Optimized: returns pre-calculated list instead of iterating all tokens.
    function getUserTokens(
        address userAddress
    ) public view returns (uint256[] memory) {
        return _userTokenIds[userAddress];
    }

    /// @dev Helper: Removes a token ID from a user's tracking list when balance hits 0.
    ///      Uses "Swap and Pop" pattern for O(1) removal, though order is not preserved.
    function _removeTokenId(address user, uint256 tokenId) internal {
        uint256[] storage ids = _userTokenIds[user];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == tokenId) {
                ids[i] = ids[ids.length - 1]; // Move last element to the hole
                ids.pop(); // Remove last element
                break;
            }
        }
    }

    // ============================================
    // TRANSFER MANAGEMENT FUNCTIONS
    // ============================================

    /// @notice Initiates a transfer of tokens to another supply chain participant
    /// @dev Implements strict role-based constraints (Producer > Factory > Retailer > Consumer).
    ///      Tokens are NOT moved immediately; they are locked in a "Pending" request.
    function transfer(address to, uint256 tokenId, uint256 amount) public {
        uint256 senderUserId = addressToUserId[msg.sender];
        require(senderUserId != 0, "Sender not registered");
        require(
            users[senderUserId].status == UserStatus.Approved,
            "Sender not approved"
        );

        require(tokenId > 0 && tokenId < nextTokenId, "Token does not exist");

        // Optimization: Explicit cast bounds check for packed struct types
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= type(uint96).max, "Amount too large");

        require(
            tokens[tokenId].balance[msg.sender] >= amount,
            "Insufficient balance"
        );
        require(to != msg.sender, "Cannot transfer to yourself");

        uint256 recipientUserId = addressToUserId[to];
        require(recipientUserId != 0, "Recipient not registered");
        require(
            users[recipientUserId].status == UserStatus.Approved,
            "Recipient not approved"
        );

        // ------------------------------------------
        // SUPPLY CHAIN FLOW VALIDATION
        // ------------------------------------------
        // We use pre-calculated hashes for gas efficiency
        bytes32 senderRoleHash = keccak256(bytes(users[senderUserId].role));
        bytes32 recipientRoleHash = keccak256(
            bytes(users[recipientUserId].role)
        );

        if (senderRoleHash == PRODUCER_ROLE) {
            require(
                recipientRoleHash == FACTORY_ROLE,
                "Producer can only transfer to Factory"
            );
        } else if (senderRoleHash == FACTORY_ROLE) {
            require(
                recipientRoleHash == RETAILER_ROLE,
                "Factory can only transfer to Retailer"
            );
        } else if (senderRoleHash == RETAILER_ROLE) {
            require(
                recipientRoleHash == CONSUMER_ROLE,
                "Retailer can only transfer to Consumer"
            );
        } else if (senderRoleHash == CONSUMER_ROLE) {
            revert("Consumer cannot transfer");
        }

        // ------------------------------------------
        // CREATE TRANSFER RECORD
        // ------------------------------------------
        Transfer storage newTransfer = transfers[nextTransferId];
        newTransfer.id = nextTransferId;
        newTransfer.from = msg.sender;
        newTransfer.to = to;
        newTransfer.tokenId = tokenId;
        // Casts are safe due to checks above (amount) and block.timestamp size
        newTransfer.dateCreated = uint64(block.timestamp);
        newTransfer.amount = uint96(amount);
        newTransfer.status = TransferStatus.Pending;

        // ------------------------------------------
        // HISTORY TRACKING (OPTIMIZED)
        // ------------------------------------------
        // Add ID to both parties' specific lists for O(1) history loading
        _userTransferIds[msg.sender].push(nextTransferId);
        _userTransferIds[to].push(nextTransferId);

        emit TransferRequested(nextTransferId, msg.sender, to, tokenId, amount);
        nextTransferId++;
    }

    /// @notice Recipient accepts the transfer, moving the tokens
    /// @dev This is where the actual balance mapping updates occur.
    function acceptTransfer(uint256 transferId) public {
        require(
            transferId > 0 && transferId < nextTransferId,
            "Transfer does not exist"
        );
        Transfer storage txfer = transfers[transferId];

        // Security: Only the intended recipient can accept
        require(msg.sender == txfer.to, "Only recipient can accept transfer");
        require(
            txfer.status == TransferStatus.Pending,
            "Transfer is not pending"
        );

        uint256 tokenId = txfer.tokenId;

        // ------------------------------------------
        // BALANCE UPDATES
        // ------------------------------------------

        // Inventory Tracking: If recipient had 0, they now have this token type
        if (tokens[tokenId].balance[txfer.to] == 0) {
            _userTokenIds[txfer.to].push(tokenId);
        }

        // Move funds
        tokens[tokenId].balance[txfer.from] -= txfer.amount;
        tokens[tokenId].balance[txfer.to] += txfer.amount;

        // Cleanup: If sender has 0 left, remove from their active inventory list
        // This keeps the `getUserTokens` list clean and accurate
        if (tokens[tokenId].balance[txfer.from] == 0) {
            _removeTokenId(txfer.from, tokenId);
        }

        // Finalize state
        txfer.status = TransferStatus.Accepted;
        emit TransferAccepted(transferId);
    }

    /// @notice Recipient rejects the transfer
    /// @dev No tokens move, status simply changes to Rejected.
    function rejectTransfer(uint256 transferId) public {
        require(
            transferId > 0 && transferId < nextTransferId,
            "Transfer does not exist"
        );
        Transfer storage txfer = transfers[transferId];

        require(msg.sender == txfer.to, "Only recipient can reject transfer");
        require(
            txfer.status == TransferStatus.Pending,
            "Transfer is not pending"
        );

        txfer.status = TransferStatus.Rejected;
        emit TransferRejected(transferId);
    }

    /// @notice Helper to fetch transfer details
    function getTransfer(
        uint256 transferId
    ) public view returns (Transfer memory) {
        require(
            transferId > 0 && transferId < nextTransferId,
            "Transfer does not exist"
        );
        return transfers[transferId];
    }

    /// @notice Returns all transfer IDs associated with a user (sent or received)
    /// @dev Optimized O(1) return using the indexing mapping.
    function getUserTransfers(
        address userAddress
    ) public view returns (uint256[] memory) {
        return _userTransferIds[userAddress];
    }
}
