import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { Building, Users, TrendingUp, ArrowLeft, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';

const PropertyDetails = () => {
  const { id } = useParams();
  const { account, isConnected, contracts, isWalletVerified } = useWeb3();
  const [property, setProperty] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [balance, setBalance] = useState('0');
  const [revenue, setRevenue] = useState({ eth: '0' });
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isConnected && contracts.multiPropertyManager) {
      loadPropertyData();
    }
  }, [isConnected, contracts, id]);

  const loadPropertyData = async () => {
    try {
      setLoading(true);
      
      // Check if user is verified
      if (account) {
        const verified = await isWalletVerified();
        setIsVerified(verified);
      }

      // Load property details
      const propertyData = await contracts.multiPropertyManager.properties(parseInt(id));
      setProperty({
        id: parseInt(id),
        name: propertyData.name,
        symbol: propertyData.symbol,
        creator: propertyData.creator,
        tokenContract: propertyData.tokenContract,
        deedHash: propertyData.deedHash,
        appraisalHash: propertyData.appraisalHash,
        kycDocHash: propertyData.kycDocHash,
        propertyValue: propertyData.propertyValue,
        totalTokens: propertyData.totalTokens,
        tokenPrice: propertyData.tokenPrice,
        isActive: propertyData.isActive
      });

      // Load token information
      if (propertyData.tokenContract !== '0x0000000000000000000000000000000000000000') {
        const tokenContract = new ethers.Contract(
          propertyData.tokenContract,
          [
            "function name() public view returns (string)",
            "function symbol() public view returns (string)",
            "function decimals() public view returns (uint8)",
            "function totalSupply() public view returns (uint256)",
            "function balanceOf(address account) public view returns (uint256)"
          ],
          contracts.multiPropertyManager.runner
        );

        const [name, symbol, decimals, totalSupply] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals(),
          tokenContract.totalSupply()
        ]);

        setTokenInfo({
          name,
          symbol,
          decimals,
          totalSupply: totalSupply.toString()
        });

        // Load user balance if connected
        if (account) {
          const userBalance = await tokenContract.balanceOf(account);
          setBalance(userBalance.toString());
        }

        // Load revenue data if connected
        if (account) {
          const ethRevenue = await contracts.multiPropertyManager.availableEthRevenue(parseInt(id), account);
          setRevenue({ eth: ethRevenue.toString() });
        }
      }
    } catch (error) {
      console.error('Error loading property data:', error);
      toast.error('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const withdrawEthRevenue = async () => {
    try {
      setLoading(true);
      const tx = await contracts.multiPropertyManager.withdrawEthRevenue(parseInt(id));
      await tx.wait();
      toast.success('ETH revenue withdrawn successfully');
      await loadPropertyData();
    } catch (error) {
      console.error('Error withdrawing ETH revenue:', error);
      toast.error('Failed to withdraw ETH revenue');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Not Found</h2>
        <p className="text-gray-600">The property you're looking for doesn't exist.</p>
        <Link to="/" className="btn-primary mt-4 inline-flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  const hasTokens = Number(balance) > 0;
  const hasRevenue = Number(revenue.eth) > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/" className="btn-secondary flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Link>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-gray-600">{property.symbol} • Property #{property.id}</p>
        </div>
      </div>

      {/* Property Overview */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Property Name</p>
                <p className="font-medium text-gray-900">{property.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Symbol</p>
                <p className="font-medium text-gray-900">{property.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Creator</p>
                <p className="font-medium text-gray-900">
                  {property.creator.slice(0, 6)}...{property.creator.slice(-4)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Token Contract</p>
                <p className="font-medium text-gray-900 font-mono text-sm">
                  {property.tokenContract.slice(0, 6)}...{property.tokenContract.slice(-4)}
                </p>
              </div>
            </div>
          </div>

          {/* Market Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Market Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Property Value</p>
                <p className="font-medium text-gray-900">
                  {ethers.formatEther(property.propertyValue)} ETH
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tokens</p>
                <p className="font-medium text-gray-900">
                  {ethers.formatEther(property.totalTokens)} {property.symbol}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Token Price</p>
                <p className="font-medium text-gray-900">
                  {ethers.formatEther(property.tokenPrice)} ETH
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Trading Status</p>
                <p className={`font-medium ${property.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {property.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>

          {/* Token Information */}
          {tokenInfo && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Token Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Supply</p>
                  <p className="font-medium text-gray-900">
                    {ethers.formatEther(tokenInfo.totalSupply)} {tokenInfo.symbol}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Balance</p>
                  <p className="font-medium text-gray-900">
                    {ethers.formatEther(balance)} {tokenInfo.symbol}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your Percentage</p>
                  <p className="font-medium text-gray-900">
                    {tokenInfo.totalSupply > 0 
                      ? ((Number(balance) / Number(tokenInfo.totalSupply)) * 100).toFixed(2)
                      : 0
                    }%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-medium ${hasTokens ? 'text-green-600' : 'text-gray-600'}`}>
                    {hasTokens ? 'You own tokens' : 'No tokens owned'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Document Hashes */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Document Hashes</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Deed Hash</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {property.deedHash}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Appraisal Hash</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {property.appraisalHash}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">KYC Document Hash</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {property.kycDocHash}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Revenue Card */}
          {isConnected && isVerified && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Your Revenue
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Available ETH Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {ethers.formatEther(revenue.eth)} ETH
                  </p>
                </div>
                <button
                  onClick={withdrawEthRevenue}
                  disabled={loading || !hasRevenue}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Withdraw ETH</span>
                </button>
                {!hasRevenue && (
                  <p className="text-sm text-gray-500 text-center">
                    No revenue available
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions Card */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button className="btn-primary w-full">
                View on Explorer
              </button>
              <button className="btn-secondary w-full">
                Copy Contract Address
              </button>
              {hasTokens && (
                <button className="btn-secondary w-full">
                  Transfer Tokens
                </button>
              )}
            </div>
          </div>

          {/* Status Card */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Wallet Connected</span>
                <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Wallet Verified</span>
                <span className={`text-sm font-medium ${isVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {isVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Token Holder</span>
                <span className={`text-sm font-medium ${hasTokens ? 'text-green-600' : 'text-gray-600'}`}>
                  {hasTokens ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
