import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Users, TrendingUp, Wallet, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';

const InvestorDashboard = () => {
  const { account, isConnected, contracts, isWalletVerified } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [tokenBalances, setTokenBalances] = useState({});
  const [revenueData, setRevenueData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isConnected && contracts.multiPropertyManager) {
      loadData();
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
      toast.error('Failed to load properties');
    }
  };

  const loadTokenBalances = async () => {
    try {
      if (!account || !contracts.multiPropertyManager) return;

      const balances = {};
      const nextId = await contracts.multiPropertyManager.nextPropertyId();

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

      setTokenBalances(balances);
    } catch (error) {
      console.error('Error loading token balances:', error);
      toast.error('Failed to load token balances');
    }
  };

  const loadRevenueData = async () => {
    try {
      if (!account || !contracts.multiPropertyManager) return;

      const revenue = {};
      const nextId = await contracts.multiPropertyManager.nextPropertyId();

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

  const getMyProperties = () => {
    return properties.filter(property => {
      const balance = tokenBalances[property.id];
      return balance && Number(balance.balance) > 0;
    });
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to access the investor dashboard</p>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Wallet Verification Required</h2>
        <p className="text-gray-600">Your wallet needs to be verified by an admin to invest in properties</p>
      </div>
    );
  }

  const myProperties = getMyProperties();
  const totalEthRevenue = Object.values(revenueData).reduce((sum, revenue) => sum + Number(revenue.eth), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Investor Dashboard</h1>
        <p className="text-gray-600">Manage your property investments and revenue</p>
      </div>

      {/* Revenue Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-full p-3 mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total ETH Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {ethers.formatEther(totalEthRevenue.toString())} ETH
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-full p-3 mr-4">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Properties Owned</p>
              <p className="text-2xl font-bold text-gray-900">{myProperties.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-full p-3 mr-4">
              <Wallet className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(tokenBalances).reduce((sum, balance) => sum + Number(balance.balance), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* My Properties */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Building className="h-5 w-5 mr-2" />
          My Properties ({myProperties.length})
        </h2>
        {myProperties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p>You don't own any property tokens yet.</p>
            <p className="text-sm">Contact property creators to purchase tokens.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {myProperties.map((property) => {
              const balance = tokenBalances[property.id];
              const revenue = revenueData[property.id];
              return (
                <div key={property.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                      <p className="text-sm text-gray-600">{property.symbol}</p>
                    </div>
                    <span className="text-sm text-gray-500">ID: {property.id}</span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Token Balance</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {ethers.formatEther(balance.balance)} {property.symbol}
                      </p>
                      <p className="text-sm text-gray-500">
                        {balance.percentage.toFixed(2)}% of total supply
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Available ETH Revenue</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {ethers.formatEther(revenue?.eth || '0')} ETH
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Creator</p>
                      <p className="text-sm text-gray-900">
                        {property.creator.slice(0, 6)}...{property.creator.slice(-4)}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => withdrawEthRevenue(property.id)}
                      disabled={loading || !revenue?.eth || Number(revenue.eth) === 0}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      <span>Withdraw ETH</span>
                    </button>
                    <button className="btn-secondary">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* All Properties */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          All Properties ({properties.length})
        </h2>
        {properties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No properties found on the platform.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const balance = tokenBalances[property.id];
              const hasTokens = balance && Number(balance.balance) > 0;
              
              return (
                <div key={property.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {property.symbol}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div>Creator: {property.creator.slice(0, 6)}...{property.creator.slice(-4)}</div>
                    <div>Token Contract: {property.tokenContract.slice(0, 6)}...{property.tokenContract.slice(-4)}</div>
                    {hasTokens && (
                      <div className="text-green-600 font-medium">
                        You own: {ethers.formatEther(balance.balance)} {property.symbol}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button className="btn-primary text-sm flex-1">
                      View Details
                    </button>
                    {!hasTokens && (
                      <button className="btn-secondary text-sm flex-1">
                        Buy Tokens
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
  );
};

export default InvestorDashboard;
