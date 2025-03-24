import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents'
import * as Constants from '../constants';
import './Indicator.css';

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

    const container = chartContainerRef.current;
    const chartWidth = container.clientWidth;
    const chartHeight = container.clientHeight;

    const chart = createChart(container, {
      width: chartWidth,
      height: chartHeight,
      layout: { textColor: Constants.GRAPH_TEXT_COLOR, background: 
        { type: ColorType.VerticalGradient, topColor: Constants.TOP_COLOR, bottomColor: Constants.BOTTOM_COLOR }},
    });
    chartInstance.current = chart;

    const priceSeries = chart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
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

  const [isHovered, setIsHovered] = useState(false);
  
    return (
      <div className="indicator-container">
        {/* <CloudBackGround/> */}
        <h2 className="indicator-title">
          {asset}: Awesome Oscillator - {timeInterval.toUpperCase()}
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
  The Awesome Oscillator (AO) is a momentum-based technical indicator developed by Bill Williams to measure market momentum and identify potential trend reversals. It is designed to compare recent market momentum with a broader historical context, helping traders assess the strength of an ongoing trend. AO is calculated as the difference between a short-term and a long-term simple moving average (SMA) of the median price, displayed as a histogram that fluctuates above and below a zero line. This makes it a valuable tool for traders looking to confirm trends and detect shifts in market sentiment.<br /><br />
  
  Traders use the Awesome Oscillator to identify bullish or bearish momentum, spot trend reversals, and generate trading signals. A positive AO value indicates that short-term momentum is stronger than long-term momentum, signaling a potential uptrend, whereas a negative AO suggests weakening momentum and a possible downtrend. Common trading strategies with AO include the “Saucer” setup, which looks for consecutive green or red bars to confirm momentum shifts, and the “Zero Line Crossover,” where AO crossing above zero suggests a buying opportunity while crossing below zero signals a selling opportunity. Additionally, AO can help traders spot divergences between price movements and momentum, providing early warnings of trend exhaustion.<br /><br />
  
  The Awesome Oscillator is calculated using the difference between a 5-period and a 34-period simple moving average (SMA) of the median price, which is the average of the high and low prices. The resulting values are plotted as a histogram, where green bars indicate rising momentum and red bars indicate falling momentum. Because AO focuses on price momentum rather than absolute price levels, it helps traders identify shifts in market strength, making it a useful confirmation tool when analyzing trends and potential entry or exit points.
          </div>
        )}
      </div>
    );
};

export default Awesome;
