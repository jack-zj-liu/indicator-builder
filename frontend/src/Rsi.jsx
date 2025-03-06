import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useLocation } from 'react-router-dom';
import * as Constants from '../constants'
import './Indicator.css';

const Rsi = () => {
  useEffect(() => {
    document.title = `RSI Chart`;
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

    const container = chartContainerRef.current;
    const chartWidth = container.clientWidth;
    const chartHeight = container.clientHeight;

    const chart = createChart(container, {
      width: chartWidth,
      height: chartHeight,
      layout: { textColor: '#dce0dc', background: { type: ColorType.VerticalGradient, topColor: '#36004d', bottomColor: '#151515' }},
    });
    chartInstance.current = chart;

    const lineSeries = chart.addLineSeries({ color: '#ffffff' });
    lineSeries.setData(priceData);

    // Calculate EMA and RSI
    const rsiPeriod = 14; // RSI period (you can adjust this)
    const rsiValues = calculateEMA(priceData, rsiPeriod); // For simplicity, using EMA to simulate RSI

    // Add a new pane for the RSI
    const rsiSeries = chart.addLineSeries({ color: 'yellow', lineWidth: 3 });
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

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="indicator-container">
      <h2 className="indicator-title">
        Relative Strength Index for {asset} {timeInterval}
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
        <MathJaxContext>
          <div className="tooltip-content">
          The Relative Strength Index (RSI) is a popular momentum oscillator developed by J. Welles Wilder in 1978 to measure the speed and change of price movements. It is used to identify overbought and oversold conditions in a market, helping traders determine potential reversal points. RSI is displayed as a line graph that oscillates between 0 and 100, with values above 70 typically indicating an overbought market and values below 30 suggesting an oversold market. Due to its effectiveness in identifying momentum shifts, RSI is widely used in stock, forex, and cryptocurrency trading.<br /><br />
          Traders use RSI to gauge market momentum, confirm trends, and generate buy or sell signals. When RSI rises above 70, it suggests that an asset may be overbought and due for a price correction, while an RSI below 30 indicates oversold conditions, potentially signaling a buying opportunity. Divergences between RSI and price action can also provide valuable insights; for example, if the price makes a new high while RSI does not, it may indicate weakening momentum and a potential trend reversal. Additionally, traders use RSI in conjunction with moving averages or trendlines to confirm signals and refine trading strategies.<br /><br />
          RSI is calculated using the formula:<br /><br />
          <MathJax>
            {`\\( RSI = 100 - \\left( \\frac{100}{1 + RS} \\right) \\)`}
          </MathJax>
          <br />
          where RS (Relative Strength) is the ratio of the average gain to the average loss over a specified period, typically 14 periods. The average gain is determined by summing all positive price changes over the period and dividing by 14, while the average loss is calculated similarly using negative price changes. To smooth the calculation, Wilder suggested using an exponential moving average for both gains and losses. The RSI value fluctuates between 0 and 100, with extreme readings indicating potential overbought or oversold conditions. Because RSI adapts to price movements, it provides traders with a dynamic measure of momentum, making it a useful tool for identifying trend strength and potential market reversals.
          </div>
        </MathJaxContext>
      )}
    </div>
  );
};

export default Rsi;
