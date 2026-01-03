import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Card, CardContent, Typography, Box } from '@mui/material'
import Chart from 'react-apexcharts'
import Spinner from './Spinner'
import { chartOptions } from './PriceChart.config'
import {
  priceChartLoadedSelector,
  priceChartSelector
} from '../store/selectors'

const priceSymbol = (lastPriceChange) => {
  let output
  if(lastPriceChange === '+') {
    output = <span className="text-success">&#9650;</span> // Green up triangle
  } else {
    output = <span className="text-danger">&#9660;</span> // Red down triangle
  }
  return(output)
}

const showPriceChart = (priceChart) => {
  return(
    <div className="price-chart-container">
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        paddingBottom: 2.5,
        borderBottom: '1px solid rgba(102, 126, 234, 0.2)'
      }}>
        <Typography variant="h6" sx={{
          margin: 0,
          fontSize: '1.3rem',
          fontWeight: 700,
          color: '#e0e7ff',
          letterSpacing: '0.5px'
        }}>
          DAPP/ETH
        </Typography>
        {priceSymbol(priceChart.lastPriceChange)}
        <Typography sx={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: priceChart.lastPriceChange === '+' ? '#10b981' : '#ef4444'
        }}>
          {priceChart.lastPrice}
        </Typography>
      </Box>
      <div className="chart-wrapper">
        <Chart
          options={chartOptions}
          series={priceChart.series}
          type='candlestick'
          width='100%'
          height='100%'
        />
      </div>
    </div>
  )
}

class PriceChart extends Component {
  render() {
    console.log('PriceChart - priceChartLoaded:', this.props.priceChartLoaded)
    console.log('PriceChart - priceChart data:', this.props.priceChart)

    return (
      <Card>
        <CardContent>
          <div className="card-header-custom">
            📊 Price Chart
          </div>
          {this.props.priceChartLoaded ? showPriceChart(this.props.priceChart) : <Spinner />}
        </CardContent>
      </Card>
    )
  }
}

function mapStateToProps(state) {

  return {
    priceChartLoaded: priceChartLoadedSelector(state),
    priceChart: priceChartSelector(state),
  }
}

export default connect(mapStateToProps)(PriceChart)
