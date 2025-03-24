import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents';
import * as Constants from '../constants';
import './Indicator.css';

const Ichimoku = () => {
  useEffect(() => {
    document.title = `Ichimoku Cloud Chart`;
  }, []);

  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const [priceData, setPriceData] = useState([]);
  const [asset, setAsset] = useState('');
  const [timeInterval, setTimeInterval] = useState('');
  const [isHovered, setIsHovered] = useState(false);

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

  const calculateIchimoku = (data) => {
    const tenkan = []; // Conversion Line
    const kijun = [];  // Base Line
    const senkouA = []; // Leading Span A
    const senkouB = []; // Leading Span B
    const chikou = []; // Lagging Span

    for (let i = 51; i < data.length; i++) {
      // Tenkan-sen: 9-period high + low / 2
      const high9 = Math.max(...data.slice(i - 9, i).map(d => d.value));
      const low9 = Math.min(...data.slice(i - 9, i).map(d => d.value));
      const tenkanSen = (high9 + low9) / 2;

      // Kijun-sen: 26-period high + low / 2
      const high26 = Math.max(...data.slice(i - 26, i).map(d => d.value));
      const low26 = Math.min(...data.slice(i - 26, i).map(d => d.value));
      const kijunSen = (high26 + low26) / 2;

      // Senkou Span A: (Tenkan-sen + Kijun-sen) / 2, shifted 26 periods forward
      const senkouAValue = (tenkanSen + kijunSen) / 2;

      // Senkou Span B: 52-period high + low / 2, shifted 26 periods forward
      const high52 = Math.max(...data.slice(i - 52, i).map(d => d.value));
      const low52 = Math.min(...data.slice(i - 52, i).map(d => d.value));
      const senkouBValue = (high52 + low52) / 2;

      // Chikou Span: The current close, shifted 26 periods back
      const chikouSpan = data[i].value;

      tenkan.push({ time: data[i].time, value: tenkanSen });
      kijun.push({ time: data[i].time, value: kijunSen });
      senkouA.push({ time: data[i].time, value: senkouAValue });
      senkouB.push({ time: data[i].time, value: senkouBValue });
      chikou.push({ time: data[i].time - 26, value: chikouSpan }); // Shift Chikou Span 26 periods back
    }

    return { tenkan, kijun, senkouA, senkouB, chikou };
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

          // Ensure the time is in valid timestamp format
          const formattedData = data.map(d => ({
            ...d,
            time: new Date(d.time).getTime(), // Convert the time string to Unix timestamp (in ms)
          }));

          // Ensure the data is sorted by time in ascending order
          formattedData.sort((a, b) => a.time - b.time);
          
          // Set the data in state
          setPriceData(formattedData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
    }
  }, [asset, timeInterval]);

  useEffect(() => {
    if (priceData.length === 0) return;

    const container = chartContainerRef.current;
    const chartWidth = container.clientWidth;
    const chartHeight = container.clientHeight;

    const chart = createChart(container, {
      width: chartWidth,
      height: chartHeight,
      layout: { textColor: Constants.GRAPH_TEXT_COLOR, background: { type: ColorType.VerticalGradient, topColor: Constants.TOP_COLOR, bottomColor: Constants.BOTTOM_COLOR }},
    });
    chartInstance.current = chart;

    const priceSeries = chart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR }); // A lighter price line color
    priceSeries.setData(priceData);

    // Calculate Ichimoku values
    const ichimokuData = calculateIchimoku(priceData);

    // Adjust the colors to less vibrant shades
    const senkouASeries = chart.addLineSeries({
      color: 'rgb(70, 170, 70)', // Green, less vibrant
      lineWidth: 2,
      visible: true,
    });
    senkouASeries.setData(ichimokuData.senkouA);

    const senkouBSeries = chart.addLineSeries({
      color: 'rgb(170, 70, 70)', // Red, less vibrant
      lineWidth: 2,
      visible: true,
    });
    senkouBSeries.setData(ichimokuData.senkouB);

    const tenkanSeries = chart.addLineSeries({
      color: 'rgb(255, 255, 150)', // Pale Yellow, less vibrant
      lineWidth: 2,
      visible: true,
    });
    tenkanSeries.setData(ichimokuData.tenkan);

    const kijunSeries = chart.addLineSeries({
      color: 'rgb(170, 110, 40)', // Orange, less vibrant
      lineWidth: 2,
      visible: true,
    });
    kijunSeries.setData(ichimokuData.kijun);

    // Adjust Chikou Span so it doesn't overlap with price series
    const chikouSeries = chart.addLineSeries({
      color: 'rgb(120, 50, 180)', // Purple, less vibrant
      lineWidth: 1,
      visible: true,
      style: 0, // Solid line style
      opacity: 0.6, // Make it more subtle
    });
    chikouSeries.setData(ichimokuData.chikou);

    // Create an area series for the Ichimoku Cloud
    const cloudArea = chart.addAreaSeries({
        lineColor: 'rgba(76, 40, 255, 0)',
        topColor: 'rgba(70, 170, 70, 0.2)',
        bottomColor: 'rgba(70, 170, 70, 0.2)',
    });

    const cloudArea2 = chart.addAreaSeries({
        lineColor: 'rgba(76, 40, 255, 0)',
        topColor: 'rgb(170, 70, 70, 0.2)',
        bottomColor: 'rgb(170, 70, 70, 0.2)', // Semi-transparent red for the area between Senkou A and Senkou B
    });
    
    const cloudData = ichimokuData.senkouA.map((item, index) => ({
        time: item.time,
        value: item.value, // Senkou A value (top of the cloud)
    }));

    const cloudData2 = ichimokuData.senkouB.map((item, index) => ({
        time: item.time,
        value: item.value,
    }));
    
    cloudArea.setData(cloudData);
    cloudArea2.setData(cloudData2);

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
    <div className="indicator-container">
      {/* <CloudBackGround/> */}
      <h2 className="indicator-title">
        {asset}: Ichimoku Cloud - {timeInterval.toUpperCase()}
      </h2>
      <div className="chart-container" ref={chartContainerRef} />
      
      {/* Question mark icon at the bottom right corner */}
      <div
        className="question-mark-icon"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        ?
      </div>

      {isHovered && (
        <div className="tooltip-content">
          <div><strong>Ichimoku Cloud Indicator</strong></div>
          <div className="tooltip-text">
            <p>The Ichimoku Cloud is a technical indicator that defines support and resistance, identifies trend direction, gauges momentum, and provides trading signals. It consists of several lines: Tenkan-sen (Conversion Line), Kijun-sen (Base Line), Senkou Span A (Leading Span A), Senkou Span B (Leading Span B), and Chikou Span (Lagging Span).</p>

            <p><strong>Definitions of the Lines:</strong></p>
            <ul>
              <li><strong><span style={{ color: 'rgb(70, 170, 70)' }}>Senkou Span A</span></strong>: Calculated as the average of the <strong>Tenkan-sen</strong> and <strong>Kijun-sen</strong> lines, shifted 26 periods ahead.</li>
              <li><strong><span style={{ color: 'rgb(170, 70, 70)' }}>Senkou Span B</span></strong>: Calculated as the average of the highest high and lowest low over the past 52 periods, shifted 26 periods ahead.</li>
              <li><strong><span style={{ color: 'rgb(120, 50, 180)' }}>Chikou Span</span></strong>: The current closing price (or close), but shifted 26 periods back. This helps identify the relationship between the current price and past prices.</li>
              <li><strong><span style={{ color: 'rgb(255, 255, 150)' }}>Tenkan-sen</span></strong> (Conversion Line): The average of the highest high and lowest low over the past 9 periods.</li>
              <li><strong><span style={{ color: 'rgb(170, 110, 40)' }}>Kijun-sen</span></strong> (Base Line): The average of the highest high and lowest low over the past 26 periods.</li>
            </ul>

            <p><strong>How to Use the Ichimoku Cloud:</strong></p>
            <ul>
              <li><strong>Trend Identification</strong>: If the price is above the cloud, the trend is considered bullish. If it’s below, the trend is bearish. If the price is inside the cloud, the market is neutral.</li>
              <li><strong>Buy/Sell Signals</strong>: A bullish signal occurs when the Tenkan-sen crosses above the Kijun-sen (bullish crossover) and is above the cloud, indicating upward momentum. A bearish signal occurs when the Tenkan-sen crosses below the Kijun-sen (bearish crossover) and is below the cloud, indicating downward momentum.</li>
              <li><strong>Support and Resistance</strong>: The cloud acts as dynamic support and resistance levels.</li>
            </ul>

            <p><strong>Example:</strong> If the price has been consistently above the cloud and the Tenkan-sen crosses above the Kijun-sen, this might indicate a potential buying opportunity. Conversely, if the price is below the cloud and the Tenkan-sen crosses below the Kijun-sen, it might indicate a selling opportunity.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ichimoku;
