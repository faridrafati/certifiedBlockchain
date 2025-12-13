# Exchange Contract Setup Guide

## Summary of Changes

The Exchange contract has been modified to use **DappToken** instead of creating its own token (ExchangeToken). This allows the Exchange to work with the existing DappToken used throughout your application.

### Modified Files:

1. **hardHat/contracts/Exchange.sol**
   - Changed from importing `ExchangeToken.sol` to importing OpenZeppelin's `IERC20` interface
   - Added `tokenAddress` state variable to store DappToken address
   - Updated constructor to accept `_tokenAddress` parameter
   - Replaced `ExchangeToken()` calls with `IERC20()` interface calls

2. **hardHat/scripts/deploy-exchange.js**
   - Now deploys DappToken with:
     - Name: "Dapp Token"
     - Symbol: "DAPP"
     - Decimals: 18
     - Initial Supply: 1,000,000 tokens
   - Passes DappToken address to Exchange constructor
   - Automatically copies ABIs to frontend
   - Copies deployment info to public folder

3. **src/exchange/store/interactions.js**
   - Changed import from `Token.json` to `DappToken.json`
   - Updated to dynamically load contract addresses from `deployment-exchange.json`

4. **hardHat/scripts/copy-abis.js** (New)
   - Standalone script to copy ABIs to frontend

## Deployment Instructions

### Step 1: Start Hardhat Local Node

In Terminal 1:
```bash
cd hardHat
npx hardhat node
```
**Keep this terminal running!** This is your local blockchain.

### Step 2: Deploy Contracts

In Terminal 2:
```bash
cd hardHat
npx hardhat run scripts/deploy-exchange.js --network localhost
```

This will:
- ✓ Deploy DappToken
- ✓ Deploy Exchange with DappToken address
- ✓ Copy ABIs to `src/exchange/abis/`
- ✓ Save deployment info to `public/hardHat/deployment-exchange.json`

### Step 3: Configure MetaMask

1. **Add Localhost Network** (if not already added):
   - Network Name: Localhost 8545
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

2. **Import a Test Account**:
   - Copy a private key from Terminal 1 (Hardhat node output)
   - Import into MetaMask

### Step 4: Start Your React App

In Terminal 3:
```bash
npm run dev
```

### Step 5: Access the Exchange

Navigate to: http://localhost:5173/exchange

## Contract Architecture

```
Exchange Contract
├── DappToken (ERC20)
│   └── 1,000,000 DAPP tokens minted to deployer
│
├── Fee Configuration
│   ├── Fee Account: Deployer address
│   └── Fee Percent: 10%
│
└── Trading Features
    ├── Deposit/Withdraw ETH
    ├── Deposit/Withdraw DappToken
    ├── Make/Cancel/Fill Orders
    └── Event emission for all actions
```

## Key Features

- **Ether Trading**: Use ETH as one side of trades
- **Token Trading**: Trade DappToken against ETH
- **Order Book**: Create buy/sell orders
- **Fee Collection**: 10% fee on all trades (configurable)
- **Event Logging**: All actions emit events for frontend tracking

## Troubleshooting

### "Contract not deployed" Error
- Make sure Hardhat node is running
- Redeploy contracts: `npx hardhat run scripts/deploy-exchange.js --network localhost`

### "Parameter decoding error"
- MetaMask is not connected to localhost:8545
- Contracts need to be redeployed after restarting Hardhat node

### ABIs not found
- Run: `cd hardHat && node scripts/copy-abis.js`

## Manual ABI Copy (if needed)

```bash
# From project root
cp hardHat/artifacts/contracts/Exchange.sol/Exchange.json src/exchange/abis/
cp hardHat/artifacts/contracts/DappToken.sol/DappToken.json src/exchange/abis/
```

## Testing the Exchange

1. **Get DappTokens**:
   - The deployer account has all 1M tokens
   - You can transfer some to test accounts

2. **Approve Exchange**:
   - Before depositing, approve Exchange to spend your tokens

3. **Deposit Funds**:
   - Deposit ETH and/or DappTokens to start trading

4. **Create Orders**:
   - Make buy/sell orders
   - Fill other users' orders

5. **Monitor Events**:
   - Check console for event logs
   - All trades are recorded on-chain

## Next Steps

- Add more trading pairs
- Implement advanced order types
- Add liquidity pools
- Create trading charts/analytics
- Add price discovery mechanisms

---

**Note**: This Exchange uses a centralized order book model. For a fully decentralized exchange, consider implementing an AMM (Automated Market Maker) model.
