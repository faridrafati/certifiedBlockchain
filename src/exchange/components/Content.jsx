import React, { Component } from 'react'
import { connect } from 'react-redux'
import { exchangeSelector } from '../store/selectors'
import { loadAllOrders, subscribeToEvents } from '../store/interactions'
import OrderBook from './OrderBook.jsx'
import Trades from './Trades.jsx'
import MyTransactions from './MyTransactions.jsx'
import PriceChart from './PriceChart.jsx'
import Balance from './Balance.jsx'
import NewOrder from './NewOrder.jsx'

class Content extends Component {
  componentWillMount() {
    this.loadBlockchainData(this.props)
  }

  async loadBlockchainData(props) {
    const { dispatch, exchange } = props
    await loadAllOrders(exchange, dispatch)
    await subscribeToEvents(exchange, dispatch)
  }

  render() {
    return (
      <div className="content">
        <div className="vertical-split">
          <Balance />
          <NewOrder />
        </div>
        <OrderBook />
        <div className="vertical-split">
          <PriceChart />
          <MyTransactions />
        </div>
        <Trades />
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
