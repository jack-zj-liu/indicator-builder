import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import * as Constants from '../constants'
import './App.css';

const Macd = () => {
  useEffect(() => {
    document.title = `MACD Chart`;
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
    if (priceData.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width: window.innerWidth * 0.8,
      height: window.innerHeight * 0.6,
      layout: { textColor: 'black', backgroundColor: 'white' },
    });
    chartInstance.current = chart;

    const lineSeries = chart.addLineSeries();
    lineSeries.setData(priceData);

    // Calculate EMA and MACD
    const ema12 = calculateEMA(priceData, 12);
    const ema26 = calculateEMA(priceData, 26);
    const macdLine = ema12.map((point, index) => ({
      time: point.time,
      value: point.value - ema26[index].value,
    }));
    const signalLine = calculateEMA(macdLine, 9);

    // Add a new pane for the MACD
    const macdSeries = chart.addLineSeries({ color: 'blue', lineWidth: 2 });
    const signalSeries = chart.addLineSeries({ color: 'red', lineWidth: 2 });

    macdSeries.setData(macdLine);
    signalSeries.setData(signalLine);

    // Resize the chart on window resize
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
    <div className="macd-container">
      <h2 className="macd-title">MACD for {asset} - {timeInterval}</h2>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default Macd;
