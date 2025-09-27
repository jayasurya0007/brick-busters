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
      checkVerificationStatus();
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
      setStatusError(true);
      // Set default values
      setVerificationStatus({
        verified: false,
        pending: false,
        kycDoc: '',
        timestamp: 0
      });
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
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Checking verification status...</p>
      </div>
    );
  }

  // If there's an error checking status, show a retry option
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Wallet</h2>
        <p className="text-gray-600">Please connect your wallet to access KYC verification</p>
      </div>
    );
  }

  // If there's an error checking status, show retry option
  if (statusError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Check Status</h2>
        <p className="text-gray-600 mb-4">There was an error checking your verification status</p>
        <button
          onClick={() => {
            setStatusError(false);
            setCheckingStatus(true);
            checkVerificationStatus();
          }}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
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
                  {verificationStatus.verified ? 'Verified' : 
                   verificationStatus.pending ? 'Pending Review' : 'Not Verified'}
                </p>
                <p className="text-sm text-gray-600">
                  {verificationStatus.verified ? 'You have full access to all features' :
                   verificationStatus.pending ? 'Your verification is under review' :
                   'Complete verification to access marketplace and trading'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm font-medium text-gray-900">
                {formatTimestamp(verificationStatus.timestamp)}
              </p>
            </div>
          </div>

          {verificationStatus.kycDoc && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">KYC Document</span>
              </div>
              <p className="text-sm text-blue-800 break-all">{verificationStatus.kycDoc}</p>
            </div>
          )}
        </div>
      </div>

      {/* Request Verification Form */}
      {!verificationStatus.verified && !verificationStatus.pending && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Request Verification
          </h2>
          
          <div className="space-y-6">
            <div>
              <label className="label">Upload KYC Document to Walrus</label>
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
                placeholder="Enter document hash, IPFS hash, or reference number"
                className="input-field"
                disabled={selectedFile !== null}
              />
              <p className="text-sm text-gray-500 mt-2">
                Provide a hash of your KYC document, IPFS hash, or a reference number from your identity verification provider.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Important Information</h3>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• Your verification request will be reviewed by platform administrators</li>
                    <li>• You will be notified once your verification is approved or rejected</li>
                    <li>• Only verified wallets can participate in token trading and marketplace activities</li>
                    <li>• Ensure your KYC document is valid and up-to-date</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={requestVerification}
              disabled={loading || (!kycDocument.trim() && !selectedFile)}
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
            Verification Pending
          </h2>
          
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Under Review</h3>
            <p className="text-gray-600 mb-4">
              Your KYC verification request is currently being reviewed by our team.
            </p>
            <p className="text-sm text-gray-500">
              You will be notified once the review is complete. This process typically takes 24-48 hours.
            </p>
          </div>
        </div>
      )}

      {/* Verified Status */}
      {verificationStatus.verified && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Verification Complete
          </h2>
          
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">You're All Set!</h3>
            <p className="text-gray-600 mb-4">
              Your wallet has been verified and you now have access to all platform features.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>✅ Access to marketplace and token trading</p>
              <p>✅ Ability to purchase property tokens</p>
              <p>✅ Revenue distribution and withdrawal</p>
              <p>✅ Full platform functionality</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerification;
