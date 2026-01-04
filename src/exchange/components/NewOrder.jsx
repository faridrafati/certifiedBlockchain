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
  sellOrderSelector,
  exchangeEtherBalanceSelector,
  exchangeTokenBalanceSelector,
  etherBalanceSelector,
  tokenBalanceSelector
} from '../store/selectors'
import {
  buyOrderAmountChanged,
  buyOrderPriceChanged,
  sellOrderAmountChanged,
  sellOrderPriceChanged,
} from '../store/actions'
import {
  makeBuyOrder,
  makeSellOrder,
  depositEther,
  depositToken
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

  handleAutoDeposit = async (asset, neededAmount) => {
    const {
      dispatch,
      exchange,
      web3,
      token,
      account,
      etherBalance,
      tokenBalance
    } = this.props

    // Determine which balance to check based on asset
    const walletBalance = asset === 'ETH' ? etherBalance : tokenBalance

    // Check if user has enough in wallet
    if (neededAmount > walletBalance) {
      toast.error(
        `Insufficient ${asset} in wallet! You need ${neededAmount.toFixed(4)} ${asset} but only have ${walletBalance.toFixed(4)} ${asset} in your wallet. Please add more ${asset} to your wallet first.`
      )
      return
    }

    try {
      this.setState({ submitting: true })
      toast.info(`Depositing ${neededAmount.toFixed(4)} ${asset} to exchange. Please confirm in MetaMask...`)

      // Deposit the needed amount
      if (asset === 'ETH') {
        await depositEther(dispatch, exchange, web3, token, neededAmount.toString(), account)
        toast.success(`Successfully deposited ${neededAmount.toFixed(4)} ETH! You can now place your order.`)
      } else {
        await depositToken(dispatch, exchange, web3, token, neededAmount.toString(), account)
        toast.success(`Successfully deposited ${neededAmount.toFixed(4)} DAPP! You can now place your order.`)
      }
    } catch (error) {
      console.error('Auto-deposit failed:', error)
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('User denied') || errorMessage.includes('user rejected')) {
        toast.warning('Deposit cancelled by user')
      } else {
        toast.error(`Failed to deposit ${asset}: ${errorMessage}`)
      }
    } finally {
      this.setState({ submitting: false })
    }
  }

  handleBuyOrder = async (event) => {
    event.preventDefault()
    const { dispatch, exchange, token, web3, buyOrder, account, exchangeEtherBalance } = this.props

    // Validate order data
    if (!buyOrder.amount || !buyOrder.price || isNaN(buyOrder.amount) || isNaN(buyOrder.price)) {
      toast.error('Please enter valid amount and price')
      return
    }

    // Validate amounts are positive
    if (parseFloat(buyOrder.amount) <= 0 || parseFloat(buyOrder.price) <= 0) {
      toast.error('Amount and price must be greater than 0')
      return
    }

    // Calculate total cost (amount * price)
    const totalCost = parseFloat(buyOrder.amount) * parseFloat(buyOrder.price)

    // Check if user has sufficient ETH balance in exchange
    if (totalCost > exchangeEtherBalance) {
      const shortage = totalCost - exchangeEtherBalance
      toast.error(
        `Insufficient ETH in exchange! You need ${shortage.toFixed(4)} more ETH. Click "Deposit ETH Now" to auto-deposit.`
      )
      // Note: User will click the button to trigger auto-deposit
      return
    }

    try {
      this.setState({ submitting: true })
      toast.info('Submitting buy order. Please confirm in MetaMask...')
      await makeBuyOrder(dispatch, exchange, token, web3, buyOrder, account)
      toast.success('Buy order submitted successfully!')
    } catch (error) {
      console.error('Buy order failed:', error)
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('User denied') || errorMessage.includes('user rejected')) {
        toast.warning('Transaction cancelled by user')
      } else {
        toast.error(`Failed to submit buy order: ${errorMessage}`)
      }
    } finally {
      this.setState({ submitting: false })
    }
  }

  handleSellOrder = async (event) => {
    event.preventDefault()
    const { dispatch, exchange, token, web3, sellOrder, account, exchangeTokenBalance } = this.props

    // Validate order data
    if (!sellOrder.amount || !sellOrder.price || isNaN(sellOrder.amount) || isNaN(sellOrder.price)) {
      toast.error('Please enter valid amount and price')
      return
    }

    // Validate amounts are positive
    if (parseFloat(sellOrder.amount) <= 0 || parseFloat(sellOrder.price) <= 0) {
      toast.error('Amount and price must be greater than 0')
      return
    }

    // Check if user has sufficient DAPP token balance in exchange
    const sellAmount = parseFloat(sellOrder.amount)
    if (sellAmount > exchangeTokenBalance) {
      toast.error(
        `Insufficient DAPP tokens in exchange account! You need ${sellAmount.toFixed(4)} DAPP but only have ${exchangeTokenBalance.toFixed(4)} DAPP.`
      )
      return
    }

    try {
      this.setState({ submitting: true })
      toast.info('Submitting sell order. Please confirm in MetaMask...')
      await makeSellOrder(dispatch, exchange, token, web3, sellOrder, account)
      toast.success('Sell order submitted successfully!')
    } catch (error) {
      console.error('Sell order failed:', error)
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('User denied') || errorMessage.includes('user rejected')) {
        toast.warning('Transaction cancelled by user')
      } else {
        toast.error(`Failed to submit sell order: ${errorMessage}`)
      }
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
      showSellTotal,
      exchangeEtherBalance,
      exchangeTokenBalance
    } = this.props

    // Calculate if user has sufficient balance
    const buyTotalCost = buyOrder.amount && buyOrder.price ? parseFloat(buyOrder.amount) * parseFloat(buyOrder.price) : 0
    const hasSufficientEth = buyTotalCost <= exchangeEtherBalance
    const sellAmount = sellOrder.amount ? parseFloat(sellOrder.amount) : 0
    const hasSufficientTokens = sellAmount <= exchangeTokenBalance

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
                  {/* Available Balance */}
                  <Box sx={{ p: 1, bgcolor: '#1e293b', borderRadius: 1, border: '1px solid #334155' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Available ETH in Exchange: <strong style={{ color: '#10b981' }}>{exchangeEtherBalance.toFixed(4)} ETH</strong>
                    </Typography>
                  </Box>

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
                    <>
                      <Box className="info-box">
                        <Typography variant="body2" component="span" sx={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.85rem' }}>
                          Total Cost:{' '}
                        </Typography>
                        <Typography component="span" sx={{ color: '#667eea', fontWeight: 700, fontSize: '1rem' }}>
                          {buyTotalCost.toFixed(4)} ETH
                        </Typography>
                      </Box>
                      {!hasSufficientEth && (
                        <Box sx={{ p: 2, bgcolor: '#7f1d1d', borderRadius: 1, border: '2px solid #dc2626', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Typography variant="body2" sx={{ color: '#fca5a5', display: 'block', fontWeight: 600 }}>
                            ⚠️ Insufficient balance! You need {buyTotalCost.toFixed(4)} ETH but only have {exchangeEtherBalance.toFixed(4)} ETH
                          </Typography>
                          <Button
                            variant="contained"
                            size="medium"
                            onClick={() => this.handleAutoDeposit('ETH', buyTotalCost - exchangeEtherBalance)}
                            sx={{
                              bgcolor: '#3b82f6',
                              color: '#ffffff',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              py: 1,
                              px: 2,
                              textTransform: 'none',
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                              '&:hover': {
                                bgcolor: '#2563eb',
                                boxShadow: '0 6px 16px rgba(59, 130, 246, 0.6)',
                                transform: 'translateY(-2px)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            💰 Deposit ETH Now
                          </Button>
                        </Box>
                      )}
                    </>
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
                  {/* Available Balance */}
                  <Box sx={{ p: 1, bgcolor: '#1e293b', borderRadius: 1, border: '1px solid #334155' }}>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                      Available DAPP in Exchange: <strong style={{ color: '#10b981' }}>{exchangeTokenBalance.toFixed(4)} DAPP</strong>
                    </Typography>
                  </Box>

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
                    <>
                      <Box className="info-box-error">
                        <Typography variant="body2" component="span" sx={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.85rem' }}>
                          Total Receive:{' '}
                        </Typography>
                        <Typography component="span" sx={{ color: '#ef4444', fontWeight: 700, fontSize: '1rem' }}>
                          {(sellOrder.amount * sellOrder.price).toFixed(4)} ETH
                        </Typography>
                      </Box>
                      {!hasSufficientTokens && (
                        <Box sx={{ p: 2, bgcolor: '#7f1d1d', borderRadius: 1, border: '2px solid #dc2626', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Typography variant="body2" sx={{ color: '#fca5a5', display: 'block', fontWeight: 600 }}>
                            ⚠️ Insufficient balance! You need {sellAmount.toFixed(4)} DAPP but only have {exchangeTokenBalance.toFixed(4)} DAPP
                          </Typography>
                          <Button
                            variant="contained"
                            size="medium"
                            onClick={() => this.handleAutoDeposit('DAPP', sellAmount - exchangeTokenBalance)}
                            sx={{
                              bgcolor: '#3b82f6',
                              color: '#ffffff',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              py: 1,
                              px: 2,
                              textTransform: 'none',
                              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                              '&:hover': {
                                bgcolor: '#2563eb',
                                boxShadow: '0 6px 16px rgba(59, 130, 246, 0.6)',
                                transform: 'translateY(-2px)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            💰 Deposit DAPP Now
                          </Button>
                        </Box>
                      )}
                    </>
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
    showSellTotal: sellOrder.amount && sellOrder.price,
    exchangeEtherBalance: exchangeEtherBalanceSelector(state),
    exchangeTokenBalance: exchangeTokenBalanceSelector(state),
    etherBalance: etherBalanceSelector(state),
    tokenBalance: tokenBalanceSelector(state)
  }
}

export default connect(mapStateToProps)(NewOrder)
