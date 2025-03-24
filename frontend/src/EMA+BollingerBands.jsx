import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents'
import * as Constants from '../constants'
import './Indicator.css';

const EMA_BB = () => {
  useEffect(() => {
    document.title = `RSI Chart`;
  }, []);

  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const [priceData, setPriceData] = useState([]);
  const [asset, setAsset] = useState('');
  const [timeInterval, setTimeInterval] = useState('');

  const location = useLocation();

  const getQueryParams = () => {
    const queryParams = new URLSearchParams(location.search);
    const assetParam = queryParams.get('asset');
    const tiParam = queryParams.get('ti');
    setAsset(assetParam);
    setTimeInterval(tiParam);
  };

  useEffect(() => {
    getQueryParams();
  }, [location.search]);

  const calculateEMA = (data, period) => {
    const k = 2 / (period + 1);
    let emaArray = [];
    let prevEma = data[0].value;
    emaArray.push({ time: data[0].time, value: prevEma });

    for (let i = 1; i < data.length; i++) {
      const ema = data[i].value * k + prevEma * (1 - k);
      emaArray.push({ time: data[i].time, value: ema });
      prevEma = ema;
    }

    return emaArray;
  };

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
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
    }
  }, [asset, timeInterval]);

  useEffect(() => {
    if (priceData.length === 0) return;

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

    // Calculate EMA and RSI
    const rsiPeriod = 14; // RSI period (you can adjust this)
    const rsiValues = calculateEMA(priceData, rsiPeriod);

    // Add a new pane for the RSI
    const rsiSeries = chart.addLineSeries({ color: 'red', lineWidth: 3 });
    rsiSeries.setData(rsiValues);

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

    // Resize the chart on window resize
    const handleResize = () => {
      const width = window.innerWidth * 0.8;
      const height = window.innerHeight * 0.6;
      chart.resize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Clean up on unmount
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
        {asset}: EMA + Bollinger Bands - {timeInterval.toUpperCase()}
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
        <span style={{ color: 'red' }}>EMA (exponential moving average)</span> and <span style={{ color: 'yellow' }}>Bollinger Bands</span> are often used together to identify trends and potential trade setups. EMA is a moving average that gives more weight to recent price data, making it more responsive to price changes. Bollinger Bands consist of a middle moving average (typically a simple moving average) and two outer bands that expand and contract based on market volatility. When the price moves near or beyond the upper or lower Bollinger Band, it may indicate overbought or oversold conditions.<br /><br />
        When using these indicators together, traders look for price interactions with both the EMA and Bollinger Bands. If the price is above the EMA and bouncing off the middle or lower Bollinger Band, it suggests a continuation of an uptrend and a potential buying opportunity. Conversely, if the price is below the EMA and touches or moves above the upper Bollinger Band, it may indicate a downtrend continuation and a potential selling opportunity. The EMA helps confirm the prevailing trend, while Bollinger Bands highlight potential entry points.<br /><br />
        Another strategy involves using EMA crossovers in conjunction with Bollinger Bands. For example, a short-term EMA crossing above a long-term EMA while the price is near the lower Bollinger Band may signal a strong bullish move. Similarly, if a short-term EMA crosses below a long-term EMA while the price is near the upper Bollinger Band, it may indicate a bearish reversal. Combining these indicators helps traders avoid false signals and make more informed trading decisions.
        </div>
      )}
    </div>
  );
};

export default EMA_BB;
