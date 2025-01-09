import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import './App.css';

const App = () => {
  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const [priceData, setPriceData] = useState([]);

  const calculateEMA = (data, period) => {
    const k = 2 / (period + 1);
    let emaArray = [];
    let prevEma = data[0].value; // Start with the first value
    emaArray.push({ time: data[0].time, value: prevEma });

    for (let i = 1; i < data.length; i++) {
      const ema = data[i].value * k + prevEma * (1 - k);
      emaArray.push({ time: data[i].time, value: ema });
      prevEma = ema;
    }

    return emaArray;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/time_series_monthly/ibm');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();

        // Set the fetched data directly into priceData
        setPriceData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

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

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [priceData]); // Runs whenever priceData updates

  return (
    <div className="chart-container">
      <div ref={chartContainerRef} />
    </div>
  );
};

export default App;
