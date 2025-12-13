# Quick Start: Deploy Exchange to Sepolia

## 🚀 3-Step Deployment

### Step 1: Get Sepolia ETH
Visit: https://sepoliafaucet.com/
- Request test ETH for your wallet
- Wait for confirmation (~1 min)

### Step 2: Deploy to Sepolia
```bash
cd hardHat
npx hardhat run scripts/deploy-script.js --network sepolia
```

**Watch the console output!** It will show:
```
Exchange :  0x1234567890abcdef...
```

### Step 3: Update .env
Copy the Exchange address from console and update `.env`:

```env
VITE_EXCHANGE_ADDRESS=0x1234567890abcdef... (paste address here)
```

**Done!** 🎉

---

## 🧪 Test the Exchange

1. **Start your app**:
   ```bash
   npm run dev
   ```

2. **Connect MetaMask to Sepolia**:
   - Network: Sepolia Test Network
   - Chain ID: 11155111

3. **Navigate to Exchange**:
   ```
   http://localhost:5173/exchange
   ```

4. **Get some DappTokens**:
   - The deployer wallet has all tokens
   - Transfer some to your test account

5. **Start Trading!**
   - Deposit ETH and DAPP tokens
   - Create buy/sell orders
   - Fill orders

---

## ⚙️ What Was Deployed?

When you ran the deployment script, it deployed:

1. **DappToken** (if not already deployed)
   - ERC20 token for trading
   - Symbol: DAPP

2. **Exchange**
   - Connected to DappToken
   - Fee: 10%
   - Fee recipient: Your deployer address

---

## 📍 Find Your Contracts

After deployment, check your contracts on Etherscan:

1. Go to https://sepolia.etherscan.io/
2. Search for the Exchange address
3. Verify it shows:
   - ✅ Contract deployed
   - ✅ Has bytecode
   - ✅ Can see transactions

---

## 🔧 Troubleshooting

### "Contract not deployed" error
- Check `.env` has the correct `VITE_EXCHANGE_ADDRESS`
- Make sure you're connected to Sepolia in MetaMask
- Refresh your browser

### "Insufficient balance" when trading
- Get Sepolia ETH from faucet
- Request DappTokens from deployer
- Check you approved the Exchange to spend tokens

### Transaction fails
1. Make sure you have enough Sepolia ETH for gas
2. Approve Exchange before depositing tokens:
   ```javascript
   await dappToken.methods.approve(exchangeAddress, amount).send({from: account})
   ```

---

## 📚 Learn More

- [Full Sepolia Guide](./DEPLOY_EXCHANGE_SEPOLIA.md)
- [Migration Summary](./EXCHANGE_MIGRATION_SUMMARY.md)
- [Hardhat Docs](https://hardhat.org/hardhat-runner/docs/guides/deploying)

---

## ✅ Checklist

Before you start trading:

- [ ] Got Sepolia ETH from faucet
- [ ] Deployed contracts to Sepolia
- [ ] Updated `.env` with Exchange address
- [ ] Started the app (`npm run dev`)
- [ ] Connected MetaMask to Sepolia
- [ ] Navigated to `/exchange`
- [ ] Have DappTokens to trade

---

## 🎯 Next Steps

1. **Deposit Funds**:
   - Deposit ETH: Use "Deposit Ether" button
   - Deposit DAPP: Approve first, then deposit

2. **Create Your First Order**:
   - Choose buy or sell
   - Enter amount and price
   - Submit transaction

3. **Fill an Order**:
   - Browse order book
   - Click fill on any order
   - Confirm transaction

4. **Withdraw Profits**:
   - After trading, withdraw your balances
   - ETH and tokens go back to your wallet

---

**Happy Trading! 🔥**
