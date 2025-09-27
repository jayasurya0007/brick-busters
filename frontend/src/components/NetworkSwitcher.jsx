import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

const NetworkSwitcher = () => {
  const { isConnected, chainId, switchToCorrectNetwork } = useWeb3();

  const isCorrectNetwork = chainId === '0x13fb' || chainId === '5115';
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

  if (isCorrectNetwork) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <Wifi className="h-5 w-5 text-green-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-green-800">Connected to Citrea Testnet</h3>
            <p className="text-sm text-green-600 mt-1">
              Perfect! You're on the correct network (Chain ID: 5115)
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSepolia) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Wrong Network - Sepolia Testnet</h3>
            <p className="text-sm text-yellow-600 mt-1 mb-3">
              You're connected to Sepolia testnet, but your contracts are deployed on Citrea testnet.
            </p>
            <div className="space-y-2">
              <button
                onClick={switchToCorrectNetwork}
                className="btn-primary text-sm mr-2"
              >
                Switch to Citrea Testnet
              </button>
              <div className="text-xs text-yellow-700">
                Or manually add Citrea testnet in MetaMask:
                <br />• Network Name: Citrea Testnet
                <br />• RPC URL: https://rpc.testnet.citrea.xyz
                <br />• Chain ID: 5115
                <br />• Currency Symbol: cBTC
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-red-800">Wrong Network</h3>
          <p className="text-sm text-red-600 mt-1 mb-3">
            Please switch to Citrea testnet (Chain ID: 5115) to access your contracts.
          </p>
          <div className="space-y-2">
            <button
              onClick={switchToCorrectNetwork}
              className="btn-primary text-sm mr-2"
            >
              Switch to Citrea Testnet
            </button>
            <div className="text-xs text-red-700">
              Manual setup in MetaMask:
              <br />• Network Name: Citrea Testnet
              <br />• RPC URL: https://rpc.testnet.citrea.xyz
              <br />• Chain ID: 5115
              <br />• Currency Symbol: cBTC
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkSwitcher;
