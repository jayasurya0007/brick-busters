import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Building, Users, Plus, TrendingUp, Wallet } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const PropertyCreatorDashboard = () => {
  const { account, isConnected, contracts, isWalletVerified } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [mintForm, setMintForm] = useState({
    propertyId: '',
    recipient: '',
    amount: ''
  });
  const [listForm, setListForm] = useState({
    propertyId: '',
    amount: '',
    pricePerToken: ''
  });

  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isConnected && contracts.multiPropertyManager) {
      // Add a small delay to ensure contract is fully initialized
      const timer = setTimeout(() => {
        loadData();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, contracts]);

  const loadData = async () => {
    try {
      // Check if user is verified
      if (account) {
        const verified = await isWalletVerified();
        setIsVerified(verified);
      }

      // Load properties
      await loadProperties();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

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
      toast.error('Failed to load properties');
    }
  };

  const mintTokens = async () => {
    if (!mintForm.propertyId || !mintForm.recipient || !mintForm.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    // Check if user is the creator of this property
    const selectedProperty = properties.find(p => p.id === parseInt(mintForm.propertyId));
    if (!selectedProperty) {
      toast.error('Property not found');
      return;
    }

    if (selectedProperty.creator.toLowerCase() !== account?.toLowerCase()) {
      toast.error('You can only mint tokens for properties you created');
      return;
    }

    try {
      setLoading(true);
      const tx = await contracts.multiPropertyManager.mintTokens(
        parseInt(mintForm.propertyId),
        mintForm.recipient,
        ethers.parseEther(mintForm.amount)
      );
      await tx.wait();
      toast.success('Tokens minted successfully');
      setMintForm({ propertyId: '', recipient: '', amount: '' });
    } catch (error) {
      console.error('Error minting tokens:', error);
      if (error.message.includes('Ownable: caller is not the owner')) {
        toast.error('You are not authorized to mint tokens for this property');
      } else {
        toast.error('Failed to mint tokens');
      }
    } finally {
      setLoading(false);
    }
  };

  const listTokensForSale = async () => {
    if (!listForm.propertyId || !listForm.amount || !listForm.pricePerToken) {
      toast.error('Please fill in all fields');
      return;
    }

    const selectedProperty = properties.find(p => p.id === parseInt(listForm.propertyId));
    if (!selectedProperty) {
      toast.error('Property not found');
      return;
    }

    if (selectedProperty.creator.toLowerCase() !== account?.toLowerCase()) {
      toast.error('You can only list tokens for properties you created');
      return;
    }

    try {
      setLoading(true);
      
      // First approve tokens for the marketplace contract
      const tokenContract = new ethers.Contract(
        selectedProperty.tokenContract,
        [
          "function approve(address spender, uint256 amount) external returns (bool)",
          "function balanceOf(address owner) external view returns (uint256)"
        ],
        contracts.multiPropertyManager.runner
      );

      const amount = ethers.parseEther(listForm.amount);
      const balance = await tokenContract.balanceOf(account);
      
      if (balance < amount) {
        toast.error('Insufficient token balance');
        return;
      }

      // Approve tokens for marketplace
      const approveTx = await tokenContract.approve(
        contracts.multiPropertyManager.target,
        amount
      );
      await approveTx.wait();
      
      toast.success('Tokens approved for sale successfully. Buyers can now purchase them from the marketplace.');
      setListForm({ propertyId: '', amount: '', pricePerToken: '' });
      await loadProperties();
    } catch (error) {
      console.error('Error approving tokens for sale:', error);
      toast.error('Failed to approve tokens for sale');
    } finally {
      setLoading(false);
    }
  };



  const getMyProperties = () => {
    return properties.filter(property => 
      property.creator.toLowerCase() === account?.toLowerCase()
    );
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center py-20 max-w-md mx-auto px-6">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
            <Building className="h-16 w-16 text-primary-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-dark-text-primary mb-4">Connect Your Wallet</h2>
            <p className="text-dark-text-secondary mb-8">Please connect your wallet to access the creator dashboard and manage your properties</p>
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
              <p className="text-sm text-primary-400">MetaMask wallet required for property management</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center py-20 max-w-md mx-auto px-6">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
            <Users className="h-16 w-16 text-dark-warning mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-dark-text-primary mb-4">Verification Required</h2>
            <p className="text-dark-text-secondary mb-8">Your wallet needs to be verified through our KYC process to create and manage properties</p>
            <div className="bg-dark-warning/10 border border-dark-warning/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-dark-warning">Complete identity verification to access creator features</p>
            </div>
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center mx-auto group">
              <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Start Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myProperties = getMyProperties();

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/90 to-transparent z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
          }}
        ></div>
        
        {/* Content */}
        <div className="relative z-20 container mx-auto px-6 lg:px-8 py-16">
          <div className="max-w-4xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-xl p-3">
                <Building className="h-8 w-8 text-secondary-500" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-dark-text-primary leading-tight">
                  Creator Dashboard
                </h1>
                <p className="text-xl text-dark-text-secondary mt-2">
                  Manage your properties and mint tokens for investors
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    <main className="container mx-auto px-6 lg:px-8 py-12">
    <div className="space-y-12">

      {/* Mint Tokens */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Mint Tokens
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="label">Property ID</label>
            <select
              value={mintForm.propertyId}
              onChange={(e) => setMintForm({...mintForm, propertyId: e.target.value})}
              className="input-field"
            >
              <option value="">Select Property</option>
              {myProperties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name} ({property.symbol})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Recipient Address</label>
            <input
              type="text"
              value={mintForm.recipient}
              onChange={(e) => setMintForm({...mintForm, recipient: e.target.value})}
              placeholder="0x..."
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Amount (Tokens)</label>
            <input
              type="number"
              value={mintForm.amount}
              onChange={(e) => setMintForm({...mintForm, amount: e.target.value})}
              placeholder="1000"
              className="input-field"
            />
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={mintTokens}
            disabled={loading || myProperties.length === 0}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Mint Tokens</span>
          </button>
        </div>
        {myProperties.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-600 border border-yellow-500 rounded-lg">
            <p className="text-sm text-white">
              <strong>No properties found:</strong> You don't have any properties yet. Properties will be created for you once you're verified.
            </p>
            <p className="text-xs text-white mt-1">
              Only property creators can mint tokens for their properties.
            </p>
          </div>
        )}
      </div>

      {/* List Tokens for Sale */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          List Tokens for Sale
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="label">Property ID</label>
            <select
              value={listForm.propertyId}
              onChange={(e) => setListForm({...listForm, propertyId: e.target.value})}
              className="input-field"
            >
              <option value="">Select Property</option>
              {myProperties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name} ({property.symbol})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount (Tokens)</label>
            <input
              type="number"
              value={listForm.amount}
              onChange={(e) => setListForm({...listForm, amount: e.target.value})}
              placeholder="100"
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Price per Token (ETH)</label>
            <input
              type="number"
              step="0.001"
              value={listForm.pricePerToken}
              onChange={(e) => setListForm({...listForm, pricePerToken: e.target.value})}
              placeholder="0.01"
              className="input-field"
            />
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={listTokensForSale}
            disabled={loading || myProperties.length === 0}
            className="btn-primary flex items-center space-x-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>List for Sale</span>
          </button>
        </div>
      </div>

      {/* My Properties */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Building className="h-5 w-5 mr-2" />
          My Properties ({myProperties.length})
        </h2>
        <p className="text-sm text-white mb-4">
          Properties you created. You can mint and prepare tokens for these properties.
        </p>
        {myProperties.length === 0 ? (
          <div className="text-center py-8 text-white">
            <Building className="h-12 w-12 text-white mx-auto mb-4" />
            <p>You don't have any properties yet.</p>
            <p className="text-sm">Upload a property in the marketplace to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProperties.map((property) => (
              <div key={property.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{property.name}</h3>
                  <span className="text-sm text-white bg-gray-600 px-2 py-1 rounded">
                    {property.symbol}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-white mb-4">
                  <div>ID: {property.id}</div>
                  <div>Token Contract: {property.tokenContract.slice(0, 6)}...{property.tokenContract.slice(-4)}</div>
                </div>
                <div className="flex space-x-2">
                  {property.creator.toLowerCase() === account?.toLowerCase() ? (
                    <button 
                      onClick={() => {
                        setMintForm({...mintForm, propertyId: property.id.toString()});
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={loading}
                      className="btn-primary text-sm flex-1"
                    >
                      Mint Tokens
                    </button>
                  ) : (
                    <div className="flex-1 text-sm text-white text-center py-2">
                      Created by {property.creator.slice(0, 6)}...{property.creator.slice(-4)}
                    </div>
                  )}
                  <button className="btn-secondary text-sm flex-1">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Properties */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          All Properties ({properties.length})
        </h2>
        {properties.length === 0 ? (
          <div className="text-center py-8 text-white">
            No properties found on the platform.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Creator
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Token Contract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-700">
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">{property.name}</div>
                        <div className="text-sm text-white">{property.symbol}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {property.creator.slice(0, 6)}...{property.creator.slice(-4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {property.tokenContract.slice(0, 6)}...{property.tokenContract.slice(-4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {property.creator.toLowerCase() === account?.toLowerCase() ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-600 text-white">
                          Your Property
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-white">
                          Other
                        </span>
                      )}
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
    </div>
  );
};

export default PropertyCreatorDashboard;
