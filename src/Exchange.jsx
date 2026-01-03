import React, { Component } from 'react'
import './exchange/Exchange.css'
import { connect } from 'react-redux'
import { Provider } from 'react-redux'
import { IconButton, Tooltip } from '@mui/material'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import RefreshIcon from '@mui/icons-material/Refresh'
import configureStore from './exchange/store/configureStore'
import {
  loadWeb3,
  loadAccount,
  loadToken,
  loadExchange,
  loadAllOrders
} from './exchange/store/interactions'
import { contractsLoadedSelector, web3Selector, exchangeSelector, tokenSelector, accountSelector } from './exchange/store/selectors'
import Content from './exchange/components/Content.jsx'
import ContractInfo from './components/ContractInfo'
import { EXCHANGE_ADDRESS } from './components/config/ExchangeConfig'

const store = configureStore()

class ExchangeApp extends Component {
  componentDidMount() {
    this.loadBlockchainData(this.props.dispatch)
    this.setupAccountChangeListener()
  }

  componentWillUnmount() {
    // Clean up event listener when component unmounts
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', this.handleAccountChange)
    }
  }

  setupAccountChangeListener = () => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', this.handleAccountChange)
    }
  }

  handleAccountChange = async (accounts) => {
    console.log('Account changed to:', accounts[0])
    // Reload the entire page when account changes (like DappToken)
    window.location.reload()
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

  handleRefresh = async () => {
    const { dispatch, exchange } = this.props
    if (!exchange) return
    try {
      await loadAllOrders(exchange, dispatch)
      console.log('Exchange data refreshed!')
    } catch (error) {
      console.error('Refresh failed:', error)
    }
  }

  render() {
    const { account } = this.props

    return (
      <div className="exchange-container">
        {/* Hero Section - DappToken Style */}
        <section className="exchange-hero">
          <div className="hero-content">
            <div className="hero-title-row">
              <h1 className="display-4 fw-bold mb-3">
                <SwapHorizIcon className="hero-icon" />
                Decentralized Exchange
              </h1>
              <ContractInfo
                contractAddress={EXCHANGE_ADDRESS}
                contractName="Exchange Contract"
                network={import.meta.env.VITE_NETWORK_ID}
                account={account}
              />
              <Tooltip title="Refresh Data">
                <IconButton onClick={this.handleRefresh} className="hero-refresh-btn">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </div>
            <p className="lead mb-4">
              Trade DAPP/ETH tokens instantly with zero intermediaries. Your keys, your crypto, your control.
            </p>
          </div>
        </section>

        {/* Exchange Content */}
        { this.props.contractsLoaded ? <Content /> : <div className="content"></div> }
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    contractsLoaded: contractsLoadedSelector(state),
    web3: web3Selector(state),
    exchange: exchangeSelector(state),
    token: tokenSelector(state),
    account: accountSelector(state)
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
