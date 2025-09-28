import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Building, Shield, Users, TrendingUp, CheckCircle, AlertCircle, ArrowRight, Star, Globe, Lock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  const { account, isConnected, contracts, isWalletVerified, chainId, connectWallet } = useWeb3();
  const [properties, setProperties] = useState([]);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

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
      setLoading(true);
      
      // Check if user is verified
      if (account) {
        const verified = await isWalletVerified();
        setIsVerified(verified);
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

  const getRoleCards = () => {
    const cards = [
      {
        title: 'Investor',
        description: 'Buy property tokens and earn revenue from property investments',
        icon: Users,
        href: '/investor',
        color: 'bg-primary-500',
        available: isVerified
      },
      {
        title: 'Property Creator',
        description: 'Create and manage property tokens, mint tokens for investors',
        icon: Building,
        href: '/creator',
        color: 'bg-secondary-500',
        available: isVerified
      }
    ];


    return cards;
  };

  // Show welcome screen when not connected instead of loading
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark-bg">
        {/* Hero Section with Cover Image */}
        <div className="relative min-h-screen flex items-center">
          {/* Background Image Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/90 to-transparent z-10"></div>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80')`
            }}
          ></div>
          
          {/* Content */}
          <div className="relative z-20 container mx-auto px-6 lg:px-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl lg:text-7xl font-bold text-dark-text-primary mb-6 leading-tight">
                Fractional Property
                <span className="text-primary-500 block">Ownership</span>
              </h1>
              <p className="text-xl lg:text-2xl text-dark-text-secondary mb-8 leading-relaxed">
                Invest in premium real estate through blockchain-based fractional ownership tokens. 
                Earn passive income with full transparency and regulatory compliance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={connectWallet}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 flex items-center justify-center group"
                >
                  Connect Wallet
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border border-dark-border hover:border-primary-500 text-dark-text-primary px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300">
                  Learn More
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-bold text-primary-500 mb-2">$2.5M+</div>
                  <div className="text-dark-text-secondary">Total Value</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-secondary-500 mb-2">150+</div>
                  <div className="text-dark-text-secondary">Properties</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary-500 mb-2">8.5%</div>
                  <div className="text-dark-text-secondary">Avg. Returns</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-dark-card">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-dark-text-primary mb-4">Platform Features</h2>
              <p className="text-xl text-dark-text-secondary max-w-3xl mx-auto">
                Built on blockchain technology with enterprise-grade security and compliance
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-primary-500/20 transition-all duration-300">
                  <Shield className="h-10 w-10 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-dark-text-primary mb-4">KYC/AML Compliance</h3>
                <p className="text-dark-text-secondary">All participants verified through our identity registry with full regulatory compliance</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-secondary-500/20 transition-all duration-300">
                  <TrendingUp className="h-10 w-10 text-secondary-500" />
                </div>
                <h3 className="text-xl font-semibold text-dark-text-primary mb-4">Revenue Distribution</h3>
                <p className="text-dark-text-secondary">Automatic revenue sharing based on token holdings with transparent reporting</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-primary-500/20 transition-all duration-300">
                  <Building className="h-10 w-10 text-primary-500" />
                </div>
                <h3 className="text-xl font-semibold text-dark-text-primary mb-4">Property Management</h3>
                <p className="text-dark-text-secondary">Comprehensive property documentation and token management with full transparency</p>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Section */}
        <div className="py-20 bg-dark-bg">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-dark-text-primary mb-4">How It Works</h2>
              <p className="text-xl text-dark-text-secondary max-w-3xl mx-auto">
                Simple steps to start your fractional property investment journey
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="bg-primary-500 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center text-white font-bold text-xl">1</div>
                <h3 className="text-lg font-semibold text-dark-text-primary mb-3">Connect Wallet</h3>
                <p className="text-dark-text-secondary">Link your MetaMask wallet to access the platform</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-500 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center text-white font-bold text-xl">2</div>
                <h3 className="text-lg font-semibold text-dark-text-primary mb-3">Complete KYC</h3>
                <p className="text-dark-text-secondary">Verify your identity through our compliance system</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-500 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center text-white font-bold text-xl">3</div>
                <h3 className="text-lg font-semibold text-dark-text-primary mb-3">Browse Properties</h3>
                <p className="text-dark-text-secondary">Explore available properties and their details</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary-500 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center text-white font-bold text-xl">4</div>
                <h3 className="text-lg font-semibold text-dark-text-primary mb-3">Invest & Earn</h3>
                <p className="text-dark-text-secondary">Purchase tokens and receive automatic revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-dark-card border-t border-dark-border py-12">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold text-dark-text-primary mb-4">PropertyToken</h3>
                <p className="text-dark-text-secondary mb-4">
                  Revolutionizing real estate investment through blockchain technology.
                </p>
                <div className="flex space-x-4">
                  <Globe className="h-6 w-6 text-dark-text-secondary hover:text-primary-500 cursor-pointer transition-colors" />
                  <Star className="h-6 w-6 text-dark-text-secondary hover:text-primary-500 cursor-pointer transition-colors" />
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-dark-text-primary mb-4">Platform</h4>
                <ul className="space-y-2 text-dark-text-secondary">
                  <li><Link to="/" className="hover:text-primary-500 transition-colors">Home</Link></li>
                  <li><Link to="/marketplace" className="hover:text-primary-500 transition-colors">Marketplace</Link></li>
                  <li><Link to="/kyc" className="hover:text-primary-500 transition-colors">KYC Verification</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-dark-text-primary mb-4">Support</h4>
                <ul className="space-y-2 text-dark-text-secondary">
                  <li><a href="#" className="hover:text-primary-500 transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-primary-500 transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-primary-500 transition-colors">Contact Us</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-dark-text-primary mb-4">Legal</h4>
                <ul className="space-y-2 text-dark-text-secondary">
                  <li><a href="#" className="hover:text-primary-500 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-primary-500 transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-primary-500 transition-colors">Compliance</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-dark-border mt-8 pt-8 text-center text-dark-text-secondary">
              <p>&copy; 2025 PropertyToken. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Loading State for Connected Users */}
      {loading && (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-text-secondary text-lg">Loading your data...</p>
        </div>
      )}

      {/* Hero Section for Connected Users */}
      <div className="relative min-h-screen flex items-center">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/90 to-transparent z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80')`
          }}
        ></div>
        
        {/* Content */}
        <div className="relative z-20 container mx-auto px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-5xl lg:text-7xl font-bold text-dark-text-primary mb-6 leading-tight">
              Welcome Back,
              <span className="text-primary-500 block">Investor</span>
            </h1>
            <p className="text-xl lg:text-2xl text-dark-text-secondary mb-8 leading-relaxed">
              Continue your fractional property investment journey with full access to our platform.
            </p>

            {/* Status Indicators */}
            {!isVerified && (
              <div className="bg-dark-warning/10 border border-dark-warning/20 rounded-lg p-4 max-w-md mb-8">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-dark-warning mr-3" />
                  <span className="text-dark-warning">Your wallet needs to be verified to participate</span>
                </div>
              </div>
            )}

            {isVerified && (
              <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-lg p-4 max-w-md mb-8">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-secondary-500 mr-3" />
                  <span className="text-secondary-500">Wallet verified and ready to participate</span>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-primary-500 mb-2">$2.5M+</div>
                <div className="text-dark-text-secondary">Total Value</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-secondary-500 mb-2">150+</div>
                <div className="text-dark-text-secondary">Properties</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-500 mb-2">8.5%</div>
                <div className="text-dark-text-secondary">Avg. Returns</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Selection */}
      {!loading && (
        <div className="py-20 bg-dark-card">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-dark-text-primary mb-4">Choose Your Role</h2>
              <p className="text-xl text-dark-text-secondary max-w-3xl mx-auto">
                Access different features based on your role in the platform
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {getRoleCards().map((role) => {
                const Icon = role.icon;
                return (
                  <div
                    key={role.title}
                    className={`bg-dark-bg border border-dark-border rounded-2xl p-8 transition-all duration-300 ${
                      role.available 
                        ? 'hover:border-primary-500/50 hover:shadow-xl cursor-pointer group' 
                        : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Link 
                      to={role.available ? role.href : '#'}
                      className="block"
                    >
                      <div className="flex items-center mb-6">
                        <div className={`p-4 rounded-xl ${role.color} text-white mr-4 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-dark-text-primary">{role.title}</h3>
                      </div>
                      <p className="text-dark-text-secondary mb-6 leading-relaxed">{role.description}</p>
                      {!role.available && (
                        <div className="text-sm text-dark-error font-medium">
                          Wallet verification required
                        </div>
                      )}
                      {role.available && (
                        <div className="flex items-center text-primary-500 font-medium group-hover:translate-x-2 transition-transform duration-300">
                          Access Dashboard
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </div>
                      )}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Properties Section */}
      {!loading && properties.length > 0 && (
        <div className="py-20 bg-dark-bg">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-dark-text-primary mb-4">Available Properties</h2>
              <p className="text-xl text-dark-text-secondary max-w-3xl mx-auto">
                Explore investment opportunities in premium real estate properties
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <div key={property.id} className="bg-dark-card border border-dark-border rounded-2xl p-6 hover:border-primary-500/50 transition-all duration-300 group">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-dark-text-primary">{property.name}</h3>
                    <span className="text-sm text-primary-500 font-medium bg-primary-500/10 px-3 py-1 rounded-full">{property.symbol}</span>
                  </div>
                  <div className="space-y-3 text-sm text-dark-text-secondary mb-6">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Creator: {property.creator.slice(0, 6)}...{property.creator.slice(-4)}
                    </div>
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Contract: {property.tokenContract.slice(0, 6)}...{property.tokenContract.slice(-4)}
                    </div>
                  </div>
                  <Link
                    to={`/property/${property.id}`}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold text-center transition-all duration-300 flex items-center justify-center group-hover:scale-105"
                  >
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="py-20 bg-dark-card">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark-text-primary mb-4">Platform Features</h2>
            <p className="text-xl text-dark-text-secondary max-w-3xl mx-auto">
              Built on blockchain technology with enterprise-grade security and compliance
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-primary-500/20 transition-all duration-300">
                <Shield className="h-10 w-10 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-dark-text-primary mb-4">KYC/AML Compliance</h3>
              <p className="text-dark-text-secondary">All participants verified through our identity registry with full regulatory compliance</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-secondary-500/20 transition-all duration-300">
                <TrendingUp className="h-10 w-10 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold text-dark-text-primary mb-4">Revenue Distribution</h3>
              <p className="text-dark-text-secondary">Automatic revenue sharing based on token holdings with transparent reporting</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center group-hover:bg-primary-500/20 transition-all duration-300">
                <Building className="h-10 w-10 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold text-dark-text-primary mb-4">Property Management</h3>
              <p className="text-dark-text-secondary">Comprehensive property documentation and token management with full transparency</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-dark-bg border-t border-dark-border py-12">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-dark-text-primary mb-4">Brick Busters</h3>
              <p className="text-dark-text-secondary mb-4">
                Revolutionizing real estate investment through blockchain technology.
              </p>
            
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-dark-text-primary mb-4">Platform</h4>
              <ul className="space-y-2 text-dark-text-secondary">
                <li><Link to="/" className="hover:text-primary-500 transition-colors">Home</Link></li>
                <li><Link to="/marketplace" className="hover:text-primary-500 transition-colors">Marketplace</Link></li>
                <li><Link to="/kyc" className="hover:text-primary-500 transition-colors">KYC Verification</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-dark-text-primary mb-4">Support</h4>
              <ul className="space-y-2 text-dark-text-secondary">
                <li><a href="#" className="hover:text-primary-500 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Contact Us</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-dark-text-primary mb-4">Legal</h4>
              <ul className="space-y-2 text-dark-text-secondary">
                <li><a href="#" className="hover:text-primary-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary-500 transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-dark-border mt-8 pt-8 text-center text-dark-text-secondary">
            <p>&copy; 2025 PropertyToken. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
