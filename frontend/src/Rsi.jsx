import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import './App.css';

const Rsi = () => {
  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const [priceData, setPriceData] = useState([]);
  const [asset, setAsset] = useState('');
  const [timeInterval, setTimeInterval] = useState('');

  const location = useLocation();

  // Function to parse the query parameters
  const getQueryParams = () => {
    const queryParams = new URLSearchParams(location.search);
    const assetParam = queryParams.get('asset');
    const tiParam = queryParams.get('ti');
    setAsset(assetParam);
    setTimeInterval(tiParam);
  };

  useEffect(() => {
    getQueryParams();
  }, [location.search]); // Runs when the URL changes

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
          const response = await fetch(`http://127.0.0.1:8000/time_series_monthly/${asset}`);
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

    const lineSeries = chart.addLineSeries();
    lineSeries.setData(priceData);

    // Calculate EMA and RSI
    const rsiPeriod = 14; // RSI period (you can adjust this)
    const rsiValues = calculateEMA(priceData, rsiPeriod); // For simplicity, using EMA to simulate RSI

    // Add a new pane for the RSI
    const rsiSeries = chart.addLineSeries({ color: 'green', lineWidth: 2 });
    rsiSeries.setData(rsiValues);

    // Resize the chart on window resize
    const handleResize = () => {
      const width = window.innerWidth * 0.8;
      const height = window.innerHeight * 0.6;
      chart.resize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [priceData]);

  return (
    <div className="rsi-container">
      <h2 className="rsi-title">RSI for {asset} - {timeInterval}</h2>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default Rsi;
