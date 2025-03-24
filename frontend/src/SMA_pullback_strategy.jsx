import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents';
import Backtest from './Backtest'
import * as Constants from '../constants';
import './Indicator.css';

const SMA_pullback_strategy = () => {
  useEffect(() => {
    document.title = `SMA Chart`;
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

  const calculateSMA = (data, period) => {
    let smaArray = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.value, 0);
      const sma = sum / period;
      smaArray.push({ time: data[i].time, value: sma });
    }
    return smaArray;
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
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: { textColor: Constants.GRAPH_TEXT_COLOR, background: 
        { type: ColorType.VerticalGradient, topColor: Constants.TOP_COLOR, bottomColor: Constants.BOTTOM_COLOR }},
    });
    chartInstance.current = chart;

    const priceSeries = chart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
    priceSeries.setData(priceData);

    const smaPeriod = 14;
    const smaValues = calculateSMA(priceData, smaPeriod);
    const smaSeries = chart.addLineSeries({ color: 'yellow', lineWidth: 3 });
    smaSeries.setData(smaValues);

    const handleResize = () => {
      chart.resize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [priceData]);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="tile-container">
      <div className="indicator-container">
        {/* <CloudBackGround/> */}
        <h2 className="indicator-title">{asset}: Simple Moving Average - {timeInterval.toUpperCase()}</h2>
        <div className="short-chart-container" ref={chartContainerRef} />

        <div className="question-mark-icon" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>?</div>

        {isHovered && (
          <MathJaxContext>
            <div className="tooltip-content formatted-tooltip">
              The Simple Moving Average (SMA) is one of the most fundamental technical indicators in financial markets. It helps traders and analysts smooth out price data over a specific period, making it easier to identify trends. Unlike more complex moving averages, such as the Exponential Moving Average (EMA), the SMA applies equal weight to all data points, providing a straightforward way to analyze historical price movements.<br/><br/>
              The SMA is calculated by summing the closing prices over a chosen period and dividing by the number of periods. The formula is:<br/><br/>
              <MathJax>
                {`\\( SMA = \\frac{\\sum_{i=0}^{N-1} P_i}{N} \\)`}
              </MathJax>
              <br/>
              <MathJax>
                {`where \\( P_i \\) represents the price at period \\( i \\), and \\( N \\) is the number of periods used in the calculation.`}
              </MathJax>
              <br/>
              Traders use SMA for various purposes, including trend identification, support and resistance levels, and trading signals. A rising SMA suggests a bullish trend, while a declining SMA indicates a bearish trend. When a short-term SMA crosses above a long-term SMA, it can signal a potential buying opportunity, while the opposite crossover may suggest a sell signal.
            </div>
          </MathJaxContext>
        )}
      </div>
      <h2 className="strategy-header">SMA Pullback Strategy: Backtesting</h2>
      <Backtest type={"SMA_pullback"} asset={asset} />
    </div>
  );
};

export default SMA_pullback_strategy;
