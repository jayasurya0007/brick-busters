# PropertyToken Frontend

A comprehensive React frontend for the MultiPropertyTokenManager system, providing fractional property ownership through blockchain technology.

## Features

### 🏢 **Multi-Role Support**
- **Admin Dashboard**: Manage platform, verify wallets, add properties
- **Property Creator**: Create properties, mint tokens for investors
- **Investor**: Buy tokens, earn revenue, manage investments

### 🔐 **Security & Compliance**
- KYC/AML verification through Identity Registry
- Compliance checks for all transactions
- Wallet verification system

### 💰 **Revenue Management**
- ETH revenue distribution
- ERC20 token revenue support
- Automatic proportional revenue sharing
- Withdrawal functionality

### 🎨 **Modern UI/UX**
- Responsive design with TailwindCSS
- Real-time wallet connection
- Transaction status tracking
- Toast notifications

## Technology Stack

- **Frontend**: React 19 + Vite
- **Styling**: TailwindCSS
- **Web3**: ethers.js v6
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js 18+ 
- MetaMask wallet
- Access to Citrea testnet

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure contract addresses**:
   Update `src/config/contracts.js` with your deployed contract addresses:
   ```javascript
   export const CONTRACT_ADDRESSES = {
     IDENTITY_REGISTRY: "0x898185e95DF67732d312d12B8F7A0dc18aaf39B1",
     COMPLIANCE_MODULE: "0xF3D8eC1c972eC98b6083EBbb8c241c86B3135e3A",
     MULTI_PROPERTY_MANAGER: "0x80D1d1a13e0472904259E8d27B03C4f557d399C2"
   };
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173`

## User Flows

### 🔧 **Admin Flow**
1. Connect wallet (must be contract owner)
2. Verify investor wallets
3. Add new properties with metadata
4. Deposit revenue for properties
5. Pause/unpause contracts

### 🏗️ **Property Creator Flow**
1. Get wallet verified by admin
2. Request property creation from admin
3. Mint tokens for verified investors
4. Monitor property performance

### 💼 **Investor Flow**
1. Get wallet verified by admin
2. Receive tokens from property creators
3. View property details and holdings
4. Withdraw earned revenue

## Contract Integration

### Smart Contract Functions Used

#### Identity Registry
- `verifyWallet(address)` - Verify investor wallets
- `revokeWallet(address)` - Revoke wallet access
- `isVerified(address)` - Check verification status

#### MultiPropertyTokenManager
- `addProperty(...)` - Add new property
- `mintTokens(propertyId, to, amount)` - Mint tokens
- `depositEthRevenue(propertyId)` - Deposit ETH revenue
- `withdrawEthRevenue(propertyId)` - Withdraw ETH revenue
- `availableEthRevenue(propertyId, wallet)` - Check available revenue

#### PropertyERC20
- `balanceOf(address)` - Check token balance
- `totalSupply()` - Get total token supply
- `mint(to, amount)` - Mint new tokens

## Network Configuration

The app is configured for **Citrea Testnet**:
- **Chain ID**: 420 (0x1A4)
- **RPC URL**: https://rpc.citrea.xyz
- **Explorer**: https://explorer.citrea.xyz

## Security Features

### 🔒 **Access Control**
- Admin-only functions protected
- Wallet verification required
- Compliance checks enforced

### 🛡️ **Transaction Safety**
- MetaMask integration
- Transaction confirmation
- Error handling and user feedback

### 📊 **State Management**
- Real-time contract state updates
- Balance and revenue tracking
- Transaction status monitoring

## File Structure

```
src/
├── components/
│   └── Layout.jsx              # Main layout with navigation
├── context/
│   └── Web3Context.jsx         # Web3 and contract management
├── pages/
│   ├── Home.jsx                # Landing page with role selection
│   ├── AdminDashboard.jsx     # Admin management interface
│   ├── PropertyCreatorDashboard.jsx  # Creator interface
│   ├── InvestorDashboard.jsx   # Investor interface
│   └── PropertyDetails.jsx     # Property detail view
├── config/
│   └── contracts.js            # Contract addresses and ABIs
├── App.jsx                     # Main app component
└── main.jsx                    # App entry point
```

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel/Netlify
1. Build the project
2. Deploy the `dist` folder
3. Configure environment variables if needed

## Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Ensure MetaMask is installed
   - Check network configuration
   - Verify contract addresses

2. **Transaction Errors**
   - Check wallet balance for gas
   - Verify wallet is connected to correct network
   - Ensure wallet is verified (for investors)

3. **Contract Interaction Issues**
   - Verify contract addresses are correct
   - Check if contracts are paused
   - Ensure proper permissions

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
localStorage.setItem('debug', 'true');
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section
- Review contract documentation
- Contact the development team

---

**Built for Integra Hackathon 2024** 🚀