import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents';
import * as Constants from '../constants';
import './Indicator.css';

const Stochastic = () => {
  useEffect(() => {
    document.title = `Stochastic Oscillator Chart`;
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

  // Calculate Stochastic Oscillator centered around 0
  const calculateStochastic = (data, period) => {
    let stochasticArray = [];

    for (let i = period - 1; i < data.length; i++) {
      const periodData = data.slice(i - period + 1, i + 1);

      const highestClose = Math.max(...periodData.map(d => d.value));
      const lowestClose = Math.min(...periodData.map(d => d.value));
      const currentClose = data[i].value;

      // Prevent division by zero
      if (highestClose === lowestClose) {
        stochasticArray.push({ time: data[i].time, value: 0 });
      } else {
        // Apply modified stochastic formula centered around 0
        const stochastic = ((currentClose - lowestClose) / (highestClose - lowestClose)) * 100 - 50;
        stochasticArray.push({ time: data[i].time, value: stochastic });
      }
    }

    return stochasticArray;
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
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: {
          type: ColorType.VerticalGradient,
          topColor: Constants.TOP_COLOR,
          bottomColor: Constants.BOTTOM_COLOR
        }
      },
    });
    chartInstance.current = chart;

    const priceSeries = chart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
    priceSeries.setData(priceData);

    // Calculate stochastic values
    const stochasticData = calculateStochastic(priceData, 14);
    // Format the stochastic data for a histogram series
    const formattedStochasticData = stochasticData.map((d) => ({
      time: d.time,
      value: d.value,
      color: d.value >= 0 ? 'green' : 'red', // Red for negative values
    }));

    const stochasticSeries = chart.addHistogramSeries({
      base: 0,
    });
    stochasticSeries.setData(formattedStochasticData);

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
        {asset}: Stochastic Oscillator - {timeInterval.toUpperCase()}
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
        <strong>The Stochastic Oscillator</strong> is a momentum indicator that compares a closing price to its price range over a set period, typically 14 periods. It helps identify overbought and oversold conditions, with values ranging from 0 to 100.<br /><br />
      
        The indicator consists of two lines:
        <ul>
          <li><strong>%K line</strong>: The current value of the oscillator, showing the closing price's position relative to the price range.</li>
          <li><strong>%D line</strong>: A 3-period moving average of the %K line, smoothing out fluctuations.</li>
        </ul>
      
        The Stochastic Oscillator is used to spot potential reversals:
        <ul>
          <li><strong>Overbought:</strong> When the value is above 80, indicating a possible pullback.</li>
          <li><strong>Oversold:</strong> When the value is below 20, suggesting a potential upward correction.</li>
        </ul>
      
        Common trading signals:
        <ul>
          <li><strong>Buy signal:</strong> %K crosses above %D below 20 (oversold conditions).</li>
          <li><strong>Sell signal:</strong> %K crosses below %D above 80 (overbought conditions).</li>
        </ul>
      
        The Stochastic Oscillator is useful for spotting momentum shifts and potential trend reversals.
      </div>      
      )}
    </div>
  );
};

export default Stochastic;
