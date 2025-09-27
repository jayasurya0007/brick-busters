import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { CONTRACT_ADDRESSES } from '../config/contracts';
import { ethers } from 'ethers';

const ContractVerifier = () => {
  const { account, isConnected, contracts, provider, chainId } = useWeb3();
  const [verificationResults, setVerificationResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({});

  useEffect(() => {
    if (isConnected && contracts.multiPropertyManager) {
      runVerification();
    }
  }, [isConnected, contracts]);

  const runVerification = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test 1: Check if contracts are properly initialized
      results.contractInitialization = {
        identityRegistry: !!contracts.identityRegistry,
        complianceModule: !!contracts.complianceModule,
        multiPropertyManager: !!contracts.multiPropertyManager,
        provider: !!provider,
        account: !!account
      };

      // Test 2: Check contract addresses
      results.contractAddresses = {
        identityRegistry: CONTRACT_ADDRESSES.IDENTITY_REGISTRY,
        complianceModule: CONTRACT_ADDRESSES.COMPLIANCE_MODULE,
        multiPropertyManager: CONTRACT_ADDRESSES.MULTI_PROPERTY_MANAGER
      };

      // Test 3: Test contract calls
      if (contracts.identityRegistry) {
        try {
          const owner = await contracts.identityRegistry.owner();
          results.identityRegistryOwner = owner;
        } catch (error) {
          results.identityRegistryError = error.message;
        }
      }

      if (contracts.multiPropertyManager) {
        try {
          const nextId = await contracts.multiPropertyManager.nextPropertyId();
          results.nextPropertyId = nextId.toString();
        } catch (error) {
          results.multiPropertyManagerError = error.message;
        }

        // Test loading properties
        try {
          const nextId = await contracts.multiPropertyManager.nextPropertyId();
          const properties = [];
          
          for (let i = 1; i < nextId; i++) {
            try {
              const property = await contracts.multiPropertyManager.properties(i);
              properties.push({
                id: i,
                name: property.name,
                symbol: property.symbol,
                creator: property.creator,
                tokenContract: property.tokenContract
              });
            } catch (error) {
              console.error(`Error loading property ${i}:`, error);
            }
          }
          
          results.properties = properties;
        } catch (error) {
          results.propertiesError = error.message;
        }
      }

      // Test 4: Check network
      results.network = {
        chainId: chainId,
        isCorrectNetwork: chainId === '0x13fb' || chainId === '5115'
      };

      // Test 5: Direct contract verification
      if (provider) {
        try {
          const identityCode = await provider.getCode(CONTRACT_ADDRESSES.IDENTITY_REGISTRY);
          results.identityRegistryCode = identityCode !== '0x' ? 'Contract exists' : 'No contract';
        } catch (error) {
          results.identityRegistryCodeError = error.message;
        }

        try {
          const managerCode = await provider.getCode(CONTRACT_ADDRESSES.MULTI_PROPERTY_MANAGER);
          results.multiPropertyManagerCode = managerCode !== '0x' ? 'Contract exists' : 'No contract';
        } catch (error) {
          results.multiPropertyManagerCodeError = error.message;
        }
      }

      // Test 6: Test wallet verification
      if (contracts.identityRegistry && account) {
        try {
          const isVerified = await contracts.identityRegistry.isVerified(account);
          results.walletVerification = isVerified;
        } catch (error) {
          results.walletVerificationError = error.message;
        }
      }

    } catch (error) {
      results.generalError = error.message;
    }

    setVerificationResults(results);
    setLoading(false);
  };

  const testContractInteraction = async () => {
    if (!contracts.multiPropertyManager || !account) return;

    try {
      setLoading(true);
      
      // Test getting property details
      const nextId = await contracts.multiPropertyManager.nextPropertyId();
      const testData = {
        nextPropertyId: nextId.toString(),
        totalProperties: nextId - 1
      };

      if (nextId > 1) {
        const property = await contracts.multiPropertyManager.properties(1);
        testData.firstProperty = {
          name: property.name,
          symbol: property.symbol,
          creator: property.creator,
          tokenContract: property.tokenContract
        };
      }

      setTestData(testData);
    } catch (error) {
      console.error('Error testing contract interaction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Verification Results</h3>
      
      <div className="space-y-4">
        <div className="flex space-x-2">
          <button
            onClick={runVerification}
            disabled={loading}
            className="btn-primary text-sm"
          >
            {loading ? 'Verifying...' : 'Run Verification'}
          </button>
          <button
            onClick={testContractInteraction}
            disabled={loading}
            className="btn-secondary text-sm"
          >
            Test Interaction
          </button>
        </div>

        {/* Network Status */}
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium text-gray-900 mb-2">Network Status</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Connected: {isConnected ? '✅ Yes' : '❌ No'}</div>
            <div>Chain ID: {chainId || 'Unknown'}</div>
            <div>Account: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'None'}</div>
            <div>Correct Network: {verificationResults.network?.isCorrectNetwork ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>

        {/* Contract Initialization */}
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium text-gray-900 mb-2">Contract Initialization</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Identity Registry: {verificationResults.contractInitialization?.identityRegistry ? '✅' : '❌'}</div>
            <div>Compliance Module: {verificationResults.contractInitialization?.complianceModule ? '✅' : '❌'}</div>
            <div>MultiProperty Manager: {verificationResults.contractInitialization?.multiPropertyManager ? '✅' : '❌'}</div>
            <div>Provider: {verificationResults.contractInitialization?.provider ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* Contract Addresses */}
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium text-gray-900 mb-2">Contract Addresses</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Identity Registry: {verificationResults.contractAddresses?.identityRegistry}</div>
            <div>Compliance Module: {verificationResults.contractAddresses?.complianceModule}</div>
            <div>MultiProperty Manager: {verificationResults.contractAddresses?.multiPropertyManager}</div>
          </div>
        </div>

        {/* Contract Code Verification */}
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium text-gray-900 mb-2">Contract Code Verification</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Identity Registry: {verificationResults.identityRegistryCode || 'Not tested'}</div>
            <div>MultiProperty Manager: {verificationResults.multiPropertyManagerCode || 'Not tested'}</div>
          </div>
        </div>

        {/* Contract Calls */}
        <div className="bg-gray-50 p-3 rounded">
          <h4 className="font-medium text-gray-900 mb-2">Contract Calls</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div>Identity Registry Owner: {verificationResults.identityRegistryOwner || 'Not tested'}</div>
            <div>Next Property ID: {verificationResults.nextPropertyId || 'Not tested'}</div>
            <div>Wallet Verified: {verificationResults.walletVerification !== undefined ? (verificationResults.walletVerification ? '✅ Yes' : '❌ No') : 'Not tested'}</div>
          </div>
        </div>

        {/* Properties */}
        {verificationResults.properties && (
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium text-gray-900 mb-2">Properties ({verificationResults.properties.length})</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {verificationResults.properties.map((property, index) => (
                <div key={index} className="border-l-2 border-blue-200 pl-2">
                  <div>ID: {property.id}</div>
                  <div>Name: {property.name}</div>
                  <div>Symbol: {property.symbol}</div>
                  <div>Creator: {property.creator.slice(0, 6)}...{property.creator.slice(-4)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Data */}
        {Object.keys(testData).length > 0 && (
          <div className="bg-green-50 p-3 rounded">
            <h4 className="font-medium text-green-900 mb-2">Test Interaction Results</h4>
            <div className="text-sm text-green-800 space-y-1">
              {Object.entries(testData).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {(verificationResults.identityRegistryError || verificationResults.multiPropertyManagerError || verificationResults.propertiesError || verificationResults.generalError) && (
          <div className="bg-red-50 p-3 rounded">
            <h4 className="font-medium text-red-900 mb-2">Errors</h4>
            <div className="text-sm text-red-800 space-y-1">
              {verificationResults.identityRegistryError && <div>Identity Registry: {verificationResults.identityRegistryError}</div>}
              {verificationResults.multiPropertyManagerError && <div>MultiProperty Manager: {verificationResults.multiPropertyManagerError}</div>}
              {verificationResults.propertiesError && <div>Properties: {verificationResults.propertiesError}</div>}
              {verificationResults.generalError && <div>General: {verificationResults.generalError}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractVerifier;
