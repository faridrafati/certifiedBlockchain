import React, { Component } from 'react'
import { connect } from 'react-redux'
import { exchangeSelector } from '../store/selectors'
import { loadAllOrders } from '../store/interactions'
import OrderBook from './OrderBook.jsx'
import Trades from './Trades.jsx'
import MyTransactions from './MyTransactions.jsx'
import PriceChart from './PriceChart.jsx'
import Balance from './Balance.jsx'
import NewOrder from './NewOrder.jsx'

class Content extends Component {
  componentDidMount() {
    this.loadBlockchainData(this.props)
  }

  async loadBlockchainData(props) {
    const { dispatch, exchange } = props
    await loadAllOrders(exchange, dispatch)
    // No event subscriptions - we reload from contract state after transactions
  }

  render() {
    return (
      <div className="exchange-content">
        {/* Center - Large price chart (spans 2 rows) */}
        <PriceChart />

        {/* Top Left - Order Book */}
        <OrderBook />

        {/* Top Right - Recent Trades */}
        <Trades />

        {/* Middle Left - New Order Form */}
        <NewOrder />

        {/* Middle Right - Balance */}
        <Balance />

        {/* Bottom - Full width My Transactions */}
        <MyTransactions />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    exchange: exchangeSelector(state)
  }
}

export default connect(mapStateToProps)(Content)
