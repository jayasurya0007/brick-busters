import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Shield, Building, Users, Plus, Pause, Play, CheckCircle, XCircle } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import WalrusFileUpload from '../components/WalrusFileUpload';
import { useWalrus } from '../hooks/useWalrus';

const AdminDashboard = () => {
  const { account, isConnected, contracts, isAdmin } = useWeb3();
  const { generateDocumentHash } = useWalrus();
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    symbol: '',
    creator: '',
    deedHash: '',
    appraisalHash: '',
    kycDocHash: '',
    propertyValue: '',
    totalTokens: ''
  });
  const [uploadedDocuments, setUploadedDocuments] = useState({
    deed: null,
    appraisal: null,
    kyc: null
  });
  const [properties, setProperties] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && contracts.multiPropertyManager) {
      // Add a small delay to ensure contract is fully initialized
      const timer = setTimeout(() => {
        loadProperties();
        loadPendingVerifications();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, contracts]);

  const loadProperties = async () => {
    try {
      if (!contracts.multiPropertyManager) {
        console.error('MultiPropertyManager contract not available');
        return;
      }

      // Validate contract has required methods
      if (typeof contracts.multiPropertyManager.nextPropertyId !== 'function') {
        console.error('Contract missing nextPropertyId function. Contract object:', contracts.multiPropertyManager);
        console.error('Available methods:', Object.getOwnPropertyNames(contracts.multiPropertyManager));
        return;
      }

      console.log('Loading properties...', {
        contract: !!contracts.multiPropertyManager,
        nextPropertyId: typeof contracts.multiPropertyManager.nextPropertyId
      });

      let nextId;
      try {
        nextId = await contracts.multiPropertyManager.nextPropertyId();
        console.log('Next property ID:', nextId.toString());
      } catch (error) {
        console.error('Error calling nextPropertyId:', error);
        // Fallback: try to get properties by checking individual IDs
        console.log('Trying fallback method...');
        nextId = 1; // Start with 1 and try to find properties
      }
      
      const propertyList = [];

      // If nextPropertyId failed, try to find properties by checking individual IDs
      if (nextId === 1) {
        console.log('Using fallback method to find properties...');
        let foundProperties = 0;
        for (let i = 1; i <= 10; i++) { // Check up to 10 properties
          try {
            const property = await contracts.multiPropertyManager.properties(i);
            if (property.name && property.name !== '') {
              propertyList.push({
                id: i,
                name: property.name,
                symbol: property.symbol,
                creator: property.creator,
                tokenContract: property.tokenContract,
                deedHash: property.deedHash,
                appraisalHash: property.appraisalHash,
                kycDocHash: property.kycDocHash
              });
              foundProperties++;
            }
          } catch (error) {
            // Property doesn't exist, continue
            if (foundProperties === 0 && i > 3) break; // Stop if no properties found after checking a few
          }
        }
      } else {
        // Normal flow with nextPropertyId
        for (let i = 1; i < nextId; i++) {
          try {
            const property = await contracts.multiPropertyManager.properties(i);
            propertyList.push({
              id: i,
              name: property.name,
              symbol: property.symbol,
              creator: property.creator,
              tokenContract: property.tokenContract,
              deedHash: property.deedHash,
              appraisalHash: property.appraisalHash,
              kycDocHash: property.kycDocHash
            });
          } catch (error) {
            console.error(`Error loading property ${i}:`, error);
          }
        }
      }

      setProperties(propertyList);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const loadPendingVerifications = async () => {
    try {
      if (!contracts.identityRegistry) return;
      
      // Note: This is a simplified approach. In a real implementation,
      // you'd need to track verification requests through events or maintain a list
      // For now, we'll show a placeholder message
      setPendingVerifications([]);
    } catch (error) {
      console.error('Error loading pending verifications:', error);
    }
  };

  const approveVerification = async (walletAddress) => {
    try {
      setLoading(true);
      const tx = await contracts.identityRegistry.approveVerification(walletAddress);
      await tx.wait();
      toast.success('Verification approved successfully');
      await loadPendingVerifications();
    } catch (error) {
      console.error('Error approving verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setLoading(false);
    }
  };

  const rejectVerification = async (walletAddress) => {
    try {
      setLoading(true);
      const tx = await contracts.identityRegistry.rejectVerification(walletAddress);
      await tx.wait();
      toast.success('Verification rejected');
      await loadPendingVerifications();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = (documentType, uploadedFile) => {
    const hash = generateDocumentHash({ 
      name: uploadedFile.originalName, 
      size: uploadedFile.size 
    });
    
    setUploadedDocuments(prev => ({
      ...prev,
      [documentType]: {
        ...uploadedFile,
        hash: hash
      }
    }));

    // Update the form with the hash
    setPropertyForm(prev => ({
      ...prev,
      [`${documentType}Hash`]: hash
    }));

    toast.success(`${documentType} document uploaded successfully!`);
  };

  const addProperty = async () => {
    if (!propertyForm.name || !propertyForm.symbol || !propertyForm.creator || !propertyForm.propertyValue || !propertyForm.totalTokens) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const tx = await contracts.multiPropertyManager.addProperty(
        propertyForm.name,
        propertyForm.symbol,
        propertyForm.creator,
        propertyForm.deedHash || ethers.encodeBytes32String('default_deed'),
        propertyForm.appraisalHash || ethers.encodeBytes32String('default_appraisal'),
        propertyForm.kycDocHash || ethers.encodeBytes32String('default_kyc'),
        ethers.parseEther(propertyForm.propertyValue),
        ethers.parseEther(propertyForm.totalTokens)
      );
      await tx.wait();
      toast.success('Property added successfully');
      setPropertyForm({
        name: '',
        symbol: '',
        creator: '',
        deedHash: '',
        appraisalHash: '',
        kycDocHash: '',
        propertyValue: '',
        totalTokens: ''
      });
      setUploadedDocuments({
        deed: null,
        appraisal: null,
        kyc: null
      });
      await loadProperties();
    } catch (error) {
      console.error('Error adding property:', error);
      toast.error('Failed to add property');
    } finally {
      setLoading(false);
    }
  };

  const pauseContract = async () => {
    try {
      setLoading(true);
      const tx = await contracts.multiPropertyManager.pause();
      await tx.wait();
      toast.success('Contract paused');
    } catch (error) {
      console.error('Error pausing contract:', error);
      toast.error('Failed to pause contract');
    } finally {
      setLoading(false);
    }
  };

  const unpauseContract = async () => {
    try {
      setLoading(true);
      const tx = await contracts.multiPropertyManager.unpause();
      await tx.wait();
      toast.success('Contract unpaused');
    } catch (error) {
      console.error('Error unpausing contract:', error);
      toast.error('Failed to unpause contract');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to access the admin dashboard</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600">You need admin privileges to access this dashboard</p>
      </div>
    );
  }

  return (
    <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage the platform and oversee all properties</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={pauseContract}
            disabled={loading}
            className="btn-danger flex items-center space-x-2"
          >
            <Pause className="h-4 w-4" />
            <span>Pause</span>
          </button>
          <button
            onClick={unpauseContract}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Unpause</span>
          </button>
        </div>
      </div>


      {/* Add Property */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Building className="h-5 w-5 mr-2" />
          Add New Property
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="label">Property Name *</label>
            <input
              type="text"
              value={propertyForm.name}
              onChange={(e) => setPropertyForm({...propertyForm, name: e.target.value})}
              placeholder="e.g., Downtown Office Building"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Symbol *</label>
            <input
              type="text"
              value={propertyForm.symbol}
              onChange={(e) => setPropertyForm({...propertyForm, symbol: e.target.value})}
              placeholder="e.g., DOB"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Creator Address *</label>
            <input
              type="text"
              value={propertyForm.creator}
              onChange={(e) => setPropertyForm({...propertyForm, creator: e.target.value})}
              placeholder="0x..."
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Property Value (ETH) *</label>
            <input
              type="number"
              value={propertyForm.propertyValue}
              onChange={(e) => setPropertyForm({...propertyForm, propertyValue: e.target.value})}
              placeholder="1000000"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Total Tokens *</label>
            <input
              type="number"
              value={propertyForm.totalTokens}
              onChange={(e) => setPropertyForm({...propertyForm, totalTokens: e.target.value})}
              placeholder="1000000"
              className="input-field"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Property Deed Document</label>
            <WalrusFileUpload
              onUploadComplete={(file) => handleDocumentUpload('deed', file)}
              documentType="deed"
              propertyId="new"
              maxFiles={1}
              allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
              maxSize={10 * 1024 * 1024} // 10MB
            />
            {uploadedDocuments.deed && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ Deed uploaded: {uploadedDocuments.deed.originalName}
                </p>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="label">Property Appraisal Document</label>
            <WalrusFileUpload
              onUploadComplete={(file) => handleDocumentUpload('appraisal', file)}
              documentType="appraisal"
              propertyId="new"
              maxFiles={1}
              allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
              maxSize={10 * 1024 * 1024} // 10MB
            />
            {uploadedDocuments.appraisal && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ Appraisal uploaded: {uploadedDocuments.appraisal.originalName}
                </p>
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="label">KYC Document</label>
            <WalrusFileUpload
              onUploadComplete={(file) => handleDocumentUpload('kyc', file)}
              documentType="kyc"
              propertyId="new"
              maxFiles={1}
              allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
              maxSize={10 * 1024 * 1024} // 10MB
            />
            {uploadedDocuments.kyc && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ KYC document uploaded: {uploadedDocuments.kyc.originalName}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={addProperty}
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Properties List */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Properties ({properties.length})
        </h2>
        {properties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No properties found. Add a property to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token Contract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{property.name}</div>
                        <div className="text-sm text-gray-500">{property.symbol}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.creator.slice(0, 6)}...{property.creator.slice(-4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {property.tokenContract.slice(0, 6)}...{property.tokenContract.slice(-4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
    </main>
  );
};

export default AdminDashboard;
