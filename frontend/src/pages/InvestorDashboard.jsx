import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Users, TrendingUp, Wallet, ArrowUpRight, Building, Shield, CheckCircle, AlertCircle, ArrowRight, DollarSign, BarChart3, Eye, ShoppingCart } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const InvestorDashboard = () => {
  const { account, isConnected, contracts, isWalletVerified } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [tokenBalances, setTokenBalances] = useState({});
  const [revenueData, setRevenueData] = useState({});
  const [withdrawForm, setWithdrawForm] = useState({
    propertyId: '',
    amount: ''
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

      // Load properties and balances
      await loadProperties();
      await loadTokenBalances();
      await loadRevenueData();
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
        nextPropertyId: typeof contracts.multiPropertyManager.nextPropertyId,
        contractMethods: Object.getOwnPropertyNames(contracts.multiPropertyManager).filter(name => typeof contracts.multiPropertyManager[name] === 'function')
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

  const loadTokenBalances = async () => {
    try {
      if (!account || !contracts.multiPropertyManager) {
        console.error('Account or MultiPropertyManager contract not available');
        return;
      }

      console.log('Loading token balances...', {
        account: !!account,
        contract: !!contracts.multiPropertyManager,
        nextPropertyId: typeof contracts.multiPropertyManager.nextPropertyId
      });

      const balances = {};
      let nextId;
      try {
        nextId = await contracts.multiPropertyManager.nextPropertyId();
        console.log('Next property ID for balances:', nextId.toString());
      } catch (error) {
        console.error('Error calling nextPropertyId for balances:', error);
        // Fallback: try to get properties by checking individual IDs
        console.log('Trying fallback method for balances...');
        nextId = 1; // Start with 1 and try to find properties
      }

      // If nextPropertyId failed, try to find properties by checking individual IDs
      if (nextId === 1) {
        console.log('Using fallback method to find properties for balances...');
        let foundProperties = 0;
        for (let i = 1; i <= 10; i++) { // Check up to 10 properties
          try {
            const property = await contracts.multiPropertyManager.properties(i);
            if (property.name && property.name !== '') {
              const tokenContract = new ethers.Contract(
                property.tokenContract,
                [
                  "function balanceOf(address account) public view returns (uint256)",
                  "function totalSupply() public view returns (uint256)",
                  "function name() public view returns (string)",
                  "function symbol() public view returns (string)"
                ],
                contracts.multiPropertyManager.runner
              );

              const balance = await tokenContract.balanceOf(account);
              const totalSupply = await tokenContract.totalSupply();
              
              balances[i] = {
                balance: balance.toString(),
                totalSupply: totalSupply.toString(),
                percentage: totalSupply > 0 ? (Number(balance) / Number(totalSupply)) * 100 : 0
              };
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
            const tokenContract = new ethers.Contract(
              property.tokenContract,
              [
                "function balanceOf(address account) public view returns (uint256)",
                "function totalSupply() public view returns (uint256)",
                "function name() public view returns (string)",
                "function symbol() public view returns (string)"
              ],
              contracts.multiPropertyManager.runner
            );

            const balance = await tokenContract.balanceOf(account);
            const totalSupply = await tokenContract.totalSupply();
            
            balances[i] = {
              balance: balance.toString(),
              totalSupply: totalSupply.toString(),
              percentage: totalSupply > 0 ? (Number(balance) / Number(totalSupply)) * 100 : 0
            };
          } catch (error) {
            console.error(`Error loading balance for property ${i}:`, error);
          }
        }
      }

      setTokenBalances(balances);
    } catch (error) {
      console.error('Error loading token balances:', error);
      toast.error('Failed to load token balances');
    }
  };

  const loadRevenueData = async () => {
    try {
      if (!account || !contracts.multiPropertyManager) {
        console.error('Account or MultiPropertyManager contract not available');
        return;
      }

      console.log('Loading revenue data...', {
        account: !!account,
        contract: !!contracts.multiPropertyManager,
        nextPropertyId: typeof contracts.multiPropertyManager.nextPropertyId
      });

      const revenue = {};
      let nextId;
      try {
        nextId = await contracts.multiPropertyManager.nextPropertyId();
        console.log('Next property ID for revenue:', nextId.toString());
      } catch (error) {
        console.error('Error calling nextPropertyId for revenue:', error);
        // Fallback: try to get properties by checking individual IDs
        console.log('Trying fallback method for revenue...');
        nextId = 1; // Start with 1 and try to find properties
      }

      // If nextPropertyId failed, try to find properties by checking individual IDs
      if (nextId === 1) {
        console.log('Using fallback method to find properties for revenue...');
        let foundProperties = 0;
        for (let i = 1; i <= 10; i++) { // Check up to 10 properties
          try {
            const property = await contracts.multiPropertyManager.properties(i);
            if (property.name && property.name !== '') {
              const ethRevenue = await contracts.multiPropertyManager.availableEthRevenue(i, account);
              revenue[i] = {
                eth: ethRevenue.toString()
              };
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
            const ethRevenue = await contracts.multiPropertyManager.availableEthRevenue(i, account);
            revenue[i] = {
              eth: ethRevenue.toString()
            };
          } catch (error) {
            console.error(`Error loading revenue for property ${i}:`, error);
          }
        }
      }

      setRevenueData(revenue);
    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast.error('Failed to load revenue data');
    }
  };

  const withdrawEthRevenue = async (propertyId) => {
    try {
      setLoading(true);
      const tx = await contracts.multiPropertyManager.withdrawEthRevenue(propertyId);
      await tx.wait();
      toast.success('ETH revenue withdrawn successfully');
      await loadRevenueData();
    } catch (error) {
      console.error('Error withdrawing ETH revenue:', error);
      toast.error('Failed to withdraw ETH revenue');
    } finally {
      setLoading(false);
    }
  };

  const withdrawRevenue = async () => {
    if (!withdrawForm.propertyId || !withdrawForm.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    const property = properties.find(p => p.id === parseInt(withdrawForm.propertyId));
    if (!property) {
      toast.error('Property not found');
      return;
    }

    const revenue = revenueData[property.id];
    if (!revenue || Number(revenue.eth) < parseFloat(withdrawForm.amount)) {
      toast.error('Insufficient revenue balance');
      return;
    }

    try {
      setLoading(true);
      const tx = await contracts.multiPropertyManager.withdrawEthRevenue(
        parseInt(withdrawForm.propertyId)
      );
      await tx.wait();
      toast.success('Revenue withdrawn successfully');
      setWithdrawForm({ propertyId: '', amount: '' });
      await loadRevenueData();
    } catch (error) {
      console.error('Error withdrawing revenue:', error);
      toast.error('Failed to withdraw revenue');
    } finally {
      setLoading(false);
    }
  };

  const getMyProperties = () => {
    return properties.filter(property => {
      const balance = tokenBalances[property.id];
      return balance && Number(balance.balance) > 0;
    });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center py-20 max-w-md mx-auto px-6">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
            <Users className="h-16 w-16 text-primary-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-dark-text-primary mb-4">Connect Your Wallet</h2>
            <p className="text-dark-text-secondary mb-8">Please connect your wallet to access the investor dashboard and start managing your property investments</p>
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
              <p className="text-sm text-primary-400">MetaMask wallet required for secure authentication</p>
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
            <Shield className="h-16 w-16 text-dark-warning mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-dark-text-primary mb-4">Verification Required</h2>
            <p className="text-dark-text-secondary mb-8">Your wallet needs to be verified through our KYC process to invest in properties</p>
            <div className="bg-dark-warning/10 border border-dark-warning/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-dark-warning">Complete identity verification to access investor features</p>
            </div>
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center mx-auto group">
              <Shield className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Start Verification
            </button>
          </div>
        </div>
      </div>
    );
  }

  const myProperties = getMyProperties();
  const totalEthRevenue = Object.values(revenueData).reduce((sum, revenue) => sum + Number(revenue.eth), 0);

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/90 to-transparent z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1996&q=80')`
          }}
        ></div>
        
        {/* Content */}
        <div className="relative z-20 container mx-auto px-6 lg:px-8 py-16">
          <div className="max-w-4xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3">
                <Users className="h-8 w-8 text-primary-500" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-dark-text-primary leading-tight">
                  Investor Dashboard
                </h1>
                <p className="text-xl text-dark-text-secondary mt-2">
                  Manage your property investments and track revenue
                </p>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-lg p-4 max-w-md mb-8">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-secondary-500 mr-3" />
                <span className="text-secondary-500 font-medium">Wallet verified and ready to invest</span>
              </div>
            </div>

            {/* Portfolio Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-dark-card/50 backdrop-blur-sm border border-dark-border rounded-xl p-6">
                <div className="flex items-center">
                  <div className="bg-primary-500/10 rounded-lg p-3 mr-4">
                    <DollarSign className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-text-secondary">Portfolio Value</p>
                    <p className="text-2xl font-bold text-dark-text-primary">
                      {ethers.formatEther(totalEthRevenue.toString())} ETH
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-dark-card/50 backdrop-blur-sm border border-dark-border rounded-xl p-6">
                <div className="flex items-center">
                  <div className="bg-secondary-500/10 rounded-lg p-3 mr-4">
                    <Building className="h-6 w-6 text-secondary-500" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-text-secondary">Properties Owned</p>
                    <p className="text-2xl font-bold text-dark-text-primary">{myProperties.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-dark-card/50 backdrop-blur-sm border border-dark-border rounded-xl p-6">
                <div className="flex items-center">
                  <div className="bg-primary-500/10 rounded-lg p-3 mr-4">
                    <BarChart3 className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm text-dark-text-secondary">Total Tokens</p>
                    <p className="text-2xl font-bold text-dark-text-primary">
                      {Object.values(tokenBalances).reduce((sum, balance) => sum + Number(balance.balance), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    <main className="container mx-auto px-6 lg:px-8 py-12">
    <div className="space-y-12">

      {/* Revenue Summary */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 hover:border-primary-500/50 transition-all duration-300 group">
          <div className="flex items-center">
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 mr-6 group-hover:bg-primary-500/20 transition-all duration-300">
              <TrendingUp className="h-8 w-8 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-dark-text-secondary font-medium">Total ETH Revenue</p>
              <p className="text-3xl font-bold text-dark-text-primary mt-2">
                {ethers.formatEther(totalEthRevenue.toString())} ETH
              </p>
              <p className="text-xs text-secondary-500 mt-1">Available for withdrawal</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 hover:border-secondary-500/50 transition-all duration-300 group">
          <div className="flex items-center">
            <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-xl p-4 mr-6 group-hover:bg-secondary-500/20 transition-all duration-300">
              <Building className="h-8 w-8 text-secondary-500" />
            </div>
            <div>
              <p className="text-sm text-dark-text-secondary font-medium">Properties Owned</p>
              <p className="text-3xl font-bold text-dark-text-primary mt-2">{myProperties.length}</p>
              <p className="text-xs text-secondary-500 mt-1">Active investments</p>
            </div>
          </div>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 hover:border-primary-500/50 transition-all duration-300 group">
          <div className="flex items-center">
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 mr-6 group-hover:bg-primary-500/20 transition-all duration-300">
              <Wallet className="h-8 w-8 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-dark-text-secondary font-medium">Total Tokens</p>
              <p className="text-3xl font-bold text-dark-text-primary mt-2">
                {Object.values(tokenBalances).reduce((sum, balance) => sum + Number(balance.balance), 0)}
              </p>
              <p className="text-xs text-primary-500 mt-1">Token holdings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Revenue */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
        <div className="flex items-center mb-8">
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 mr-4">
            <Wallet className="h-6 w-6 text-primary-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-dark-text-primary">Withdraw Revenue</h2>
            <p className="text-dark-text-secondary">Claim your proportional share of property revenue</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-semibold text-dark-text-primary mb-3">Select Property</label>
            <select
              value={withdrawForm.propertyId}
              onChange={(e) => setWithdrawForm({...withdrawForm, propertyId: e.target.value})}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
            >
              <option value="">Choose a property...</option>
              {myProperties
                .filter(property => revenueData[property.id] && Number(revenueData[property.id].eth) > 0)
                .map(property => (
                  <option key={property.id} value={property.id} className="bg-dark-card">
                    {property.name} ({property.symbol}) - Available: {ethers.formatEther(revenueData[property.id]?.eth || 0)} ETH
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-dark-text-primary mb-3">Amount (ETH)</label>
            <input
              type="number"
              step="0.001"
              value={withdrawForm.amount}
              onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})}
              placeholder="0.1"
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
            />
          </div>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={withdrawRevenue}
            disabled={loading || myProperties.length === 0}
            className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 group"
          >
            <Wallet className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span>{loading ? 'Processing...' : 'Withdraw Revenue'}</span>
          </button>
        </div>
        
        <div className="mt-6 p-6 bg-secondary-500/10 border border-secondary-500/20 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-secondary-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-secondary-500 mb-1">Revenue Withdrawal Info</p>
              <p className="text-sm text-dark-text-secondary">
                Withdraw your proportional share of property revenue. Revenue is distributed based on your token ownership percentage and is available immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* My Properties */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-xl p-3 mr-4">
              <Building className="h-6 w-6 text-secondary-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark-text-primary">My Properties</h2>
              <p className="text-dark-text-secondary">{myProperties.length} active investments</p>
            </div>
          </div>
        </div>
        
        {myProperties.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-dark-bg border border-dark-border rounded-2xl p-12">
              <Building className="h-16 w-16 text-dark-text-secondary mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-dark-text-primary mb-4">No Properties Yet</h3>
              <p className="text-dark-text-secondary mb-6">You don't own any property tokens yet. Start investing to see your portfolio here.</p>
              <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center mx-auto group">
                <ShoppingCart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                Browse Properties
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8">
            {myProperties.map((property) => {
              const balance = tokenBalances[property.id];
              const revenue = revenueData[property.id];
              return (
                <div key={property.id} className="bg-dark-bg border border-dark-border rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-dark-text-primary group-hover:text-primary-400 transition-colors">{property.name}</h3>
                      <p className="text-dark-text-secondary font-medium">{property.symbol}</p>
                    </div>
                    <span className="text-sm text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full font-medium">
                      ID: {property.id}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                      <p className="text-sm text-dark-text-secondary font-medium mb-2">Token Balance</p>
                      <p className="text-lg font-bold text-dark-text-primary">
                        {ethers.formatEther(balance.balance)} {property.symbol}
                      </p>
                      <p className="text-sm text-secondary-500 mt-1">
                        {balance.percentage.toFixed(2)}% of total supply
                      </p>
                    </div>
                    <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                      <p className="text-sm text-dark-text-secondary font-medium mb-2">Available Revenue</p>
                      <p className="text-lg font-bold text-primary-500">
                        {ethers.formatEther(revenue?.eth || '0')} ETH
                      </p>
                      <p className="text-sm text-dark-text-secondary mt-1">Ready to withdraw</p>
                    </div>
                    <div className="bg-dark-card border border-dark-border rounded-lg p-4">
                      <p className="text-sm text-dark-text-secondary font-medium mb-2">Creator</p>
                      <p className="text-sm font-mono text-dark-text-primary">
                        {property.creator.slice(0, 6)}...{property.creator.slice(-4)}
                      </p>
                      <p className="text-sm text-dark-text-secondary mt-1">Property owner</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => withdrawEthRevenue(property.id)}
                      disabled={loading || !revenue?.eth || Number(revenue.eth) === 0}
                      className="bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 group"
                    >
                      <ArrowUpRight className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span>Withdraw ETH</span>
                    </button>
                    <button className="bg-dark-border hover:bg-dark-border/70 text-dark-text-primary py-2 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 group">
                      <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Properties */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 mr-4">
              <TrendingUp className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark-text-primary">All Properties</h2>
              <p className="text-dark-text-secondary">{properties.length} available for investment</p>
            </div>
          </div>
        </div>
        
        {properties.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-dark-bg border border-dark-border rounded-2xl p-12">
              <Building className="h-16 w-16 text-dark-text-secondary mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-dark-text-primary mb-4">No Properties Available</h3>
              <p className="text-dark-text-secondary">No properties found on the platform. Check back later for new investment opportunities.</p>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => {
              const balance = tokenBalances[property.id];
              const hasTokens = balance && Number(balance.balance) > 0;
              
              return (
                <div key={property.id} className="bg-dark-bg border border-dark-border rounded-xl p-6 hover:border-primary-500/50 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-dark-text-primary group-hover:text-primary-400 transition-colors">{property.name}</h3>
                    <span className="text-sm text-primary-500 bg-primary-500/10 px-3 py-1 rounded-full font-medium">
                      {property.symbol}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex items-center text-dark-text-secondary">
                      <Users className="h-4 w-4 mr-2" />
                      <span>Creator: </span>
                      <span className="font-mono ml-1">{property.creator.slice(0, 6)}...{property.creator.slice(-4)}</span>
                    </div>
                    <div className="flex items-center text-dark-text-secondary">
                      <Shield className="h-4 w-4 mr-2" />
                      <span>Contract: </span>
                      <span className="font-mono ml-1">{property.tokenContract.slice(0, 6)}...{property.tokenContract.slice(-4)}</span>
                    </div>
                    {hasTokens && (
                      <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-lg p-3">
                        <div className="flex items-center text-secondary-500 font-medium">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>You own: {ethers.formatEther(balance.balance)} {property.symbol}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button className="bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg font-semibold text-sm flex-1 transition-all duration-300 flex items-center justify-center group">
                      <Eye className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      View Details
                    </button>
                    {!hasTokens && (
                      <button className="bg-dark-border hover:bg-secondary-500/20 hover:border-secondary-500/30 text-dark-text-primary hover:text-secondary-400 py-2 px-4 rounded-lg font-semibold text-sm flex-1 transition-all duration-300 border border-dark-border flex items-center justify-center group">
                        <ShoppingCart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        Invest
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </main>
    </div>
  );
};

export default InvestorDashboard;
