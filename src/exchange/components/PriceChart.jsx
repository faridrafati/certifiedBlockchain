import React, { Component } from 'react'
import { connect } from 'react-redux'
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
    output = <span className="text-success">&#9650;</span> // Green up tiangle
  } else {
    output = <span className="text-danger">&#9660;</span> // Red down triangle
  }
  return(output)
}

const showPriceChart = (priceChart) => {
  return(
    <div className="price-chart">
      <div className="price" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(139, 92, 246, 0.2)'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '1.3rem',
          fontWeight: '700',
          color: '#e0e7ff',
          letterSpacing: '0.5px'
        }}>
          DAPP/ETH
        </h4>
        {priceSymbol(priceChart.lastPriceChange)}
        <span style={{
          fontSize: '1.2rem',
          fontWeight: '700',
          color: priceChart.lastPriceChange === '+' ? '#10b981' : '#ef4444'
        }}>
          {priceChart.lastPrice}
        </span>
      </div>
      <Chart options={chartOptions} series={priceChart.series} type='candlestick' width='100%' height='100%' />
    </div>
  )
}

class PriceChart extends Component {
  render() {
    return (
      <div className="card bg-dark text-white">
        <div className="card-header">
          📊 Price Chart
        </div>
        <div className="card-body">
          {this.props.priceChartLoaded ? showPriceChart(this.props.priceChart) : <Spinner />}
        </div>
      </div>
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
