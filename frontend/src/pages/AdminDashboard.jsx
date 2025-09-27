import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Shield, Building, Users, Plus, Pause, Play, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { account, isConnected, contracts, isAdmin } = useWeb3();
  const [walletAddress, setWalletAddress] = useState('');
  const [propertyForm, setPropertyForm] = useState({
    name: '',
    symbol: '',
    creator: '',
    deedHash: '',
    appraisalHash: '',
    kycDocHash: ''
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isConnected && contracts.multiPropertyManager) {
      loadProperties();
    }
  }, [isConnected, contracts]);

  const loadProperties = async () => {
    try {
      if (!contracts.multiPropertyManager) return;

      const nextId = await contracts.multiPropertyManager.nextPropertyId();
      const propertyList = [];

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

      setProperties(propertyList);
    } catch (error) {
      console.error('Error loading properties:', error);
    }
  };

  const verifyWallet = async () => {
    if (!walletAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    try {
      setLoading(true);
      const tx = await contracts.identityRegistry.verifyWallet(walletAddress);
      await tx.wait();
      toast.success('Wallet verified successfully');
      setWalletAddress('');
    } catch (error) {
      console.error('Error verifying wallet:', error);
      toast.error('Failed to verify wallet');
    } finally {
      setLoading(false);
    }
  };

  const revokeWallet = async () => {
    if (!walletAddress.trim()) {
      toast.error('Please enter a wallet address');
      return;
    }

    try {
      setLoading(true);
      const tx = await contracts.identityRegistry.revokeWallet(walletAddress);
      await tx.wait();
      toast.success('Wallet verification revoked');
      setWalletAddress('');
    } catch (error) {
      console.error('Error revoking wallet:', error);
      toast.error('Failed to revoke wallet');
    } finally {
      setLoading(false);
    }
  };

  const addProperty = async () => {
    if (!propertyForm.name || !propertyForm.symbol || !propertyForm.creator) {
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
        propertyForm.kycDocHash || ethers.encodeBytes32String('default_kyc')
      );
      await tx.wait();
      toast.success('Property added successfully');
      setPropertyForm({
        name: '',
        symbol: '',
        creator: '',
        deedHash: '',
        appraisalHash: '',
        kycDocHash: ''
      });
      loadProperties();
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

      {/* Wallet Management */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Wallet Management
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="label">Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="input-field"
            />
            <div className="flex space-x-2 mt-4">
              <button
                onClick={verifyWallet}
                disabled={loading}
                className="btn-primary flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Verify Wallet</span>
              </button>
              <button
                onClick={revokeWallet}
                disabled={loading}
                className="btn-danger flex items-center space-x-2"
              >
                <XCircle className="h-4 w-4" />
                <span>Revoke Wallet</span>
              </button>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Enter a wallet address to verify or revoke</li>
              <li>• Verified wallets can participate in the platform</li>
              <li>• Revoked wallets lose access to platform features</li>
            </ul>
          </div>
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
            <label className="label">Deed Hash</label>
            <input
              type="text"
              value={propertyForm.deedHash}
              onChange={(e) => setPropertyForm({...propertyForm, deedHash: e.target.value})}
              placeholder="Optional: IPFS hash or document hash"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Appraisal Hash</label>
            <input
              type="text"
              value={propertyForm.appraisalHash}
              onChange={(e) => setPropertyForm({...propertyForm, appraisalHash: e.target.value})}
              placeholder="Optional: Appraisal document hash"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">KYC Document Hash</label>
            <input
              type="text"
              value={propertyForm.kycDocHash}
              onChange={(e) => setPropertyForm({...propertyForm, kycDocHash: e.target.value})}
              placeholder="Optional: KYC document hash"
              className="input-field"
            />
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
  );
};

export default AdminDashboard;
