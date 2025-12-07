// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/SupplyChain.sol";

contract SupplyChainTest is Test {
    SupplyChain public supplyChain;
    
    // Test accounts
    address admin;
    address producer;
    address factory;
    address retailer;
    address consumer;
    address unauthorized;
    
    function setUp() public {
        // Set up test accounts
        admin = address(this);
        producer = address(0x1);
        factory = address(0x2);
        retailer = address(0x3);
        consumer = address(0x4);
        unauthorized = address(0x5);
        
        // Deploy contract
        supplyChain = new SupplyChain();
    }
    
    // ============================================
    // USER MANAGEMENT TESTS
    // ============================================
    
    function testUserRegistration() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.userAddress, producer);
        assertEq(user.role, "Producer");
        assertTrue(user.status == SupplyChain.UserStatus.Pending);
    }
    
    function testAdminApproveUser() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertTrue(user.status == SupplyChain.UserStatus.Approved);
    }
    
    function testAdminRejectUser() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Rejected);
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertTrue(user.status == SupplyChain.UserStatus.Rejected);
    }
    
    function testUserStatusChanges() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertTrue(user.status == SupplyChain.UserStatus.Approved);
        
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Canceled);
        user = supplyChain.getUserInfo(producer);
        assertTrue(user.status == SupplyChain.UserStatus.Canceled);
    }
    
    function testOnlyApprovedUsersCanOperate() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        vm.prank(producer);
        vm.expectRevert("User not approved");
        supplyChain.createToken("Coffee", 1000, "{}", 0);
    }
    
    function testGetUserInfo() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        SupplyChain.User memory user = supplyChain.getUserInfo(producer);
        assertEq(user.userAddress, producer);
        assertEq(user.role, "Producer");
    }
    
    function testIsAdmin() public {
        assertTrue(supplyChain.isAdmin(admin));
        assertFalse(supplyChain.isAdmin(producer));
    }
    
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
    
    function testCreateTokenByProducer() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.createToken("Coffee Beans", 1000, '{"origin":"Colombia"}', 0);
        
        (uint256 id, address creator, string memory name, uint256 totalSupply,,,) = supplyChain.getToken(1);
        assertEq(id, 1);
        assertEq(creator, producer);
        assertEq(name, "Coffee Beans");
        assertEq(totalSupply, 1000);
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
    }
    
    function testCreateTokenWithParent() public {
        // Setup producer and factory
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        // Producer creates raw material
        vm.prank(producer);
        supplyChain.createToken("Coffee Beans", 1000, "{}", 0);
        
        // Transfer to factory and accept
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Factory creates derived product
        vm.prank(factory);
        supplyChain.createToken("Roasted Coffee", 500, "{}", 1);
        
        (,, string memory name,,, uint256 parentId,) = supplyChain.getToken(2);
        assertEq(name, "Roasted Coffee");
        assertEq(parentId, 1);
    }
    
    function testUnapprovedUserCannotCreateToken() public {
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        
        vm.prank(producer);
        vm.expectRevert("User not approved");
        supplyChain.createToken("Coffee", 1000, "{}", 0);
    }
    
    // ============================================
    // TRANSFER TESTS
    // ============================================
    
    function testTransferFromProducerToFactory() public {
        // Setup users
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        // Create token
        vm.prank(producer);
        supplyChain.createToken("Coffee", 1000, "{}", 0);
        
        // Transfer
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        
        SupplyChain.Transfer memory txfer = supplyChain.getTransfer(1);
        assertEq(txfer.from, producer);
        assertEq(txfer.to, factory);
        assertEq(txfer.amount, 500);
        assertTrue(txfer.status == SupplyChain.TransferStatus.Pending);
    }
    
    function testAcceptTransfer() public {
        // Setup and create transfer
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.createToken("Coffee", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        
        // Accept transfer
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        assertEq(supplyChain.getTokenBalance(1, producer), 500);
        assertEq(supplyChain.getTokenBalance(1, factory), 500);
        
        SupplyChain.Transfer memory txfer = supplyChain.getTransfer(1);
        assertTrue(txfer.status == SupplyChain.TransferStatus.Accepted);
    }
    
    function testRejectTransfer() public {
        // Setup and create transfer
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.createToken("Coffee", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 500);
        
        // Reject transfer
        vm.prank(factory);
        supplyChain.rejectTransfer(1);
        
        assertEq(supplyChain.getTokenBalance(1, producer), 1000);
        assertEq(supplyChain.getTokenBalance(1, factory), 0);
        
        SupplyChain.Transfer memory txfer = supplyChain.getTransfer(1);
        assertTrue(txfer.status == SupplyChain.TransferStatus.Rejected);
    }
    
    function testInvalidRoleTransfer() public {
        // Setup producer and consumer
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer");
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
        
        vm.prank(producer);
        supplyChain.createToken("Coffee", 1000, "{}", 0);
        
        // Producer cannot transfer to Consumer
        vm.prank(producer);
        vm.expectRevert("Producer can only transfer to Factory");
        supplyChain.transfer(consumer, 1, 500);
    }
    
    function testConsumerCannotTransfer() public {
        // Setup full chain
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer");
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
        
        // Create and transfer to consumer
        vm.prank(producer);
        supplyChain.createToken("Coffee", 1000, "{}", 0);
        
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 1000);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 1000);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        
        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 1000);
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);
        
        // Consumer cannot transfer
        vm.prank(consumer);
        vm.expectRevert("Consumer cannot transfer");
        supplyChain.transfer(producer, 1, 100);
    }
    
    function testCompleteSupplyChainFlow() public {
        // Register all users
        vm.prank(producer);
        supplyChain.requestUserRole("Producer");
        supplyChain.changeStatusUser(producer, SupplyChain.UserStatus.Approved);
        
        vm.prank(factory);
        supplyChain.requestUserRole("Factory");
        supplyChain.changeStatusUser(factory, SupplyChain.UserStatus.Approved);
        
        vm.prank(retailer);
        supplyChain.requestUserRole("Retailer");
        supplyChain.changeStatusUser(retailer, SupplyChain.UserStatus.Approved);
        
        vm.prank(consumer);
        supplyChain.requestUserRole("Consumer");
        supplyChain.changeStatusUser(consumer, SupplyChain.UserStatus.Approved);
        
        // Producer creates raw material
        vm.prank(producer);
        supplyChain.createToken("Coffee Beans", 1000, '{"origin":"Colombia"}', 0);
        
        // Producer → Factory
        vm.prank(producer);
        supplyChain.transfer(factory, 1, 1000);
        vm.prank(factory);
        supplyChain.acceptTransfer(1);
        
        // Factory → Retailer
        vm.prank(factory);
        supplyChain.transfer(retailer, 1, 1000);
        vm.prank(retailer);
        supplyChain.acceptTransfer(2);
        
        // Retailer → Consumer
        vm.prank(retailer);
        supplyChain.transfer(consumer, 1, 1000);
        vm.prank(consumer);
        supplyChain.acceptTransfer(3);
        
        // Verify final state
        assertEq(supplyChain.getTokenBalance(1, consumer), 1000);
        assertEq(supplyChain.getTokenBalance(1, producer), 0);
    }
}
