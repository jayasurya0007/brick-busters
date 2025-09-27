import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, NETWORK_CONFIG, FALLBACK_NETWORK_CONFIG } from '../config/contracts';
import toast from 'react-hot-toast';

const Web3Context = createContext();

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chainId, setChainId] = useState(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      toast.error('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        toast.error('No accounts found');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      
      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setChainId(network.chainId.toString());
      setIsConnected(true);

      // Check if we're on the correct network
      const correctChainId = parseInt(NETWORK_CONFIG.chainId, 16);
      if (network.chainId !== BigInt(correctChainId)) {
        console.log(`Wrong network. Current: ${network.chainId}, Expected: ${correctChainId}`);
        await switchToCorrectNetwork();
      }

      // Initialize contracts
      await initializeContracts(provider, signer);
      
      toast.success('Wallet connected successfully!');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch to correct network with fallback
  const switchToCorrectNetwork = async () => {
    try {
      console.log('Attempting to switch to Citrea testnet...');
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
      console.log('Successfully switched to Citrea testnet');
    } catch (switchError) {
      console.log('Citrea network not available, trying to add it...', switchError);
      
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          console.log('Adding Citrea network...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [NETWORK_CONFIG],
          });
          console.log('Successfully added Citrea network');
        } catch (addError) {
          console.error('Error adding Citrea network:', addError);
          toast.error('Failed to add Citrea network. Please add it manually in MetaMask.');
          
          // Show manual instructions
          toast.error('Please manually add Citrea testnet: Chain ID 5115, RPC: https://rpc.testnet.citrea.xyz');
        }
      } else {
        console.error('Error switching network:', switchError);
        toast.error('Failed to switch network. Please check your MetaMask settings.');
      }
    }
  };

  // Initialize contract instances
  const initializeContracts = async (provider, signer) => {
    try {
      const identityRegistry = new ethers.Contract(
        CONTRACT_ADDRESSES.IDENTITY_REGISTRY,
        [
          "function verifyWallet(address wallet) external",
          "function revokeWallet(address wallet) external", 
          "function isVerified(address wallet) external view returns (bool)",
          "function owner() external view returns (address)"
        ],
        signer
      );

      const complianceModule = new ethers.Contract(
        CONTRACT_ADDRESSES.COMPLIANCE_MODULE,
        [
          "function checkCompliance(address to) public view returns (bool)",
          "function setIdentityRegistry(address _identityRegistry) external"
        ],
        signer
      );

      const multiPropertyManager = new ethers.Contract(
        CONTRACT_ADDRESSES.MULTI_PROPERTY_MANAGER,
        [
          "function addProperty(string memory name_, string memory symbol_, address creator_, bytes32 deedHash_, bytes32 appraisalHash_, bytes32 kycDocHash_) external returns (uint256)",
          "function mintTokens(uint256 propertyId, address to, uint256 amount) external",
          "function depositEthRevenue(uint256 propertyId) external payable",
          "function depositTokenRevenue(uint256 propertyId, address token, uint256 amount) external",
          "function withdrawEthRevenue(uint256 propertyId) external",
          "function withdrawTokenRevenue(uint256 propertyId, address token) external",
          "function availableEthRevenue(uint256 propertyId, address wallet) public view returns (uint256)",
          "function availableTokenRevenue(uint256 propertyId, address token, address wallet) public view returns (uint256)",
          "function properties(uint256) public view returns (string memory name, string memory symbol, address creator, bytes32 deedHash, bytes32 appraisalHash, bytes32 kycDocHash, address tokenContract)",
          "function nextPropertyId() public view returns (uint256)",
          "function pause() external",
          "function unpause() external",
          "function owner() external view returns (address)"
        ],
        signer
      );

      setContracts({
        identityRegistry,
        complianceModule,
        multiPropertyManager
      });
    } catch (error) {
      console.error('Error initializing contracts:', error);
      toast.error('Failed to initialize contracts');
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setContracts({});
    setIsConnected(false);
    setChainId(null);
    toast.success('Wallet disconnected');
  };

  // Check if user is admin (owner of contracts)
  const isAdmin = async () => {
    if (!contracts.identityRegistry || !account) return false;
    try {
      const owner = await contracts.identityRegistry.owner();
      return owner.toLowerCase() === account.toLowerCase();
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Check if wallet is verified
  const isWalletVerified = async (walletAddress = account) => {
    if (!contracts.identityRegistry || !walletAddress) return false;
    try {
      return await contracts.identityRegistry.isVerified(walletAddress);
    } catch (error) {
      console.error('Error checking verification status:', error);
      return false;
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = (chainId) => {
        setChainId(chainId);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  const value = {
    account,
    provider,
    signer,
    contracts,
    isConnected,
    isLoading,
    chainId,
    connectWallet,
    disconnectWallet,
    isAdmin,
    isWalletVerified,
    switchToCorrectNetwork
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};
