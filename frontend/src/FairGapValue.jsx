import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents';
import * as Constants from '../constants';
import './Indicator.css';

const FairGapValue = () => {
  useEffect(() => {
    document.title = `Fair Gap Value Chart`;
  }, []);

  const chartContainerRef = useRef(null); // Price chart container
  const gapChartContainerRef = useRef(null); // Fair Gap Value chart container
  const chartInstance = useRef(null);
  const gapChartInstance = useRef(null);
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

  const calculateFairGap = (data) => {
    if (data.length === 0) return [];

    const sortedData = [...data].sort((a, b) => a.time - b.time);
    const maxPrice = Math.max(...sortedData.map(d => d.value)); // Get the maximum price value

    // Calculate the gaps
    const gaps = sortedData.map((d, index) => {
      if (index === 0) return null; // Skip first data point as there is no previous point to calculate a gap
      const gap = d.value - sortedData[index - 1].value;
      return { time: d.time, value: gap };
    }).filter(gap => gap !== null);

    // Find the largest gap value
    const maxGap = Math.max(...gaps.map(gap => Math.abs(gap.value)));

    // Scale the gaps so that the largest gap is 1/3 of the max price
    const scaleFactor = maxPrice / 3 / maxGap;

    // Apply scaling to each gap value
    const scaledGaps = gaps.map(gap => ({
      time: gap.time,
      value: gap.value * scaleFactor,
    }));

    return scaledGaps;
  };

  useEffect(() => {
    if (priceData.length === 0) return;

    const priceContainer = chartContainerRef.current;
    const gapContainer = gapChartContainerRef.current;

    // Price Chart
    const priceChart = createChart(priceContainer, {
      width: priceContainer.clientWidth,
      height: priceContainer.clientHeight,
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: {
          type: ColorType.VerticalGradient,
          topColor: Constants.TOP_COLOR,
          bottomColor: Constants.BOTTOM_COLOR,
        },
      },
    });
    chartInstance.current = priceChart;

    const sortedPriceData = [...priceData].sort((a, b) => a.time - b.time);
    const priceSeries = priceChart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
    priceSeries.setData(sortedPriceData);

    // Fair Gap Value Chart
    const gapChart = createChart(gapContainer, {
      width: gapContainer.clientWidth,
      height: gapContainer.clientHeight,
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: {
          type: ColorType.VerticalGradient,
          topColor: Constants.BOTTOM_COLOR,
          bottomColor: Constants.BOTTOM_COLOR,
        },
      },
    });
    gapChartInstance.current = gapChart;

    const gaps = calculateFairGap(sortedPriceData);

    // Create an array of points with colors based on gap value (green if positive, red if negative)
    const gapSeriesData = gaps.map((gap, index) => {
      const color = gap.value > 0 ? 'green' : 'red'; // Green if gap is positive, red if negative
      return {
        time: gap.time,
        value: gap.value,
        color,
      };
    });

    const gapSeries = gapChart.addLineSeries({
      lineWidth: 2,
    });

    gapSeries.setData(gapSeriesData);

    const handleResize = () => {
      const priceWidth = priceContainer.clientWidth;
      const priceHeight = priceContainer.clientHeight;
      priceChart.resize(priceWidth, priceHeight);

      const gapWidth = gapContainer.clientWidth;
      const gapHeight = gapContainer.clientHeight;
      gapChart.resize(gapWidth, gapHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      priceChart.remove();
      gapChart.remove();
    };
  }, [priceData]);

  return (
    <div className="indicator-container">
      <CloudBackGround />
      <h2 className="indicator-title">
        {asset}: Fair Gap Value - {timeInterval.toUpperCase()}
      </h2>
      <div className="price-chart-container" ref={chartContainerRef} /> {/* Price Chart */}
      <div className="indicator-chart-container" ref={gapChartContainerRef} /> {/* Fair Gap Value Chart */}

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
          The Fair Gap Value indicator identifies the difference in price between consecutive data points, such as the current and previous prices. This gap can indicate significant movements in the asset price, which might be used for identifying potential reversals or trends.<br /><br />
          The Fair Gap Value is calculated as the difference between the current price and the previous price. A large gap can suggest a change in the market sentiment, while a small gap may indicate stability.<br /><br />

          <strong>Gap Analysis:</strong>
          <ul>
            <li><span style={{ color: 'green' }}> Positive Gap: The current price is higher than the previous price, indicating upward momentum.</span></li>
            <li><span style={{ color: 'red' }}> Negative Gap: The current price is lower than the previous price, indicating downward momentum.</span></li>
          </ul>

          <strong>Trading Strategy:</strong><br />
          Buy Signal: If a large negative gap occurs, consider it as a potential buying opportunity (reversal).<br />
          Sell Signal: If a large positive gap occurs, consider it as a potential selling opportunity (reversal).<br />
          Stop-Loss Placement: Traders may use the gap as a reference for placing stop-loss orders.
        </div>
      )}
    </div>
  );
};

export default FairGapValue;
