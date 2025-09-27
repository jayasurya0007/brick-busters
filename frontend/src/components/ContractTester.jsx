import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESSES } from '../config/contracts';

const ContractTester = () => {
  const { contracts, provider } = useWeb3();
  const [testResults, setTestResults] = useState({});
  const [testing, setTesting] = useState(false);

  const testContracts = async () => {
    setTesting(true);
    const results = {};

    try {
      // Test Identity Registry
      if (contracts.identityRegistry) {
        try {
          const owner = await contracts.identityRegistry.owner();
          results.identityRegistry = { success: true, owner };
        } catch (error) {
          results.identityRegistry = { success: false, error: error.message };
        }
      } else {
        results.identityRegistry = { success: false, error: 'Contract not initialized' };
      }

      // Test MultiProperty Manager
      if (contracts.multiPropertyManager) {
        try {
          const nextId = await contracts.multiPropertyManager.nextPropertyId();
          results.multiPropertyManager = { success: true, nextId: nextId.toString() };
        } catch (error) {
          results.multiPropertyManager = { success: false, error: error.message };
        }
      } else {
        results.multiPropertyManager = { success: false, error: 'Contract not initialized' };
      }

      // Test direct contract calls
      if (provider) {
        try {
          const code = await provider.getCode(CONTRACT_ADDRESSES.IDENTITY_REGISTRY);
          results.identityRegistryCode = code !== '0x' ? 'Contract exists' : 'No contract at address';
        } catch (error) {
          results.identityRegistryCode = { error: error.message };
        }

        try {
          const code = await provider.getCode(CONTRACT_ADDRESSES.MULTI_PROPERTY_MANAGER);
          results.multiPropertyManagerCode = code !== '0x' ? 'Contract exists' : 'No contract at address';
        } catch (error) {
          results.multiPropertyManagerCode = { error: error.message };
        }
      }

    } catch (error) {
      console.error('Error testing contracts:', error);
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-blue-900 mb-2">Contract Test Results</h3>
      <button
        onClick={testContracts}
        disabled={testing}
        className="btn-primary text-sm mb-3"
      >
        {testing ? 'Testing...' : 'Test Contracts'}
      </button>
      
      <div className="text-xs text-blue-800 space-y-1">
        <div><strong>Contract Addresses:</strong></div>
        <div className="ml-2">
          <div>Identity Registry: {CONTRACT_ADDRESSES.IDENTITY_REGISTRY}</div>
          <div>Compliance Module: {CONTRACT_ADDRESSES.COMPLIANCE_MODULE}</div>
          <div>MultiProperty Manager: {CONTRACT_ADDRESSES.MULTI_PROPERTY_MANAGER}</div>
        </div>
        
        {Object.keys(testResults).length > 0 && (
          <div className="mt-2">
            <div><strong>Test Results:</strong></div>
            {Object.entries(testResults).map(([key, result]) => (
              <div key={key} className="ml-2">
                <div>{key}: {result.success ? '✅' : '❌'}</div>
                {result.error && <div className="ml-2 text-red-600">Error: {result.error}</div>}
                {result.owner && <div className="ml-2">Owner: {result.owner}</div>}
                {result.nextId && <div className="ml-2">Next ID: {result.nextId}</div>}
                {typeof result === 'string' && <div className="ml-2">{result}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractTester;
