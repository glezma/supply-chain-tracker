# Sepolia Testnet Deployment Plan

## Prerequisites

### 1. Get Sepolia ETH
- Visit a Sepolia faucet:
  - https://sepoliafaucet.com/
  - https://www.alchemy.com/faucets/ethereum-sepolia
- Request test ETH for your deployer wallet
- Need at least 0.1 ETH for deployment and testing

### 2. Setup Environment Variables
Create `.env` file in `/sc` directory:
```bash
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_for_verification
```

**Get API Keys:**
- Alchemy RPC: https://www.alchemy.com/ (free tier)
- Etherscan API: https://etherscan.io/apis (for contract verification)

### 3. Install Dependencies
```bash
cd sc
forge install
```

## Deployment Steps

### Step 1: Update Deployment Script
Edit `sc/script/Deploy.s.sol` to support Sepolia:

```solidity
// Add network detection
uint256 chainId = block.chainid;
address admin;

if (chainId == 11155111) { // Sepolia
    admin = vm.envAddress("SEPOLIA_ADMIN_ADDRESS");
} else {
    admin = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266; // Local
}
```

### Step 2: Deploy Contract
```bash
cd sc
forge script script/Deploy.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

**Save the deployed contract address from the output!**

### Step 3: Verify Deployment
```bash
# Check contract on Sepolia Etherscan
# https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS

# Test contract call
cast call YOUR_CONTRACT_ADDRESS "admin()(address)" --rpc-url $SEPOLIA_RPC_URL
```

## Frontend Configuration

### Step 1: Update Contract Config
Edit `web/src/contracts/config.ts`:

```typescript
export const CONTRACT_CONFIG = {
  address: 'YOUR_DEPLOYED_CONTRACT_ADDRESS', // From deployment
  abi: SupplyChainABI,
  adminAddress: 'YOUR_ADMIN_WALLET_ADDRESS' // Your MetaMask address
};

export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia
  rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY',
  name: 'Sepolia Testnet'
};
```

### Step 2: Update Contract ABI
Copy the ABI from deployment:
```bash
cd sc
cat out/SupplyChain.sol/SupplyChain.json | jq '.abi' > ../web/src/contracts/SupplyChain.json
```

### Step 3: Configure MetaMask
1. Open MetaMask
2. Click network dropdown
3. Select "Sepolia test network"
4. If not visible, enable "Show test networks" in Settings > Advanced

### Step 4: Deploy Frontend
```bash
cd web
npm run build
npm start
```

Or deploy to Vercel:
```bash
npm install -g vercel
vercel --prod
```

## Testing on Sepolia

### 1. Connect Wallet
- Open your deployed frontend
- Connect MetaMask (ensure you're on Sepolia network)
- Confirm you have Sepolia ETH

### 2. Register Users
- Register as Producer with your wallet
- Switch to admin wallet and approve the user
- Register additional test accounts (Factory, Retailer)

### 3. Test Token Flow
1. **Create Token** (as Producer)
   - Create a Raw Material token
   - Wait for transaction confirmation (~15 seconds)

2. **Transfer Token** (Producer → Factory)
   - Initiate transfer
   - Switch to Factory wallet
   - Accept transfer

3. **Create Processed Token** (as Factory)
   - Create Processed Product with parent token
   - Verify lineage tracking

4. **Final Product** (as Retailer)
   - Create Final Product
   - Complete supply chain flow

## Monitoring & Debugging

### View Transactions
- Sepolia Etherscan: https://sepolia.etherscan.io/
- Search by your contract address or wallet address

### Common Issues

**Issue: Transaction fails with "insufficient funds"**
- Solution: Get more Sepolia ETH from faucet

**Issue: MetaMask shows wrong network**
- Solution: Manually switch to Sepolia in MetaMask

**Issue: Contract not verified on Etherscan**
- Solution: Run verification manually:
```bash
forge verify-contract \
  YOUR_CONTRACT_ADDRESS \
  src/SupplyChain.sol:SupplyChain \
  --chain sepolia \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

**Issue: Frontend shows "Contract not initialized"**
- Solution: Check contract address in config.ts matches deployed address
- Ensure you're on Sepolia network in MetaMask

## Cost Estimates

- Contract Deployment: ~0.02-0.05 ETH
- User Registration: ~0.001 ETH per user
- Token Creation: ~0.002 ETH per token
- Transfer: ~0.001 ETH per transfer
- Accept/Reject: ~0.001 ETH per action

**Total for full test flow: ~0.1 ETH**

## Production Considerations

### Security
- [ ] Use hardware wallet for admin account
- [ ] Set up multi-sig for admin functions
- [ ] Audit contract before mainnet deployment
- [ ] Implement rate limiting on frontend

### Scalability
- [ ] Consider L2 solutions (Arbitrum, Optimism) for lower fees
- [ ] Implement IPFS for storing token features/metadata
- [ ] Add indexing service (The Graph) for faster queries

### Monitoring
- [ ] Set up Tenderly for transaction monitoring
- [ ] Configure alerts for failed transactions
- [ ] Track gas usage and optimize

## Rollback Plan

If issues occur:
1. Deploy new contract version
2. Update frontend config with new address
3. Migrate critical data if needed
4. Notify users of new contract address

## Next Steps After Deployment

1. Share contract address and frontend URL with testers
2. Document any issues encountered
3. Gather feedback on UX
4. Plan mainnet deployment timeline
5. Consider audit if moving to mainnet
