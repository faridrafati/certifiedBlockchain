import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Card,
  CardContent,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Typography
} from '@mui/material'
import { toast } from 'react-toastify'
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

class NewOrder extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeTab: 0,
      submitting: false
    }
  }

  handleTabChange = (event, newValue) => {
    this.setState({ activeTab: newValue })
  }

  handleBuyOrder = async (event) => {
    event.preventDefault()
    const { dispatch, exchange, token, web3, buyOrder, account } = this.props

    try {
      this.setState({ submitting: true })
      toast.info('Submitting buy order. Please confirm in MetaMask...')
      await makeBuyOrder(dispatch, exchange, token, web3, buyOrder, account)
      toast.success('Buy order submitted successfully!')
    } catch (error) {
      console.error('Buy order failed:', error)
      toast.error(`Failed to submit buy order: ${error.message || 'Unknown error'}`)
    } finally {
      this.setState({ submitting: false })
    }
  }

  handleSellOrder = async (event) => {
    event.preventDefault()
    const { dispatch, exchange, token, web3, sellOrder, account } = this.props

    try {
      this.setState({ submitting: true })
      toast.info('Submitting sell order. Please confirm in MetaMask...')
      await makeSellOrder(dispatch, exchange, token, web3, sellOrder, account)
      toast.success('Sell order submitted successfully!')
    } catch (error) {
      console.error('Sell order failed:', error)
      toast.error(`Failed to submit sell order: ${error.message || 'Unknown error'}`)
    } finally {
      this.setState({ submitting: false })
    }
  }

  render() {
    const { activeTab, submitting } = this.state
    const {
      dispatch,
      buyOrder,
      sellOrder,
      showBuyTotal,
      showSellTotal
    } = this.props

    return (
      <Card>
        <CardContent>
          <div className="card-header-custom">
            📝 New Order
          </div>

          <Tabs value={activeTab} onChange={this.handleTabChange}>
            <Tab label="📈 Buy" />
            <Tab label="📉 Sell" />
          </Tabs>

          {/* Buy Tab */}
          <Box role="tabpanel" hidden={activeTab !== 0} className="tab-panel">
            {activeTab === 0 && (
              <form onSubmit={this.handleBuyOrder} aria-label="Buy DAPP tokens form">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Amount (DAPP)"
                    type="number"
                    inputProps={{ step: '0.0001', min: '0' }}
                    variant="outlined"
                    size="small"
                    fullWidth
                    placeholder="0.00"
                    onChange={(e) => dispatch(buyOrderAmountChanged(e.target.value))}
                    disabled={submitting}
                    required
                  />

                  <TextField
                    label="Price (ETH)"
                    type="number"
                    inputProps={{ step: '0.0001', min: '0' }}
                    variant="outlined"
                    size="small"
                    fullWidth
                    placeholder="0.00"
                    onChange={(e) => dispatch(buyOrderPriceChanged(e.target.value))}
                    disabled={submitting}
                    required
                  />

                  {showBuyTotal && (
                    <Box className="info-box">
                      <Typography variant="body2" component="span" sx={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.85rem' }}>
                        Total Cost:{' '}
                      </Typography>
                      <Typography component="span" sx={{ color: '#667eea', fontWeight: 700, fontSize: '1rem' }}>
                        {(buyOrder.amount * buyOrder.price).toFixed(4)} ETH
                      </Typography>
                    </Box>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="success"
                    fullWidth
                    size="large"
                    disabled={submitting}
                    aria-label="Submit buy order"
                  >
                    {submitting ? 'Submitting...' : 'Buy DAPP'}
                  </Button>
                </Box>
              </form>
            )}
          </Box>

          {/* Sell Tab */}
          <Box role="tabpanel" hidden={activeTab !== 1} className="tab-panel">
            {activeTab === 1 && (
              <form onSubmit={this.handleSellOrder} aria-label="Sell DAPP tokens form">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Amount (DAPP)"
                    type="number"
                    inputProps={{ step: '0.0001', min: '0' }}
                    variant="outlined"
                    size="small"
                    fullWidth
                    placeholder="0.00"
                    onChange={(e) => dispatch(sellOrderAmountChanged(e.target.value))}
                    disabled={submitting}
                    required
                  />

                  <TextField
                    label="Price (ETH)"
                    type="number"
                    inputProps={{ step: '0.0001', min: '0' }}
                    variant="outlined"
                    size="small"
                    fullWidth
                    placeholder="0.00"
                    onChange={(e) => dispatch(sellOrderPriceChanged(e.target.value))}
                    disabled={submitting}
                    required
                  />

                  {showSellTotal && (
                    <Box className="info-box-error">
                      <Typography variant="body2" component="span" sx={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.85rem' }}>
                        Total Receive:{' '}
                      </Typography>
                      <Typography component="span" sx={{ color: '#ef4444', fontWeight: 700, fontSize: '1rem' }}>
                        {(sellOrder.amount * sellOrder.price).toFixed(4)} ETH
                      </Typography>
                    </Box>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    color="error"
                    fullWidth
                    size="large"
                    disabled={submitting}
                    aria-label="Submit sell order"
                  >
                    {submitting ? 'Submitting...' : 'Sell DAPP'}
                  </Button>
                </Box>
              </form>
            )}
          </Box>
        </CardContent>
      </Card>
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
    showBuyTotal: buyOrder.amount && buyOrder.price,
    showSellTotal: sellOrder.amount && sellOrder.price
  }
}

export default connect(mapStateToProps)(NewOrder)
