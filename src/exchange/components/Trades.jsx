import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material'
import Spinner from './Spinner'
import {
  filledOrdersLoadedSelector,
  filledOrdersSelector
} from '../store/selectors'

const showFilledOrders = (filledOrders) => {
  return(
    <TableBody>
      { filledOrders.length > 0 ? filledOrders.map((order) => {
        return(
          <TableRow hover key={order.id} className={`order-${order.id}`}>
            <TableCell sx={{color: '#a5b4fc', fontSize: '0.8rem'}}>
              {order.formattedTimestamp}
            </TableCell>
            <TableCell sx={{fontWeight: 600}}>
              {order.tokenAmount}
            </TableCell>
            <TableCell className={`text-${order.tokenPriceClass}`} sx={{fontWeight: 600}}>
              {order.tokenPrice}
            </TableCell>
          </TableRow>
        )
      }) : (
        <TableRow>
          <TableCell colSpan={3}>
            <div className="table-empty-state">
              <div className="table-empty-icon">📈</div>
              <div className="table-empty-text">No trades yet</div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  )
}

class Trades extends Component {
  render() {
    return (
      <Card>
        <CardContent>
          <div className="card-header-custom">
            💹 Recent Trades
          </div>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>DAPP</TableCell>
                  <TableCell>DAPP/ETH</TableCell>
                </TableRow>
              </TableHead>
              { this.props.filledOrdersLoaded ? showFilledOrders(this.props.filledOrders) : <Spinner type="table" />}
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
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
