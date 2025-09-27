# Quick Setup Guide

## 1. Install Dependencies

```bash
cd frontend
npm install
```

## 2. Update Contract Addresses

The contract addresses are already configured with your latest deployment:

```javascript
export const CONTRACT_ADDRESSES = {
  IDENTITY_REGISTRY: "0xb60986bE0E7877D3768135b820927720Cc599e32",
  COMPLIANCE_MODULE: "0x6EF9040c9376c771D17dF186Cfb25d0f5B9bba90", 
  MULTI_PROPERTY_MANAGER: "0x8883089F46D9e1DeBa6483BF214633B17e0aC132"
};
```

## 3. Start Development Server

```bash
npm run dev
```

## 4. Access the Application

Open `http://localhost:5173` in your browser

## 5. Connect MetaMask

1. Install MetaMask browser extension
2. Switch to Citrea testnet (Chain ID: 420)
3. Connect your wallet in the app

## 6. Test the Flow

### Admin (Contract Owner)
1. Connect wallet with admin privileges
2. Go to Admin Dashboard
3. Verify investor wallets
4. Add new properties

### Property Creator
1. Get wallet verified by admin
2. Go to Creator Dashboard
3. Mint tokens for verified investors

### Investor
1. Get wallet verified by admin
2. Go to Investor Dashboard
3. View properties and revenue

## Network Configuration

The app is pre-configured for Citrea testnet:
- **Chain ID**: 420
- **RPC**: https://rpc.citrea.xyz
- **Explorer**: https://explorer.citrea.xyz

## Troubleshooting

- **Wallet not connecting**: Check MetaMask installation and network
- **Transaction fails**: Ensure sufficient ETH for gas fees
- **Access denied**: Verify wallet has proper permissions
- **Contract errors**: Verify contract addresses are correct

## Demo Data

The deployment script already created a sample property:
- **Name**: Sample Property Token
- **Symbol**: SPT
- **Creator**: Your deployer address

You can use this to test the complete flow!
