import Web3 from 'web3'
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
    window.alert('Please install MetaMask')
    window.location.assign("https://metamask.io/")
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
    const token = new web3.eth.Contract(DAPPTOKEN_ABI, DAPPTOKEN_ADDRESS)
    dispatch(tokenLoaded(token))
    return token
  } catch (error) {
    console.log('Contract not deployed to the current network. Please select another network with Metamask.')
    return null
  }
}

export const loadExchange = async (web3, networkId, dispatch) => {
  try {
    const exchange = new web3.eth.Contract(EXCHANGE_ABI, EXCHANGE_ADDRESS)
    dispatch(exchangeLoaded(exchange))
    return exchange
  } catch (error) {
    console.log('Contract not deployed to the current network. Please select another network with Metamask.')
    return null
  }
}

export const loadAllOrders = async (exchange, dispatch) => {
  console.log('loadAllOrders - Starting to fetch orders from blockchain...')

  // Get total number of orders from contract
  const orderCount = Number(await exchange.methods.orderCount().call())
  console.log('loadAllOrders - Order count:', orderCount)

  // Fetch all orders directly from contract state
  const allOrders = []
  const cancelledOrders = []
  const filledOrders = []

  for (let i = 1; i <= orderCount; i++) {
    const orderData = await exchange.methods.orders(i).call()
    const isCancelled = await exchange.methods.orderCancelled(i).call()
    const isFilled = await exchange.methods.orderFilled(i).call()

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

    // Add to allOrders
    allOrders.push(order)

    // Add to cancelled if cancelled
    if (isCancelled) {
      cancelledOrders.push(order)
    }

    // Add to filled if filled
    if (isFilled) {
      filledOrders.push(order)
    }
  }

  console.log('loadAllOrders - All orders fetched:', allOrders.length, allOrders)
  console.log('loadAllOrders - Cancelled orders:', cancelledOrders.length, cancelledOrders)
  console.log('loadAllOrders - Filled orders:', filledOrders.length, filledOrders)

  // Dispatch to Redux
  dispatch(cancelledOrdersLoaded(cancelledOrders))
  dispatch(filledOrdersLoaded(filledOrders))
  dispatch(allOrdersLoaded(allOrders))

  console.log('loadAllOrders - All orders dispatched to Redux')
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
  exchange.methods.cancelOrder(order.id).send({ from: account })
  .on('transactionHash', (hash) => {
     dispatch(orderCancelling())
  })
  .on('receipt', async (receipt) => {
    // Reload orders from contract state after transaction is mined
    await loadAllOrders(exchange, dispatch)
  })
  .on('error', (error) => {
    console.log(error)
    window.alert('There was an error!')
  })
}

export const fillOrder = (dispatch, exchange, order, account) => {
  exchange.methods.fillOrder(order.id).send({ from: account })
  .on('transactionHash', (hash) => {
     dispatch(orderFilling())
  })
  .on('receipt', async (receipt) => {
    // Reload orders from contract state after transaction is mined
    await loadAllOrders(exchange, dispatch)
  })
  .on('error', (error) => {
    console.log(error)
    window.alert('There was an error!')
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
      window.alert('Please login with MetaMask')
    }
}

export const depositEther = (dispatch, exchange, web3, token, amount, account) => {
  exchange.methods.depositEther().send({ from: account,  value: web3.utils.toWei(amount, 'ether') })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('receipt', async (receipt) => {
    // Reload balances from contract state after transaction is mined
    await loadBalances(dispatch, web3, exchange, token, account)
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}

export const withdrawEther = (dispatch, exchange, web3, token, amount, account) => {
  exchange.methods.withdrawEther(web3.utils.toWei(amount, 'ether')).send({ from: account })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('receipt', async (receipt) => {
    // Reload balances from contract state after transaction is mined
    await loadBalances(dispatch, web3, exchange, token, account)
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}

export const depositToken = (dispatch, exchange, web3, token, amount, account) => {
  amount = web3.utils.toWei(amount, 'ether')

  token.methods.approve(exchange.options.address, amount).send({ from: account })
  .on('transactionHash', (hash) => {
    exchange.methods.depositToken(token.options.address, amount).send({ from: account })
    .on('transactionHash', (hash) => {
      dispatch(balancesLoading())
    })
    .on('receipt', async (receipt) => {
      // Reload balances from contract state after transaction is mined
      await loadBalances(dispatch, web3, exchange, token, account)
    })
    .on('error',(error) => {
      console.error(error)
      window.alert(`There was an error!`)
    })
  })
}

export const withdrawToken = (dispatch, exchange, web3, token, amount, account) => {
  exchange.methods.withdrawToken(token.options.address, web3.utils.toWei(amount, 'ether')).send({ from: account })
  .on('transactionHash', (hash) => {
    dispatch(balancesLoading())
  })
  .on('receipt', async (receipt) => {
    // Reload balances from contract state after transaction is mined
    await loadBalances(dispatch, web3, exchange, token, account)
  })
  .on('error',(error) => {
    console.error(error)
    window.alert(`There was an error!`)
  })
}

export const makeBuyOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = token.options.address
  const amountGet = web3.utils.toWei(order.amount, 'ether')
  const tokenGive = ETHER_ADDRESS
  const amountGive = web3.utils.toWei((order.amount * order.price).toString(), 'ether')

  return new Promise((resolve, reject) => {
    exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account })
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
  })
}

export const makeSellOrder = (dispatch, exchange, token, web3, order, account) => {
  const tokenGet = ETHER_ADDRESS
  const amountGet = web3.utils.toWei((order.amount * order.price).toString(), 'ether')
  const tokenGive = token.options.address
  const amountGive = web3.utils.toWei(order.amount, 'ether')

  return new Promise((resolve, reject) => {
    exchange.methods.makeOrder(tokenGet, amountGet, tokenGive, amountGive).send({ from: account })
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
  })
}
