import React from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

const NetworkTroubleshooter = ({ isConnected, chainId, onRetry }) => {
  const isCorrectNetwork = chainId === '0x1a4' || chainId === '420';
  const isSepolia = chainId === '0xaa36a7' || chainId === '11155111';

  if (!isConnected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <WifiOff className="h-5 w-5 text-red-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Wallet Not Connected</h3>
            <p className="text-sm text-red-600 mt-1">
              Please connect your MetaMask wallet to continue.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isCorrectNetwork && !isSepolia) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Wrong Network</h3>
            <p className="text-sm text-yellow-600 mt-1">
              Please switch to Citrea testnet (Chain ID: 420) or Sepolia testnet (Chain ID: 11155111).
            </p>
            <div className="mt-2">
              <button
                onClick={onRetry}
                className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSepolia) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Wifi className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Using Sepolia Testnet</h3>
            <p className="text-sm text-blue-600 mt-1">
              You're connected to Sepolia testnet. Note: Your contracts are deployed on Citrea testnet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <Wifi className="h-5 w-5 text-green-600 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-green-800">Connected to Citrea Testnet</h3>
          <p className="text-sm text-green-600 mt-1">
            You're connected to the correct network. Chain ID: {chainId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NetworkTroubleshooter;
