import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents';
import * as Constants from '../constants';
import './Indicator.css';

const AroonIndicator = () => {
  useEffect(() => {
    document.title = `Aroon Indicator Chart`;
  }, []);

  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const [priceData, setPriceData] = useState([]);
  const [aroonData, setAroonData] = useState([]);
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

  const calculateAroon = (data, period = 14) => {
    if (data.length === 0) return [];

    const aroonUp = [];
    const aroonDown = [];

    for (let i = period; i < data.length; i++) {
      const slice = data.slice(i - period, i);
      const maxIndex = slice.reduce((maxIdx, curr, idx, arr) => curr.value > arr[maxIdx].value ? idx : maxIdx, 0);
      const minIndex = slice.reduce((minIdx, curr, idx, arr) => curr.value < arr[minIdx].value ? idx : minIdx, 0);

      aroonUp.push(((period - (period - maxIndex - 1)) / period) * 100);
      aroonDown.push(((period - (period - minIndex - 1)) / period) * 100);
    }

    return data.slice(period).map((d, i) => ({
      time: d.time,
      aroonUp: aroonUp[i],
      aroonDown: aroonDown[i],
    }));
  };

  const scaleAroonData = (aroonData, priceData) => {
    if (aroonData.length === 0 || priceData.length === 0) return [];

    // Find the minimum and maximum price values
    const minPrice = Math.min(...priceData.map(d => d.value));
    const maxPrice = Math.max(...priceData.map(d => d.value));

    // Calculate the scaling factor (1/3 of the price range)
    const scalingFactor = (maxPrice - minPrice) / 3;

    // Scale the Aroon values
    return aroonData.map(d => ({
      time: d.time,
      aroonUp: (d.aroonUp / 100) * scalingFactor + minPrice,
      aroonDown: (d.aroonDown / 100) * scalingFactor + minPrice,
    }));
  };

  useEffect(() => {
    if (priceData.length === 0) return;

    const aroonCalculated = calculateAroon(priceData);
    setAroonData(aroonCalculated);
  }, [priceData]);

  useEffect(() => {
    if (aroonData.length === 0 || priceData.length === 0) return;

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

    // Add price series
    const sortedPriceData = [...priceData].sort((a, b) => a.time - b.time);
    const priceSeries = chart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
    priceSeries.setData(sortedPriceData);

    // Scale Aroon data relative to price
    const scaledAroonData = scaleAroonData(aroonData, priceData);

    // Add Aroon Up and Aroon Down series
    const sortedAroonData = [...scaledAroonData].sort((a, b) => a.time - b.time);

    const aroonUpSeries = chart.addLineSeries({ 
      color: Constants.GRAPH_AROON_UP_COLOR, 
      lineWidth: 2 
    });
    aroonUpSeries.setData(sortedAroonData.map(d => ({ time: d.time, value: d.aroonUp })));

    const aroonDownSeries = chart.addLineSeries({ 
      color: Constants.GRAPH_AROON_DOWN_COLOR, 
      lineWidth: 2 
    });
    aroonDownSeries.setData(sortedAroonData.map(d => ({ time: d.time, value: d.aroonDown })));

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
  }, [aroonData, priceData]);

  return (
    <div className="indicator-container">
      <CloudBackGround />
      <h2 className="indicator-title">
        {asset}: Aroon Indicator - {timeInterval.toUpperCase()}
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
            <strong>Aroon Indicator: A Trend Strength Tool</strong><br /><br />
            
            The Aroon Indicator is used to identify the strength of a trend and potential trend changes. It consists of two lines: Aroon Up and Aroon Down. Aroon Up measures the strength of the uptrend, while Aroon Down measures the strength of the downtrend.<br /><br />
            
            <strong>How It Works:</strong><br />
            - Aroon Up: Measures the time since the highest price within the period.<br />
            - Aroon Down: Measures the time since the lowest price within the period.<br />
            - The indicator is on a scale from 0% to 100%. Values above 70 indicate a strong trend, while values below 30 indicate a weak trend.<br /><br />
            
            <strong>Interpreting Aroon:</strong>
            <ul>
                <li><span style={{ color: Constants.GRAPH_AROON_UP_COLOR }}>Aroon Up &gt; 70</span>: Strong uptrend.</li>
                <li><span style={{ color: Constants.GRAPH_AROON_DOWN_COLOR }}>Aroon Down &gt; 70</span>: Strong downtrend.</li>
                <li><span>Aroon Up & Aroon Down &lt; 30</span>: Consolidation or weak trend.</li>
                <li><span>Aroon Up crosses above Aroon Down</span>: Potential uptrend.</li>
                <li><span>Aroon Down crosses above Aroon Up</span>: Potential downtrend.</li>
            </ul>

            <strong>Trading Strategy:</strong><br />
            - Buy Signal: Aroon Up crosses above Aroon Down and both are above 50.<br />
            - Sell Signal: Aroon Down crosses above Aroon Up and both are above 50.<br />
            - Trend Confirmation: Use Aroon in conjunction with other indicators like Moving Averages or RSI.<br /><br />

            Use the Aroon Indicator to gauge trend strength and potential reversals, but always confirm with other technical tools!
        </div>
        )}
    </div>
  );
};

export default AroonIndicator;