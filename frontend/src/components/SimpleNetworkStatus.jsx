import React from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

const SimpleNetworkStatus = ({ isConnected, chainId }) => {
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

  const isCorrectNetwork = chainId === '0x13fb' || chainId === '5115';
  const isSepolia = chainId === '0xaa36a7' || chainId === '11155111';

  if (!isCorrectNetwork && !isSepolia) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Wrong Network</h3>
            <p className="text-sm text-yellow-600 mt-1">
              Please switch to Citrea testnet (Chain ID: 5115) or Sepolia testnet (Chain ID: 11155111).
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
          <h3 className="text-sm font-medium text-green-800">Connected</h3>
          <p className="text-sm text-green-600 mt-1">
            {isCorrectNetwork ? 'Citrea Testnet' : 'Sepolia Testnet'} (Chain ID: {chainId})
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleNetworkStatus;
