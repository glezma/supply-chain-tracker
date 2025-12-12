import SupplyChainABI from './SupplyChain.json';

export const CONTRACT_CONFIG = {
  address: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  abi: SupplyChainABI,
  adminAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
};

export const NETWORK_CONFIG = {
  chainId: 31337,
  rpcUrl: 'http://localhost:8545',
  name: 'Anvil Local'
};
