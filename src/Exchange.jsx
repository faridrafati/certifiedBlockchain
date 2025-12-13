import React, { Component } from 'react'
import './exchange/Exchange.css'
import { connect } from 'react-redux'
import { Provider } from 'react-redux'
import configureStore from './exchange/store/configureStore'
import {
  loadWeb3,
  loadAccount,
  loadToken,
  loadExchange
} from './exchange/store/interactions'
import { contractsLoadedSelector } from './exchange/store/selectors'
import Content from './exchange/components/Content.jsx'

const store = configureStore()

class ExchangeApp extends Component {
  componentWillMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    const web3 = await loadWeb3(dispatch)
    const networkId = await web3.eth.net.getId()
    await loadAccount(web3, dispatch)
    const token = await loadToken(web3, networkId, dispatch)
    if(!token) {
      window.alert('Token smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }
    const exchange = await loadExchange(web3, networkId, dispatch)
    if(!exchange) {
      window.alert('Exchange smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }
  }

  render() {
    return (
      <div className="exchange-container">
        { this.props.contractsLoaded ? <Content /> : <div className="content"></div> }
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state)
  }
}

const ConnectedExchange = connect(mapStateToProps)(ExchangeApp)

export default function Exchange() {
  return (
    <Provider store={store}>
      <ConnectedExchange />
    </Provider>
  )
}
