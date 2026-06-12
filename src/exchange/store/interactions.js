import Web3 from 'web3'
import { toast } from 'react-toastify'
import {
  web3Loaded,
  web3AccountLoaded,
  tokenLoaded,
  exchangeLoaded,
  cancelledOrdersLoaded,
  filledOrdersLoaded,
  allOrdersLoaded,
  orderCancelling,
  orderCancelled,
  orderFilling,
  orderFilled,
  feePercentLoaded,
  etherBalanceLoaded,
  tokenBalanceLoaded,
  exchangeEtherBalanceLoaded,
  exchangeTokenBalanceLoaded,
  balancesLoaded,
  balancesLoading,
  buyOrderMaking,
  sellOrderMaking,
  orderMade
} from './actions'
import { DAPPTOKEN_ADDRESS, DAPPTOKEN_ABI } from '../../components/config/DappTokenConfig'
import { EXCHANGE_ADDRESS, EXCHANGE_ABI } from '../../components/config/ExchangeConfig'
import { ETHER_ADDRESS } from '../helpers'

export const loadWeb3 = async (dispatch) => {
  if(typeof window.ethereum!=='undefined'){
    const web3 = new Web3(window.ethereum)
    dispatch(web3Loaded(web3))
    return web3
  } else {
    toast.error('Please install MetaMask to use the exchange')
    return null
  }
}

export const loadAccount = async (web3, dispatch) => {
  const accounts = await web3.eth.getAccounts()
  const account = accounts[0]
  dispatch(web3AccountLoaded(account))
  return account
}

export const loadToken = async (web3, networkId, dispatch) => {
  try {
    // Undefined when VITE_DAPPTOKEN_ADDRESS is not set in .env
    if (!DAPPTOKEN_ADDRESS) return null
    const token = new web3.eth.Contract(DAPPTOKEN_ABI, DAPPTOKEN_ADDRESS)
    dispatch(tokenLoaded(token))
    return token
  } catch (error) {
    console.error('Token contract not deployed to the current network.', error)
    return null
  }
}

export const loadExchange = async (web3, networkId, dispatch) => {
  try {
    // Undefined when VITE_EXCHANGE_ADDRESS is not set in .env
    if (!EXCHANGE_ADDRESS) return null
    const exchange = new web3.eth.Contract(EXCHANGE_ABI, EXCHANGE_ADDRESS)
    dispatch(exchangeLoaded(exchange))
    // Read the real fee from the contract so the order-book affordability checks
    // stay in sync with the deployed fee instead of assuming a hardcoded 10%.
    try {
      const fee = await exchange.methods.feePercent().call()
      dispatch(feePercentLoaded(Number(fee)))
    } catch (feeErr) {
      console.error('Could not read feePercent from exchange; using default.', feeErr)
    }
    return exchange
  } catch (error) {
    console.error('Exchange contract not deployed to the current network.', error)
    return null
  }
}

export const loadAllOrders = async (exchange, dispatch) => {
  // Get total number of orders from contract
  const orderCount = Number(await exchange.methods.orderCount().call())

  // Fetch Trade events to get userFill, transaction hash, and fill timestamp
  const tradeEvents = await exchange.getPastEvents('Trade', {
    fromBlock: 0,
    toBlock: 'latest'
  })

  // Create a map of orderId -> {userFill, transactionHash, fillTimestamp}
  const tradeDataMap = {}
  tradeEvents.forEach(event => {
    const orderId = String(event.returnValues.id)
    tradeDataMap[orderId] = {
      userFill: event.returnValues.userFill,
      transactionHash: event.transactionHash,
      fillTimestamp: String(event.returnValues.timestamp)
    }
  })

  // Fetch all orders concurrently (order data + cancelled/filled status per order)
  const orderResults = await Promise.all(
    Array.from({ length: orderCount }, (_, idx) => {
      const i = idx + 1
      return Promise.all([
        exchange.methods.orders(i).call(),
        exchange.methods.orderCancelled(i).call(),
        exchange.methods.orderFilled(i).call()
      ])
    })
  )

  const allOrders = []
  const cancelledOrders = []
  const filledOrders = []

  for (const [orderData, isCancelled, isFilled] of orderResults) {
    // Transform order data from contract format (numeric indices) to named properties
    // Convert BigInt values to strings to match expected format
    const order = {
      id: String(orderData[0] || orderData.id),
      user: orderData[1] || orderData.user,
      tokenGet: orderData[2] || orderData.tokenGet,
      amountGet: String(orderData[3] || orderData.amountGet),
      tokenGive: orderData[4] || orderData.tokenGive,
      amountGive: String(orderData[5] || orderData.amountGive),
      timestamp: String(orderData[6] || orderData.timestamp)
    }

    allOrders.push(order)

    if (isCancelled) {
      cancelledOrders.push(order)
    }

    if (isFilled) {
      // Add userFill, transactionHash, and use fill timestamp from Trade event
      const tradeData = tradeDataMap[order.id] || {}
      filledOrders.push({
        ...order,
        timestamp: tradeData.fillTimestamp || order.timestamp,
        userFill: tradeData.userFill || null,
        transactionHash: tradeData.transactionHash || null
      })
    }
  }

  // Dispatch to Redux
  dispatch(cancelledOrdersLoaded(cancelledOrders))
  dispatch(filledOrdersLoaded(filledOrders))
  dispatch(allOrdersLoaded(allOrders))
}

// NOTE: Event subscriptions disabled - we now reload data directly from contract state
// This is more reliable than event listeners, especially on testnets
// Data is reloaded after each transaction completes (on 'receipt' event)
/*
export const subscribeToEvents = async (exchange, dispatch) => {
  exchange.events.Cancel({}, (error, event) => {
    if (error) {
      console.error('Cancel event error:', error)
      return
    }
    console.log('Cancel event received:', event.returnValues)
    dispatch(orderCancelled(event.returnValues))
  })

  exchange.events.Trade({}, (error, event) => {
    if (error) {
      console.error('Trade event error:', error)
      return
    }
    console.log('Trade event received:', event.returnValues)
    dispatch(orderFilled(event.returnValues))
  })

  exchange.events.Deposit({}, (error, event) => {
    if (error) {
      console.error('Deposit event error:', error)
      return
    }
    console.log('Deposit event received:', event.returnValues)
    dispatch(balancesLoaded())
  })

  exchange.events.Withdraw({}, (error, event) => {
    if (error) {
      console.error('Withdraw event error:', error)
      return
    }
    console.log('Withdraw event received:', event.returnValues)
    dispatch(balancesLoaded())
  })

  exchange.events.Order({}, (error, event) => {
    if (error) {
      console.error('Order event error:', error)
      return
    }
    console.log('Order event received:', event.returnValues)
    dispatch(orderMade(event.returnValues))
  })
}
*/

export const cancelOrder = (dispatch, exchange, order, account) => {
  return new Promise((resolve, reject) => {
    try {
      exchange.methods.cancelOrder(order.id).send({ from: account })
      .on('transactionHash', (hash) => {
        dispatch(orderCancelling())
      })
      .on('receipt', async (receipt) => {
        // Reload orders from contract state after transaction is mined
        await loadAllOrders(exchange, dispatch)
        resolve(receipt)
      })
      .on('error', (error) => {
        console.error(error)
        reject(error)
      })
      .catch((error) => {
        console.error(error)
        reject(error)
      })
    } catch (error) {
      console.error(error)
      reject(error)
    }
  })
}

export const fillOrder = (dispatch, exchange, order, account) => {
  return new Promise((resolve, reject) => {
    try {
      exchange.methods.fillOrder(order.id).send({
        from: account,
        gas: 500000 // Set reasonable gas limit to avoid estimation issues
      })
      .on('transactionHash', (hash) => {
        dispatch(orderFilling())
      })
      .on('receipt', async (receipt) => {
        // Reload orders from contract state after transaction is mined
        await loadAllOrders(exchange, dispatch)
        resolve(receipt)
      })
      .on('error', (error) => {
        console.error(error)
        reject(error)
      })
      .catch((error) => {
        console.error(error)
        reject(error)
      })
    } catch (error) {
      console.error(error)
      reject(error)
    }
  })
}

export const loadBalances = async (dispatch, web3, exchange, token, account) => {
  if(typeof account !== 'undefined') {
      // Ether balance in wallet
      const etherBalance = await web3.eth.getBalance(account)
      dispatch(etherBalanceLoaded(etherBalance))

      // Token balance in wallet
      const tokenBalance = await token.methods.balanceOf(account).call()
      dispatch(tokenBalanceLoaded(tokenBalance))

      // Ether balance in exchange
      const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_ADDRESS, account).call()
      dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance))

      // Token balance in exchange
      const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call()
      dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance))

      // Trigger all balances loaded
      dispatch(balancesLoaded())
    } else {
      toast.error('Please login with MetaMask')
    }
}

export const depositEther = (dispatch, exchange, web3, token, amount, account) => {
  return new Promise((resolve, reject) => {
    try {
      exchange.methods.depositEther().send({ from: account,  value: web3.utils.toWei(amount, 'ether') })
      .on('transactionHash', (hash) => {
        dispatch(balancesLoading())
      })
      .on('receipt', async (receipt) => {
        // Reload balances from contract state after transaction is mined
        await loadBalances(dispatch, web3, exchange, token, account)
        resolve(receipt)
      })
      .on('error',(error) => {
        console.error(error)
        reject(error)
      })
      .catch((error) => {
        console.error(error)
        reject(error)
      })
    } catch (error) {
      console.error(error)
      reject(error)
    }
  })
}

export const withdrawEther = (dispatch, exchange, web3, token, amount, account) => {
  return new Promise((resolve, reject) => {
    try {
      exchange.methods.withdrawEther(web3.utils.toWei(amount, 'ether')).send({ from: account })
      .on('transactionHash', (hash) => {
        dispatch(balancesLoading())
      })
      .on('receipt', async (receipt) => {
        // Reload balances from contract state after transaction is mined
        await loadBalances(dispatch, web3, exchange, token, account)
        resolve(receipt)
      })
      .on('error',(error) => {
        console.error(error)
        reject(error)
      })
      .catch((error) => {
        console.error(error)
        reject(error)
      })
    } catch (error) {
      console.error(error)
      reject(error)
    }
  })
}

export const depositToken = (dispatch, exchange, web3, token, amount, account) => {
  amount = web3.utils.toWei(amount, 'ether')

  return new Promise((resolve, reject) => {
    try {
      token.methods.approve(exchange.options.address, amount).send({ from: account })
      .on('receipt', () => {
        // Only deposit once the approval is mined - depositing on the approval's
        // transactionHash would race the allowance update and can revert
        exchange.methods.depositToken(token.options.address, amount).send({ from: account })
        .on('transactionHash', (hash) => {
          dispatch(balancesLoading())
        })
        .on('receipt', async (receipt) => {
          // Reload balances from contract state after transaction is mined
          await loadBalances(dispatch, web3, exchange, token, account)
          resolve(receipt)
        })
        .on('error',(error) => {
          console.error(error)
          reject(error)
        })
        .catch((error) => {
          console.error(error)
          reject(error)
        })
      })
      .on('error',(error) => {
        console.error(error)
        reject(error)
      })
      .catch((error) => {
        console.error(error)
        reject(error)
      })
    } catch (error) {
      console.error(error)
      reject(error)
    }
  })
}

export const withdrawToken = (dispatch, exchange, web3, token, amount, account) => {
  return new Promise((resolve, reject) => {
    try {
      exchange.methods.withdrawToken(token.options.address, web3.utils.toWei(amount, 'ether')).send({ from: account })
      .on('transactionHash', (hash) => {
        dispatch(balancesLoading())
      })
      .on('receipt', async (receipt) => {
        // Reload balances from contract state after transaction is mined
        await loadBalances(dispatch, web3, exchange, token, account)
        resolve(receipt)
      })
      .on('error',(error) => {
        console.error(error)
        reject(error)
      })
      .catch((error) => {
        console.error(error)
        reject(error)
      })
    } catch (error) {
      console.error(error)
      reject(error)
    }
  })
}

export const makeBuyOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = token.options.address
  const amountGet = web3.utils.toWei(order.amount, 'ether')
  const tokenGive = ETHER_ADDRESS
  // toFixed(18) avoids float artifacts and exponent notation that toWei rejects
  const amountGive = web3.utils.toWei((order.amount * order.price).toFixed(18), 'ether')

  return new Promise((resolve, reject) => {
    try {
      exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({
        from: account,
        gas: 500000 // Set reasonable gas limit to avoid estimation issues
      })
      .on('transactionHash', (hash) => {
        dispatch(buyOrderMaking())
      })
      .on('receipt', async (receipt) => {
        // Reload orders from contract state after transaction is mined
        await loadAllOrders(exchange, dispatch)
        resolve(receipt)
      })
      .on('error',(error) => {
        console.error(error)
        reject(error)
      })
      .catch((error) => {
        console.error(error)
        reject(error)
      })
    } catch (error) {
      console.error(error)
      reject(error)
    }
  })
}

export const makeSellOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = ETHER_ADDRESS
  // toFixed(18) avoids float artifacts and exponent notation that toWei rejects
  const amountGet = web3.utils.toWei((order.amount * order.price).toFixed(18), 'ether')
  const tokenGive = token.options.address
  const amountGive = web3.utils.toWei(order.amount, 'ether')

  return new Promise((resolve, reject) => {
    try {
      exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({
        from: account,
        gas: 500000 // Set reasonable gas limit to avoid estimation issues
      })
      .on('transactionHash', (hash) => {
        dispatch(sellOrderMaking())
      })
      .on('receipt', async (receipt) => {
        // Reload orders from contract state after transaction is mined
        await loadAllOrders(exchange, dispatch)
        resolve(receipt)
      })
      .on('error',(error) => {
        console.error(error)
        reject(error)
      })
      .catch((error) => {
        console.error(error)
        reject(error)
      })
    } catch (error) {
      console.error(error)
      reject(error)
    }
  })
}
