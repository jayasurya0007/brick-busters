// Contract addresses from your deployment on Citrea testnet (Chain ID 5115)
export const CONTRACT_ADDRESSES = {
  // Updated with latest deployment addresses with auto-verification KYC functionality
  IDENTITY_REGISTRY: "0x72a51Ba84Fe89F377046726251A36FA41f3E9aDd",
  COMPLIANCE_MODULE: "0x4E71db78D1E44989b88d7561f314393c6C72952c",
  MULTI_PROPERTY_MANAGER: "0x758d7aFf071bd0c721ACf0607EfA14b32a33339A"
};

// Network configuration - Updated to match your deployed contracts
export const NETWORK_CONFIG = {
  chainId: "0x13FB", // 5115 in hex (Citrea testnet where contracts are deployed)
  chainName: "Citrea Testnet",
  rpcUrls: ["https://rpc.testnet.citrea.xyz"],
  blockExplorerUrls: ["https://explorer.testnet.citrea.xyz"],
  nativeCurrency: {
    name: "cBTC",
    symbol: "cBTC",
    decimals: 18,
  },
};

// Fallback to Sepolia testnet if Citrea is not available
export const FALLBACK_NETWORK_CONFIG = {
  chainId: "0xaa36a7", // 11155111 in hex (Sepolia testnet)
  chainName: "Sepolia Testnet",
  rpcUrls: ["https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18,
  },
};

// Contract ABIs (simplified versions for the main functions we need)
export const IDENTITY_REGISTRY_ABI = [
  "function verifyWallet(address wallet) external",
  "function revokeWallet(address wallet) external", 
  "function requestVerification(string memory kycDocument) external",
  "function approveVerification(address wallet) external",
  "function rejectVerification(address wallet) external",
  "function isVerified(address wallet) external view returns (bool)",
  "function isPendingVerification(address wallet) external view returns (bool)",
  "function getKycDocument(address wallet) external view returns (string memory)",
  "function getVerificationTimestamp(address wallet) external view returns (uint256)",
  "function getVerificationStatus(address wallet) external view returns (bool verified, bool pending, string memory kycDoc, uint256 timestamp)",
  "function owner() external view returns (address)",
  "event WalletVerified(address indexed wallet)",
  "event WalletRevoked(address indexed wallet)",
  "event VerificationRequested(address indexed wallet, string kycDocument)",
  "event VerificationApproved(address indexed wallet)",
  "event VerificationRejected(address indexed wallet)"
];

export const COMPLIANCE_MODULE_ABI = [
  "function checkCompliance(address to) public view returns (bool)",
  "function setIdentityRegistry(address _identityRegistry) external"
];

export const PROPERTY_ERC20_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function pause() external",
  "function unpause() external",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

export const MULTI_PROPERTY_MANAGER_ABI = [
  "function addProperty(string memory name_, string memory symbol_, address creator_, bytes32 deedHash_, bytes32 appraisalHash_, bytes32 kycDocHash_, uint256 propertyValue_, uint256 totalTokens_) external returns (uint256)",
  "function mintTokens(uint256 propertyId, address to, uint256 amount) external",
  "function buyTokens(uint256 propertyId, uint256 amount) external payable",
  "function depositEthRevenue(uint256 propertyId) external payable",
  "function depositTokenRevenue(uint256 propertyId, address token, uint256 amount) external",
  "function withdrawEthRevenue(uint256 propertyId) external",
  "function withdrawTokenRevenue(uint256 propertyId, address token) external",
  "function availableEthRevenue(uint256 propertyId, address wallet) public view returns (uint256)",
  "function availableTokenRevenue(uint256 propertyId, address token, address wallet) public view returns (uint256)",
  "function properties(uint256) public view returns (string memory name, string memory symbol, address creator, bytes32 deedHash, bytes32 appraisalHash, bytes32 kycDocHash, address tokenContract, uint256 propertyValue, uint256 totalTokens, uint256 tokenPrice, bool isActive)",
  "function getPropertyMarketData(uint256 propertyId) external view returns (uint256 propertyValue, uint256 totalTokens, uint256 tokenPrice, uint256 availableTokens, bool isActive)",
  "function nextPropertyId() public view returns (uint256)",
  "function pause() external",
  "function unpause() external",
  "function getPropertyHashes(uint256 propertyId) external view returns (bytes32, bytes32, bytes32)",
  "event PropertyAdded(uint256 indexed propertyId, string name, string symbol, address tokenAddress, address creator, uint256 propertyValue, uint256 totalTokens, uint256 tokenPrice)",
  "event TokensMinted(uint256 indexed propertyId, address indexed to, uint256 amount)",
  "event TokensPurchased(uint256 indexed propertyId, address indexed buyer, uint256 amount, uint256 totalCost)",
  "event EthRevenueDeposited(uint256 indexed propertyId, uint256 amount)",
  "event EthRevenueWithdrawn(uint256 indexed propertyId, address indexed wallet, uint256 amount)",
  "event TokenRevenueDeposited(uint256 indexed propertyId, address indexed token, uint256 amount)",
  "event TokenRevenueWithdrawn(uint256 indexed propertyId, address indexed wallet, address indexed token, uint256 amount)"
];

export const ERC20_ABI = [
  "function name() public view returns (string)",
  "function symbol() public view returns (string)",
  "function decimals() public view returns (uint8)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) public view returns (uint256)",
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) public returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];
