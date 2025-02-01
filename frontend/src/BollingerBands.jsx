import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import * as Constants from '../constants';
import './App.css';

const BollingerBands = () => {
  useEffect(() => {
    document.title = `Bollinger Bands Chart`;
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

  // Calculate Bollinger Bands using a simple moving average (SMA)
  // period: number of data points (default 20)
  // multiplier: standard deviation multiplier (default 2)
  // TODO: add customization to default values
  const calculateBollingerBands = (data, period = 20, multiplier = 2) => {
    if (data.length < period) return { median: [], upper: [], lower: [] };

    const median = [];
    const upper = [];
    const lower = [];

    for (let i = period - 1; i < data.length; i++) {
      // slice the window data points
      const windowSlice = data.slice(i - period + 1, i + 1);
      
      // calculate simple moving average (SMA)
      const sum = windowSlice.reduce((s, d) => s + d.value, 0);
      const sma = sum / period;
      
      // calculate standard deviation
      const variance = windowSlice.reduce((v, d) => v + Math.pow(d.value - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);
      
      median.push({ time: data[i].time, value: sma });
      upper.push({ time: data[i].time, value: sma + multiplier * stdDev });
      lower.push({ time: data[i].time, value: sma - multiplier * stdDev });
    }

    return { median, upper, lower };
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
        } catch (err) {
          console.error('Error fetching data:', err);
        }
      };
      fetchData();
    }
  }, [asset, timeInterval]);

  useEffect(() => {
    if (!priceData.length) return;

    const chart = createChart(chartContainerRef.current, {
      width: window.innerWidth * 0.8,
      height: window.innerHeight * 0.6,
      layout: { textColor: 'black', backgroundColor: 'white' }
    });
    chartInstance.current = chart;

    const priceSeries = chart.addLineSeries();
    priceSeries.setData(priceData);

    const { median, upper, lower } = calculateBollingerBands(priceData);

    // Median SMA line
    const medianSeries = chart.addLineSeries({ color: 'gray', lineWidth: 2 });
    medianSeries.setData(median);

    // Upper band
    const upperSeries = chart.addLineSeries({ color: 'red', lineWidth: 1 });
    upperSeries.setData(upper);

    // Lower band
    const lowerSeries = chart.addLineSeries({ color: 'red', lineWidth: 1 });
    lowerSeries.setData(lower);

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
    <div className="bollinger-bands-container">
      <h2 className="bollinger-bands-title">
        Bollinger Bands for {asset} - {timeInterval}
      </h2>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default BollingerBands;
