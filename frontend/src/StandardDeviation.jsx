import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents';
import * as Constants from '../constants';
import './Indicator.css';

const StdDev = () => {
  useEffect(() => {
    document.title = `Standard Deviation Chart`;
  }, []);

  const chartContainerRef = useRef(null);
  const stdDevChartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const stdDevChartInstance = useRef(null);
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

  // Function to calculate Standard Deviation for a given period
  const calculateStdDev = (data, period) => {
    let stdDevArray = [];

    // Loop over the data to calculate standard deviation for each period
    for (let i = period - 1; i < data.length; i++) {
      const periodData = data.slice(i - period + 1, i + 1);
      const values = periodData.map(d => d.value);

      const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
      const stdDev = Math.sqrt(variance);

      stdDevArray.push({
        time: data[i].time,
        value: stdDev
      });
    }

    return stdDevArray;
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

    const priceContainer = chartContainerRef.current;
    const stdDevContainer = stdDevChartContainerRef.current;

    // Main Price Chart
    const priceChart = createChart(priceContainer, {
      width: priceContainer.clientWidth,
      height: priceContainer.clientHeight,
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: { type: ColorType.VerticalGradient, topColor: Constants.TOP_COLOR, bottomColor: Constants.BOTTOM_COLOR }
      },
    });
    chartInstance.current = priceChart;

    const priceSeries = priceChart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
    priceSeries.setData(priceData);

    // Standard Deviation Chart (below the price chart)
    const stdDevChart = createChart(stdDevContainer, {
      width: stdDevContainer.clientWidth,
      height: stdDevContainer.clientHeight,
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: { type: ColorType.VerticalGradient, topColor: Constants.BOTTOM_COLOR, bottomColor: Constants.BOTTOM_COLOR }
      },
    });
    stdDevChartInstance.current = stdDevChart;

    // Calculate Standard Deviation with a period of 14 (adjustable)
    const stdDevPeriod = 14;
    const stdDevValues = calculateStdDev(priceData, stdDevPeriod);

    const stdDevSeries = stdDevChart.addLineSeries({ color: 'red', lineWidth: 3 });
    stdDevSeries.setData(stdDevValues);

    // Resize the charts on window resize
    const handleResize = () => {
      const priceWidth = priceContainer.clientWidth;
      const priceHeight = priceContainer.clientHeight;
      priceChart.resize(priceWidth, priceHeight);

      const stdDevWidth = stdDevContainer.clientWidth;
      const stdDevHeight = stdDevContainer.clientHeight;
      stdDevChart.resize(stdDevWidth, stdDevHeight);
    };

    window.addEventListener('resize', handleResize);

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      priceChart.remove();
      stdDevChart.remove();
    };
  }, [priceData]);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="indicator-container">
      <CloudBackGround />
      <h2 className="indicator-title">
        {asset}: Standard Deviation - {timeInterval.toUpperCase()}
      </h2>
      <div className="price-chart-container" ref={chartContainerRef} /> {/* Price Chart */}
      <div className="indicator-chart-container" ref={stdDevChartContainerRef} /> {/* Standard Deviation Chart */}

      {/* Question mark icon at the bottom right corner */}
      <div
        className="question-mark-icon"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        ?
      </div>

      {isHovered && (
        <MathJaxContext>
          <div className="tooltip-content">
            Standard deviation is a measure of the amount of variation or dispersion in a set of data. 
            It provides an indication of how spread out the data points are around the mean (average) value.
            In trading, standard deviation is often used to measure market volatility. A higher standard deviation indicates greater price variability, while a lower standard deviation indicates more stability.
            <br /><br />
            Standard deviation is calculated using the formula:
            <MathJax>
              {`\\( \\sigma = \\sqrt{ \\frac{1}{n} \\sum_{i=1}^{n} (x_i - \\mu)^2 } \\)`}
            </MathJax>
            <br />
            where:
            - \( x_i \) is each individual value in the data set,
            - \( \mu \) is the mean of the data set,
            - \( n \) is the number of data points in the set.
            <br /><br />
            In trading, a higher standard deviation often signals higher volatility, and a lower value indicates that the price is more stable.
          </div>
        </MathJaxContext>
      )}
    </div>
  );
};

export default StdDev;
