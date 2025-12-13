// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SupplyChain {
    // ============================================
    // ENUMS
    // ============================================

    enum UserStatus {
        Pending,
        Approved,
        Rejected,
        Canceled
    }

    enum TransferStatus {
        Pending,
        Accepted,
        Rejected
    }

    // ============================================
    // CONSTANTS
    // ============================================

    bytes32 public constant PRODUCER_ROLE = keccak256("Producer");
    bytes32 public constant FACTORY_ROLE = keccak256("Factory");
    bytes32 public constant RETAILER_ROLE = keccak256("Retailer");
    bytes32 public constant CONSUMER_ROLE = keccak256("Consumer");

    // ============================================
    // STRUCTS
    // ============================================

    struct Token {
        uint256 id;
        address creator;
        string name;
        uint256 totalSupply;
        string features; // JSON string (consider IPFS hash for optimization)
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
        string role;
        UserStatus status;
    }

    // ============================================
    // STATE VARIABLES
    // ============================================

    address public admin;

    // Counters for IDs
    uint256 public nextTokenId = 1;
    uint256 public nextTransferId = 1;
    uint256 public nextUserId = 1;

    // Mappings
    mapping(uint256 => Token) public tokens;
    mapping(uint256 => Transfer) public transfers;
    mapping(uint256 => User) public users;
    mapping(address => uint256) public addressToUserId;

    // Optimization Mappings (Scalability)
    mapping(address => uint256[]) private _userTokenIds;
    mapping(address => uint256[]) private _userTransferIds;

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
    // CONSTRUCTOR
    // ============================================

    constructor() {
        admin = msg.sender;
    }

    // ============================================
    // USER MANAGEMENT FUNCTIONS
    // ============================================

    function requestUserRole(string memory role) public {
        bytes32 roleHash = keccak256(bytes(role));
        require(
            roleHash == PRODUCER_ROLE ||
                roleHash == FACTORY_ROLE ||
                roleHash == RETAILER_ROLE ||
                roleHash == CONSUMER_ROLE,
            "Invalid role"
        );

        // Check user is not already registered
        require(addressToUserId[msg.sender] == 0, "User already registered");

        // Create User struct
        User storage newUser = users[nextUserId];
        newUser.id = nextUserId;
        newUser.userAddress = msg.sender;
        newUser.role = role;
        newUser.status = UserStatus.Pending;

        // Store in addressToUserId mapping
        addressToUserId[msg.sender] = nextUserId;

        emit UserRoleRequested(msg.sender, role);
        nextUserId++;
    }

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

    function getUserInfo(
        address userAddress
    ) public view returns (User memory) {
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "User does not exist");
        return users[userId];
    }

    function isAdmin(address userAddress) public view returns (bool) {
        return userAddress == admin;
    }

    // ============================================
    // TOKEN MANAGEMENT FUNCTIONS
    // ============================================

    function createToken(
        string memory name,
        uint256 totalSupply,
        string memory features,
        uint256 parentId
    ) public {
        uint256 userId = addressToUserId[msg.sender];
        require(userId != 0, "User not registered");
        require(
            users[userId].status == UserStatus.Approved,
            "User not approved"
        );
        require(bytes(name).length > 0, "Name cannot be empty");
        require(totalSupply > 0, "Total supply must be greater than 0");

        if (parentId > 0) {
            require(parentId < nextTokenId, "Parent token does not exist");
        }

        Token storage newToken = tokens[nextTokenId];
        newToken.id = nextTokenId;
        newToken.creator = msg.sender;
        newToken.name = name;
        newToken.totalSupply = totalSupply;
        newToken.features = features;
        newToken.parentId = parentId;
        newToken.dateCreated = block.timestamp;

        // Set balance
        newToken.balance[msg.sender] = totalSupply;

        // Track token ownership (Optimized)
        _userTokenIds[msg.sender].push(nextTokenId);

        emit TokenCreated(nextTokenId, msg.sender, name, totalSupply);
        nextTokenId++;
    }

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
            token.parentId,
            token.dateCreated
        );
    }

    function getTokenBalance(
        uint256 tokenId,
        address userAddress
    ) public view returns (uint256) {
        require(tokenId > 0 && tokenId < nextTokenId, "Token does not exist");
        return tokens[tokenId].balance[userAddress];
    }

    function getUserTokens(
        address userAddress
    ) public view returns (uint256[] memory) {
        return _userTokenIds[userAddress];
    }

    // Internal helper to remove token ID from user list when balance hits 0
    function _removeTokenId(address user, uint256 tokenId) internal {
        uint256[] storage ids = _userTokenIds[user];
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == tokenId) {
                ids[i] = ids[ids.length - 1];
                ids.pop();
                break;
            }
        }
    }

    // ============================================
    // TRANSFER MANAGEMENT FUNCTIONS
    // ============================================

    function transfer(address to, uint256 tokenId, uint256 amount) public {
        uint256 senderUserId = addressToUserId[msg.sender];
        require(senderUserId != 0, "Sender not registered");
        require(
            users[senderUserId].status == UserStatus.Approved,
            "Sender not approved"
        );

        require(tokenId > 0 && tokenId < nextTokenId, "Token does not exist");
        require(amount > 0, "Amount must be greater than 0");
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

        // Optimize Role Checks using Hashes
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

        Transfer storage newTransfer = transfers[nextTransferId];
        newTransfer.id = nextTransferId;
        newTransfer.from = msg.sender;
        newTransfer.to = to;
        newTransfer.tokenId = tokenId;
        newTransfer.dateCreated = block.timestamp;
        newTransfer.amount = amount;
        newTransfer.status = TransferStatus.Pending;

        // Track Transfers (Optimized)
        _userTransferIds[msg.sender].push(nextTransferId);
        _userTransferIds[to].push(nextTransferId);

        emit TransferRequested(nextTransferId, msg.sender, to, tokenId, amount);
        nextTransferId++;
    }

    function acceptTransfer(uint256 transferId) public {
        require(
            transferId > 0 && transferId < nextTransferId,
            "Transfer does not exist"
        );
        Transfer storage txfer = transfers[transferId];

        require(msg.sender == txfer.to, "Only recipient can accept transfer");
        require(
            txfer.status == TransferStatus.Pending,
            "Transfer is not pending"
        );

        uint256 tokenId = txfer.tokenId;

        // Check if recipient is receiving this token type for the first time
        if (tokens[tokenId].balance[txfer.to] == 0) {
            _userTokenIds[txfer.to].push(tokenId);
        }

        // Update balances
        tokens[tokenId].balance[txfer.from] -= txfer.amount;
        tokens[tokenId].balance[txfer.to] += txfer.amount;

        // Check if sender balance is now 0 (remove from their list)
        if (tokens[tokenId].balance[txfer.from] == 0) {
            _removeTokenId(txfer.from, tokenId);
        }

        txfer.status = TransferStatus.Accepted;
        emit TransferAccepted(transferId);
    }

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

    function getTransfer(
        uint256 transferId
    ) public view returns (Transfer memory) {
        require(
            transferId > 0 && transferId < nextTransferId,
            "Transfer does not exist"
        );
        return transfers[transferId];
    }

    function getUserTransfers(
        address userAddress
    ) public view returns (uint256[] memory) {
        return _userTransferIds[userAddress];
    }
}
