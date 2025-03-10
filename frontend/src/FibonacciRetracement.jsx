import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents';
import * as Constants from '../constants';
import './Indicator.css';

const FibonacciRetracement = () => {
  useEffect(() => {
    document.title = `Fibonacci Retracement Chart`;
  }, []);

  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const [priceData, setPriceData] = useState([]);
  const [asset, setAsset] = useState('');
  const [timeInterval, setTimeInterval] = useState('');
  const [isHovered, setIsHovered] = useState(false);

  const location = useLocation();

  const getQueryParams = () => {
    const queryParams = new URLSearchParams(location.search);
    setAsset(queryParams.get('asset'));
    setTimeInterval(queryParams.get('ti'));
  };

  useEffect(() => {
    getQueryParams();
  }, [location.search]);

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

  const calculateFibonacciLevels = (data) => {
    if (data.length === 0) return { levels: [], high: 0, low: 0 };

    const sortedData = [...data].sort((a, b) => a.time - b.time);
    const high = Math.max(...sortedData.map(d => d.value));
    const low = Math.min(...sortedData.map(d => d.value));

    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map(level => ({
      level,
      price: high - (high - low) * level,
    }));

    return { levels, high, low };
  };

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

    const sortedPriceData = [...priceData].sort((a, b) => a.time - b.time);
    const priceSeries = chart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
    priceSeries.setData(sortedPriceData);

    const { levels } = calculateFibonacciLevels(sortedPriceData);

    const rainbowColors = [
      'rgba(255, 0, 0, 0.2)',    // Red
      'rgba(255, 165, 0, 0.2)',  // Orange
      'rgba(255, 255, 0, 0.2)',  // Yellow
      'rgba(0, 255, 0, 0.2)',    // Green
      'rgba(0, 0, 255, 0.2)',    // Blue
      'rgba(75, 0, 130, 0.2)',   // Indigo
      'rgba(238, 130, 238, 0.2)' // Violet
    ];

    levels.forEach((level, index) => {
      if (index < levels.length - 1) {
        const upperLevel = levels[index];
        const lowerLevel = levels[index + 1];

        const areaSeries = chart.addAreaSeries({
          lineColor: rainbowColors[index],  
          topColor: rainbowColors[index],
          bottomColor: rainbowColors[index],
        });

        const areaData = sortedPriceData.map(d => ({
          time: d.time,
          value: upperLevel.price
        }));

        const areaDataBottom = sortedPriceData.map(d => ({
          time: d.time,
          value: lowerLevel.price
        }));

        areaSeries.setData(areaData);
        areaSeries.setData(areaDataBottom);
      }
    });

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

  return (
    <div className="indicator-container">
      <CloudBackGround />
      <h2 className="indicator-title">
        {asset}: Fibonacci Retracement - {timeInterval.toUpperCase()}
      </h2>
      <div className="chart-container" ref={chartContainerRef} />

      {/* Tooltip Question Mark */}
      <div
        className="question-mark-icon"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        ?
      </div>

      {/* Tooltip Content */}
      {isHovered && (
        <div className="tooltip-content">
            <strong>Fibonacci Retracement: A Key Trading Tool</strong><br /><br />
            
            The Fibonacci Retracement indicator helps traders identify potential support and resistance levels based on key Fibonacci ratios (23.6%, 38.2%, 50%, 61.8%, 78.6%). These levels are derived from the Fibonacci sequence and are commonly used to predict price retracements and reversals in financial markets.<br /><br />
            
            <strong>How It Works:</strong><br />
            When an asset experiences a significant price movement (either up or down), traders use Fibonacci levels to anticipate possible points of reversal. Prices often retrace to these levels before continuing in the original trend direction.<br /><br />
            
            <strong>Fibonacci Levels & Their Colors:</strong>
            <ul>
                <li><span style={{ color: 'red' }}> 0.0% - Major Resistance (Highest Price)</span></li>
                <li><span style={{ color: 'orange' }}> 23.6% - Shallow Pullback, Minor Support</span></li>
                <li><span style={{ color: 'yellow' }}> 38.2% - Moderate Retracement, Trend Strength</span></li>
                <li><span style={{ color: 'green' }}> 50.0% - Key Psychological Level</span></li>
                <li><span style={{ color: 'blue' }}> 61.8% - The Golden Ratio, Strong Support</span></li>
                <li><span style={{ color: 'indigo' }}> 78.6% - Deep Retracement, Reversal Zone</span></li>
                <li><span style={{ color: 'violet' }}> 100% - Major Support (Lowest Price)</span></li>
            </ul>

            
            <strong>Trading Strategy:</strong><br />
            - Buy Signal: If price bounces off a Fibonacci support level (e.g., 38.2% or 61.8%).<br />
            - Sell Signal: If price rejects a Fibonacci resistance level (e.g., 23.6% or 50%).<br />
            - Stop-Loss Placement: Traders often place stop-loss orders below the 61.8% or 78.6% retracement level.<br /><br />

            Use Fibonacci Retracement as a guide, but always combine it with other technical indicators for better accuracy!
        </div>
        )}
    </div>
  );
};

export default FibonacciRetracement;
