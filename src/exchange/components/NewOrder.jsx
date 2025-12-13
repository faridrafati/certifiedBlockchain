import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Tabs, Tab } from 'react-bootstrap'
import Spinner from './Spinner'
import {
  exchangeSelector,
  tokenSelector,
  accountSelector,
  web3Selector,
  buyOrderSelector,
  sellOrderSelector
} from '../store/selectors'
import {
  buyOrderAmountChanged,
  buyOrderPriceChanged,
  sellOrderAmountChanged,
  sellOrderPriceChanged,
} from '../store/actions'
import {
  makeBuyOrder,
  makeSellOrder
} from '../store/interactions'

const showForm = (props) => {
  const {
    dispatch,
    buyOrder,
    exchange,
    token,
    web3,
    account,
    sellOrder,
    showBuyTotal,
    showSellTotal
  } = props

  return(
    <Tabs defaultActiveKey="buy" className="bg-dark text-white">

      <Tab eventKey="buy" title="📈 Buy" className="bg-dark">
        <form className="row" onSubmit={(event) => {
          event.preventDefault()
          makeBuyOrder(dispatch, exchange, token, web3, buyOrder, account)
        }}>
          <div className="col-12 mb-3">
            <label className="form-label" style={{fontSize: '0.85rem', fontWeight: '600', color: '#a5b4fc'}}>
              Amount (DAPP)
            </label>
            <input
              type="text"
              className="form-control form-control-sm bg-dark text-white"
              placeholder="0.00"
              onChange={(e) => dispatch( buyOrderAmountChanged( e.target.value ) )}
              required
            />
          </div>
          <div className="col-12 mb-3">
            <label className="form-label" style={{fontSize: '0.85rem', fontWeight: '600', color: '#a5b4fc'}}>
              Price (ETH)
            </label>
            <input
              type="text"
              className="form-control form-control-sm bg-dark text-white"
              placeholder="0.00"
              onChange={(e) => dispatch( buyOrderPriceChanged( e.target.value ) )}
              required
            />
          </div>
          { showBuyTotal ? (
            <div className="col-12 mb-3">
              <div style={{
                padding: '12px',
                background: 'rgba(139, 92, 246, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.3)'
              }}>
                <small style={{color: '#a5b4fc', fontWeight: '600'}}>Total Cost: </small>
                <span style={{color: '#8b5cf6', fontWeight: '700', fontSize: '1rem'}}>
                  {(buyOrder.amount * buyOrder.price).toFixed(4)} ETH
                </span>
              </div>
            </div>
          ) : null }
          <div className="col-12">
            <button type="submit" className="btn btn-success btn-sm btn-block">
              Buy DAPP
            </button>
          </div>
        </form>
      </Tab>

      <Tab eventKey="sell" title="📉 Sell" className="bg-dark">
        <form className="row" onSubmit={(event) => {
          event.preventDefault()
          makeSellOrder(dispatch, exchange, token, web3, sellOrder, account)
        }}>
          <div className="col-12 mb-3">
            <label className="form-label" style={{fontSize: '0.85rem', fontWeight: '600', color: '#a5b4fc'}}>
              Amount (DAPP)
            </label>
            <input
              type="text"
              className="form-control form-control-sm bg-dark text-white"
              placeholder="0.00"
              onChange={(e) => dispatch( sellOrderAmountChanged( e.target.value ) )}
              required
            />
          </div>
          <div className="col-12 mb-3">
            <label className="form-label" style={{fontSize: '0.85rem', fontWeight: '600', color: '#a5b4fc'}}>
              Price (ETH)
            </label>
            <input
              type="text"
              className="form-control form-control-sm bg-dark text-white"
              placeholder="0.00"
              onChange={(e) => dispatch( sellOrderPriceChanged( e.target.value ) )}
              required
            />
          </div>
          { showSellTotal ? (
            <div className="col-12 mb-3">
              <div style={{
                padding: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <small style={{color: '#a5b4fc', fontWeight: '600'}}>Total Receive: </small>
                <span style={{color: '#ef4444', fontWeight: '700', fontSize: '1rem'}}>
                  {(sellOrder.amount * sellOrder.price).toFixed(4)} ETH
                </span>
              </div>
            </div>
          ) : null }
          <div className="col-12">
            <button type="submit" className="btn btn-danger btn-sm btn-block">
              Sell DAPP
            </button>
          </div>
        </form>
      </Tab>
    </Tabs>
  )
}

class NewOrder extends Component {

  render() {
    return (
      <div className="card bg-dark text-white">
        <div className="card-header">
          New Order
        </div>
        <div className="card-body">
          {this.props.showForm ? showForm(this.props) : <Spinner />}
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  const buyOrder = buyOrderSelector(state)
  const sellOrder = sellOrderSelector(state)

  return {
    account: accountSelector(state),
    exchange: exchangeSelector(state),
    token: tokenSelector(state),
    web3: web3Selector(state),
    buyOrder,
    sellOrder,
    showForm: !buyOrder.making && !sellOrder.making,
    showBuyTotal: buyOrder.amount && buyOrder.price,
    showSellTotal: sellOrder.amount && sellOrder.price
  }
}

export default connect(mapStateToProps)(NewOrder)
