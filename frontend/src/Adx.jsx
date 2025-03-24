import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents';
import * as Constants from '../constants';
import './Indicator.css';

const Adx = () => {
  useEffect(() => {
    document.title = `ADX Chart`;
  }, []);

  const chartContainerRef = useRef(null); // Price chart reference
  const adxChartContainerRef = useRef(null); // ADX chart reference
  const chartInstance = useRef(null);
  const adxChartInstance = useRef(null);  // Reference for ADX chart
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

  const calculateADX = (data, period = 14) => {
    if (data.length < period + 1) return [];

    let tr = [];
    let dmPlus = [];
    let dmMinus = [];

    for (let i = 1; i < data.length; i++) {
      const close = data[i].value;
      const prevClose = data[i - 1].value;

      const trueRange = Math.abs(close - prevClose); // Use absolute change in close as a proxy for TR
      const plusDM = close - prevClose > 0 ? Math.max(close - prevClose, 0) : 0; // Simplified +DM
      const minusDM = prevClose - close > 0 ? Math.max(prevClose - close, 0) : 0; // Simplified -DM

      tr.push(trueRange);
      dmPlus.push(plusDM);
      dmMinus.push(minusDM);
    }

    const smooth = (arr, period) => {
      let smoothed = [];
      let sum = arr.slice(0, period).reduce((a, b) => a + b, 0);
      smoothed.push(sum / period);

      for (let i = period; i < arr.length; i++) {
        sum = sum - arr[i - period] + arr[i];
        smoothed.push(sum / period);
      }
      return smoothed;
    };

    const smoothedTR = smooth(tr, period);
    const smoothedDMPlus = smooth(dmPlus, period);
    const smoothedDMMinus = smooth(dmMinus, period);

    if (smoothedTR.length === 0) return [];

    const diPlus = smoothedDMPlus.map((val, i) => (smoothedTR[i] !== 0 ? (val / smoothedTR[i]) * 100 : 0));
    const diMinus = smoothedDMMinus.map((val, i) => (smoothedTR[i] !== 0 ? (val / smoothedTR[i]) * 100 : 0));

    const dx = diPlus.map((val, i) => (diPlus[i] + diMinus[i] !== 0 ? (Math.abs(val - diMinus[i]) / (diPlus[i] + diMinus[i])) * 100 : 0));

    const adx = smooth(dx, period);

    let adxArray = [];
    for (let i = 0; i < adx.length; i++) {
      const index = i + 2 * period;
      if (index < data.length) {
        adxArray.push({ time: data[index].time, value: adx[i] });
      }
    }

    return adxArray;
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

    // Price chart setup
    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight, // Set the height to half for the price chart
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: { type: ColorType.VerticalGradient, topColor: Constants.TOP_COLOR, bottomColor: Constants.BOTTOM_COLOR },
      },
    });
    chartInstance.current = chart;

    const priceSeries = chart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
    priceSeries.setData(priceData);

    // ADX chart setup
    const adxContainer = adxChartContainerRef.current;
    const adxChart = createChart(adxContainer, {
      width: adxContainer.clientWidth,
      height: adxContainer.clientHeight, // Set a fixed height for ADX chart
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: { type: ColorType.VerticalGradient, topColor: Constants.BOTTOM_COLOR, bottomColor: Constants.BOTTOM_COLOR },
      },
    });
    adxChartInstance.current = adxChart;

    const adxPeriod = 14;
    const adxValues = calculateADX(priceData, adxPeriod);
    const adxSeries = adxChart.addLineSeries({ color: 'red', lineWidth: 3 });
    adxSeries.setData(adxValues);

    const handleResize = () => {
      chart.resize(container.clientWidth, container.clientHeight / 2);  // Resize the price chart
      adxChart.resize(adxContainer.clientWidth, adxContainer.clientHeight); // Resize the ADX chart
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      adxChart.remove();
    };
  }, [priceData]);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="indicator-container">
      {/* <CloudBackGround/> */}
      <h2 className="indicator-title">{asset}: Average Directional Index - {timeInterval.toUpperCase()}</h2>
      
      {/* Price chart container */}
      <div className="price-chart-container" ref={chartContainerRef} />
      
      {/* ADX chart container */}
      <div className="indicator-chart-container" ref={adxChartContainerRef} />

      <div className="question-mark-icon" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>?</div>

      {isHovered && (
        <MathJaxContext>
          <div className="tooltip-content formatted-tooltip">
            The Average Directional Index (ADX) is a key indicator used to measure the strength of a trend in financial markets. It helps traders determine whether an asset is trending strongly or experiencing weak momentum.<br /><br />

            The ADX is calculated using the following steps:<br /><br />
            1. Calculate the True Range (TR), Positive Directional Movement (+DM), and Negative Directional Movement (-DM).<br />
            2. Smooth the values over a given period (typically 14).<br />
            3. Compute the Directional Indicators:<br /><br />

            <MathJax>
              {`\\( DI^+ = \\frac{\\text{Smoothed } +DM}{\\text{Smoothed TR}} \\times 100 \\), \\( DI^- = \\frac{\\text{Smoothed } -DM}{\\text{Smoothed TR}} \\times 100 \\)`}
            </MathJax>
            <br />

            4. Compute the Directional Index (DX):<br />
            <MathJax>
              {`\\( DX = \\frac{|DI^+ - DI^-|}{DI^+ + DI^-} \\times 100 \\)`}
            </MathJax>
            <br />

            5. Smooth DX over the period to get the final ADX:<br />
            <MathJax>
              {`\\( ADX = \\frac{\\sum DX}{N} \\)`}
            </MathJax>
            <br />

            A rising ADX above 25 indicates a strong trend, while a value below 20 suggests a weak or no trend. Traders use ADX to confirm trend strength before entering trades.
          </div>
        </MathJaxContext>
      )}
    </div>
  );
};

export default Adx;
