'use client';

import { useWeb3 } from '@/contexts/Web3Context';
import { useState } from 'react';

export function useContract() {
  const { contract, account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestUserRole = async (role: string) => {
    if (!contract) throw new Error('Contract not initialized');
    setLoading(true);
    setError(null);
    try {
      console.log('[Contract] Requesting role:', role);
      const tx = await contract.requestUserRole(role);
      console.log('[Contract] Transaction sent:', tx.hash);
      await tx.wait();
      console.log('[Contract] Transaction confirmed');
      return tx;
    } catch (err: any) {
      console.error('[Contract] Error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const changeStatusUser = async (userAddress: string, status: number) => {
    if (!contract) throw new Error('Contract not initialized');
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.changeStatusUser(userAddress, BigInt(status));
      await tx.wait();
      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createToken = async (name: string, quantity: bigint, features: string = '', parentId: bigint = BigInt(0)) => {
    if (!contract) throw new Error('Contract not initialized');
    setLoading(true);
    setError(null);
    try {
      console.log('[Contract] Creating token:', { name, quantity, features, parentId });
      const tx = await contract.createToken(name, quantity, features, parentId);
      console.log('[Contract] Transaction sent:', tx.hash);
      await tx.wait();
      console.log('[Contract] Transaction confirmed');
      return tx;
    } catch (err: any) {
      console.error('[Contract] Error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const transfer = async (tokenId: bigint, to: string, quantity: bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.transfer(to, tokenId, quantity);
      await tx.wait();
      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const acceptTransfer = async (transferId: bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.acceptTransfer(transferId);
      await tx.wait();
      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const rejectTransfer = async (transferId: bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.rejectTransfer(transferId);
      await tx.wait();
      return tx;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = async (userAddress: string) => {
    if (!contract) throw new Error('Contract not initialized');
    try {
      return await contract.getUserInfo(userAddress);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getToken = async (tokenId: bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    try {
      return await contract.getToken(tokenId);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getTransfer = async (transferId: bigint) => {
    if (!contract) throw new Error('Contract not initialized');
    try {
      // Force fresh data by calling staticCall
      const result = await contract.getTransfer.staticCall(transferId);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getUserTokens = async (userAddress: string) => {
    if (!contract) throw new Error('Contract not initialized');
    try {
      return await contract.getUserTokens(userAddress);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const getUserTransfers = async (userAddress: string) => {
    if (!contract) throw new Error('Contract not initialized');
    try {
      return await contract.getUserTransfers(userAddress);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    loading,
    error,
    requestUserRole,
    changeStatusUser,
    createToken,
    transfer,
    acceptTransfer,
    rejectTransfer,
    getUserInfo,
    getToken,
    getTransfer,
    getUserTokens,
    getUserTransfers,
  };
}
