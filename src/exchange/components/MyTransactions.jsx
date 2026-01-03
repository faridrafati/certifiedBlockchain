import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Card,
  CardContent,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
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
    <TableBody>
      { myFilledOrders.length > 0 ? myFilledOrders.map((order) => {
        return (
          <TableRow hover key={order.id}>
            <TableCell sx={{color: '#a5b4fc', fontSize: '0.8rem'}}>
              {order.formattedTimestamp}
            </TableCell>
            <TableCell className={`text-${order.orderTypeClass}`} sx={{fontWeight: 600}}>
              {order.orderSign}{order.tokenAmount}
            </TableCell>
            <TableCell className={`text-${order.orderTypeClass}`} sx={{fontWeight: 600}}>
              {order.tokenPrice}
            </TableCell>
          </TableRow>
        )
      }) : (
        <TableRow>
          <TableCell colSpan={3}>
            <div className="table-empty-state">
              <div className="table-empty-icon">📋</div>
              <div className="table-empty-text">No filled orders</div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

const showMyOpenOrders = (props) => {
  const { myOpenOrders, dispatch, exchange, account } = props

  return(
    <TableBody>
      { myOpenOrders.length > 0 ? myOpenOrders.map((order) => {
        return (
          <TableRow hover key={order.id}>
            <TableCell className={`text-${order.orderTypeClass}`} sx={{fontWeight: 600}}>
              {order.tokenAmount}
            </TableCell>
            <TableCell className={`text-${order.orderTypeClass}`} sx={{fontWeight: 600}}>
              {order.tokenPrice}
            </TableCell>
            <TableCell
              className="cancel-order-cell"
              onClick={(e) => {
                cancelOrder(dispatch, exchange, order, account)
              }}
              sx={{cursor: 'pointer', textAlign: 'center'}}
            >
              <span style={{fontSize: '1.2rem'}}>✖</span>
            </TableCell>
          </TableRow>
        )
      }) : (
        <TableRow>
          <TableCell colSpan={3}>
            <div className="table-empty-state">
              <div className="table-empty-icon">📝</div>
              <div className="table-empty-text">No open orders</div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

class MyTransactions extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeTab: 0
    }
  }

  handleTabChange = (event, newValue) => {
    this.setState({ activeTab: newValue })
  }

  render() {
    const { activeTab } = this.state

    return (
      <Card>
        <CardContent>
          <div className="card-header-custom">
            👤 My Transactions
          </div>
          <Tabs value={activeTab} onChange={this.handleTabChange}>
            <Tab label="✅ Filled" />
            <Tab label="⏳ Open" />
          </Tabs>

          <Box role="tabpanel" hidden={activeTab !== 0} className="tab-panel">
            {activeTab === 0 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>DAPP</TableCell>
                      <TableCell>DAPP/ETH</TableCell>
                    </TableRow>
                  </TableHead>
                  { this.props.showMyFilledOrders ? showMyFilledOrders(this.props) : <Spinner type="table" />}
                </Table>
              </TableContainer>
            )}
          </Box>

          <Box role="tabpanel" hidden={activeTab !== 1} className="tab-panel">
            {activeTab === 1 && (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Amount</TableCell>
                      <TableCell>DAPP/ETH</TableCell>
                      <TableCell>Cancel</TableCell>
                    </TableRow>
                  </TableHead>
                  { this.props.showMyOpenOrders ? showMyOpenOrders(this.props) : <Spinner type="table" />}
                </Table>
              </TableContainer>
            )}
          </Box>
        </CardContent>
      </Card>
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
