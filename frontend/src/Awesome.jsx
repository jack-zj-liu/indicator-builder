import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import * as Constants from '../constants';
import './App.css';

const Awesome = () => {
  useEffect(() => {
    document.title = `Awesome Oscillator Chart`;
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

  // Awesome Oscillator (AO)
  // AO = SMA(5) - SMA(34) using price values
  const calculateAO = (data) => {
    const aoData = [];
    for (let i = 33; i < data.length; i++) {
      // Calculate 5-period SMA
      let sum5 = 0;
      for (let j = i - 4; j <= i; j++) {
        sum5 += data[j].value;
      }
      const sma5 = sum5 / 5;

      // Calculate 34-period SMA
      let sum34 = 0;
      for (let j = i - 33; j <= i; j++) {
        sum34 += data[j].value;
      }
      const sma34 = sum34 / 34;

      aoData.push({
        time: data[i].time,
        value: sma5 - sma34
      });
    }
    return aoData;
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

    // Add primary price line series
    const priceSeries = chart.addLineSeries();
    priceSeries.setData(priceData);

    // Calculate AO values
    const aoData = calculateAO(priceData);
    // Format AO data for a histogram series with conditional coloring:
    // Green when AO positive, red when negative.
    const formattedAOData = aoData.map((d) => ({
      time: d.time,
      value: d.value,
      color: d.value >= 0 ? 'green' : 'red'
    }));

    const aoSeries = chart.addHistogramSeries({
      base: 0
    });
    aoSeries.setData(formattedAOData);

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
    <div className="awesome-oscillator-container">
      <h2 className="awesome-oscillator-title">
        Awesome Oscillator for {asset} - {timeInterval}
      </h2>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default Awesome;
