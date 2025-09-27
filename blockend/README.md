# PropertyToken Smart Contracts

A comprehensive blockchain-based fractional property ownership platform built on Ethereum-compatible networks. This project enables real estate tokenization with KYC/AML compliance, revenue distribution, and a built-in marketplace for token trading.

## 🏗️ **Architecture Overview**

### **Core Contracts**

#### **1. IdentityRegistry.sol**
- **Purpose**: KYC/AML wallet verification system
- **Key Functions**:
  - `verifyWallet(address)` - Admin verifies investor wallets
  - `revokeWallet(address)` - Admin revokes wallet access
  - `isVerified(address)` - Check verification status
- **Access Control**: Admin-only verification functions

#### **2. ComplianceModule.sol**
- **Purpose**: Enforces transfer compliance rules
- **Key Functions**:
  - `checkCompliance(address)` - Validates recipient compliance
  - `setIdentityRegistry(address)` - Update identity registry
- **Integration**: Works with IdentityRegistry for verification checks

#### **3. PropertyERC20.sol**
- **Purpose**: ERC20 token representing fractional ownership of a single property
- **Key Features**:
  - Transfer restrictions (only verified wallets)
  - Compliance checks on all transfers
  - Pausable functionality
  - Owner-controlled minting
- **Key Functions**:
  - `mint(address, uint256)` - Mint tokens to verified addresses
  - `pause()/unpause()` - Emergency controls
  - `setComplianceModule()` - Update compliance rules

#### **4. MultiPropertyTokenManager.sol**
- **Purpose**: Main contract managing multiple properties, revenue distribution, and marketplace
- **Key Features**:
  - Property creation and tokenization
  - Revenue distribution (ETH and ERC20)
  - Marketplace for token trading
  - Property valuation and pricing

## 🚀 **Latest Updates & Features**

### **Marketplace Token Availability Display Fix (v3.5)**
- **Date**: December 2024
- **Features**:
  - Fixed marketplace showing 0 available tokens despite property creation
  - Corrected token availability calculation to use contract data
  - Added visual indicators for token availability status
  - Enhanced property cards with "Not minted" status
  - Disabled purchase buttons when no tokens available
  - Improved user understanding of token preparation workflow

### **Marketplace Input Validation Fix (v3.4)**
- **Date**: December 2024
- **Features**:
  - Fixed app crash when clicking on "Amount (Tokens)" input field
  - Added input validation to prevent invalid number formats
  - Improved error handling for ethers.parseEther operations
  - Added safe total cost calculation with try-catch blocks
  - Enhanced input field with proper number validation
  - Prevented negative numbers and invalid characters

### **Marketplace State Management Fix (v3.3)**
- **Date**: December 2024
- **Features**:
  - Fixed marketplace properties disappearing after navigation
  - Improved data loading sequence and state management
  - Added proper useEffect dependencies for data reloading
  - Added loading states and refresh functionality
  - Enhanced debugging with console logging
  - Fixed market data loading timing issues

### **Marketplace Token Purchase Fix (v3.2)**
- **Date**: December 2024
- **Features**:
  - Fixed marketplace token purchase functionality
  - Added token preparation workflow for property creators
  - Improved error handling for token purchases
  - Added approval checking before token purchases
  - Enhanced marketplace with better user feedback
  - Fixed available tokens calculation using creator balance

### **Auto-Verification KYC (v3.1)**
- **Date**: December 2024
- **Features**:
  - File upload functionality for KYC documents
  - Automatic verification after document upload
  - Removed manual wallet management from admin dashboard
  - Streamlined verification process
  - Enhanced user experience with drag-and-drop file upload
  - Improved error handling for verification status checks
  - Retry functionality for failed status checks

### **Marketplace Implementation (v2.0)**

#### **Property Structure Enhancement**
```solidity
struct Property {
    string name;
    string symbol;
    address creator;
    bytes32 deedHash;
    bytes32 appraisalHash;
    bytes32 kycDocHash;
    PropertyERC20 tokenContract;
    uint256 propertyValue;    // NEW: Property valuation in wei
    uint256 totalTokens;      // NEW: Total tokens to be minted
    uint256 tokenPrice;       // NEW: Price per token in wei
    bool isActive;            // NEW: Trading status
}
```

#### **New Marketplace Functions**
- **`addProperty()`** - Enhanced with property valuation and token pricing
- **`buyTokens()`** - Direct token purchase from property creators
- **`getPropertyMarketData()`** - Real-time market information
- **`mintTokens()`** - Creator-controlled token minting

#### **Revenue Distribution System**
- **ETH Revenue**: `depositEthRevenue()` / `withdrawEthRevenue()`
- **ERC20 Revenue**: `depositTokenRevenue()` / `withdrawTokenRevenue()`
- **Proportional Distribution**: Based on token holdings
- **Available Revenue Tracking**: `availableEthRevenue()` / `availableTokenRevenue()`

## 📋 **Deployment Information**

### **Current Deployment (Citrea Testnet)**
- **Network**: Citrea Testnet (Chain ID: 5115)
- **RPC URL**: https://rpc.testnet.citrea.xyz
- **Explorer**: https://explorer.testnet.citrea.xyz

### **Contract Addresses (Latest)**
```
IdentityRegistry:     0x4bB5a645bcEfc85b5Ca9e5283365e62D2adE5876
ComplianceModule:     0x01890E7948BdbBB7d6a0EDaE396Af1bCEaB03e8c
MultiPropertyManager: 0x071692F39260468A6A5E3E0699736b775b07136d
```

### **Sample Property Created**
- **Name**: "Sample Property Token"
- **Symbol**: "SPT"
- **Property Value**: 1,000,000 ETH
- **Total Tokens**: 1,000,000 tokens
- **Token Price**: 1 ETH per token
- **Creator**: 0x1Db4634a48aeb9BAC776F20160e31459adCdC0A5

## 🔧 **Development Setup**

### **Prerequisites**
- Node.js (v16+)
- npm or yarn
- Hardhat
- MetaMask or compatible wallet

### **Installation**
```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Citrea testnet
npx hardhat run scripts/deploy.js --network citrea
```

### **Environment Configuration**
Create `.env` file:
```
CITREA_RPC_URL=https://rpc.testnet.citrea.xyz
PRIVATE_KEY=your_private_key_here
```

## 🎯 **User Flows**

### **1. Admin Flow**
1. Deploy contracts and become owner
2. Verify investor wallets via `verifyWallet()`
3. Create properties with `addProperty()` including:
   - Property valuation
   - Total token supply
   - Creator assignment
4. Deposit revenue for properties
5. Manage contract pause/unpause

### **2. Property Creator Flow**
1. Get wallet verified by admin
2. Request property creation from admin
3. Receive property ownership and token contract control
4. Mint tokens to verified investors via `mintTokens()`
5. Sell tokens through marketplace
6. Receive payments from token sales

### **3. Investor Flow**
1. Get wallet verified by admin
2. Browse available properties in marketplace
3. Purchase tokens via `buyTokens()` with ETH payment
4. Hold fractional ownership tokens
5. Receive proportional revenue distributions
6. Withdraw earned revenue via `withdrawEthRevenue()`

## 💰 **Marketplace Features**

### **Token Pricing**
- **Automatic Calculation**: `tokenPrice = propertyValue / totalTokens`
- **Fixed Pricing**: Set at property creation
- **Transparent**: All pricing visible on-chain

### **Trading Mechanism**
- **Direct Purchase**: Buy tokens directly from property creators
- **ETH Payment**: Automatic payment processing
- **Token Transfer**: Immediate token delivery
- **Availability Tracking**: Real-time token availability

### **Revenue Distribution**
- **Proportional**: Based on token holdings
- **Automatic**: Calculated on-chain
- **Withdrawable**: Investors can withdraw anytime
- **Multi-token**: Supports ETH and ERC20 revenue

## 🔒 **Security Features**

### **Access Control**
- **Admin-only**: Critical functions restricted to contract owner
- **Creator-only**: Token minting restricted to property creators
- **Verified-only**: All transfers require wallet verification

### **Compliance**
- **KYC/AML**: All participants must be verified
- **Transfer Restrictions**: Only verified wallets can receive tokens
- **Compliance Checks**: Every transfer validated

### **Emergency Controls**
- **Pausable**: Contracts can be paused in emergencies
- **Ownership Transfer**: Admin can transfer ownership
- **Module Updates**: Compliance and identity modules can be updated

## 📊 **Contract Functions Reference**

### **IdentityRegistry**
```solidity
function verifyWallet(address wallet) external onlyOwner
function revokeWallet(address wallet) external onlyOwner
function isVerified(address wallet) external view returns (bool)
```

### **MultiPropertyTokenManager**
```solidity
// Property Management
function addProperty(
    string memory name_,
    string memory symbol_,
    address creator_,
    bytes32 deedHash_,
    bytes32 appraisalHash_,
    bytes32 kycDocHash_,
    uint256 propertyValue_,
    uint256 totalTokens_
) external onlyOwner returns (uint256)

// Token Operations
function mintTokens(uint256 propertyId, address to, uint256 amount) external
function buyTokens(uint256 propertyId, uint256 amount) external payable

// Revenue Management
function depositEthRevenue(uint256 propertyId) external payable onlyOwner
function withdrawEthRevenue(uint256 propertyId) external
function availableEthRevenue(uint256 propertyId, address wallet) external view returns (uint256)

// Market Data
function getPropertyMarketData(uint256 propertyId) external view returns (
    uint256 propertyValue,
    uint256 totalTokens,
    uint256 tokenPrice,
    uint256 availableTokens,
    bool isActive
)
```

## 🧪 **Testing**

### **Run Tests**
```bash
# Run all tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/PropertyToken.test.js
```

### **Test Coverage**
- Contract deployment
- Property creation and management
- Token minting and transfers
- Revenue distribution
- Marketplace functionality
- Access control and compliance

## 📈 **Gas Optimization**

### **Optimizations Applied**
- **Solidity Version**: 0.8.28 with optimizer enabled
- **Optimizer Runs**: 200 (balanced between size and gas)
- **Efficient Storage**: Packed structs and mappings
- **Batch Operations**: Multiple operations in single transaction

### **Gas Estimates**
- Property Creation: ~800,000 gas
- Token Minting: ~60,000 gas
- Token Purchase: ~120,000 gas
- Revenue Withdrawal: ~80,000 gas

## 🔄 **Version History**

### **v2.0 - Marketplace Implementation**
- ✅ Added property valuation and token pricing
- ✅ Implemented direct token purchase functionality
- ✅ Added marketplace data functions
- ✅ Enhanced property structure with market fields
- ✅ Updated frontend with marketplace UI
- ✅ Deployed to Citrea testnet

### **v1.0 - Initial Implementation**
- ✅ Basic property tokenization
- ✅ KYC/AML compliance system
- ✅ Revenue distribution (ETH only)
- ✅ Admin and creator dashboards
- ✅ Investor portfolio management

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 **Support**

For questions or support:
- Create an issue in the repository
- Check the documentation
- Review the test files for usage examples

---

**Built with ❤️ for the future of real estate investment**