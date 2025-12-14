export enum UserRole {
  Producer = 0,
  Factory = 1,
  Retailer = 2,
  Consumer = 3,
}

export enum UserStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Revoked = 3,
}

export enum TransferStatus {
  Pending = 0,
  Accepted = 1,
  Rejected = 2,
}

export enum TokenType {
  RawMaterial = 0,
  ProcessedProduct = 1,
  FinalProduct = 2,
}

export interface User {
  userAddress: string;
  role: UserRole;
  status: UserStatus;
}

export interface Token {
  id: bigint;
  name: string;
  creator: string;
  totalSupply: bigint;
  timestamp: bigint;
  features?: string;
  tokenType: TokenType;
  parentId?: bigint;
}

export interface Transfer {
  id: bigint;
  tokenId: bigint;
  from: string;
  to: string;
  quantity: bigint;
  status: TransferStatus;
  timestamp: bigint;
}
