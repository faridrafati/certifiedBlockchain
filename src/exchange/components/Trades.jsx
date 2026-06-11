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
  Typography,
  Tooltip
} from '@mui/material'
import Spinner from './Spinner'
import {
  filledOrdersLoadedSelector,
  filledOrdersSelector
} from '../store/selectors'

const showFilledOrders = (filledOrders) => {
  const handleRowClick = (transactionHash) => {
    if (transactionHash) {
      window.open(`https://eth-sepolia.blockscout.com/tx/${transactionHash}`, '_blank')
    }
  }

  return(
    <TableBody>
      { filledOrders.length > 0 ? filledOrders.map((order) => {
        return(
          <Tooltip
            key={order.id}
            title={order.transactionHash ? 'Click to view transaction on Blockscout' : 'Transaction hash not available'}
            placement="left"
          >
            <TableRow
              hover
              className={`order-${order.id}`}
              onClick={() => handleRowClick(order.transactionHash)}
              sx={{
                cursor: order.transactionHash ? 'pointer' : 'default',
                '&:hover': {
                  backgroundColor: order.transactionHash ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                }
              }}
            >
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
          </Tooltip>
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
          <TableContainer
            sx={{
              maxHeight: { xs: '250px', sm: '350px', md: '500px' },
              overflowY: 'auto',
              overflowX: { xs: 'auto', md: 'hidden' },
              WebkitOverflowScrolling: 'touch',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(102, 126, 234, 0.5)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'rgba(102, 126, 234, 0.7)',
                },
              },
            }}
          >
            <Table size="small" stickyHeader>
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
