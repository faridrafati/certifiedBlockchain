import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import {
  filledOrdersLoadedSelector,
  filledOrdersSelector
} from '../store/selectors'

const showFilledOrders = (filledOrders) => {
  return(
    <tbody>
      { filledOrders.length > 0 ? filledOrders.map((order) => {
        return(
          <tr className={`order-${order.id}`} key={order.id}>
            <td style={{color: '#a5b4fc', fontSize: '0.8rem'}}>{order.formattedTimestamp}</td>
            <td style={{fontWeight: '600'}}>{order.tokenAmount}</td>
            <td className={`text-${order.tokenPriceClass}`} style={{fontWeight: '600'}}>
              {order.tokenPrice}
            </td>
          </tr>
        )
      }) : (
        <tr>
          <td colSpan="3" style={{textAlign: 'center', color: '#a5b4fc', padding: '40px 20px'}}>
            <div className="empty-state">
              <div className="empty-state-icon">📈</div>
              <div className="empty-state-text">No trades yet</div>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  )
}

class Trades extends Component {
  render() {
    return (
      <div className="vertical">
        <div className="card bg-dark text-white">
          <div className="card-header">
            💹 Recent Trades
          </div>
          <div className="card-body">
            <table className="table table-dark table-sm small">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>DAPP</th>
                  <th>DAPP/ETH</th>
                </tr>
              </thead>
              { this.props.filledOrdersLoaded ? showFilledOrders(this.props.filledOrders) : <Spinner type="table" />}
            </table>
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    filledOrdersLoaded: filledOrdersLoadedSelector(state),
    filledOrders: filledOrdersSelector(state),
  }
}

export default connect(mapStateToProps)(Trades)
