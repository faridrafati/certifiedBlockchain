import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Tabs, Tab } from 'react-bootstrap'
import Spinner from './Spinner'
import {
  myFilledOrdersLoadedSelector,
  myFilledOrdersSelector,
  myOpenOrdersLoadedSelector,
  myOpenOrdersSelector,
  exchangeSelector,
  accountSelector,
  orderCancellingSelector
} from '../store/selectors'
import { cancelOrder } from '../store/interactions'

const showMyFilledOrders = (props) => {
  const { myFilledOrders } = props

  return(
    <tbody>
      { myFilledOrders.length > 0 ? myFilledOrders.map((order) => {
        return (
          <tr key={order.id}>
            <td style={{color: '#a5b4fc', fontSize: '0.8rem'}}>{order.formattedTimestamp}</td>
            <td className={`text-${order.orderTypeClass}`} style={{fontWeight: '600'}}>
              {order.orderSign}{order.tokenAmount}
            </td>
            <td className={`text-${order.orderTypeClass}`} style={{fontWeight: '600'}}>
              {order.tokenPrice}
            </td>
          </tr>
        )
      }) : (
        <tr>
          <td colSpan="3" style={{textAlign: 'center', color: '#a5b4fc', padding: '40px 20px'}}>
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-text">No filled orders</div>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  )
}

const showMyOpenOrders = (props) => {
  const { myOpenOrders, dispatch, exchange, account } = props

  return(
    <tbody>
      { myOpenOrders.length > 0 ? myOpenOrders.map((order) => {
        return (
          <tr key={order.id}>
            <td className={`text-${order.orderTypeClass}`} style={{fontWeight: '600'}}>
              {order.tokenAmount}
            </td>
            <td className={`text-${order.orderTypeClass}`} style={{fontWeight: '600'}}>
              {order.tokenPrice}
            </td>
            <td
              className="cancel-order"
              onClick={(e) => {
                cancelOrder(dispatch, exchange, order, account)
              }}
              style={{cursor: 'pointer', textAlign: 'center'}}
            >
              <span style={{fontSize: '1.2rem'}}>✖</span>
            </td>
          </tr>
        )
      }) : (
        <tr>
          <td colSpan="3" style={{textAlign: 'center', color: '#a5b4fc', padding: '40px 20px'}}>
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-text">No open orders</div>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  )
}

class MyTransactions extends Component {
  render() {
    return (
      <div className="card bg-dark text-white">
        <div className="card-header">
          👤 My Transactions
        </div>
        <div className="card-body">
          <Tabs defaultActiveKey="trades" className="bg-dark text-white">
            <Tab eventKey="trades" title="✅ Filled" className="bg-dark">
              <table className="table table-dark table-sm small">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>DAPP</th>
                    <th>DAPP/ETH</th>
                  </tr>
                </thead>
                { this.props.showMyFilledOrders ? showMyFilledOrders(this.props) : <Spinner type="table" />}
              </table>
            </Tab>
            <Tab eventKey="orders" title="⏳ Open" className="bg-dark">
              <table className="table table-dark table-sm small">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>DAPP/ETH</th>
                    <th>Cancel</th>
                  </tr>
                </thead>
                { this.props.showMyOpenOrders ? showMyOpenOrders(this.props) : <Spinner type="table" />}
              </table>
            </Tab>
          </Tabs>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  const myOpenOrdersLoaded = myOpenOrdersLoadedSelector(state)
  const orderCancelling = orderCancellingSelector(state)

  return {
    myFilledOrders: myFilledOrdersSelector(state),
    showMyFilledOrders: myFilledOrdersLoadedSelector(state),
    myOpenOrders: myOpenOrdersSelector(state),
    showMyOpenOrders: myOpenOrdersLoaded && !orderCancelling,
    exchange: exchangeSelector(state),
    account: accountSelector(state)
  }
}

export default connect(mapStateToProps)(MyTransactions);










