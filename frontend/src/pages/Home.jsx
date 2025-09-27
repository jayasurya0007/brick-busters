import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Building, Shield, Users, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import NetworkSwitcher from '../components/NetworkSwitcher';
import toast from 'react-hot-toast';

const Home = () => {
  const { account, isConnected, contracts, isWalletVerified, chainId, connectWallet } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [isVerified, setIsVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && contracts.multiPropertyManager) {
      loadData();
    }
  }, [isConnected, contracts]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check if user is verified
      if (account) {
        const verified = await isWalletVerified();
        setIsVerified(verified);
      }

      // Check if user is admin
      if (contracts.identityRegistry && account) {
        const admin = await contracts.identityRegistry.owner();
        setIsAdmin(admin.toLowerCase() === account.toLowerCase());
      }

      // Load properties
      await loadProperties();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
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
    }
  };

  const getRoleCards = () => {
    const cards = [
      {
        title: 'Investor',
        description: 'Buy property tokens and earn revenue from property investments',
        icon: Users,
        href: '/investor',
        color: 'bg-blue-500',
        available: isVerified
      },
      {
        title: 'Property Creator',
        description: 'Create and manage property tokens, mint tokens for investors',
        icon: Building,
        href: '/creator',
        color: 'bg-green-500',
        available: isVerified
      }
    ];

    if (isAdmin) {
      cards.unshift({
        title: 'Admin',
        description: 'Manage the platform, verify wallets, and oversee all properties',
        icon: Shield,
        href: '/admin',
        color: 'bg-purple-500',
        available: true
      });
    }

    return cards;
  };

  // Show welcome screen when not connected instead of loading
  if (!isConnected) {
    return (
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to PropertyToken
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Invest in real estate properties through blockchain-based fractional ownership tokens. 
            Earn revenue from property investments with full transparency and compliance.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Building className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Get Started</h3>
            <p className="text-blue-800 mb-4">
              Connect your MetaMask wallet to access the platform and start investing in fractional property ownership.
            </p>
            <button
              onClick={connectWallet}
              className="btn-primary w-full"
            >
              Connect Wallet
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">KYC/AML Compliance</h3>
              <p className="text-gray-600">All participants must be verified through our identity registry</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Distribution</h3>
              <p className="text-gray-600">Automatic revenue sharing based on token holdings</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Building className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Management</h3>
              <p className="text-gray-600">Comprehensive property documentation and token management</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Network Switcher */}
      <NetworkSwitcher />

      {/* Loading State for Connected Users */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Fractional Property Ownership
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Invest in real estate properties through blockchain-based fractional ownership tokens. 
          Earn revenue from property investments with full transparency and compliance.
        </p>

        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800">Please connect your wallet to get started</span>
            </div>
          </div>
        )}

        {isConnected && !isVerified && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-orange-800">Your wallet needs to be verified to participate</span>
            </div>
          </div>
        )}

        {isConnected && isVerified && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">Wallet verified and ready to participate</span>
            </div>
          </div>
        )}
      </div>

      {/* Role Selection */}
      {isConnected && !loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getRoleCards().map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.title}
                className={`card transition-all duration-200 ${
                  role.available 
                    ? 'hover:shadow-lg cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <Link 
                  to={role.available ? role.href : '#'}
                  className="block"
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${role.color} text-white mr-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{role.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{role.description}</p>
                  {!role.available && (
                    <div className="text-sm text-red-600 font-medium">
                      {role.title === 'Admin' ? 'Admin access required' : 'Wallet verification required'}
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Properties Section */}
      {!loading && properties.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Properties</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                  <span className="text-sm text-gray-500">{property.symbol}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Creator: {property.creator.slice(0, 6)}...{property.creator.slice(-4)}</div>
                  <div>Token Contract: {property.tokenContract.slice(0, 6)}...{property.tokenContract.slice(-4)}</div>
                </div>
                <div className="mt-4">
                  <Link
                    to={`/property/${property.id}`}
                    className="btn-primary w-full text-center"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">KYC/AML Compliance</h3>
            <p className="text-gray-600">All participants must be verified through our identity registry</p>
          </div>
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Revenue Distribution</h3>
            <p className="text-gray-600">Automatic revenue sharing based on token holdings</p>
          </div>
          <div className="text-center">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Building className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Property Management</h3>
            <p className="text-gray-600">Comprehensive property documentation and token management</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
