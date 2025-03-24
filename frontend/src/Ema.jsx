import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents';
import * as Constants from '../constants';
import './Indicator.css';

const Ema = () => {
  useEffect(() => {
    document.title = `EMA Chart`;
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

  const calculateEMA = (data, period) => {
    if (data.length === 0) return [];
    
    const emaArray = [];
    const multiplier = 2 / (period + 1);
    let ema = data[0].value;

    emaArray.push({ time: data[0].time, value: ema });
    
    for (let i = 1; i < data.length; i++) {
      ema = (data[i].value - ema) * multiplier + ema;
      emaArray.push({ time: data[i].time, value: ema });
    }

    return emaArray;
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

    const emaPeriod = 14;
    const emaValues = calculateEMA(priceData, emaPeriod);
    const emaSeries = chart.addLineSeries({ color: 'yellow', lineWidth: 3 });
    emaSeries.setData(emaValues);

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
    <div className="indicator-container">
      {/* <CloudBackGround/> */}
      <h2 className="indicator-title">{asset}: Exponential Moving Average - {timeInterval.toUpperCase()}</h2>
      <div className="chart-container" ref={chartContainerRef} />

      <div className="question-mark-icon" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>?</div>

      {isHovered && (
        <MathJaxContext>
          <div className="tooltip-content formatted-tooltip">
            The Exponential Moving Average (EMA) is a widely used technical indicator in financial markets. Unlike the Simple Moving Average (SMA), EMA gives greater weight to recent prices, making it more responsive to price changes.<br/><br/>
            The EMA is calculated using the following formula:<br/><br/>
            <MathJax>
                {`\\( EMA_t = P_t \\times \\alpha + EMA_{t-1} \\times (1 - \\alpha) \\)`}
            </MathJax>
            <br/>
            <MathJax>
                {`where \\( P_t \\) represents the price at time \\( t \\), \\( \\alpha = \\frac{2}{N+1} \\) is the smoothing factor, and \\( N \\) is the number of periods.`}
            </MathJax>
            <br/>
            Traders use EMA for identifying trends, support/resistance levels, and trading signals. A rising EMA suggests a bullish trend, while a declining EMA suggests a bearish trend. Crossovers between short-term and long-term EMAs are often used as trade signals.
          </div>
        </MathJaxContext>
      )}
    </div>
  );
};

export default Ema;
