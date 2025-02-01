import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import * as Constants from '../constants';
import './App.css';

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

    const chart = createChart(chartContainerRef.current, {
      width: window.innerWidth * 0.8,
      height: window.innerHeight * 0.6,
      layout: { textColor: 'black', backgroundColor: 'white' },
    });
    chartInstance.current = chart;

    const priceSeries = chart.addLineSeries();
    priceSeries.setData(priceData);

    // Calculate the three EMAs: periods 50, 100, and 200
    const ema50 = calculateEMA(priceData, 50);
    const ema100 = calculateEMA(priceData, 100);
    const ema200 = calculateEMA(priceData, 200);

    // Add line series for each EMA with distinct colors
    const ema50Series = chart.addLineSeries({ color: 'red', lineWidth: 2 });
    ema50Series.setData(ema50);

    const ema100Series = chart.addLineSeries({ color: 'blue', lineWidth: 2 });
    ema100Series.setData(ema100);

    const ema200Series = chart.addLineSeries({ color: 'green', lineWidth: 2 });
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

  return (
    <div className="triple-ema-container">
      <h2 className="triple-ema-title">
        Triple EMA for {asset} - {timeInterval}
      </h2>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default TripleEma;
