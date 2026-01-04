# Exchange Balance Validation - Testing Guide

## Summary of Changes

The Exchange order submission workflow has been enhanced with comprehensive balance validation to ensure users can only place orders when they have sufficient funds in their exchange account.

### Files Modified
1. **src/exchange/components/NewOrder.jsx** - Added balance validation logic and UI improvements

---

## Features Implemented

### 1. **Buy Order Validation**
- ✅ Validates user has sufficient ETH in exchange account before placing buy order
- ✅ Calculates total cost (Amount × Price)
- ✅ Compares total cost with available ETH balance
- ✅ Shows clear error message if insufficient funds
- ✅ Visual warning indicator in UI

### 2. **Sell Order Validation**
- ✅ Validates user has sufficient DAPP tokens in exchange account before placing sell order
- ✅ Compares sell amount with available DAPP balance
- ✅ Shows clear error message if insufficient funds
- ✅ Visual warning indicator in UI

### 3. **UI Improvements**
- ✅ Displays available ETH balance on Buy tab
- ✅ Displays available DAPP balance on Sell tab
- ✅ Real-time visual warnings when balance is insufficient
- ✅ Prevents wasted gas fees by checking balance before blockchain transaction

### 4. **Input Validation**
- ✅ Validates amount and price are valid numbers
- ✅ Validates amount and price are greater than 0
- ✅ Validates balance is sufficient before submission

---

## Testing Instructions

### Prerequisites
1. Connect MetaMask to Sepolia testnet
2. Have some test ETH in your wallet (get from [Sepolia Faucet](https://sepolia-faucet.pk910.de/#/))
3. Have DAPP tokens in your wallet
4. Navigate to the Exchange page

---

## Test Case 1: Buy Order - Insufficient Balance

**Objective**: Verify that buy orders are blocked when user lacks sufficient ETH in exchange

### Steps:
1. **Check Your Exchange Balance**
   - Look at the "Balance" card on the left
   - Note your "Exchange" ETH balance (should be 0 if you haven't deposited)

2. **Try to Place a Buy Order Without Sufficient Balance**
   - Click on the "New Order" card
   - Select the "📈 Buy" tab
   - You should see: "Available ETH in Exchange: 0.0000 ETH" (or your actual balance)
   - Enter Amount: `1` DAPP
   - Enter Price: `0.01` ETH
   - You should see "Total Cost: 0.0100 ETH"
   - **Expected Result**: A red warning box appears saying:
     ```
     ⚠️ Insufficient balance! You need 0.0100 ETH but only have 0.0000 ETH
     ```
   - Click "Buy DAPP" button
   - **Expected Result**: Toast error message:
     ```
     Insufficient ETH in exchange account! You need 0.0100 ETH but only have 0.0000 ETH. Please deposit more ETH.
     ```
   - **Expected Result**: Order is NOT submitted to blockchain (no MetaMask popup)

3. **Deposit ETH to Exchange**
   - Go to the "Balance" card
   - Select "ETH" asset
   - Select "Deposit" tab
   - Enter amount: `0.1` ETH
   - Click "Deposit" button
   - Confirm in MetaMask
   - Wait for transaction to complete
   - **Expected Result**: Your Exchange ETH balance updates to 0.1 ETH

4. **Try Buy Order Again with Sufficient Balance**
   - Go back to "New Order" card
   - Select "📈 Buy" tab
   - You should now see: "Available ETH in Exchange: 0.1000 ETH"
   - Enter Amount: `1` DAPP
   - Enter Price: `0.01` ETH
   - **Expected Result**: Total Cost shows 0.0100 ETH
   - **Expected Result**: NO warning box appears (you have sufficient balance)
   - Click "Buy DAPP" button
   - **Expected Result**: MetaMask popup appears asking to confirm transaction
   - Confirm the transaction
   - **Expected Result**: Toast success message: "Buy order submitted successfully!"
   - **Expected Result**: Order appears in "My Open Orders" section

---

## Test Case 2: Buy Order - Exact Balance

**Objective**: Verify orders work when balance exactly matches required amount

### Steps:
1. Check your Exchange ETH balance (e.g., 0.05 ETH)
2. Create a buy order with EXACT total cost:
   - Amount: `5` DAPP
   - Price: `0.01` ETH
   - Total Cost: `0.05` ETH (exactly your balance)
3. **Expected Result**: NO warning appears
4. Click "Buy DAPP"
5. **Expected Result**: Order submits successfully

---

## Test Case 3: Sell Order - Insufficient Balance

**Objective**: Verify that sell orders are blocked when user lacks sufficient DAPP tokens

### Steps:
1. **Check Your Exchange DAPP Balance**
   - Look at the "Balance" card
   - Note your "Exchange" DAPP balance (should be 0 if you haven't deposited)

2. **Try to Place a Sell Order Without Sufficient Balance**
   - Click on the "New Order" card
   - Select the "📉 Sell" tab
   - You should see: "Available DAPP in Exchange: 0.0000 DAPP"
   - Enter Amount: `10` DAPP
   - Enter Price: `0.01` ETH
   - You should see "Total Receive: 0.1000 ETH"
   - **Expected Result**: A red warning box appears saying:
     ```
     ⚠️ Insufficient balance! You need 10.0000 DAPP but only have 0.0000 DAPP
     ```
   - Click "Sell DAPP" button
   - **Expected Result**: Toast error message:
     ```
     Insufficient DAPP tokens in exchange account! You need 10.0000 DAPP but only have 0.0000 DAPP. Please deposit more tokens.
     ```
   - **Expected Result**: Order is NOT submitted to blockchain (no MetaMask popup)

3. **Deposit DAPP Tokens to Exchange**
   - Go to the "Balance" card
   - Select "DAPP" asset
   - Select "Deposit" tab
   - Enter amount: `100` DAPP
   - Click "Deposit" button
   - Confirm in MetaMask
   - Wait for transaction to complete
   - **Expected Result**: Your Exchange DAPP balance updates to 100 DAPP

4. **Try Sell Order Again with Sufficient Balance**
   - Go back to "New Order" card
   - Select "📉 Sell" tab
   - You should now see: "Available DAPP in Exchange: 100.0000 DAPP"
   - Enter Amount: `10` DAPP
   - Enter Price: `0.01` ETH
   - **Expected Result**: Total Receive shows 0.1000 ETH
   - **Expected Result**: NO warning box appears
   - Click "Sell DAPP" button
   - **Expected Result**: MetaMask popup appears
   - Confirm the transaction
   - **Expected Result**: Toast success message: "Sell order submitted successfully!"
   - **Expected Result**: Order appears in "My Open Orders" section

---

## Test Case 4: Input Validation

**Objective**: Verify input validation works correctly

### Steps:
1. **Test Negative Values**
   - Enter Amount: `-5`
   - Enter Price: `0.01`
   - Click "Buy DAPP"
   - **Expected Result**: Error message: "Amount and price must be greater than 0"

2. **Test Zero Values**
   - Enter Amount: `0`
   - Enter Price: `0`
   - Click "Buy DAPP"
   - **Expected Result**: Error message: "Amount and price must be greater than 0"

3. **Test Non-Numeric Values**
   - Leave Amount empty
   - Enter Price: `abc`
   - Click "Buy DAPP"
   - **Expected Result**: HTML5 validation prevents submission or error: "Please enter valid amount and price"

---

## Test Case 5: Edge Cases

### A. Very Small Amounts
1. Enter Amount: `0.0001` DAPP
2. Enter Price: `0.0001` ETH
3. Total Cost: `0.00000001` ETH
4. **Expected Result**: Should work if you have sufficient balance

### B. Large Amounts
1. Enter Amount: `1000000` DAPP
2. Enter Price: `1` ETH
3. Total Cost: `1000000` ETH
4. **Expected Result**: Warning appears (insufficient balance)
5. Order submission is blocked

### C. Decimal Precision
1. Enter Amount: `1.123456` DAPP
2. Enter Price: `0.987654` ETH
3. **Expected Result**: Total cost calculated correctly to 4 decimal places
4. Balance comparison works correctly

---

## Test Case 6: Real-Time Balance Updates

**Objective**: Verify balance updates are reflected immediately

### Steps:
1. Note your current Exchange ETH balance
2. Open the "Balance" card
3. Deposit more ETH (e.g., 0.05 ETH)
4. Wait for transaction confirmation
5. Go to "New Order" card
6. **Expected Result**: The "Available ETH in Exchange" should show the updated balance immediately
7. Try creating an order with the new balance
8. **Expected Result**: Order validation uses the updated balance

---

## Test Case 7: Multiple Orders Workflow

**Objective**: Test placing multiple orders consecutively

### Steps:
1. Deposit 1 ETH to exchange
2. Place buy order: 10 DAPP @ 0.01 ETH (uses 0.1 ETH)
3. **Expected Result**: Order succeeds, balance shows ~0.9 ETH remaining
4. Place another buy order: 50 DAPP @ 0.01 ETH (requires 0.5 ETH)
5. **Expected Result**: Order succeeds, balance shows ~0.4 ETH remaining
6. Try to place buy order: 100 DAPP @ 0.01 ETH (requires 1 ETH)
7. **Expected Result**: Error - insufficient balance
8. **Expected Result**: Shows you need 1.0000 ETH but only have ~0.4000 ETH

---

## Expected Validation Behavior Summary

| Scenario | Expected Behavior |
|----------|------------------|
| Sufficient balance | ✅ Order submits to blockchain |
| Insufficient balance | ❌ Order blocked, error message shown |
| Exact balance | ✅ Order submits successfully |
| Zero balance | ❌ Order blocked with clear message |
| Negative/zero input | ❌ Validation error before balance check |
| Invalid input | ❌ HTML5 or custom validation error |

---

## Visual Indicators Reference

### Available Balance Display (Green box)
```
Available ETH in Exchange: 0.1234 ETH
Available DAPP in Exchange: 100.5678 DAPP
```

### Insufficient Balance Warning (Red box)
```
⚠️ Insufficient balance! You need X.XXXX [ASSET] but only have Y.YYYY [ASSET]
```

### Toast Messages
- **Success**: "Buy/Sell order submitted successfully!"
- **Error**: "Insufficient ETH/DAPP tokens in exchange account! You need X.XXXX but only have Y.YYYY. Please deposit more."
- **Validation Error**: "Please enter valid amount and price"
- **Validation Error**: "Amount and price must be greater than 0"

---

## Troubleshooting

### Issue: Balance shows 0.0000 but I deposited
**Solution**:
- Refresh the page
- Check if the deposit transaction was confirmed on Sepolia
- Click the refresh button on the Exchange page

### Issue: Order still goes through despite warning
**Solution**:
- This shouldn't happen. If it does, there's a bug
- Check browser console for errors
- Verify the validation code is running (check Network tab)

### Issue: Balance doesn't update after deposit
**Solution**:
- Wait for blockchain confirmation (~15 seconds on Sepolia)
- Click the refresh icon in the hero section
- Hard refresh the page (Ctrl+F5)

---

## Success Criteria

The implementation is working correctly if:
- ✅ Users cannot submit buy orders without sufficient ETH in exchange
- ✅ Users cannot submit sell orders without sufficient DAPP in exchange
- ✅ Clear, informative error messages are shown
- ✅ Visual warnings appear in real-time as users type amounts
- ✅ Available balance is displayed prominently on both tabs
- ✅ No wasted gas fees from failed transactions
- ✅ MetaMask popup only appears when validation passes

---

## Technical Implementation Details

### Validation Flow (Buy Order)
1. User enters amount and price
2. System calculates: `totalCost = amount × price`
3. System retrieves: `exchangeEtherBalance` from Redux state
4. System compares: `totalCost <= exchangeEtherBalance`
5. If insufficient: Show error, prevent submission
6. If sufficient: Proceed to MetaMask confirmation

### Validation Flow (Sell Order)
1. User enters amount
2. System retrieves: `exchangeTokenBalance` from Redux state
3. System compares: `amount <= exchangeTokenBalance`
4. If insufficient: Show error, prevent submission
5. If sufficient: Proceed to MetaMask confirmation

---

## Notes
- All balance checks happen **before** MetaMask popup
- This saves gas fees by preventing failed transactions
- Balance is checked in real-time as users type
- Visual feedback is immediate (red warning box)
- The smart contract also has balance checks as a safety layer

---

## Report Issues
If you find any bugs or edge cases during testing, please note:
1. Steps to reproduce
2. Expected vs actual behavior
3. Browser console errors (if any)
4. Screenshots of the issue
