# Deploy Exchange to Sepolia Testnet

## Overview

This guide will help you deploy the Exchange contract to Sepolia testnet and configure your application to use it.

## Prerequisites

1. **Get Sepolia ETH**:
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Or [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
   - Request test ETH for your deployer wallet

2. **Configure Hardhat**:
   - Make sure your `hardhat.config.js` has Sepolia network configured
   - Your private key should be in the config (use environment variables!)

## Deployment Steps

### Step 1: Deploy All Contracts (Including Exchange)

Run the main deployment script:

```bash
cd hardHat
npx hardhat run scripts/deploy-script.js --network sepolia
```

This will:
- ✓ Deploy DappToken (if not already deployed)
- ✓ Deploy Exchange with DappToken address
- ✓ Generate `ExchangeConfig.js` in `src/components/config/`
- ✓ Save contract address and ABI

### Step 2: Update .env File

After deployment, the script will output the Exchange contract address.
Update your `.env` file:

```env
VITE_EXCHANGE_ADDRESS=0xYourExchangeAddressHere
```

**Important**: Replace the placeholder address with the actual deployed address!

### Step 3: Verify Contract on Etherscan (Optional but Recommended)

```bash
npx hardhat verify --network sepolia DEPLOYED_EXCHANGE_ADDRESS "FEE_ACCOUNT" "FEE_PERCENT" "DAPPTOKEN_ADDRESS"
```

Example:
```bash
npx hardhat verify --network sepolia 0x123... "0xYourWallet..." "10" "0xDappTokenAddress..."
```

### Step 4: Test the Exchange

1. **Connect MetaMask to Sepolia**
   - Network: Sepolia Test Network
   - Chain ID: 11155111

2. **Navigate to Exchange**:
   ```
   http://localhost:5173/exchange
   ```

3. **Get DappTokens**:
   - The deployer has all DappTokens
   - Transfer some to your test wallet

4. **Approve Exchange**:
   - Before depositing tokens, approve the Exchange contract

5. **Start Trading**!

## Contract Architecture on Sepolia

```
Sepolia Testnet
│
├── DappToken (ERC20)
│   └── Symbol: DAPP
│   └── Supply: As configured in deploy-script.js
│
└── Exchange
    ├── Token: DappToken address
    ├── Fee Account: Deployer address
    └── Fee Percent: 10%
```

## Configuration Files

### 1. Contract Config
Location: `src/components/config/ExchangeConfig.js`

Contains:
- `EXCHANGE_ADDRESS`: From `VITE_EXCHANGE_ADDRESS` env variable
- `EXCHANGE_ABI`: Contract ABI

### 2. Environment Variables
Location: `.env`

```env
VITE_NETWORK_ID=11155111
VITE_NETWORK_NAME=Sepolia
VITE_EXCHANGE_ADDRESS=0x... (Your deployed address)
VITE_DAPPTOKEN_ADDRESS=0x... (DappToken address)
```

## How the Exchange Works

### Trading Pairs
- **ETH ↔ DAPP**: Trade Ether for DappTokens
- Uses the DappToken deployed on Sepolia

### Fees
- **10% fee** on all trades (configurable)
- Fees go to the fee account (deployer)

### Order Book
- Create buy/sell orders
- Orders stay on-chain until filled or cancelled
- No order expiration (cancel manually)

## Troubleshooting

### Issue: "Contract not deployed" error

**Solution**:
1. Check `.env` has correct `VITE_EXCHANGE_ADDRESS`
2. Ensure you're connected to Sepolia in MetaMask
3. Verify contract is deployed: Check on [Sepolia Etherscan](https://sepolia.etherscan.io/)

### Issue: "Insufficient balance" when depositing

**Solution**:
1. For ETH: Make sure you have Sepolia ETH
2. For Tokens: Make sure you have DappTokens
3. Check token approval: `exchange.methods.balanceOf(tokenAddress, yourAddress).call()`

### Issue: Transaction fails with "Transfer failed"

**Solution**:
1. Approve Exchange before depositing tokens
2. Use DappToken's `approve()` function:
   ```javascript
   await token.methods.approve(exchangeAddress, amount).send({from: account})
   ```

### Issue: Orders not showing up

**Solution**:
1. Make sure you have deposited funds to the exchange
2. Check that the transaction was confirmed
3. Refresh the page

## Manual Deployment (If needed)

If you want to deploy Exchange separately:

```bash
cd hardHat
npx hardhat run scripts/deploy-exchange.js --network sepolia
```

Then manually create the config file or run:
```bash
node scripts/copy-abis.js
```

## Contract Addresses on Sepolia

After deployment, document your addresses here:

```
DappToken: 0x...
Exchange: 0x...
Fee Account: 0x...
```

## Next Steps

1. **Add Liquidity**: Deposit both ETH and DAPP tokens
2. **Create Orders**: Make your first buy/sell orders
3. **Invite Users**: Share the exchange with others
4. **Monitor Trades**: Check events on Etherscan
5. **Collect Fees**: Withdraw accumulated trading fees

## Security Notes

⚠️ **This is a testnet deployment for development/testing purposes**

For production:
- Add access controls
- Implement emergency pause
- Add withdrawal limits
- Consider using a multisig for fee account
- Audit the smart contracts
- Add oracle for price feeds
- Implement slippage protection

## Support

If you encounter issues:
1. Check [Hardhat Documentation](https://hardhat.org/)
2. Review Sepolia Etherscan for transaction details
3. Check browser console for errors
4. Ensure all dependencies are installed

---

**Deployment Checklist:**

- [ ] Sepolia ETH in deployer wallet
- [ ] Hardhat config has Sepolia network
- [ ] Ran deployment script
- [ ] Updated `.env` with Exchange address
- [ ] Tested Exchange on Sepolia
- [ ] Documented deployed addresses
- [ ] (Optional) Verified contract on Etherscan

🎉 **Ready to trade on Sepolia!**
