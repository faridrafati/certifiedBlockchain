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
  Tooltip
} from '@mui/material'
import Spinner from './Spinner'
import {
  orderBookSelector,
  orderBookLoadedSelector,
  exchangeSelector,
  accountSelector,
  orderFillingSelector
} from '../store/selectors'
import { fillOrder } from '../store/interactions'

const renderOrder = (order, props) => {
  const { dispatch, exchange, account } = props

  return(
    <Tooltip
      key={order.id}
      title={`Click here to ${order.orderFillAction}`}
      placement="top"
    >
      <TableRow
        hover
        className="order-book-order"
        onClick={(e) => fillOrder(dispatch, exchange, order, account)}
        sx={{ cursor: 'pointer' }}
      >
        <TableCell>{order.tokenAmount}</TableCell>
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
          <TableCell>DAPP</TableCell>
          <TableCell>DAPP/ETH</TableCell>
          <TableCell>ETH</TableCell>
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
              background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.5) 50%, rgba(102, 126, 234, 0.3) 100%)',
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
  render() {
    console.log('OrderBook - showOrderBook:', this.props.showOrderBook)
    console.log('OrderBook - orderBook data:', this.props.orderBook)
    console.log('OrderBook - sellOrders:', this.props.orderBook?.sellOrders)
    console.log('OrderBook - buyOrders:', this.props.orderBook?.buyOrders)

    return (
      <Card>
        <CardContent>
          <div className="card-header-custom">
            📊 Order Book
          </div>
          <TableContainer>
            <Table size="small">
              { this.props.showOrderBook ? showOrderBook(this.props) : <Spinner type='table' /> }
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
    account: accountSelector(state)
  }
}

export default connect(mapStateToProps)(OrderBook);
