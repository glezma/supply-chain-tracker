// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/SupplyChain.sol";

contract Deploy is Script {
    function run() external returns (SupplyChain) {
        vm.startBroadcast();
        
        SupplyChain supplyChain = new SupplyChain();
        
        console.log("SupplyChain deployed at:", address(supplyChain));
        
        vm.stopBroadcast();
        
        return supplyChain;
    }
}
