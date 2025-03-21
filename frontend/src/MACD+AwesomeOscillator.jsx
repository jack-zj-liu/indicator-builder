import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents'
import * as Constants from '../constants';
import './Indicator.css';
import './App.css';

const MACD_AwesomeOscillator = () => {
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

  const calculateAO = (data) => {
    const aoData = [];
    for (let i = 33; i < data.length; i++) {
      // Calculate 5-period SMA
      let sum5 = 0;
      for (let j = i - 4; j <= i; j++) {
        sum5 += data[j].value;
      }
      const sma5 = sum5 / 5;

      // Calculate 34-period SMA
      let sum34 = 0;
      for (let j = i - 33; j <= i; j++) {
        sum34 += data[j].value;
      }
      const sma34 = sum34 / 34;

      aoData.push({
        time: data[i].time,
        value: sma5 - sma34
      });
    }
    return aoData;
  };

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

    

    const aoData = calculateAO(priceData);
    // Format AO data for a histogram series with conditional coloring:
    // Green when AO positive, red when negative.
    const formattedAOData = aoData.map((d) => ({
      time: d.time,
      value: d.value,
      color: d.value >= 0 ? 'green' : 'red'
    }));

    const aoSeries = priceChart.addHistogramSeries({
      base: 0
    });
    aoSeries.setData(formattedAOData);

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
        {asset}: Moving Average Convergence Divergence + Awesome Oscillator - {timeInterval.toUpperCase()}
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
          The MACD (below) and Awesome Oscillator (above) work well together by combining trend momentum with confirmation of market strength. MACD identifies trend direction using two EMAs (typically 12-day and 26-day) and a signal line (9-day EMA). A bullish crossover of the MACD line above the signal line suggests upward momentum, while a bearish crossover signals a potential downtrend.<br /><br />

          The Awesome Oscillator (AO) measures market momentum by comparing a short-term (5-period) and long-term (34-period) SMA on the median price. It is displayed as a histogram that turns green when momentum increases and red when it weakens. AO helps confirm MACD signals by showing whether momentum aligns with the trend. A zero-line crossover in AO can also indicate a shift in trend direction.<br /><br />

          When used together, traders look for MACD crossovers supported by AO confirmation. A strong buy signal occurs when MACD crosses bullishly, and AO turns green or moves above zero. A sell signal appears when MACD crosses bearishly, and AO turns red or moves below zero. This combination helps filter out false signals and provides stronger trend confirmation.
        </div>
      )}
    </div>
  );
};

export default MACD_AwesomeOscillator;
