import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress
} from '@mui/material'
import { toast } from 'react-toastify'
import Spinner from './Spinner'
import {
  orderBookSelector,
  orderBookLoadedSelector,
  exchangeSelector,
  accountSelector,
  orderFillingSelector,
  exchangeEtherBalanceSelector,
  exchangeTokenBalanceSelector,
  feePercentSelector
} from '../store/selectors'
import { fillOrder, loadAllOrders } from '../store/interactions'
import { ETHER_ADDRESS } from '../helpers'

const renderOrder = (order, props) => {
  const { dispatch, exchange, account, exchangeEtherBalance, exchangeTokenBalance, feePercent, fillingOrderId, onFillOrder } = props

  // Check if this is the user's own order
  const isOwnOrder = Boolean(order.user && account && order.user.toLowerCase() === account.toLowerCase())

  // Check if user has sufficient balance to fill this order
  // When filling an order, user needs the token/ETH that the order creator wants (tokenGet)
  // IMPORTANT: Some exchanges charge fee on what you GIVE (not what you receive)
  // So user might need: amountGet + fee
  const amountNeeded = parseFloat(order.tokenGet === ETHER_ADDRESS ? order.etherAmount : order.tokenAmount)
  const fee = amountNeeded * (feePercent / 100)
  const totalNeeded = amountNeeded + fee

  const userBalance = order.tokenGet === ETHER_ADDRESS ? exchangeEtherBalance : exchangeTokenBalance
  const hasSufficientBalance = userBalance >= totalNeeded

  // User can fill the order only if it's not their own order AND they have sufficient balance
  const canFill = !isOwnOrder && hasSufficientBalance
  const isFilling = fillingOrderId === order.id

  let tooltipTitle
  if (isFilling) {
    tooltipTitle = 'Processing transaction...'
  } else if (isOwnOrder) {
    tooltipTitle = `This is your own order. You cannot fill your own orders.`
  } else if (!hasSufficientBalance) {
    tooltipTitle = `Insufficient balance. You need ${amountNeeded.toFixed(6)} ${order.tokenGet === ETHER_ADDRESS ? 'ETH' : 'DAPP'} in exchange. You have ${userBalance.toFixed(6)}. Please deposit more funds.`
  } else {
    tooltipTitle = `Click here to ${order.orderFillAction}`
  }

  return(
    <Tooltip
      key={order.id}
      title={tooltipTitle}
      placement="top"
    >
      <TableRow
        hover
        className="order-book-order"
        onClick={() => canFill && !isFilling && onFillOrder(order)}
        sx={{
          cursor: canFill && !isFilling ? 'pointer' : 'not-allowed',
          opacity: canFill && !isFilling ? 1 : 0.5,
          '&:hover': {
            backgroundColor: canFill && !isFilling ? 'rgba(124, 58, 237, 0.1)' : 'transparent'
          }
        }}
      >
        <TableCell>
          {isFilling ? (
            <CircularProgress size={16} sx={{ mr: 1 }} />
          ) : null}
          {order.tokenAmount}
        </TableCell>
        <TableCell className={`text-${order.orderTypeClass}`}>
          {order.tokenPrice}
        </TableCell>
        <TableCell>{order.etherAmount}</TableCell>
      </TableRow>
    </Tooltip>
  )
}

const showOrderBook = (props) => {
  const { orderBook } = props

  return(
    <>
      <TableHead>
        <TableRow>
          <TableCell
            sx={{
              backgroundColor: '#1a1625',
              fontWeight: 600,
              color: '#a5b4fc'
            }}
          >
            DAPP
          </TableCell>
          <TableCell
            sx={{
              backgroundColor: '#1a1625',
              fontWeight: 600,
              color: '#a5b4fc'
            }}
          >
            DAPP/ETH
          </TableCell>
          <TableCell
            sx={{
              backgroundColor: '#1a1625',
              fontWeight: 600,
              color: '#a5b4fc'
            }}
          >
            ETH
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {orderBook.sellOrders.length > 0 ? (
          orderBook.sellOrders.map((order) => renderOrder(order, props))
        ) : (
          <TableRow>
            <TableCell colSpan={3}>
              <div className="table-empty-state">
                <div className="table-empty-text">No sell orders</div>
              </div>
            </TableCell>
          </TableRow>
        )}
        <TableRow>
          <TableCell
            colSpan={3}
            sx={{
              padding: 0,
              height: '3px',
              background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.3) 0%, rgba(99, 102, 241, 0.5) 50%, rgba(124, 58, 237, 0.3) 100%)',
              border: 'none'
            }}
          />
        </TableRow>
        {orderBook.buyOrders.length > 0 ? (
          orderBook.buyOrders.map((order) => renderOrder(order, props))
        ) : (
          <TableRow>
            <TableCell colSpan={3}>
              <div className="table-empty-state">
                <div className="table-empty-text">No buy orders</div>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </>
  )
}

class OrderBook extends Component {
  constructor(props) {
    super(props)
    this.state = {
      fillingOrderId: null
    }
  }

  handleFillOrder = async (order) => {
    const { dispatch, exchange, account, exchangeEtherBalance, exchangeTokenBalance, feePercent } = this.props

    try {
      this.setState({ fillingOrderId: order.id })

      // Fetch fresh order data from contract
      const orderData = await exchange.methods.orders(order.id).call()
      const isCancelled = await exchange.methods.orderCancelled(order.id).call()
      const isFilled = await exchange.methods.orderFilled(order.id).call()

      if (isCancelled) {
        toast.error('This order has already been cancelled')
        this.setState({ fillingOrderId: null })
        await loadAllOrders(exchange, dispatch)
        return
      }

      if (isFilled) {
        toast.error('This order has already been filled')
        this.setState({ fillingOrderId: null })
        await loadAllOrders(exchange, dispatch)
        return
      }

      // Check if this is user's own order
      const orderUser = orderData[1] || orderData.user
      if (orderUser && account && orderUser.toLowerCase() === account.toLowerCase()) {
        toast.error('You cannot fill your own order')
        this.setState({ fillingOrderId: null })
        return
      }

      // Validate balance - use fresh order data
      const tokenGet = orderData[2] || orderData.tokenGet
      const amountGetWei = orderData[3] || orderData.amountGet
      const tokenGive = orderData[4] || orderData.tokenGive
      const amountGiveWei = orderData[5] || orderData.amountGive

      // Convert wei to ether for comparison
      const amountNeeded = Number(amountGetWei) / (10**18)
      const fee = amountNeeded * (feePercent / 100)
      const totalNeeded = amountNeeded + fee
      const userBalance = tokenGet.toLowerCase() === ETHER_ADDRESS.toLowerCase() ? exchangeEtherBalance : exchangeTokenBalance

      if (userBalance < totalNeeded) {
        toast.error(`Insufficient balance. You need ${totalNeeded.toFixed(6)} ${tokenGet.toLowerCase() === ETHER_ADDRESS.toLowerCase() ? 'ETH' : 'DAPP'} (including ${(feePercent)}% fee) but only have ${userBalance.toFixed(6)}`)
        this.setState({ fillingOrderId: null })
        return
      }

      // CRITICAL: Check if order creator still has enough balance to fulfill their side!
      // The Exchange contract doesn't lock funds when orders are created, so creators can withdraw after
      const amountGiveNeeded = Number(amountGiveWei) / (10**18)
      const creatorBalance = await exchange.methods.balanceOf(tokenGive, orderUser).call()
      const creatorBalanceEther = Number(creatorBalance) / (10**18)

      if (creatorBalanceEther < amountGiveNeeded) {
        toast.error(`Order cannot be filled. The order creator no longer has enough ${tokenGive.toLowerCase() === ETHER_ADDRESS.toLowerCase() ? 'ETH' : 'DAPP'} in the exchange to complete this trade.`)
        this.setState({ fillingOrderId: null })
        await loadAllOrders(exchange, dispatch)
        return
      }

      toast.info('Filling order. Please confirm in MetaMask...')
      await fillOrder(dispatch, exchange, order, account)
      toast.success('Order filled successfully!')
    } catch (error) {
      console.error('Fill order failed:', error)
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('User denied') || errorMessage.includes('user rejected')) {
        toast.warning('Transaction cancelled by user')
      } else {
        toast.error(`Failed to fill order: ${errorMessage}`)
        await loadAllOrders(exchange, dispatch)
      }
    } finally {
      this.setState({ fillingOrderId: null })
    }
  }

  render() {
    return (
      <Card>
        <CardContent>
          <div className="card-header-custom">
            Order Book
          </div>
          <TableContainer
            sx={{
              maxHeight: { xs: '250px', sm: '350px', md: '500px' },
              overflowY: 'auto',
              overflowX: { xs: 'auto', md: 'hidden' },
              WebkitOverflowScrolling: 'touch',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(124, 58, 237, 0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(124, 58, 237, 0.5)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(124, 58, 237, 0.7)',
                },
              },
            }}
          >
            <Table size="small" stickyHeader>
              { this.props.showOrderBook ? showOrderBook({
                ...this.props,
                fillingOrderId: this.state.fillingOrderId,
                onFillOrder: this.handleFillOrder
              }) : <Spinner type='table' /> }
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    )
  }
}

function mapStateToProps(state) {
  const orderBookLoaded = orderBookLoadedSelector(state)
  const orderFilling = orderFillingSelector(state)

  return {
    orderBook: orderBookSelector(state),
    showOrderBook: orderBookLoaded && !orderFilling,
    exchange: exchangeSelector(state),
    account: accountSelector(state),
    exchangeEtherBalance: exchangeEtherBalanceSelector(state),
    exchangeTokenBalance: exchangeTokenBalanceSelector(state),
    feePercent: feePercentSelector(state) // read from the contract, not hardcoded
  }
}

export default connect(mapStateToProps)(OrderBook);
