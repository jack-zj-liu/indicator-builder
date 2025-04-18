import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents'
import * as Constants from '../constants';
import './Indicator.css';

const BollingerBands = () => {
  useEffect(() => {
    document.title = `Bollinger Bands Chart`;
  }, []);

  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const [priceData, setPriceData] = useState([]);
  const [asset, setAsset] = useState('');
  const [timeInterval, setTimeInterval] = useState('');

  const location = useLocation();

  const getQueryParams = () => {
    const queryParams = new URLSearchParams(location.search);
    setAsset(queryParams.get('asset'));
    setTimeInterval(queryParams.get('ti'));
  };

  useEffect(() => {
    getQueryParams();
  }, [location.search]);

  // Calculate Bollinger Bands using a simple moving average (SMA)
  // period: number of data points (default 20)
  // multiplier: standard deviation multiplier (default 2)
  // TODO: add customization to default values
  const calculateBollingerBands = (data, period = 20, multiplier = 2) => {
    if (data.length < period) return { median: [], upper: [], lower: [] };

    const median = [];
    const upper = [];
    const lower = [];

    for (let i = period - 1; i < data.length; i++) {
      // slice the window data points
      const windowSlice = data.slice(i - period + 1, i + 1);
      
      // calculate simple moving average (SMA)
      const sum = windowSlice.reduce((s, d) => s + d.value, 0);
      const sma = sum / period;
      
      // calculate standard deviation
      const variance = windowSlice.reduce((v, d) => v + Math.pow(d.value - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      median.push({ time: data[i].time, value: sma });
      upper.push({ time: data[i].time, value: sma + multiplier * stdDev });
      lower.push({ time: data[i].time, value: sma - multiplier * stdDev });
    }

    return { median, upper, lower };
  };

  useEffect(() => {
    if (asset && timeInterval) {
      const fetchData = async () => {
        try {
          const response = await fetch(`${Constants.BACKEND_URL}/time_series_${timeInterval.toLowerCase()}/${asset}`);
          if (!response.ok) {
            throw new Error('Failed to fetch data');
          }
          const data = await response.json();
          setPriceData(data);
        } catch (err) {
          console.error('Error fetching data:', err);
        }
      };
      fetchData();
    }
  }, [asset, timeInterval]);

  useEffect(() => {
    if (!priceData.length) return;

    const container = chartContainerRef.current;
    const chartWidth = container.clientWidth;
    const chartHeight = container.clientHeight;

    const chart = createChart(container, {
      width: chartWidth,
      height: chartHeight,
      layout: { textColor: Constants.GRAPH_TEXT_COLOR, background: 
        { type: ColorType.VerticalGradient, topColor: Constants.TOP_COLOR, bottomColor: Constants.BOTTOM_COLOR }},
    });
    chartInstance.current = chart;

    const priceSeries = chart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
    priceSeries.setData(priceData);

    const { median, upper, lower } = calculateBollingerBands(priceData);

    // Median SMA line
    const medianSeries = chart.addLineSeries({ color: 'gray', lineWidth: 2 });
    medianSeries.setData(median);

    // Upper band
    const upperSeries = chart.addLineSeries({ color: '#ced902', lineWidth: 2 });
    upperSeries.setData(upper);

    // Lower band
    const lowerSeries = chart.addLineSeries({ color: '#ced902', lineWidth: 2 });
    lowerSeries.setData(lower);

    const handleResize = () => {
      const width = window.innerWidth * 0.8;
      const height = window.innerHeight * 0.6;
      chart.resize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [priceData]);

  const [isHovered, setIsHovered] = useState(false);
  
    return (
      <div className="indicator-container">
        {/* <CloudBackGround/> */}
        <h2 className="indicator-title">
          {asset}: Bollinger Bands - {timeInterval.toUpperCase()}
        </h2>
        <div className="chart-container" ref={chartContainerRef} />
        
        {/* Question mark icon at the bottom right corner */}
        <div
          className="question-mark-icon"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          ?
        </div>
  
        {isHovered && (
          <div className="tooltip-content">
  Bollinger Bands are a widely used technical indicator developed by John Bollinger in the 1980s to measure market volatility and identify potential overbought or oversold conditions. The indicator consists of three lines: a simple moving average (SMA) in the center, with an upper and lower band positioned a set number of standard deviations away from the SMA. These bands expand and contract based on market volatility, making them a dynamic tool for traders to analyze price movements and potential trend reversals.<br /><br />
  
  Traders use Bollinger Bands to identify market conditions, detect breakouts, and assess trend strength. When the price touches or exceeds the upper band, it suggests that the asset may be overbought, while reaching the lower band may indicate an oversold condition. A common strategy is the “Bollinger Bounce,” where prices tend to revert toward the middle band after reaching the outer bands. Another strategy, the “Bollinger Squeeze,” occurs when the bands contract, signaling a period of low volatility that often precedes a strong breakout in either direction. By combining Bollinger Bands with other indicators like the Relative Strength Index (RSI) or Moving Average Convergence Divergence (MACD), traders can improve their decision-making and confirm trade signals.<br /><br />
  
  Bollinger Bands consist of three key components: the middle band, which is typically a 20-period simple moving average (SMA), and the upper and lower bands, which are positioned two standard deviations above and below the SMA. The standard deviation measures the price's volatility, meaning the bands widen when the market is more volatile and contract when volatility decreases. The formula for Bollinger Bands is as follows: the middle band is calculated as the 20-period SMA, while the upper band is derived by adding two times the 20-period standard deviation to the SMA, and the lower band is obtained by subtracting two times the standard deviation from the SMA. These settings can be adjusted based on the trader’s preference or the asset being analyzed. Because Bollinger Bands dynamically adjust to price fluctuations, they provide valuable insights into market conditions, helping traders identify trend strength, potential reversals, and breakout opportunities.
          </div>
        )}
      </div>
    );
};

export default BollingerBands;
