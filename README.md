# 🏗️ Brick Busters - Fractional Property Ownership Platform

A comprehensive blockchain-based platform for fractional real estate investment, built with React frontend and Solidity smart contracts. This project enables property tokenization with KYC/AML compliance, automated revenue distribution, and a dynamic marketplace for token trading.

## 🌟 **Project Overview**

Brick Busters revolutionizes real estate investment by allowing investors to purchase fractional ownership tokens of premium properties. Built on blockchain technology, it provides transparency, security, and automated revenue distribution while maintaining full regulatory compliance.

### **Key Features**
- 🏢 **Multi-Role System**: Admin, Property Creator, and Investor dashboards
- 🔐 **KYC/AML Compliance**: Automated wallet verification with document upload
- 💰 **Revenue Distribution**: Automatic proportional revenue sharing (ETH & ERC20)
- 🛒 **Dynamic Marketplace**: Buy, sell, and upload property tokens
- 📁 **Decentralized Storage**: Walrus integration for document management
- 🎨 **Modern UI/UX**: Responsive design with real-time updates

## 🏗️ **Architecture**

### **Smart Contracts (Solidity)**
- **IdentityRegistry**: KYC/AML wallet verification system
- **ComplianceModule**: Transfer compliance enforcement
- **PropertyERC20**: ERC20 tokens representing fractional property ownership
- **MultiPropertyTokenManager**: Main contract managing properties, revenue, and marketplace

### **Frontend (React)**
- **React 19** with modern hooks and context
- **TailwindCSS** for responsive styling
- **Ethers.js v6** for Web3 integration
- **React Router** for navigation
- **React Hot Toast** for notifications

### **Storage & Infrastructure**
- **Walrus (Tusky)** for decentralized file storage
- **MetaMask** wallet integration
- **Citrea Testnet** deployment (Chain ID: 5115)

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+
- MetaMask wallet
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/brick-busters.git
   cd brick-busters
   ```

2. **Install backend dependencies**
   ```bash
   cd blockend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   
   Create `.env` file in `blockend/`:
   ```bash
   PRIVATE_KEY=your_private_key_here
   CITREA_RPC_URL=https://rpc.testnet.citrea.xyz
   ```

   Create `.env` file in `frontend/`:
   ```bash
   VITE_TUSKY_API_KEY=your_tusky_api_key_here
   ```

5. **Deploy smart contracts**
   ```bash
   cd blockend
   npx hardhat run scripts/deploy.js --network citrea
   ```

6. **Update contract addresses**
   
   Update `frontend/src/config/contracts.js` with deployed addresses:
   ```javascript
   export const CONTRACT_ADDRESSES = {
     IDENTITY_REGISTRY: "0x...",
     COMPLIANCE_MODULE: "0x...",
     MULTI_PROPERTY_MANAGER: "0x..."
   };
   ```

7. **Start the frontend**
   ```bash
   cd frontend
   npm run dev
   ```

8. **Open in browser**
   Navigate to `http://localhost:5173`

## 🎯 **User Flows**

### **🔧 Admin Flow**
1. Connect wallet (must be contract owner)
2. Verify investor wallets through KYC system
3. Add new properties with metadata and valuation
4. Deposit revenue for properties
5. Manage contract pause/unpause states

### **🏗️ Property Creator Flow**
1. Complete KYC verification
2. Upload property documents to Walrus
3. Request property creation from admin
4. Mint tokens for verified investors
5. Sell tokens through marketplace
6. Receive payments from token sales

### **💼 Investor Flow**
1. Complete KYC verification with document upload
2. Browse available properties in marketplace
3. Purchase tokens with ETH payment
4. Hold fractional ownership tokens
5. Receive automatic revenue distributions
6. Withdraw earned revenue anytime

## 🛒 **Marketplace Features**

### **Dynamic Trading System**
- **Buy Tokens**: Direct purchase from property creators
- **Sell Tokens**: Peer-to-peer token trading
- **Upload Properties**: Create new property listings
- **Real-time Pricing**: Automatic token price calculation
- **Availability Tracking**: Live token availability status

### **Revenue Distribution**
- **Proportional Sharing**: Based on token holdings
- **Multi-token Support**: ETH and ERC20 revenue
- **Automatic Calculation**: On-chain revenue distribution
- **Withdrawal System**: Instant revenue claiming

## 🔒 **Security & Compliance**

### **Access Control**
- **Admin-only Functions**: Critical operations restricted to contract owner
- **Creator Authorization**: Token minting limited to property creators
- **Verified-only Transfers**: All transfers require wallet verification

### **Compliance Features**
- **KYC/AML Integration**: Full identity verification system
- **Document Management**: Secure document storage with Walrus
- **Transfer Restrictions**: Only verified wallets can receive tokens
- **Audit Trail**: Complete transaction history on blockchain

### **Emergency Controls**
- **Pausable Contracts**: Emergency stop functionality
- **Ownership Transfer**: Admin can transfer contract ownership
- **Module Updates**: Compliance and identity modules can be updated

## 📁 **File Structure**

```
brick-busters/
├── blockend/                    # Smart contracts
│   ├── contracts/
│   │   ├── IdentityRegistry.sol
│   │   └── MyContract.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   ├── hardhat.config.js
│   └── package.json
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── KYCVerification.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Marketplace.jsx
│   │   │   └── WalrusFileUpload.jsx
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── InvestorDashboard.jsx
│   │   │   └── PropertyCreatorDashboard.jsx
│   │   ├── context/
│   │   │   └── Web3Context.jsx
│   │   ├── hooks/
│   │   │   └── useWalrus.js
│   │   ├── services/
│   │   │   ├── walrusService.js
│   │   │   └── mockWalrusService.js
│   │   └── config/
│   │       └── contracts.js
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── README.md
└── .gitignore
```

## 🌐 **Network Configuration**

### **Citrea Testnet (Primary)**
- **Chain ID**: 5115 (0x13FB)
- **RPC URL**: https://rpc.testnet.citrea.xyz
- **Explorer**: https://explorer.testnet.citrea.xyz
- **Currency**: cBTC

### **Sepolia Testnet (Fallback)**
- **Chain ID**: 11155111 (0xaa36a7)
- **RPC URL**: https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
- **Explorer**: https://sepolia.etherscan.io
- **Currency**: ETH

## 🔧 **Development**

### **Smart Contract Development**
```bash
cd blockend

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to local network
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet
npx hardhat run scripts/deploy.js --network citrea
```

### **Frontend Development**
```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 📊 **Contract Functions Reference**

### **IdentityRegistry**
```solidity
function verifyWallet(address wallet) external onlyOwner
function revokeWallet(address wallet) external onlyOwner
function requestVerification(string memory kycDocument) external
function isVerified(address wallet) external view returns (bool)
function getVerificationStatus(address wallet) external view returns (...)
```

### **MultiPropertyTokenManager**
```solidity
// Property Management
function addProperty(...) external onlyOwner returns (uint256)
function getPropertyMarketData(uint256 propertyId) external view returns (...)

// Token Operations
function mintTokens(uint256 propertyId, address to, uint256 amount) external
function buyTokens(uint256 propertyId, uint256 amount) external payable
function sellTokens(uint256 propertyId, address buyer, uint256 amount, uint256 pricePerToken) external

// Revenue Management
function depositEthRevenue(uint256 propertyId) external payable onlyOwner
function withdrawEthRevenue(uint256 propertyId) external
function availableEthRevenue(uint256 propertyId, address wallet) external view returns (uint256)
```

## 🧪 **Testing**

### **Smart Contract Tests**
```bash
cd blockend
npx hardhat test
REPORT_GAS=true npx hardhat test
```

### **Frontend Testing**
```bash
cd frontend
npm test
```

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

### **v4.1 - Dynamic Marketplace Authorization Fix**
- Fixed "Ownable: caller is not the owner" error in token minting
- Added proper authorization checks for property creators
- Enhanced error handling with detailed error messages
- Improved UI to show only properties user can manage

### **v4.0 - Dynamic Marketplace Implementation**
- Dynamic seller-buyer model for any user
- Property upload functionality
- Token trading between users
- Tabbed interface for Buy, Sell, and Upload
- User token balances display

### **v3.1 - Auto-Verification KYC**
- File upload functionality for KYC documents
- Automatic verification after document upload
- Walrus integration for document storage
- Streamlined verification process

### **v2.0 - Marketplace Implementation**
- Property valuation and token pricing
- Direct token purchase functionality
- Revenue distribution system
- Enhanced property structure

### **v1.0 - Initial Implementation**
- Basic property tokenization
- KYC/AML compliance system
- Revenue distribution (ETH only)
- Admin and creator dashboards

## 🛠️ **Troubleshooting**

### **Common Issues**

1. **Wallet Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Check network configuration
   - Verify contract addresses are correct

2. **Transaction Errors**
   - Check wallet balance for gas fees
   - Verify wallet is connected to correct network
   - Ensure wallet is verified (for investors)

3. **Loading Issues**
   - Check browser console for errors
   - Verify network connectivity
   - Try refreshing the page
   - Clear browser cache

4. **Contract Interaction Issues**
   - Verify contract addresses are correct
   - Check if contracts are paused
   - Ensure proper permissions

### **Network Setup**
See `frontend/NETWORK_SETUP.md` for detailed network configuration instructions.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For questions or support:
- Create an issue in the repository
- Check the troubleshooting section
- Review the documentation files
- Contact the development team

## 🏆 **Acknowledgments**

- Built for Integra Hackathon 2024
- Powered by OpenZeppelin contracts
- Integrated with Walrus decentralized storage
- Deployed on Citrea testnet

---

**Built with ❤️ for the future of real estate investment** 🚀
