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
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import { toast } from 'react-toastify'
import Spinner from './Spinner'
import {
  loadBalances,
  depositEther,
  depositToken,
  withdrawEther,
  withdrawToken
} from '../store/interactions'
import {
  exchangeSelector,
  tokenSelector,
  accountSelector,
  web3Selector,
  etherBalanceSelector,
  tokenBalanceSelector,
  exchangeEtherBalanceSelector,
  exchangeTokenBalanceSelector,
  balancesLoadingSelector,
  etherDepositAmountSelector,
  etherWithdrawAmountSelector,
  tokenDepositAmountSelector,
  tokenWithdrawAmountSelector,
} from '../store/selectors'
import {
  etherDepositAmountChanged,
  etherWithdrawAmountChanged,
  tokenDepositAmountChanged,
  tokenWithdrawAmountChanged,
} from '../store/actions'

class Balance extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectedAsset: 'ETH',
      activeTab: 0,
      submitting: false
    }
  }

  componentDidMount() {
    this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const { dispatch, web3, exchange, token, account } = this.props
    try {
      await loadBalances(dispatch, web3, exchange, token, account)
    } catch (error) {
      console.error('Failed to load balances:', error)
      toast.error('Failed to load balances. Please refresh the page.')
    }
  }

  handleAssetChange = (event, newAsset) => {
    if (newAsset !== null) {
      this.setState({ selectedAsset: newAsset })
    }
  }

  handleTabChange = (event, newValue) => {
    this.setState({ activeTab: newValue })
  }

  formatBalance = (balance) => {
    if (!balance) return '0'
    const num = parseFloat(balance)
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    })
  }

  handleDepositEther = async (event) => {
    event.preventDefault()
    const { dispatch, exchange, web3, token, etherDepositAmount, account, etherBalance } = this.props

    if (!etherDepositAmount || isNaN(etherDepositAmount) || parseFloat(etherDepositAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Check if user has sufficient ETH in wallet
    const depositAmount = parseFloat(etherDepositAmount)
    if (depositAmount > etherBalance) {
      toast.error(
        `Insufficient ETH in wallet! You have ${etherBalance.toFixed(4)} ETH but trying to deposit ${depositAmount.toFixed(4)} ETH.`
      )
      return
    }

    try {
      this.setState({ submitting: true })
      toast.info('Depositing ETH. Please confirm in MetaMask...')
      await depositEther(dispatch, exchange, web3, token, etherDepositAmount, account)
      toast.success('ETH deposited successfully!')
    } catch (error) {
      console.error('Deposit failed:', error)
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('User denied') || errorMessage.includes('user rejected')) {
        toast.warning('Transaction cancelled by user')
      } else {
        toast.error(`Failed to deposit ETH: ${errorMessage}`)
      }
    } finally {
      this.setState({ submitting: false })
    }
  }

  handleDepositToken = async (event) => {
    event.preventDefault()
    const { dispatch, exchange, web3, token, tokenDepositAmount, account, tokenBalance } = this.props

    if (!tokenDepositAmount || isNaN(tokenDepositAmount) || parseFloat(tokenDepositAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Check if user has sufficient DAPP tokens in wallet
    const depositAmount = parseFloat(tokenDepositAmount)
    if (depositAmount > tokenBalance) {
      toast.error(
        `Insufficient DAPP in wallet! You have ${tokenBalance.toFixed(4)} DAPP but trying to deposit ${depositAmount.toFixed(4)} DAPP.`
      )
      return
    }

    try {
      this.setState({ submitting: true })
      toast.info('Depositing DAPP tokens. Please confirm in MetaMask...')
      await depositToken(dispatch, exchange, web3, token, tokenDepositAmount, account)
      toast.success('DAPP tokens deposited successfully!')
    } catch (error) {
      console.error('Deposit failed:', error)
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('User denied') || errorMessage.includes('user rejected')) {
        toast.warning('Transaction cancelled by user')
      } else {
        toast.error(`Failed to deposit DAPP: ${errorMessage}`)
      }
    } finally {
      this.setState({ submitting: false })
    }
  }

  handleWithdrawEther = async (event) => {
    event.preventDefault()
    const { dispatch, exchange, web3, token, etherWithdrawAmount, account, exchangeEtherBalance } = this.props

    if (!etherWithdrawAmount || isNaN(etherWithdrawAmount) || parseFloat(etherWithdrawAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Check if user has sufficient ETH in exchange
    const withdrawAmount = parseFloat(etherWithdrawAmount)
    if (withdrawAmount > exchangeEtherBalance) {
      toast.error(
        `Insufficient ETH in exchange! You have ${exchangeEtherBalance.toFixed(4)} ETH but trying to withdraw ${withdrawAmount.toFixed(4)} ETH.`
      )
      return
    }

    try {
      this.setState({ submitting: true })
      toast.info('Withdrawing ETH. Please confirm in MetaMask...')
      await withdrawEther(dispatch, exchange, web3, token, etherWithdrawAmount, account)
      toast.success('ETH withdrawn successfully!')
    } catch (error) {
      console.error('Withdraw failed:', error)
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('User denied') || errorMessage.includes('user rejected')) {
        toast.warning('Transaction cancelled by user')
      } else {
        toast.error(`Failed to withdraw ETH: ${errorMessage}`)
      }
    } finally {
      this.setState({ submitting: false })
    }
  }

  handleWithdrawToken = async (event) => {
    event.preventDefault()
    const { dispatch, exchange, web3, token, tokenWithdrawAmount, account, exchangeTokenBalance } = this.props

    if (!tokenWithdrawAmount || isNaN(tokenWithdrawAmount) || parseFloat(tokenWithdrawAmount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Check if user has sufficient DAPP tokens in exchange
    const withdrawAmount = parseFloat(tokenWithdrawAmount)
    if (withdrawAmount > exchangeTokenBalance) {
      toast.error(
        `Insufficient DAPP in exchange! You have ${exchangeTokenBalance.toFixed(4)} DAPP but trying to withdraw ${withdrawAmount.toFixed(4)} DAPP.`
      )
      return
    }

    try {
      this.setState({ submitting: true })
      toast.info('Withdrawing DAPP tokens. Please confirm in MetaMask...')
      await withdrawToken(dispatch, exchange, web3, token, tokenWithdrawAmount, account)
      toast.success('DAPP tokens withdrawn successfully!')
    } catch (error) {
      console.error('Withdraw failed:', error)
      const errorMessage = error.message || 'Unknown error'
      if (errorMessage.includes('User denied') || errorMessage.includes('user rejected')) {
        toast.warning('Transaction cancelled by user')
      } else {
        toast.error(`Failed to withdraw DAPP: ${errorMessage}`)
      }
    } finally {
      this.setState({ submitting: false })
    }
  }

  renderAssetToggle = () => {
    const { selectedAsset } = this.state
    return (
      <ToggleButtonGroup
        value={selectedAsset}
        exclusive
        onChange={this.handleAssetChange}
        fullWidth
        sx={{ marginBottom: 2 }}
      >
        <ToggleButton value="ETH" aria-label="Select ETH">
          ETH
        </ToggleButton>
        <ToggleButton value="DAPP" aria-label="Select DAPP">
          DAPP
        </ToggleButton>
      </ToggleButtonGroup>
    )
  }

  renderBalanceTable = () => {
    const { selectedAsset } = this.state
    const {
      etherBalance,
      tokenBalance,
      exchangeEtherBalance,
      exchangeTokenBalance
    } = this.props

    const isEth = selectedAsset === 'ETH'
    const walletBalance = isEth ? etherBalance : tokenBalance
    const exchangeBalance = isEth ? exchangeEtherBalance : exchangeTokenBalance

    return (
      <TableContainer sx={{ marginBottom: 2 }}>
        <Table size="small" className="balance-table">
          <TableHead>
            <TableRow>
              <TableCell>Asset</TableCell>
              <TableCell>Wallet</TableCell>
              <TableCell>Exchange</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>{selectedAsset}</TableCell>
              <TableCell className="text-success" sx={{ fontWeight: 600 }}>
                {this.formatBalance(walletBalance)}
              </TableCell>
              <TableCell className="text-primary" sx={{ fontWeight: 600 }}>
                {this.formatBalance(exchangeBalance)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    )
  }

  render() {
    const { selectedAsset, activeTab, submitting } = this.state
    const {
      dispatch,
      exchange,
      web3,
      account,
      token,
      etherDepositAmount,
      tokenDepositAmount,
      etherWithdrawAmount,
      tokenWithdrawAmount,
      showForm
    } = this.props

    if (!showForm) {
      return (
        <Card className="balance-card">
          <CardContent>
            <div className="card-header-custom">
              💼 Balance
            </div>
            <Spinner />
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="balance-card">
        <CardContent>
          <div className="card-header-custom">
            💼 Balance
          </div>

          <Tabs value={activeTab} onChange={this.handleTabChange}>
            <Tab label="💰 Deposit" />
            <Tab label="💸 Withdraw" />
          </Tabs>

          {/* Deposit Tab */}
          <Box role="tabpanel" hidden={activeTab !== 0} className="tab-panel">
            {activeTab === 0 && (
              <>
                {this.renderAssetToggle()}
                {this.renderBalanceTable()}

                {selectedAsset === 'ETH' ? (
                  <form
                    onSubmit={this.handleDepositEther}
                    aria-label="Deposit Ether form"
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Amount (ETH)"
                        type="number"
                        inputProps={{ step: '0.0001', min: '0' }}
                        variant="outlined"
                        size="small"
                        fullWidth
                        placeholder="0.00"
                        onChange={(e) => dispatch(etherDepositAmountChanged(e.target.value))}
                        disabled={submitting}
                        required
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        fullWidth
                        disabled={submitting}
                        aria-label="Deposit Ether to exchange"
                      >
                        {submitting ? 'Submitting...' : 'Deposit ETH'}
                      </Button>
                    </Box>
                  </form>
                ) : (
                  <form
                    onSubmit={this.handleDepositToken}
                    aria-label="Deposit DAPP token form"
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Amount (DAPP)"
                        type="number"
                        inputProps={{ step: '0.0001', min: '0' }}
                        variant="outlined"
                        size="small"
                        fullWidth
                        placeholder="0.00"
                        onChange={(e) => dispatch(tokenDepositAmountChanged(e.target.value))}
                        disabled={submitting}
                        required
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        fullWidth
                        disabled={submitting}
                        aria-label="Deposit DAPP tokens to exchange"
                      >
                        {submitting ? 'Submitting...' : 'Deposit DAPP'}
                      </Button>
                    </Box>
                  </form>
                )}
              </>
            )}
          </Box>

          {/* Withdraw Tab */}
          <Box role="tabpanel" hidden={activeTab !== 1} className="tab-panel">
            {activeTab === 1 && (
              <>
                {this.renderAssetToggle()}
                {this.renderBalanceTable()}

                {selectedAsset === 'ETH' ? (
                  <form
                    onSubmit={this.handleWithdrawEther}
                    aria-label="Withdraw Ether form"
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Amount (ETH)"
                        type="number"
                        inputProps={{ step: '0.0001', min: '0' }}
                        variant="outlined"
                        size="small"
                        fullWidth
                        placeholder="0.00"
                        onChange={(e) => dispatch(etherWithdrawAmountChanged(e.target.value))}
                        disabled={submitting}
                        required
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="error"
                        fullWidth
                        disabled={submitting}
                        aria-label="Withdraw Ether from exchange"
                      >
                        {submitting ? 'Submitting...' : 'Withdraw ETH'}
                      </Button>
                    </Box>
                  </form>
                ) : (
                  <form
                    onSubmit={this.handleWithdrawToken}
                    aria-label="Withdraw DAPP token form"
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="Amount (DAPP)"
                        type="number"
                        inputProps={{ step: '0.0001', min: '0' }}
                        variant="outlined"
                        size="small"
                        fullWidth
                        placeholder="0.00"
                        onChange={(e) => dispatch(tokenWithdrawAmountChanged(e.target.value))}
                        disabled={submitting}
                        required
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="error"
                        fullWidth
                        disabled={submitting}
                        aria-label="Withdraw DAPP tokens from exchange"
                      >
                        {submitting ? 'Submitting...' : 'Withdraw DAPP'}
                      </Button>
                    </Box>
                  </form>
                )}
              </>
            )}
          </Box>
        </CardContent>
      </Card>
    )
  }
}

function mapStateToProps(state) {
  const balancesLoading = balancesLoadingSelector(state)

  return {
    account: accountSelector(state),
    exchange: exchangeSelector(state),
    token: tokenSelector(state),
    web3: web3Selector(state),
    etherBalance: etherBalanceSelector(state),
    tokenBalance: tokenBalanceSelector(state),
    exchangeEtherBalance: exchangeEtherBalanceSelector(state),
    exchangeTokenBalance: exchangeTokenBalanceSelector(state),
    balancesLoading,
    showForm: !balancesLoading,
    etherDepositAmount: etherDepositAmountSelector(state),
    etherWithdrawAmount: etherWithdrawAmountSelector(state),
    tokenDepositAmount: tokenDepositAmountSelector(state),
    tokenWithdrawAmount: tokenWithdrawAmountSelector(state),
  }
}

export default connect(mapStateToProps)(Balance)
