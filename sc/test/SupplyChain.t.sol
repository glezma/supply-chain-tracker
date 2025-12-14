// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol";

/**
 * @title Supply Chain Smart Contract Tests
 * @author Gonzalo Lezma
 * @notice Tests the complete lifecycle and security controls of the SupplyChain contract.
 * @dev Uses Foundry for testing. Contains 43 distinct tests covering all functionality.
 */
contract SupplyChainTest is Test {
    SupplyChain public supplyChain;

    // Mock user addresses simulating different actors in the system
    address admin;
    address producer;
    address factory;
    address retailer;
    address consumer;
    address unauthorized;

    // Events to check
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
    event UserStatusChanged(
        address indexed user,
        SupplyChain.UserStatus status
    );

    function setUp() public {
        admin = address(this);
        producer = address(0x1);
        factory = address(0x2);
        retailer = address(0x3);
        consumer = address(0x4);
        unauthorized = address(0x5);

        supplyChain = new SupplyChain();
    }

    // ============================================
    // USER MANAGEMENT TESTS
    // ============================================

    /// @notice Test 1: Verifies that a user can request a role with Pending status
    function testUserRegistration() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");

        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.userAddress, producer);
        assertEq(user.role, "Producer");
        assertTrue(user.status == SupplyChain.UserStatus.Pending);
    }

    /// @notice Test 2: Verifies that Admin can approve a pending user
    function testAdminApproveUser() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");

        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);

        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertTrue(user.status == SupplyChain.UserStatus.Approved);
    }

    /// @notice Test 3: Verifies that Admin can reject a user registration
    function testAdminRejectUser() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");

        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Rejected);

        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertTrue(user.status == SupplyChain.UserStatus.Rejected);
    }

    /// @notice Test 4: Verifies the full lifecycle of status changes (Pending -> Approved -> Canceled)
    function testUserStatusChanges() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");

        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        assertTrue(
            supplyChain.getUserInfo(producer).status ==
                SupplyChain.UserStatus.Approved
        );

        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Canceled);
        assertTrue(
            supplyChain.getUserInfo(producer).status ==
                SupplyChain.UserStatus.Canceled
        );
    }

    /// @notice Test 5: Verifies that unapproved users revert when trying to operate
    function testOnlyApprovedUsersCanOperate() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");

        vm.prank(producer);
        vm.expectRevert("User not approved");
        supplyChain.createToken("Coffee", 1000, "{}", 0);
    }

    /// @notice Test 6: Verifies correct retrieval of user profile struct
    function testGetUserInfo() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.userAddress, producer);
    }

    /// @notice Test 7: Verifies isAdmin check works correctly for deployer vs regular user
    function testIsAdmin() public view {
        assertTrue(supplyChain.isAdmin(admin));
        assertFalse(supplyChain.isAdmin(producer));
    }

    /// @notice Test 8: Verifies security check that only Admin can change statuses
    function testOnlyAdminCanChangeStatus() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");

        vm.prank(unauthorized);
        vm.expectRevert("Only admin can change user status");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
    }

    // ============================================
    // TOKEN CREATION TESTS
    // ============================================

    // Helper to setup an approved user quickly
    function _approveUser(address user, string memory role) internal {
        vm.prank(user);
        supplyChain.requestUserRole(role);
        supplyChain.changeStatusUser(user, SupplyChain.UserStatus.Approved);
    }

    /// @notice Test 9: Verifies a Producer can mint new tokens
    function testCreateTokenByProducer() public {
        _approveUser(producer, "Producer");
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 100, "{}", 0);
        assertEq(supplyChain.getTokenBalance(1, producer), 100);
    }

    /// @notice Test 10: Verifies a Factory can mint new tokens
    function testCreateTokenByFactory() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        
        // Producer creates raw material first
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 100, "{}", 0);
        
        // Factory creates processed product with parent
        vm.prank(factory);
        supplyChain.createToken("Processed Product", 50, "{}", 1);
        assertEq(supplyChain.getTokenBalance(2, factory), 50);
    }

    /// @notice Test 11: Verifies a Retailer can mint new tokens (e.g. repacking)
    function testCreateTokenByRetailer() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        _approveUser(retailer, "Retailer");
        
        // Producer creates raw material
        vm.prank(producer);
        supplyChain.createToken("Raw Material", 100, "{}", 0);
        
        // Factory creates processed product
        vm.prank(factory);
        supplyChain.createToken("Processed Product", 50, "{}", 1);
        
        // Retailer creates final product with parent
        vm.prank(retailer);
        supplyChain.createToken("Retail Batch", 10, "{}", 2);
        assertEq(supplyChain.getTokenBalance(3, retailer), 10);
    }

    /// @notice Test 12: Verifies parentId linking logic for traceability
    function testTokenWithParentId() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        
        vm.prank(producer);
        supplyChain.createToken("Parent", 100, "{}", 0);

        vm.prank(factory);
        supplyChain.createToken("Child", 100, "{}", 1);

        (, , , , , , uint256 parentId, ) = supplyChain.getToken(2);
        assertEq(parentId, 1);
    }

    /// @notice Test 13: Verifies metadata string is stored correctly
    function testTokenMetadata() public {
        _approveUser(producer, "Producer");
        string memory features = '{"color":"red"}';
        vm.prank(producer);
        supplyChain.createToken("Item", 1, features, 0);

        (, , , , string memory storedFeatures, , , ) = supplyChain.getToken(1);
        assertEq(storedFeatures, features);
    }

    /// @notice Test 14: Verifies token balance is assigned only to creator
    function testTokenBalance() public {
        _approveUser(producer, "Producer");
        vm.prank(producer);
        supplyChain.createToken("Item", 500, "{}", 0);

        assertEq(supplyChain.getTokenBalance(1, producer), 500);
        assertEq(supplyChain.getTokenBalance(1, factory), 0);
    }

    /// @notice Test 15: Verifies getToken returns correct basic info
    function testGetToken() public {
        _approveUser(producer, "Producer");
        vm.prank(producer);
        supplyChain.createToken("Item", 1, "{}", 0);

        (uint256 id, address creator, string memory name, , , , , ) = supplyChain
            .getToken(1);
        assertEq(id, 1);
        assertEq(creator, producer);
        assertEq(name, "Item");
    }

    /// @notice Test 16: Verifies getUserTokens returns list of owned tokens
    function testGetUserTokens() public {
        _approveUser(producer, "Producer");
        vm.prank(producer);
        supplyChain.createToken("T1", 1, "{}", 0);
        vm.prank(producer);
        supplyChain.createToken("T2", 1, "{}", 0);

        uint256[] memory tokens = supplyChain.getUserTokens(producer);
        assertEq(tokens.length, 2);
        assertEq(tokens[0], 1);
        assertEq(tokens[1], 2);
    }

    // ============================================
    // TRANSFER TESTS
    // ============================================

    /// @notice Test 17: Verifies valid transfer from Producer to Factory
    function testTransferFromProducerToFactory() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);

        SupplyChain.Transfer memory txfer = supplyChain.getTransfer(1);
        assertEq(txfer.amount, 50);
        assertEq(txfer.to, factory);
    }

    /// @notice Test 18: Verifies valid transfer from Factory to Retailer
    function testTransferFromFactoryToRetailer() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        _approveUser(retailer, "Retailer");

        // Producer creates raw material
        vm.prank(producer);
        supplyChain.createToken("Raw", 100, "{}", 0);

        // Factory creates processed product
        vm.prank(factory);
        supplyChain.createToken("Processed", 100, "{}", 1);

        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 50);

        SupplyChain.Transfer memory txfer = supplyChain.getTransfer(1);
        assertEq(txfer.to, retailer);
    }

    /// @notice Test 19: Verifies valid transfer from Retailer to Consumer
    function testTransferFromRetailerToConsumer() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        _approveUser(retailer, "Retailer");
        _approveUser(consumer, "Consumer");

        // Producer creates raw material
        vm.prank(producer);
        supplyChain.createToken("Raw", 100, "{}", 0);

        // Factory creates processed product
        vm.prank(factory);
        supplyChain.createToken("Processed", 100, "{}", 1);

        // Retailer creates final product
        vm.prank(retailer);
        supplyChain.createToken("Final", 100, "{}", 2);

        vm.prank(retailer);
        supplyChain.transfer(consumer, 3, 50);

        SupplyChain.Transfer memory txfer = supplyChain.getTransfer(1);
        assertEq(txfer.to, consumer);
    }

    /// @notice Test 20: Verifies that accepting a transfer updates balances
    function testAcceptTransfer() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);

        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        assertEq(supplyChain.getTokenBalance(1, producer), 50);
        assertEq(supplyChain.getTokenBalance(1, factory), 50);
    }

    /// @notice Test 21: Verifies that rejecting a transfer cancels movement
    function testRejectTransfer() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);

        vm.prank(factory);
        supplyChain.rejectTransfer(1);

        SupplyChain.Transfer memory txfer = supplyChain.getTransfer(1);
        assertTrue(txfer.status == SupplyChain.TransferStatus.Rejected);
        assertEq(supplyChain.getTokenBalance(1, producer), 100);
    }

    /// @notice Test 22: Verifies reverts on insufficient balance
    function testTransferInsufficientBalance() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        supplyChain.createToken("T", 10, "{}", 0); // Only 10

        vm.prank(producer);
        vm.expectRevert("Insufficient balance");
        supplyChain.transfer(factory, 1, 20); // Try 20
    }

    /// @notice Test 23: Verifies getTransfer returns correct details
    function testGetTransfer() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);

        SupplyChain.Transfer memory txfer = supplyChain.getTransfer(1);
        assertEq(txfer.id, 1);
    }

    /// @notice Test 24: Verifies getUserTransfers returns history
    function testGetUserTransfers() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50); // Tx 1

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 10); // Tx 2

        uint256[] memory txs = supplyChain.getUserTransfers(producer);
        assertEq(txs.length, 2);
    }

    // ============================================
    // VALIDATIONS AND PERMISSIONS
    // ============================================

    /// @notice Test 25: Verifies strict role check (Producer cannot skip to Consumer)
    function testInvalidRoleTransfer() public {
        _approveUser(producer, "Producer");
        _approveUser(consumer, "Consumer");

        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);

        vm.prank(producer);
        vm.expectRevert("Producer can only transfer to Factory");
        supplyChain.transfer(consumer, 1, 50);
    }

    /// @notice Test 26: Verifies unapproved users cannot create tokens
    function testUnapprovedUserCannotCreateToken() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        // Pending state

        vm.prank(producer);
        vm.expectRevert("User not approved");
        supplyChain.createToken("T", 100, "{}", 0);
    }

    /// @notice Test 27: Verifies unapproved recipient check
    function testUnapprovedUserCannotTransfer() public {
        _approveUser(producer, "Producer");
        vm.prank(factory);
        supplyChain.requestUserRole("Factory"); // Pending

        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);

        vm.prank(producer);
        vm.expectRevert("Recipient not approved");
        supplyChain.transfer(factory, 1, 50);
    }

    /// @notice Test 28: Verifies Consumer cannot initiate transfers (End of line)
    function testConsumerCannotTransfer() public {
        _approveUser(consumer, "Consumer");
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        _approveUser(retailer, "Retailer");

        // Fast forward: P -> F -> R -> C
        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 100);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 100);
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);

        // Now try to transfer from Consumer
        vm.prank(consumer);
        vm.expectRevert("Consumer cannot transfer");
        supplyChain.transfer(producer, 1, 10);
    }

    /// @notice Test 29: Verifies cannot transfer to self
    function testTransferToSameAddress() public {
        _approveUser(producer, "Producer");
        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);

        vm.prank(producer);
        vm.expectRevert("Cannot transfer to yourself");
        supplyChain.transfer(producer, 1, 10);
    }

    // ============================================
    // EDGE CASES
    // ============================================

    /// @notice Test 30: Verifies zero amount transfer fails
    function testTransferZeroAmount() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);

        vm.prank(producer);
        vm.expectRevert("Amount must be greater than 0");
        supplyChain.transfer(factory, 1, 0);
    }

    /// @notice Test 31: Verifies transfer of non-existent token fails
    function testTransferNonExistentToken() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        vm.expectRevert("Token does not exist");
        supplyChain.transfer(factory, 999, 10);
    }

    /// @notice Test 32: Verifies accepting non-existent transfer fails
    function testAcceptNonExistentTransfer() public {
        _approveUser(factory, "Factory");

        vm.prank(factory);
        vm.expectRevert("Transfer does not exist");
        supplyChain.acceptTransfer(999);
    }

    /// @notice Test 33: Verifies double-spend/double-accept protection
    function testDoubleAcceptTransfer() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);

        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // Try accepting again
        vm.prank(factory);
        vm.expectRevert("Transfer is not pending");
        supplyChain.acceptTransfer(1);
    }

    /// @notice Test 34: Verifies behavior after rejection (Transfer is terminal)
    function testTransferAfterRejection() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);

        vm.prank(factory);
        supplyChain.rejectTransfer(1);

        // Sender creates NEW transfer
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50); // New transfer ID 2
        SupplyChain.Transfer memory txfer = supplyChain.getTransfer(2);
        assertTrue(txfer.status == SupplyChain.TransferStatus.Pending);
    }

    // ============================================
    // EVENTS
    // ============================================

    /// @notice Test 35: Verifies UserRoleRequested event emission
    function testUserRegisteredEvent() public {
        vm.expectEmit(true, false, false, true);
        emit UserRoleRequested(producer, "Producer");

        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
    }

    /// @notice Test 36: Verifies UserStatusChanged event emission
    function testUserStatusChangedEvent() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");

        vm.expectEmit(true, false, false, true);
        emit UserStatusChanged(producer, SupplyChain.UserStatus.Approved);

        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
    }

    /// @notice Test 37: Verifies TokenCreated event emission
    function testTokenCreatedEvent() public {
        _approveUser(producer, "Producer");

        vm.expectEmit(true, true, false, true);
        emit TokenCreated(1, producer, "T", 100);

        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);
    }

    /// @notice Test 38: Verifies TransferRequested event emission
    function testTransferInitiatedEvent() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);

        vm.expectEmit(true, true, true, true);
        emit TransferRequested(1, producer, factory, 1, 50);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
    }

    /// @notice Test 39: Verifies TransferAccepted event emission
    function testTransferAcceptedEvent() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);

        vm.expectEmit(true, false, false, false);
        emit TransferAccepted(1);

        vm.prank(factory);
        supplyChain.acceptTransfer(1);
    }

    /// @notice Test 40: Verifies TransferRejected event emission
    function testTransferRejectedEvent() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        vm.prank(producer);
        supplyChain.createToken("T", 100, "{}", 0);
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);

        vm.expectEmit(true, false, false, false);
        emit TransferRejected(1);

        vm.prank(factory);
        supplyChain.rejectTransfer(1);
    }

    // ============================================
    // FLOWS
    // ============================================

    /// @notice Test 41: End-to-end simulation of P->F->R->C flow
    function testCompleteSupplyChainFlow() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");
        _approveUser(retailer, "Retailer");
        _approveUser(consumer, "Consumer");

        // 1. P creates
        vm.prank(producer);
        supplyChain.createToken("Grain", 100, "{}", 0);

        // 2. P -> F
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        // 3. F creates derived
        vm.prank(factory);
        supplyChain.createToken("Flour", 100, "{}", 1);

        // 4. F -> R (derived)
        vm.prank(factory);
        supplyChain.transfer(retailer, 2, 100);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);

        // 5. R -> C
        vm.prank(retailer);
        supplyChain.transfer(consumer, 2, 100);
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);

        assertEq(supplyChain.getTokenBalance(2, consumer), 100);
    }

    /// @notice Test 42: Verifies complex scenario with multiple tokens moving in parallel
    function testMultipleTokensFlow() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        supplyChain.createToken("A", 100, "", 0);
        vm.prank(producer);
        supplyChain.createToken("B", 100, "", 0);

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 50);
        vm.prank(producer);
        supplyChain.transfer(factory, 2, 50);

        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        vm.prank(factory);
        supplyChain.acceptTransfer(2);

        assertEq(supplyChain.getTokenBalance(1, factory), 50);
        assertEq(supplyChain.getTokenBalance(2, factory), 50);
    }

    /// @notice Test 43: Verifies lineage calculation (Raw Material -> Processed Product)
    function testTraceabilityFlow() public {
        _approveUser(producer, "Producer");
        _approveUser(factory, "Factory");

        vm.prank(producer);
        supplyChain.createToken("Raw", 100, "", 0);

        // Check raw token traceability
        (, , , , , , uint256 type1Parent, ) = supplyChain.getToken(1);
        assertEq(type1Parent, 0); // Root

        vm.prank(producer);
        supplyChain.transfer(factory, 1, 100);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);

        vm.prank(factory);
        supplyChain.createToken("Processed", 100, "", 1);

        (, , , , , , uint256 type2Parent, ) = supplyChain.getToken(2);
        assertEq(type2Parent, 1); // Linked to Raw
    }
}
