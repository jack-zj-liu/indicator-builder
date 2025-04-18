import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useLocation } from 'react-router-dom';
import { CloudBackGround } from './VantaComponents';
import * as Constants from '../constants';
import './Indicator.css';

const Cci = () => {
  useEffect(() => {
    document.title = `CCI Chart`;
  }, []);

  const chartContainerRef = useRef(null);
  const cciChartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const cciChartInstance = useRef(null);
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

  // Calculate the Simple Moving Average (SMA)
  const calculateSMA = (data, period) => {
    let smaArray = [];
    for (let i = 0; i <= data.length - period; i++) {
      const slice = data.slice(i, i + period);
      const sum = slice.reduce((acc, point) => acc + point.value, 0);
      smaArray.push({ time: data[i + period - 1].time, value: sum / period });
    }
    return smaArray;
  };

  // Calculate the Mean Deviation (MD)
  const calculateMD = (data, sma, period) => {
    let mdArray = [];
    for (let i = 0; i <= data.length - period; i++) {
      const slice = data.slice(i, i + period);
      const smaValue = sma[i].value;
      const md = slice.reduce((acc, point) => acc + Math.abs(point.value - smaValue), 0) / period;
      mdArray.push({ time: data[i + period - 1].time, value: md });
    }
    return mdArray;
  };

  // Calculate the CCI
  const calculateCCI = (data, period) => {
    const sma = calculateSMA(data, period);
    const md = calculateMD(data, sma, period);
    const cci = data.slice(period - 1).map((point, index) => {
      const smaValue = sma[index];
      const mdValue = md[index];
      const cciValue = (point.value - smaValue.value) / (0.015 * mdValue.value);
      return { time: point.time, value: cciValue };
    });

    return cci;
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

    // Price chart
    const container = chartContainerRef.current;
    const chartWidth = container.clientWidth;
    const chartHeight = container.clientHeight;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: {
          type: ColorType.VerticalGradient,
          topColor: Constants.TOP_COLOR,
          bottomColor: Constants.BOTTOM_COLOR,
        },
      },
    });
    chartInstance.current = chart;

    const priceSeries = chart.addLineSeries({ color: Constants.GRAPH_PRICE_COLOR });
    priceSeries.setData(priceData);

    // CCI chart
    const cciContainer = cciChartContainerRef.current;
    const cciChart = createChart(cciContainer, {
      width: cciContainer.clientWidth,
      height: cciContainer.clientHeight,  // Make the CCI chart smaller
      layout: {
        textColor: Constants.GRAPH_TEXT_COLOR,
        background: {
          type: ColorType.VerticalGradient,
          topColor: Constants.BOTTOM_COLOR,
          bottomColor: Constants.BOTTOM_COLOR,
        },
      },
    });
    cciChartInstance.current = cciChart;

    const cciPeriod = 14; // CCI period (can be adjusted)
    const cciValues = calculateCCI(priceData, cciPeriod);

    // Create the CCI series
    const cciSeries = cciChart.addLineSeries({ color: 'red', lineWidth: 3 });
    cciSeries.setData(cciValues);

    // Resize the chart on window resize
    const handleResize = () => {
      const width = window.innerWidth * 0.8;
      const height = window.innerHeight * 0.6;
      chart.resize(width, height);
      cciChart.resize(width, height / 3);  // Resize the CCI chart separately
    };
    window.addEventListener('resize', handleResize);

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      cciChart.remove();
    };
  }, [priceData]);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="indicator-container">
      {/* <CloudBackGround/> */}
      <h2 className="indicator-title">
        {asset}: Commodity Channel Index (CCI) - {timeInterval.toUpperCase()}
      </h2>
      <div className="price-chart-container" ref={chartContainerRef} />

      {/* CCI Chart below the price chart */}
      <div className="indicator-chart-container" ref={cciChartContainerRef} />

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
            The Commodity Channel Index (CCI) is a versatile indicator that can be used to identify cyclical trends in a market. CCI measures the deviation of the price from its average, and it is typically used to find overbought and oversold conditions.<br /><br />
            CCI is calculated using the formula:<br /><br />
            <MathJax>
              {`\\( CCI = \\frac{(Price - SMA)}{0.015 * MD} \\)`}
            </MathJax>
            <br />
            where Price is the current price, SMA is the Simple Moving Average, and MD is the Mean Deviation.<br /><br />
            A CCI value above +100 indicates that the price is above the average, suggesting an overbought condition, while a value below -100 indicates an oversold condition.<br /><br />
            Traders use CCI to identify trend reversals and confirm trends. Positive CCI values suggest a strong uptrend, while negative values indicate a potential downtrend.
          </div>
        </MathJaxContext>
      )}
    </div>
  );
};

export default Cci;
