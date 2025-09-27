import React from 'react';
import { useWeb3 } from '../context/Web3Context';

const DebugInfo = () => {
  const { account, isConnected, contracts, chainId } = useWeb3();

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-900 mb-2">Debug Information</h3>
      <div className="text-xs text-gray-600 space-y-1">
        <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
        <div>Account: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'None'}</div>
        <div>Chain ID: {chainId || 'Unknown'}</div>
        <div>Contracts Available:</div>
        <div className="ml-2">
          <div>Identity Registry: {contracts.identityRegistry ? 'Yes' : 'No'}</div>
          <div>Compliance Module: {contracts.complianceModule ? 'Yes' : 'No'}</div>
          <div>MultiProperty Manager: {contracts.multiPropertyManager ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </div>
  );
};

export default DebugInfo;
