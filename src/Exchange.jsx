import React, { Component } from 'react'
import './exchange/Exchange.css'
import { connect } from 'react-redux'
import { Provider } from 'react-redux'
import { toast } from 'react-toastify'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
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
import HeroSection from './components/HeroSection'
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
    // Reload the entire page when account changes so contract state reinitializes
    window.location.reload()
  }

  async loadBlockchainData(dispatch) {
    try {
      const web3 = await loadWeb3(dispatch)
      if (!web3) return
      const networkId = await web3.eth.net.getId()
      await loadAccount(web3, dispatch)
      const token = await loadToken(web3, networkId, dispatch)
      if(!token) {
        toast.error('Token contract not detected on this network. Please switch networks in MetaMask.')
        return
      }
      const exchange = await loadExchange(web3, networkId, dispatch)
      if(!exchange) {
        toast.error('Exchange contract not detected on this network. Please switch networks in MetaMask.')
        return
      }
    } catch (error) {
      console.error('Failed to load blockchain data:', error)
      toast.error('Failed to connect to the blockchain. Please check MetaMask and refresh.')
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
        <HeroSection
          title="Decentralized Exchange"
          description="Trade DAPP/ETH tokens instantly with zero intermediaries"
          contractAddress={EXCHANGE_ADDRESS}
          contractName="Exchange Contract"
          network={import.meta.env.VITE_NETWORK_ID}
          account={account}
          onRefresh={this.handleRefresh}
        />

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
