# Network Setup Guide

## 🚨 **If Your Dashboard is Loading Forever**

This is usually caused by network connection issues. Follow these steps:

## **Option 1: Use Sepolia Testnet (Recommended for Testing)**

Since Citrea testnet might have connectivity issues, you can use Sepolia testnet for testing:

### **Add Sepolia to MetaMask:**

1. **Open MetaMask**
2. **Click the network dropdown** (top of MetaMask)
3. **Click "Add network"**
4. **Add network manually**
5. **Enter these details:**
   - **Network name**: `Sepolia Testnet`
   - **RPC URL**: `https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`
   - **Chain ID**: `11155111`
   - **Currency symbol**: `ETH`
   - **Block explorer URL**: `https://sepolia.etherscan.io`

6. **Click "Save"**

## **Option 2: Use Citrea Testnet (If Available)**

### **Add Citrea to MetaMask:**

1. **Open MetaMask**
2. **Click the network dropdown**
3. **Click "Add network"**
4. **Add network manually**
5. **Enter these details:**
   - **Network name**: `Citrea Testnet`
   - **RPC URL**: `https://rpc.testnet.citrea.xyz`
   - **Chain ID**: `5115`
   - **Currency symbol**: `cBTC`
   - **Block explorer URL**: `https://explorer.testnet.citrea.xyz`

6. **Click "Save"**

## **Option 3: Use Local Hardhat Network (For Development)**

If you want to test locally:

1. **Start Hardhat node:**
   ```bash
   cd blockend
   npx hardhat node
   ```

2. **Add local network to MetaMask:**
   - **Network name**: `Hardhat Local`
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency symbol**: `ETH`

3. **Deploy contracts to local network:**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

## **Troubleshooting Steps**

### **1. Check Browser Console**
- Press `F12` in your browser
- Go to "Console" tab
- Look for any error messages
- Share any errors you see

### **2. Check Network Connection**
- Make sure you're connected to the internet
- Try refreshing the page
- Clear browser cache

### **3. Check MetaMask**
- Make sure MetaMask is unlocked
- Check if you're on the correct network
- Try disconnecting and reconnecting

### **4. Check Contract Addresses**
- Verify the contract addresses in `src/config/contracts.js`
- Make sure they match your deployed contracts

## **Quick Fix Commands**

If you're still having issues, try these commands:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Start fresh
npm run dev
```

## **Alternative: Use Different Testnet**

If Citrea is not working, you can deploy to Sepolia:

1. **Update your Hardhat config** to include Sepolia
2. **Deploy to Sepolia:**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
3. **Update contract addresses** in the frontend
4. **Switch to Sepolia** in MetaMask

## **Still Having Issues?**

1. **Check the browser console** for specific error messages
2. **Try a different browser** (Chrome, Firefox, Edge)
3. **Disable browser extensions** temporarily
4. **Check your internet connection**
5. **Restart your computer**

The most common issue is network connectivity. Try using Sepolia testnet first as it's more reliable than Citrea.
