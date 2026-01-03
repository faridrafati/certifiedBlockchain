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
      activeTab: 0
    }
  }

  componentDidMount() {
    this.loadBlockchainData()
  }

  async loadBlockchainData() {
    const { dispatch, web3, exchange, token, account } = this.props
    await loadBalances(dispatch, web3, exchange, token, account)
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
    const { selectedAsset, activeTab } = this.state
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
        <Card>
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
      <Card>
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
                    onSubmit={(event) => {
                      event.preventDefault()
                      depositEther(dispatch, exchange, web3, token, etherDepositAmount, account)
                    }}
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
                        required
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        fullWidth
                        aria-label="Deposit Ether to exchange"
                      >
                        Deposit ETH
                      </Button>
                    </Box>
                  </form>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      depositToken(dispatch, exchange, web3, token, tokenDepositAmount, account)
                    }}
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
                        required
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="success"
                        fullWidth
                        aria-label="Deposit DAPP tokens to exchange"
                      >
                        Deposit DAPP
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
                    onSubmit={(event) => {
                      event.preventDefault()
                      withdrawEther(dispatch, exchange, web3, token, etherWithdrawAmount, account)
                    }}
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
                        required
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="error"
                        fullWidth
                        aria-label="Withdraw Ether from exchange"
                      >
                        Withdraw ETH
                      </Button>
                    </Box>
                  </form>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      withdrawToken(dispatch, exchange, web3, token, tokenWithdrawAmount, account)
                    }}
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
                        required
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="error"
                        fullWidth
                        aria-label="Withdraw DAPP tokens from exchange"
                      >
                        Withdraw DAPP
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
