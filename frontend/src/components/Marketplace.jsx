import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Building, TrendingUp, ShoppingCart, DollarSign, Users } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const Marketplace = () => {
  const { account, isConnected, contracts, isWalletVerified } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [purchaseForm, setPurchaseForm] = useState({
    propertyId: '',
    amount: ''
  });
  const [sellForm, setSellForm] = useState({
    propertyId: '',
    amount: '',
    pricePerToken: ''
  });
  const [uploadForm, setUploadForm] = useState({
    name: '',
    symbol: '',
    propertyValue: '',
    totalTokens: '',
    deedHash: '',
    appraisalHash: '',
    kycDocHash: ''
  });
  const [activeTab, setActiveTab] = useState('buy'); // 'buy', 'sell', 'upload'
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [userTokenBalances, setUserTokenBalances] = useState({});

  useEffect(() => {
    if (isConnected && contracts.multiPropertyManager) {
      // Add a small delay to ensure contract is fully initialized
      const timer = setTimeout(() => {
        loadData();
      }, 100);
      
      return () => clearTimeout(timer);
    } else if (isConnected && !contracts.multiPropertyManager) {
      setDataLoading(false);
    }
  }, [isConnected, contracts]);

  // Reload market data when properties change
  useEffect(() => {
    if (properties.length > 0) {
      loadMarketData();
    }
  }, [properties]);

  // Reload data when account changes
  useEffect(() => {
    if (isConnected && contracts.multiPropertyManager && account) {
      loadData();
    }
  }, [account]);

  // Load user token balances when properties change
  useEffect(() => {
    if (properties.length > 0 && account) {
      loadUserTokenBalances();
    }
  }, [properties, account]);

  const loadData = async () => {
    try {
      setDataLoading(true);
      // Check if user is verified
      if (account) {
        const verified = await isWalletVerified();
        setIsVerified(verified);
      }

      // Load properties first
      await loadProperties();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load marketplace data');
    } finally {
      setDataLoading(false);
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

      console.log('Marketplace: Loading properties...', {
        contract: !!contracts.multiPropertyManager,
        nextPropertyId: typeof contracts.multiPropertyManager.nextPropertyId
      });

      let nextId;
      try {
        nextId = await contracts.multiPropertyManager.nextPropertyId();
        console.log('Marketplace: Next property ID:', nextId.toString());
      } catch (error) {
        console.error('Marketplace: Error calling nextPropertyId:', error);
        // Fallback: try to get properties by checking individual IDs
        console.log('Marketplace: Trying fallback method...');
        nextId = 1; // Start with 1 and try to find properties
      }
      
      const propertyList = [];

      // If nextPropertyId failed, try to find properties by checking individual IDs
      if (nextId === 1) {
        console.log('Marketplace: Using fallback method to find properties...');
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
                propertyValue: property.propertyValue,
                totalTokens: property.totalTokens,
                tokenPrice: property.tokenPrice,
                isActive: property.isActive
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
              propertyValue: property.propertyValue,
              totalTokens: property.totalTokens,
              tokenPrice: property.tokenPrice,
              isActive: property.isActive
            });
          } catch (error) {
            console.error(`Error loading property ${i}:`, error);
          }
        }
      }

      console.log('Marketplace: Loaded properties:', propertyList.length);
      setProperties(propertyList);
    } catch (error) {
      console.error('Error loading properties:', error);
      toast.error('Failed to load properties');
    }
  };

  const loadMarketData = async () => {
    try {
      if (!contracts.multiPropertyManager) return;
      console.log('Marketplace: Loading market data for', properties.length, 'properties');

      const data = {};
      for (const property of properties) {
        try {
          const marketInfo = await contracts.multiPropertyManager.getPropertyMarketData(property.id);
          
          data[property.id] = {
            propertyValue: marketInfo.propertyValue,
            totalTokens: marketInfo.totalTokens,
            tokenPrice: marketInfo.tokenPrice,
            availableTokens: marketInfo.availableTokens, // Use the value from contract
            isActive: marketInfo.isActive
          };
        } catch (error) {
          console.error(`Error loading market data for property ${property.id}:`, error);
          // Set default values if there's an error
          data[property.id] = {
            propertyValue: property.propertyValue,
            totalTokens: property.totalTokens,
            tokenPrice: property.tokenPrice,
            availableTokens: 0,
            isActive: property.isActive
          };
        }
      }
      console.log('Marketplace: Market data loaded:', data);
      setMarketData(data);
    } catch (error) {
      console.error('Error loading market data:', error);
      toast.error('Failed to load market data');
    }
  };

  const loadUserTokenBalances = async () => {
    try {
      if (!account) return;
      
      const balances = {};
      for (const property of properties) {
        try {
          const tokenContract = new ethers.Contract(
            property.tokenContract,
            ["function balanceOf(address owner) external view returns (uint256)"],
            contracts.multiPropertyManager.runner
          );
          const balance = await tokenContract.balanceOf(account);
          balances[property.id] = balance;
        } catch (error) {
          console.error(`Error loading balance for property ${property.id}:`, error);
          balances[property.id] = 0;
        }
      }
      setUserTokenBalances(balances);
    } catch (error) {
      console.error('Error loading user token balances:', error);
    }
  };

  const sellTokens = async () => {
    if (!sellForm.propertyId || !sellForm.amount || !sellForm.pricePerToken) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate inputs
    const amountValue = parseFloat(sellForm.amount);
    const priceValue = parseFloat(sellForm.pricePerToken);
    
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }
    
    if (isNaN(priceValue) || priceValue <= 0) {
      toast.error('Please enter a valid price greater than 0');
      return;
    }

    const property = properties.find(p => p.id === parseInt(sellForm.propertyId));
    if (!property) {
      toast.error('Property not found');
      return;
    }

    // Check if user has enough tokens
    const userBalance = userTokenBalances[property.id] || 0;
    const amount = ethers.parseEther(sellForm.amount);
    
    if (userBalance < amount) {
      toast.error(`Insufficient tokens. You have ${ethers.formatEther(userBalance)} tokens.`);
      return;
    }

    try {
      setLoading(true);
      
      // For now, we'll just show a message that selling requires a buyer
      // In a real implementation, you'd need a more sophisticated order book system
      toast.success('Token selling functionality requires a buyer. This feature will be enhanced in future updates.');
      
      setSellForm({ propertyId: '', amount: '', pricePerToken: '' });
    } catch (error) {
      console.error('Error selling tokens:', error);
      toast.error('Failed to sell tokens');
    } finally {
      setLoading(false);
    }
  };

  const uploadProperty = async () => {
    if (!uploadForm.name || !uploadForm.symbol || !uploadForm.propertyValue || !uploadForm.totalTokens) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const tx = await contracts.multiPropertyManager.addProperty(
        uploadForm.name,
        uploadForm.symbol,
        account, // User becomes the creator
        uploadForm.deedHash || ethers.encodeBytes32String('default_deed'),
        uploadForm.appraisalHash || ethers.encodeBytes32String('default_appraisal'),
        uploadForm.kycDocHash || ethers.encodeBytes32String('default_kyc'),
        ethers.parseEther(uploadForm.propertyValue),
        ethers.parseEther(uploadForm.totalTokens)
      );
      await tx.wait();
      toast.success('Property uploaded successfully! You can now mint tokens for sale.');
      setUploadForm({
        name: '',
        symbol: '',
        propertyValue: '',
        totalTokens: '',
        deedHash: '',
        appraisalHash: '',
        kycDocHash: ''
      });
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error uploading property:', error);
      toast.error('Failed to upload property');
    } finally {
      setLoading(false);
    }
  };

  const buyTokens = async () => {
    if (!purchaseForm.propertyId || !purchaseForm.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate amount input
    const amountValue = parseFloat(purchaseForm.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    const property = properties.find(p => p.id === parseInt(purchaseForm.propertyId));
    if (!property) {
      toast.error('Property not found');
      return;
    }

    const marketInfo = marketData[property.id];
    if (!marketInfo || !marketInfo.isActive) {
      toast.error('Property is not active for trading');
      return;
    }

    let amount, totalCost;
    try {
      amount = ethers.parseEther(purchaseForm.amount);
      totalCost = marketInfo.tokenPrice * amount;
    } catch (error) {
      console.error('Error parsing amount:', error);
      toast.error('Invalid amount format. Please enter a valid number.');
      return;
    }

    if (marketInfo.availableTokens < amount) {
      toast.error(`Insufficient tokens available. Only ${ethers.formatEther(marketInfo.availableTokens)} tokens available for purchase.`);
      return;
    }

    try {
      setLoading(true);
      
      // First, check if creator has approved the contract to transfer tokens
      const tokenContract = new ethers.Contract(
        property.tokenContract,
        [
          "function allowance(address owner, address spender) external view returns (uint256)",
          "function approve(address spender, uint256 amount) external returns (bool)"
        ],
        contracts.multiPropertyManager.runner
      );
      
      const allowance = await tokenContract.allowance(property.creator, contracts.multiPropertyManager.address);
      
      if (allowance < amount) {
        toast.error('Creator has not approved enough tokens for sale. Please contact the property creator to mint and approve tokens.');
        return;
      }

      const tx = await contracts.multiPropertyManager.buyTokens(
        parseInt(purchaseForm.propertyId),
        amount,
        { value: totalCost }
      );
      await tx.wait();
      toast.success('Tokens purchased successfully');
      setPurchaseForm({ propertyId: '', amount: '' });
      await loadMarketData(); // Refresh market data
    } catch (error) {
      console.error('Error buying tokens:', error);
      if (error.message.includes('Insufficient payment')) {
        toast.error('Insufficient payment for tokens');
      } else if (error.message.includes('Insufficient tokens available')) {
        toast.error('Not enough tokens available for purchase');
      } else if (error.message.includes('Wallet not verified')) {
        toast.error('Your wallet needs to be verified to buy tokens');
      } else if (error.message.includes('Property not active')) {
        toast.error('This property is not active for trading');
      } else {
        toast.error(`Failed to buy tokens: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to access the marketplace</p>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Marketplace</h2>
        <p className="text-gray-600">Please wait while we load available properties...</p>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Verification Required</h2>
        <p className="text-gray-600">Your wallet needs to be verified by an admin to buy property tokens</p>
      </div>
    );
  }

  const activeProperties = properties.filter(property => 
    marketData[property.id]?.isActive
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Token Marketplace</h1>
          <p className="text-gray-600">Buy, sell, and upload fractional ownership tokens for real estate properties</p>
        </div>
        <button
          onClick={loadData}
          disabled={dataLoading}
          className="btn-secondary flex items-center space-x-2"
        >
          <TrendingUp className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('buy')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'buy'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ShoppingCart className="h-4 w-4 inline mr-2" />
            Buy Tokens
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sell'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <TrendingUp className="h-4 w-4 inline mr-2" />
            Sell Tokens
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upload'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="h-4 w-4 inline mr-2" />
            Upload Property
          </button>
        </nav>
      </div>

      {/* Buy Tokens Tab */}
      {activeTab === 'buy' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Buy Property Tokens
          </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="label">Select Property</label>
            <select
              value={purchaseForm.propertyId}
              onChange={(e) => setPurchaseForm({...purchaseForm, propertyId: e.target.value})}
              className="input-field"
            >
              <option value="">Choose a property</option>
              {activeProperties.map(property => (
                <option key={property.id} value={property.id}>
                  {property.name} ({property.symbol}) - {ethers.formatEther(marketData[property.id]?.tokenPrice || '0')} ETH/token
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Amount (Tokens)</label>
            <input
              type="number"
              value={purchaseForm.amount}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow positive numbers and decimal points
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  setPurchaseForm({...purchaseForm, amount: value});
                }
              }}
              onKeyDown={(e) => {
                // Prevent negative sign, 'e', 'E', '+', '-'
                if (['e', 'E', '+', '-'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder="100"
              min="0"
              step="0.000001"
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={buyTokens}
              disabled={loading || activeProperties.length === 0}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Buy Tokens</span>
            </button>
          </div>
        </div>
        {purchaseForm.propertyId && purchaseForm.amount && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Total Cost:</strong> {(() => {
                try {
                  const amount = parseFloat(purchaseForm.amount);
                  if (isNaN(amount) || amount <= 0) return '0';
                  const tokenPrice = marketData[purchaseForm.propertyId]?.tokenPrice || 0;
                  const totalCost = tokenPrice * ethers.parseEther(amount.toString());
                  return ethers.formatEther(totalCost);
                } catch (error) {
                  console.error('Error calculating total cost:', error);
                  return '0';
                }
              })()} ETH
            </p>
          </div>
        )}
        </div>
      )}

      {/* Sell Tokens Tab */}
      {activeTab === 'sell' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Sell Your Tokens
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <label className="label">Select Property</label>
              <select
                value={sellForm.propertyId}
                onChange={(e) => setSellForm({...sellForm, propertyId: e.target.value})}
                className="input-field"
              >
                <option value="">Choose a property</option>
                {properties.filter(p => (userTokenBalances[p.id] || 0) > 0).map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name} ({property.symbol}) - You have {ethers.formatEther(userTokenBalances[property.id] || 0)} tokens
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Amount (Tokens)</label>
              <input
                type="number"
                value={sellForm.amount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setSellForm({...sellForm, amount: value});
                  }
                }}
                placeholder="100"
                min="0"
                step="0.000001"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Price per Token (ETH)</label>
              <input
                type="number"
                value={sellForm.pricePerToken}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setSellForm({...sellForm, pricePerToken: value});
                  }
                }}
                placeholder="0.001"
                min="0"
                step="0.000001"
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={sellTokens}
              disabled={loading || properties.filter(p => (userTokenBalances[p.id] || 0) > 0).length === 0}
              className="btn-primary flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Sell Tokens</span>
            </button>
          </div>
          {sellForm.propertyId && sellForm.amount && sellForm.pricePerToken && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Total Revenue:</strong> {(() => {
                  try {
                    const amount = parseFloat(sellForm.amount);
                    const price = parseFloat(sellForm.pricePerToken);
                    if (isNaN(amount) || isNaN(price) || amount <= 0 || price <= 0) return '0';
                    return (amount * price).toFixed(6);
                  } catch (error) {
                    return '0';
                  }
                })()} ETH
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Property Tab */}
      {activeTab === 'upload' && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Upload New Property
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="label">Property Name *</label>
              <input
                type="text"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                placeholder="e.g., Downtown Office Building"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Symbol *</label>
              <input
                type="text"
                value={uploadForm.symbol}
                onChange={(e) => setUploadForm({...uploadForm, symbol: e.target.value})}
                placeholder="e.g., DOB"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Property Value (ETH) *</label>
              <input
                type="number"
                value={uploadForm.propertyValue}
                onChange={(e) => setUploadForm({...uploadForm, propertyValue: e.target.value})}
                placeholder="1000000"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Total Tokens *</label>
              <input
                type="number"
                value={uploadForm.totalTokens}
                onChange={(e) => setUploadForm({...uploadForm, totalTokens: e.target.value})}
                placeholder="1000000"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Deed Hash</label>
              <input
                type="text"
                value={uploadForm.deedHash}
                onChange={(e) => setUploadForm({...uploadForm, deedHash: e.target.value})}
                placeholder="Optional: IPFS hash or document hash"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Appraisal Hash</label>
              <input
                type="text"
                value={uploadForm.appraisalHash}
                onChange={(e) => setUploadForm({...uploadForm, appraisalHash: e.target.value})}
                placeholder="Optional: Appraisal document hash"
                className="input-field"
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">KYC Document Hash</label>
              <input
                type="text"
                value={uploadForm.kycDocHash}
                onChange={(e) => setUploadForm({...uploadForm, kycDocHash: e.target.value})}
                placeholder="Optional: KYC document hash"
                className="input-field"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={uploadProperty}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              <Building className="h-4 w-4" />
              <span>Upload Property</span>
            </button>
          </div>
        </div>
      )}

      {/* Available Properties */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Building className="h-5 w-5 mr-2" />
            Available Properties ({activeProperties.length})
          </h2>
          <div className="text-sm text-gray-500">
            Properties with tokens available for purchase
          </div>
        </div>
        {activeProperties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>No properties available for trading.</p>
            <p className="text-sm mt-2">Property creators need to mint and approve tokens for sale first.</p>
            <p className="text-xs mt-1 text-gray-400">Available tokens = Creator's token balance (0 if not minted yet)</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProperties.map((property) => {
              const marketInfo = marketData[property.id];
              return (
                <div key={property.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                    <span className="text-sm text-gray-500 bg-green-100 px-2 py-1 rounded">
                      {property.symbol}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Value:</span>
                      <span className="font-medium">{ethers.formatEther(marketInfo?.propertyValue || '0')} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Token Price:</span>
                      <span className="font-medium">{ethers.formatEther(marketInfo?.tokenPrice || '0')} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Tokens:</span>
                      <span className={`font-medium ${(marketInfo?.availableTokens || 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {ethers.formatEther(marketInfo?.availableTokens || '0')}
                        {(marketInfo?.availableTokens || 0) === 0 && (
                          <span className="text-xs ml-1">(Not minted)</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Your Tokens:</span>
                      <span className={`font-medium ${(userTokenBalances[property.id] || 0) > 0 ? 'text-blue-600' : 'text-gray-500'}`}>
                        {ethers.formatEther(userTokenBalances[property.id] || '0')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Creator:</span>
                      <span className="text-xs">{property.creator.slice(0, 6)}...{property.creator.slice(-4)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setPurchaseForm({...purchaseForm, propertyId: property.id.toString()});
                          setActiveTab('buy');
                        }}
                        disabled={(marketInfo?.availableTokens || 0) === 0}
                        className={`flex-1 text-sm ${
                          (marketInfo?.availableTokens || 0) === 0 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed px-4 py-2 rounded-md' 
                            : 'btn-primary'
                        }`}
                      >
                        {(marketInfo?.availableTokens || 0) === 0 ? 'No Tokens Available' : 'Buy Tokens'}
                      </button>
                      {(userTokenBalances[property.id] || 0) > 0 && (
                        <button
                          onClick={() => {
                            setSellForm({...sellForm, propertyId: property.id.toString()});
                            setActiveTab('sell');
                          }}
                          className="flex-1 text-sm btn-secondary"
                        >
                          Sell Tokens
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
