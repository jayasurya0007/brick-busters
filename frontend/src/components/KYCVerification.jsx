import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Shield, CheckCircle, Clock, AlertCircle, Upload, FileText } from 'lucide-react';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import WalrusFileUpload from './WalrusFileUpload';
import { useWalrus } from '../hooks/useWalrus';

const KYCVerification = () => {
  const { account, isConnected, contracts } = useWeb3();
  const { generateDocumentHash } = useWalrus();
  const [kycDocument, setKycDocument] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileHash, setFileHash] = useState('');
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({
    verified: false,
    pending: false,
    kycDoc: '',
    timestamp: 0
  });
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    if (isConnected && contracts.identityRegistry && account) {
      // Add a small delay to ensure contracts are fully initialized
      const timer = setTimeout(() => {
        checkVerificationStatus();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, contracts, account]);

  const checkVerificationStatus = async () => {
    try {
      setCheckingStatus(true);
      
      // Check verification status using individual function calls
      const [verified, pending, kycDoc, timestamp] = await Promise.all([
        contracts.identityRegistry.isVerified(account),
        contracts.identityRegistry.isPendingVerification(account),
        contracts.identityRegistry.getKycDocument(account),
        contracts.identityRegistry.getVerificationTimestamp(account)
      ]);
      
      setVerificationStatus({
        verified: verified,
        pending: pending,
        kycDoc: kycDoc,
        timestamp: Number(timestamp)
      });
    } catch (error) {
      console.error('Error checking verification status:', error);
      
      // If it's a contract call error (user hasn't submitted verification yet), 
      // set default unverified state instead of showing error
      if (error.message && error.message.includes('missing revert data')) {
        console.log('User has not submitted verification yet - setting default state');
        setVerificationStatus({
          verified: false,
          pending: false,
          kycDoc: '',
          timestamp: 0
        });
        setStatusError(false);
      } else {
        setStatusError(true);
        // Set default values for other errors
        setVerificationStatus({
          verified: false,
          pending: false,
          kycDoc: '',
          timestamp: 0
        });
      }
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Generate a simple hash for demo purposes
      // In production, you'd use a proper hashing library
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        // Simple hash generation (in production, use crypto-js or similar)
        const hash = btoa(content).substring(0, 32);
        setFileHash(hash);
        setKycDocument(`File: ${file.name} | Hash: ${hash}`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWalrusUpload = (uploadedFile) => {
    setUploadedFileInfo(uploadedFile);
    const hash = generateDocumentHash({ name: uploadedFile.originalName, size: uploadedFile.size });
    setFileHash(hash);
    setKycDocument(`Walrus File: ${uploadedFile.originalName} | Upload ID: ${uploadedFile.id} | Hash: ${hash}`);
    toast.success('Document uploaded to Walrus successfully!');
  };

  const requestVerification = async () => {
    if (!kycDocument.trim() && !selectedFile && !uploadedFileInfo) {
      toast.error('Please upload a KYC document or provide a document reference');
      return;
    }

    try {
      setLoading(true);
      let documentRef;
      
      if (uploadedFileInfo) {
        // Use Walrus file information
        documentRef = `Walrus File: ${uploadedFileInfo.originalName} | Upload ID: ${uploadedFileInfo.id} | Hash: ${fileHash} | Size: ${uploadedFileInfo.size} bytes | URL: ${uploadedFileInfo.url}`;
      } else if (selectedFile) {
        // Use local file information
        documentRef = `File: ${selectedFile.name} | Hash: ${fileHash} | Size: ${selectedFile.size} bytes`;
      } else {
        // Use manual document reference
        documentRef = kycDocument;
      }
      
      const tx = await contracts.identityRegistry.requestVerification(documentRef);
      await tx.wait();
      toast.success('KYC verification completed successfully! You are now verified.');
      setKycDocument('');
      setSelectedFile(null);
      setFileHash('');
      setUploadedFileInfo(null);
      setStatusError(false);
      await checkVerificationStatus();
    } catch (error) {
      console.error('Error requesting verification:', error);
      if (error.message.includes('already verified')) {
        toast.error('Wallet is already verified');
      } else if (error.message.includes('already pending')) {
        toast.error('Verification request is already pending');
      } else {
        toast.error('Failed to complete verification');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to access KYC verification</p>
      </div>
    );
  }

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-6"></div>
          <p className="text-xl text-dark-text-secondary">Checking verification status...</p>
        </div>
      </div>
    );
  }



  // If there's an error checking status, show retry option
  if (statusError) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center py-20 max-w-md mx-auto px-6">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
            <AlertCircle className="h-16 w-16 text-dark-error mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-dark-text-primary mb-4">Unable to Check Status</h2>
            <p className="text-dark-text-secondary mb-6">There was an error checking your verification status</p>
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm font-semibold text-primary-400 mb-2">
                Common causes:
              </p>
              <ul className="text-sm text-dark-text-secondary space-y-1 text-left">
                <li>• Network connection issues</li>
                <li>• Wrong network selected in MetaMask</li>
                <li>• Contract not properly deployed</li>
                <li>• You haven't submitted verification yet</li>
              </ul>
            </div>
            <button
              onClick={() => {
                setStatusError(false);
                setCheckingStatus(true);
                checkVerificationStatus();
              }}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center mx-auto group"
            >
              <Shield className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Hero Section */}
      <div className="relative">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/90 to-transparent z-10"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
          }}
        ></div>
        
        {/* Content */}
        <div className="relative z-20 container mx-auto px-6 lg:px-8 py-16">
          <div className="max-w-4xl">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3">
                <Shield className="h-8 w-8 text-primary-500" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-dark-text-primary leading-tight">
                  KYC Verification
                </h1>
                <p className="text-xl text-dark-text-secondary mt-2">
                  Complete your identity verification to access all platform features
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    <main className="container mx-auto px-6 lg:px-8 py-12">
    <div className="space-y-12">

      {/* Status Card */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 mr-4">
              <Shield className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark-text-primary">Verification Status</h2>
              <p className="text-dark-text-secondary">Your identity verification progress</p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatusError(false);
              checkVerificationStatus();
            }}
            disabled={loading}
            className="bg-dark-border hover:bg-dark-border/70 text-dark-text-primary py-2 px-4 rounded-lg font-semibold transition-all duration-300 text-sm"
          >
            Refresh
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between p-6 bg-dark-bg border border-dark-border rounded-xl">
            <div className="flex items-center space-x-4">
              {verificationStatus.verified ? (
                <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-lg p-3">
                  <CheckCircle className="h-6 w-6 text-secondary-500" />
                </div>
              ) : verificationStatus.pending ? (
                <div className="bg-dark-warning/10 border border-dark-warning/20 rounded-lg p-3">
                  <Clock className="h-6 w-6 text-dark-warning" />
                </div>
              ) : (
                <div className="bg-dark-error/10 border border-dark-error/20 rounded-lg p-3">
                  <AlertCircle className="h-6 w-6 text-dark-error" />
                </div>
              )}
              <div>
                <p className="font-bold text-dark-text-primary text-lg">
                  {verificationStatus.verified ? 'Verified' : 
                   verificationStatus.pending ? 'Pending Review' : 'Not Verified'}
                </p>
                <p className="text-sm text-dark-text-secondary mt-1">
                  {verificationStatus.verified ? 'You have full access to all features' :
                   verificationStatus.pending ? 'Your verification is under review' :
                   'Complete verification to access marketplace and trading'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-dark-text-secondary font-medium">Last Updated</p>
              <p className="text-sm font-bold text-dark-text-primary mt-1">
                {formatTimestamp(verificationStatus.timestamp)}
              </p>
            </div>
          </div>

          {verificationStatus.kycDoc && (
            <div className="p-6 bg-primary-500/10 border border-primary-500/20 rounded-xl">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="h-5 w-5 text-primary-500" />
                <span className="text-sm font-bold text-primary-400">KYC Document</span>
              </div>
              <p className="text-sm text-dark-text-secondary break-all font-mono bg-dark-bg p-3 rounded-lg border border-dark-border">{verificationStatus.kycDoc}</p>
            </div>
          )}
        </div>
      </div>

      {/* Request Verification Form */}
      {!verificationStatus.verified && !verificationStatus.pending && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
          <div className="flex items-center mb-8">
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 mr-4">
              <Upload className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark-text-primary">Request Verification</h2>
              <p className="text-dark-text-secondary">Upload your documents to complete verification</p>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-dark-text-primary mb-4">Upload KYC Document to Walrus</label>
              <WalrusFileUpload
                onUploadComplete={handleWalrusUpload}
                documentType="kyc"
                userId={account}
                maxFiles={1}
                allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                maxSize={10 * 1024 * 1024} // 10MB
              />
              {uploadedFileInfo && (
                <div className="mt-4 p-4 bg-secondary-500/10 border border-secondary-500/20 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-secondary-500 mr-3" />
                    <div>
                      <p className="text-sm font-bold text-secondary-400">{uploadedFileInfo.originalName}</p>
                      <p className="text-xs text-dark-text-secondary">
                        {(uploadedFileInfo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-dark-text-secondary">
                        Walrus ID: {uploadedFileInfo.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-dark-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-dark-card text-dark-text-secondary font-medium">Or</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-dark-text-primary mb-3">Manual Document Reference</label>
              <input
                type="text"
                value={kycDocument}
                onChange={(e) => setKycDocument(e.target.value)}
                placeholder="Enter document hash, IPFS hash, or reference number"
                className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
                disabled={selectedFile !== null}
              />
              <p className="text-sm text-dark-text-secondary mt-3">
                Provide a hash of your KYC document, IPFS hash, or a reference number from your identity verification provider.
              </p>
            </div>

            <div className="bg-dark-warning/10 border border-dark-warning/20 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <AlertCircle className="h-6 w-6 text-dark-warning mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-dark-warning mb-3">Important Information</h3>
                  <ul className="text-sm text-dark-text-secondary space-y-2">
                    <li className="flex items-start space-x-2">
                      <span className="text-dark-warning mt-1">•</span>
                      <span>Your verification request will be reviewed by the platform</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-dark-warning mt-1">•</span>
                      <span>You will be notified once your verification is approved or rejected</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-dark-warning mt-1">•</span>
                      <span>Only verified wallets can participate in token trading and marketplace activities</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-dark-warning mt-1">•</span>
                      <span>Ensure your KYC document is valid and up-to-date</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={requestVerification}
              disabled={loading || (!kycDocument.trim() && !selectedFile)}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-300 flex items-center justify-center space-x-3 group"
            >
              <Shield className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span>{loading ? 'Processing...' : 'Complete Verification'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Pending Status */}
      {verificationStatus.pending && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
          <div className="flex items-center mb-8">
            <div className="bg-dark-warning/10 border border-dark-warning/20 rounded-xl p-3 mr-4">
              <Clock className="h-6 w-6 text-dark-warning" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark-text-primary">Verification Pending</h2>
              <p className="text-dark-text-secondary">Your request is being reviewed</p>
            </div>
          </div>
          
          <div className="text-center py-12">
            <div className="bg-dark-warning/10 border border-dark-warning/20 rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Clock className="h-10 w-10 text-dark-warning" />
            </div>
            <h3 className="text-2xl font-bold text-dark-text-primary mb-4">Verification Under Review</h3>
            <p className="text-dark-text-secondary mb-6 max-w-md mx-auto">
              Your KYC verification request is currently being reviewed by our team.
            </p>
            <div className="bg-dark-bg border border-dark-border rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-dark-text-secondary">
                <span className="font-semibold text-dark-warning">Expected timeframe:</span> 24-48 hours
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Verified Status */}
      {verificationStatus.verified && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8">
          <div className="flex items-center mb-8">
            <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-xl p-3 mr-4">
              <CheckCircle className="h-6 w-6 text-secondary-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-dark-text-primary">Verification Complete</h2>
              <p className="text-dark-text-secondary">You now have full platform access</p>
            </div>
          </div>
          
          <div className="text-center py-12">
            <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-2xl p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-secondary-500" />
            </div>
            <h3 className="text-2xl font-bold text-dark-text-primary mb-4">You're All Set!</h3>
            <p className="text-dark-text-secondary mb-8 max-w-md mx-auto">
              Your wallet has been verified and you now have access to all platform features.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-secondary-500" />
                  <span className="text-sm font-medium text-dark-text-primary">Marketplace Access</span>
                </div>
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-secondary-500" />
                  <span className="text-sm font-medium text-dark-text-primary">Token Trading</span>
                </div>
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-secondary-500" />
                  <span className="text-sm font-medium text-dark-text-primary">Revenue Withdrawal</span>
                </div>
              </div>
              <div className="bg-dark-bg border border-dark-border rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-secondary-500" />
                  <span className="text-sm font-medium text-dark-text-primary">Full Platform Access</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </main>
    </div>
  );
};

export default KYCVerification;
