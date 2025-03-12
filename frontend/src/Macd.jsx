import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents'
import * as Constants from '../constants';
import './Indicator.css';
import './App.css';

const Macd = () => {
  useEffect(() => {
    document.title = `MACD Chart`;
  }, []);

  const chartContainerRef = useRef(null);
  const indicatorChartContainerRef = useRef(null);  // For MACD and Signal lines
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
    if (priceData.length === 0 || !chartContainerRef.current || !indicatorChartContainerRef.current) return;

    // Price chart setup
    const priceContainer = chartContainerRef.current;
    const priceChart = createChart(priceContainer, {
      width: priceContainer.clientWidth,
      height: priceContainer.clientHeight,
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: { type: ColorType.VerticalGradient, topColor: Constants.TOP_COLOR, bottomColor: Constants.BOTTOM_COLOR },
      },
    });
    chartInstance.current = priceChart;

    const priceSeries = priceChart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
    priceSeries.setData(priceData);

    // MACD chart setup
    const indicatorContainer = indicatorChartContainerRef.current;
    const indicatorChart = createChart(indicatorContainer, {
      width: indicatorContainer.clientWidth,
      height: indicatorContainer.clientHeight,
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: { type: ColorType.VerticalGradient, topColor: Constants.BOTTOM_COLOR, bottomColor: Constants.BOTTOM_COLOR },
      },
    });

    const ema12 = calculateEMA(priceData, 12);
    const ema26 = calculateEMA(priceData, 26);
    const macdLine = ema12.map((point, index) => ({
      time: point.time,
      value: point.value - ema26[index].value,
    }));
    const signalLine = calculateEMA(macdLine, 9);

    const macdSeries = indicatorChart.addLineSeries({ color: '#74adfc', lineWidth: 2 });
    const signalSeries = indicatorChart.addLineSeries({ color: '#fc7674', lineWidth: 2 });

    macdSeries.setData(macdLine);
    signalSeries.setData(signalLine);

    const handleResize = () => {
      if (priceChart && indicatorChart) {
        priceChart.resize(priceContainer.clientWidth, priceContainer.clientHeight);
        indicatorChart.resize(indicatorContainer.clientWidth, indicatorContainer.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      priceChart.remove();
      indicatorChart.remove();
    };
  }, [priceData]);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="indicator-container">
      <CloudBackGround />
      <h2 className="indicator-title">
        {asset}: Moving Average Convergence Divergence - {timeInterval.toUpperCase()}
      </h2>
      
      {/* Price chart container */}
      <div className="price-chart-container" ref={chartContainerRef} />

      {/* MACD and Signal line container */}
      <div className="indicator-chart-container" ref={indicatorChartContainerRef} />

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
          The Moving Average Convergence Divergence (MACD) is a popular technical analysis tool used by traders to assess the momentum of an asset, identify trend directions, and spot potential reversals. Developed by Gerald Appel in the late 1970s, the MACD has become one of the most widely used indicators for analyzing price trends in various markets, including stocks, forex, and commodities. It combines elements of both trend-following and momentum-based strategies, making it a versatile tool for traders seeking to make informed buy or sell decisions.<br /><br />

          Traders use the MACD to determine the strength and direction of a trend, as well as to spot potential turning points. The indicator is typically employed to identify bullish and bearish crossovers, where the MACD line (the difference between the 12-day and 26-day exponential moving averages) crosses above or below the signal line (the 9-day EMA of the MACD). A crossover above the signal line is often interpreted as a buy signal, indicating that the asset is gaining upward momentum. Conversely, a crossover below the signal line is seen as a sell signal, suggesting that the downward momentum is increasing. Additionally, the MACD histogram, which represents the difference between the MACD and its signal line, can help traders visually identify shifts in momentum.<br /><br />

          The MACD consists of three main components: the MACD line, the signal line, and the histogram. The MACD line is calculated by subtracting the 26-period Exponential Moving Average (EMA) from the 12-period EMA, providing insight into the short-term momentum relative to the long-term trend. The signal line is a 9-period EMA of the MACD line, which smooths the fluctuations and makes crossovers easier to identify. The histogram represents the difference between the MACD line and the signal line, visually indicating the strength of the trend. A growing histogram suggests increasing momentum, while a shrinking histogram signals weakening momentum. Divergence between the MACD and price action is also a key signal; for example, if the price is making new highs while the MACD fails to do so, it may indicate an impending reversal.
        </div>
      )}
    </div>
  );
};

export default Macd;
