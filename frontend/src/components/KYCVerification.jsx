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
  
  // State variables
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
      const timer = setTimeout(() => {
        checkVerificationStatus();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isConnected, contracts, account]);

  const checkVerificationStatus = async () => {
    try {
      setCheckingStatus(true);
      
      // Check smart contract first (blockchain is source of truth)
      const [verified, pending, kycDoc, timestamp] = await Promise.all([
        contracts.identityRegistry.isVerified(account),
        contracts.identityRegistry.isPendingVerification(account),
        contracts.identityRegistry.getKycDocument(account),
        contracts.identityRegistry.getVerificationTimestamp(account)
      ]);
      
      const blockchainStatus = {
        verified: verified,
        pending: pending,
        kycDoc: kycDoc,
        timestamp: Number(timestamp)
      };
      
      setVerificationStatus(blockchainStatus);
      
      // Update local storage with blockchain status
      const localVerificationKey = `kyc_verification_${account}`;
      localStorage.setItem(localVerificationKey, JSON.stringify(blockchainStatus));
      
    } catch (error) {
      console.error('Error checking verification status:', error);
      
      // If blockchain fails, check local verification as fallback
      const localVerificationKey = `kyc_verification_${account}`;
      const localVerification = localStorage.getItem(localVerificationKey);
      
      if (localVerification) {
        const localStatus = JSON.parse(localVerification);
        setVerificationStatus(localStatus);
        console.log('Using local verification status as fallback');
      } else if (error.message && error.message.includes('missing revert data')) {
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
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
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
    
    toast.success('Document uploaded successfully! Click "Complete Verification" to verify on blockchain.');
  };

  const requestVerification = async () => {
    if (!kycDocument.trim() && !selectedFile && !uploadedFileInfo) {
      toast.error('Please upload a KYC document or provide a document reference');
      return;
    }

    // Check if wallet is connected and contracts are available
    if (!isConnected || !contracts.identityRegistry) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Show MetaMask prompt notification
    toast.loading('Please confirm the transaction in MetaMask...', {
      id: 'metamask-prompt',
      duration: 10000
    });

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
      
      // Debug contract and signer information
      console.log('Contract runner:', contracts.identityRegistry?.runner);
      console.log('Signer available:', !!contracts.identityRegistry?.runner?._isSigner);
      console.log('Account:', account);
      
      // This will trigger MetaMask popup
      const tx = await contracts.identityRegistry.requestVerification(documentRef);
      
      // Dismiss MetaMask prompt and show transaction pending
      toast.dismiss('metamask-prompt');
      toast.loading('Transaction submitted! Waiting for confirmation...', {
        id: 'tx-pending',
        duration: 30000
      });
      
      await tx.wait();
      
      // Dismiss pending toast and show success
      toast.dismiss('tx-pending');
      toast.success('🎉 KYC verification completed successfully! You are now verified.');
      
      setKycDocument('');
      setSelectedFile(null);
      setFileHash('');
      setUploadedFileInfo(null);
      setStatusError(false);
      await checkVerificationStatus();
    } catch (error) {
      console.error('Error requesting verification:', error);
      
      // Dismiss any pending toasts
      toast.dismiss('metamask-prompt');
      toast.dismiss('tx-pending');
      
      // Handle different error types
      if (error.code === 4001) {
        // User rejected the transaction
        toast.error('Transaction cancelled by user. You can try again anytime.');
      } else if (error.code === -32002) {
        // MetaMask is already processing a request
        toast.error('MetaMask is busy. Please wait and try again.');
      } else if (error.message.includes('already verified')) {
        toast.error('Wallet is already verified');
      } else if (error.message.includes('already pending')) {
        toast.error('Verification request is already pending');
      } else {
        toast.error('Failed to complete verification. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  if (checkingStatus) {
    return (
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Checking verification status...</p>
          </div>
        </div>
      </main>
    );
  }

  if (statusError) {
    return (
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Verification Status</h2>
          <p className="text-gray-600 mb-6">
            There was an error checking your verification status. Please make sure your wallet is connected
            and you're on the correct network.
          </p>
          <button 
            onClick={() => {
              setStatusError(false);
              checkVerificationStatus();
            }}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (verificationStatus.verified) {
    return (
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className="text-center py-12">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Verification Complete!</h2>
          <p className="text-lg text-gray-600 mb-6">
            Your wallet has been successfully verified. You can now access all platform features.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-sm text-green-800">
              <p><strong>Verified:</strong> {formatTimestamp(verificationStatus.timestamp)}</p>
              {verificationStatus.kycDoc && (
                <p className="mt-2 break-all"><strong>Document:</strong> {verificationStatus.kycDoc}</p>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-gray-600">Complete your identity verification to access all platform features</p>
      </div>

      {/* Status Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Verification Status
          </h2>
          <button
            onClick={() => {
              setStatusError(false);
              checkVerificationStatus();
            }}
            disabled={loading}
            className="btn-secondary text-sm"
          >
            Refresh
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {verificationStatus.verified ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : verificationStatus.pending ? (
                <Clock className="h-6 w-6 text-yellow-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600" />
              )}
              <div>
                <p className="font-medium text-gray-900">
                  {verificationStatus.verified 
                   ? 'Verified' 
                   : verificationStatus.pending 
                   ? 'Verification Pending' 
                   : 'Not Verified'}
                </p>
                <p className="text-sm text-gray-500">
                  {verificationStatus.verified 
                   ? 'You can access all platform features' 
                   : verificationStatus.pending 
                   ? 'Your verification request is being reviewed' 
                   : 'Complete verification to access marketplace and trading'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm font-medium text-gray-900">
                {formatTimestamp(verificationStatus.timestamp)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section - Only show if not verified */}
      {!verificationStatus.verified && !verificationStatus.pending && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Submit KYC Documents
          </h2>
          
          <div className="space-y-6">
            <div className="relative">
              <label className="label">Upload KYC Document</label>
              <p className="text-sm text-gray-600 mb-3">
                📋 Upload your document, then click "Complete Verification" to verify on blockchain
              </p>
              <WalrusFileUpload
                onUploadComplete={handleWalrusUpload}
                documentType="kyc"
                userId={account}
                maxFiles={1}
                allowedTypes={['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']}
                maxSize={10 * 1024 * 1024} // 10MB
              />
              {uploadedFileInfo && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800">{uploadedFileInfo.originalName}</p>
                      <p className="text-xs text-green-600">
                        {(uploadedFileInfo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-xs text-green-600">
                        Walrus ID: {uploadedFileInfo.id}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div>
              <label className="label">Manual Document Reference</label>
              <input
                type="text"
                value={kycDocument}
                onChange={(e) => setKycDocument(e.target.value)}
                placeholder="Enter document reference or hash"
                className="input"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div>
              <label className="label">Upload File Directly</label>
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png"
                className="input"
              />
              {selectedFile && (
                <div className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Your verification request will be reviewed by the platform</li>
                    <li>• You will be notified once your verification is approved or rejected</li>
                    <li>• Only verified wallets can participate in token trading and marketplace activities</li>
                    <li>• Ensure your KYC document is valid and up-to-date</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={requestVerification}
              disabled={loading || (!kycDocument.trim() && !selectedFile && !uploadedFileInfo)}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span>{loading ? 'Processing...' : 'Complete Verification'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Pending Status */}
      {verificationStatus.pending && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Verification In Progress
          </h2>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your verification is being reviewed</h3>
            <p className="text-gray-600 mb-4">
              We're currently reviewing your submitted documents. This process typically takes 1-3 business days.
            </p>
            {verificationStatus.kycDoc && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-700">
                  <strong>Submitted Document:</strong><br />
                  <span className="break-all">{verificationStatus.kycDoc}</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Submitted: {formatTimestamp(verificationStatus.timestamp)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </main>
  );
};

export default KYCVerification;