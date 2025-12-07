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
    // STRUCTS
    // ============================================
    
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
        // Validate role is valid
        require(
            keccak256(bytes(role)) == keccak256(bytes("Producer")) ||
            keccak256(bytes(role)) == keccak256(bytes("Factory")) ||
            keccak256(bytes(role)) == keccak256(bytes("Retailer")) ||
            keccak256(bytes(role)) == keccak256(bytes("Consumer")),
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
        
        // Emit event
        emit UserRoleRequested(msg.sender, role);
        
        // Increment counter
        nextUserId++;
    }
    
    function changeStatusUser(address userAddress, UserStatus newStatus) public {
        // Validate msg.sender is admin
        require(msg.sender == admin, "Only admin can change user status");
        
        // Validate user exists
        uint256 userId = addressToUserId[userAddress];
        require(userId != 0, "User does not exist");
        
        // Update user status
        users[userId].status = newStatus;
        
        // Emit event
        emit UserStatusChanged(userAddress, newStatus);
    }
    
    function getUserInfo(address userAddress) public view returns (User memory) {
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
        // Validate user is approved
        uint256 userId = addressToUserId[msg.sender];
        require(userId != 0, "User not registered");
        require(users[userId].status == UserStatus.Approved, "User not approved");
        
        // Validate name is not empty
        require(bytes(name).length > 0, "Name cannot be empty");
        
        // Validate totalSupply > 0
        require(totalSupply > 0, "Total supply must be greater than 0");
        
        // If parentId > 0, validate parent token exists
        if (parentId > 0) {
            require(parentId < nextTokenId, "Parent token does not exist");
        }
        
        // Create Token struct
        Token storage newToken = tokens[nextTokenId];
        newToken.id = nextTokenId;
        newToken.creator = msg.sender;
        newToken.name = name;
        newToken.totalSupply = totalSupply;
        newToken.features = features;
        newToken.parentId = parentId;
        newToken.dateCreated = block.timestamp;
        
        // Set balance[msg.sender] = totalSupply
        newToken.balance[msg.sender] = totalSupply;
        
        // Emit event
        emit TokenCreated(nextTokenId, msg.sender, name, totalSupply);
        
        // Increment counter
        nextTokenId++;
    }
    
    function getToken(uint256 tokenId) public view returns (
        uint256 id,
        address creator,
        string memory name,
        uint256 totalSupply,
        string memory features,
        uint256 parentId,
        uint256 dateCreated
    ) {
        // Validate token exists
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
    
    function getTokenBalance(uint256 tokenId, address userAddress) public view returns (uint256) {
        // Validate token exists
        require(tokenId > 0 && tokenId < nextTokenId, "Token does not exist");
        
        return tokens[tokenId].balance[userAddress];
    }
    
    function getUserTokens(address userAddress) public view returns (uint256[] memory) {
        // Count tokens with balance > 0
        uint256 count = 0;
        for (uint256 i = 1; i < nextTokenId; i++) {
            if (tokens[i].balance[userAddress] > 0) {
                count++;
            }
        }
        
        // Create array and populate
        uint256[] memory tokenIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextTokenId; i++) {
            if (tokens[i].balance[userAddress] > 0) {
                tokenIds[index] = i;
                index++;
            }
        }
        
        return tokenIds;
    }
    
    // ============================================
    // TRANSFER MANAGEMENT FUNCTIONS
    // ============================================
    
    function transfer(address to, uint256 tokenId, uint256 amount) public {
        // Validate user is approved
        uint256 senderUserId = addressToUserId[msg.sender];
        require(senderUserId != 0, "Sender not registered");
        require(users[senderUserId].status == UserStatus.Approved, "Sender not approved");
        
        // Validate token exists
        require(tokenId > 0 && tokenId < nextTokenId, "Token does not exist");
        
        // Validate amount > 0
        require(amount > 0, "Amount must be greater than 0");
        
        // Validate sender has sufficient balance
        require(tokens[tokenId].balance[msg.sender] >= amount, "Insufficient balance");
        
        // Validate to address is not sender
        require(to != msg.sender, "Cannot transfer to yourself");
        
        // Validate recipient is registered and approved
        uint256 recipientUserId = addressToUserId[to];
        require(recipientUserId != 0, "Recipient not registered");
        require(users[recipientUserId].status == UserStatus.Approved, "Recipient not approved");
        
        // Validate role-based transfer rules
        string memory senderRole = users[senderUserId].role;
        string memory recipientRole = users[recipientUserId].role;
        
        if (keccak256(bytes(senderRole)) == keccak256(bytes("Producer"))) {
            require(keccak256(bytes(recipientRole)) == keccak256(bytes("Factory")), "Producer can only transfer to Factory");
        } else if (keccak256(bytes(senderRole)) == keccak256(bytes("Factory"))) {
            require(keccak256(bytes(recipientRole)) == keccak256(bytes("Retailer")), "Factory can only transfer to Retailer");
        } else if (keccak256(bytes(senderRole)) == keccak256(bytes("Retailer"))) {
            require(keccak256(bytes(recipientRole)) == keccak256(bytes("Consumer")), "Retailer can only transfer to Consumer");
        } else if (keccak256(bytes(senderRole)) == keccak256(bytes("Consumer"))) {
            revert("Consumer cannot transfer");
        }
        
        // Create Transfer struct with status = Pending
        Transfer storage newTransfer = transfers[nextTransferId];
        newTransfer.id = nextTransferId;
        newTransfer.from = msg.sender;
        newTransfer.to = to;
        newTransfer.tokenId = tokenId;
        newTransfer.dateCreated = block.timestamp;
        newTransfer.amount = amount;
        newTransfer.status = TransferStatus.Pending;
        
        // Emit event
        emit TransferRequested(nextTransferId, msg.sender, to, tokenId, amount);
        
        // Increment counter
        nextTransferId++;
        
        // Note: Do NOT move tokens yet - they move on acceptance
    }
    
    function acceptTransfer(uint256 transferId) public {
        // Validate transfer exists
        require(transferId > 0 && transferId < nextTransferId, "Transfer does not exist");
        
        Transfer storage txfer = transfers[transferId];
        
        // Validate msg.sender is recipient
        require(msg.sender == txfer.to, "Only recipient can accept transfer");
        
        // Validate transfer status is Pending
        require(txfer.status == TransferStatus.Pending, "Transfer is not pending");
        
        // Update balances
        tokens[txfer.tokenId].balance[txfer.from] -= txfer.amount;
        tokens[txfer.tokenId].balance[txfer.to] += txfer.amount;
        
        // Update transfer status
        txfer.status = TransferStatus.Accepted;
        
        // Emit event
        emit TransferAccepted(transferId);
    }
    
    function rejectTransfer(uint256 transferId) public {
        // Validate transfer exists
        require(transferId > 0 && transferId < nextTransferId, "Transfer does not exist");
        
        Transfer storage txfer = transfers[transferId];
        
        // Validate msg.sender is recipient
        require(msg.sender == txfer.to, "Only recipient can reject transfer");
        
        // Validate transfer status is Pending
        require(txfer.status == TransferStatus.Pending, "Transfer is not pending");
        
        // Update transfer status (tokens remain with sender)
        txfer.status = TransferStatus.Rejected;
        
        // Emit event
        emit TransferRejected(transferId);
    }
    
    function getTransfer(uint256 transferId) public view returns (Transfer memory) {
        // Validate transfer exists
        require(transferId > 0 && transferId < nextTransferId, "Transfer does not exist");
        
        return transfers[transferId];
    }
    
    function getUserTransfers(address userAddress) public view returns (uint256[] memory) {
        // Count transfers where user is sender or recipient
        uint256 count = 0;
        for (uint256 i = 1; i < nextTransferId; i++) {
            if (transfers[i].from == userAddress || transfers[i].to == userAddress) {
                count++;
            }
        }
        
        // Create array and populate
        uint256[] memory transferIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i < nextTransferId; i++) {
            if (transfers[i].from == userAddress || transfers[i].to == userAddress) {
                transferIds[index] = i;
                index++;
            }
        }
        
        return transferIds;
    }
}
