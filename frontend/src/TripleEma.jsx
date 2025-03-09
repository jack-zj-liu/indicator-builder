import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents'
import * as Constants from '../constants';
import './Indicator.css';

const TripleEma = () => {
  useEffect(() => {
    document.title = `Triple EMA Chart`;
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

  // Calculate EMA given data array and period
  const calculateEMA = (data, period) => {
    if (data.length === 0) return [];

    const k = 2 / (period + 1);
    const emaArray = [];
    let prevEma = data[0].value;
    emaArray.push({ time: data[0].time, value: prevEma });

    for (let i = 1; i < data.length; i++) {
      const ema = data[i].value * k + prevEma * (1 - k);
      emaArray.push({ time: data[i].time, value: ema });
      prevEma = ema;
    }

    return emaArray;
  };

  // Fetch price data from backend
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

    // Calculate the three EMAs: periods 50, 100, and 200
    const ema50 = calculateEMA(priceData, 50);
    const ema100 = calculateEMA(priceData, 100);
    const ema200 = calculateEMA(priceData, 200);

    // Add line series for each EMA with distinct colors
    const ema50Series = chart.addLineSeries({ color: '#ff6969', lineWidth: 2 });
    ema50Series.setData(ema50);

    const ema100Series = chart.addLineSeries({ color: '#ced902', lineWidth: 2 });
    ema100Series.setData(ema100);

    const ema200Series = chart.addLineSeries({ color: '#059103', lineWidth: 2 });
    ema200Series.setData(ema200);

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
      <CloudBackGround/>
      <h2 className="indicator-title">
        {asset}: Triplke Exponential Moving Average - {timeInterval.toUpperCase()}
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
  The Triple Exponential Moving Average (Triple EMA or TEMA) is a technical indicator used in trading to smooth out price data and identify trends more effectively than a traditional moving average. Developed by Patrick Mulloy in 1994, TEMA aims to reduce lag while maintaining responsiveness to price movements. Unlike a simple moving average (SMA) or an exponential moving average (EMA), TEMA applies multiple layers of smoothing to provide a more accurate representation of price trends. This makes it particularly useful for traders who seek to minimize noise and react swiftly to market changes.<br /><br />

  TEMA is widely used by traders to identify trend direction, generate buy and sell signals, and confirm price breakouts. When the TEMA line moves upward, it suggests an uptrend, while a downward slope indicates a downtrend. Traders often use it in combination with other indicators, such as the Relative Strength Index (RSI) or Moving Average Convergence Divergence (MACD), to improve signal accuracy. Additionally, crossover strategies, where a short-term TEMA crosses above or below a long-term TEMA, can help traders identify potential entry and exit points in the market. Due to its reduced lag, TEMA is particularly effective in fast-moving markets, such as forex and short-term stock trading.<br /><br />

  TEMA is calculated using a combination of multiple EMAs to remove lag more effectively than a single EMA. The formula involves computing a single EMA (EMA1), a double EMA (EMA2), and a triple EMA (EMA3), then combining them to create the final TEMA value. By incorporating multiple layers of EMA, TEMA effectively reduces the lag present in traditional moving averages, making it more responsive to recent price changes while still filtering out minor fluctuations. This makes it a powerful tool for traders looking for a balance between smooth trend analysis and timely signal generation.
        </div>
      )}
    </div>
  );
};

export default TripleEma;
