import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as Constants from "../constants";
import Autocomplete from "./Autocomplete";
import { createChart, ColorType } from "lightweight-charts";
import { WaveBackGround } from './VantaComponents'
import "./Home.css";
import "./App.css"; 

const Home = () => {
  useEffect(() => {
    document.title = `IndicatorBuilder`;
  }, []);
  const [stocks, setStocks] = useState([]);
  const [indicator, setIndicator] = useState("");
  const [asset, setAsset] = useState("SPY");
  const [assets, setAssets] = useState({});
  const [timeInterval, setTimeInterval] = useState("daily");
  const [priceData, setPriceData] = useState([]);
  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const navigate = useNavigate();

  // Fetch stock data
  useEffect(() => {
    // Fetch data from your backend API
    fetch(`${Constants.BACKEND_URL}/get_common_stocks`)
      .then((response) => response.json()) // Parse the JSON response
      .then((data) => {
        console.log(data);
        // Check if 'common_stocks' exists in the response and is an object
        const fetchedStocks = data.common_stocks;
        // Convert the object into an array of stock data
        const stocksArray = Object.entries(fetchedStocks).map(([symbol, stock]) => ({
          symbol,
          ...stock,
        }));
        setStocks(stocksArray); // Set the stocks state to an array
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
      });
  }, []);

  // Existing data fetching for assets and price data
  useEffect(() => {
    if (asset && timeInterval) {
      const fetchData = async () => {
        try {
          const response = await fetch(
            `${Constants.BACKEND_URL}/time_series_${timeInterval.toLowerCase()}/${asset}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch data");
          }
          const data = await response.json();
          setPriceData(data);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };
      fetchData();
    }
  }, [asset, timeInterval]);

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${Constants.BACKEND_URL}/list_assets`);
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      const data = await response.json();
      setAssets(data.assets);
    } catch (error) {
      console.error("Error fetching assets:", error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleGenerateUrl = () => {
    if (indicator) {
      const url = `/${indicator.toLowerCase()}?asset=${asset}&ti=${timeInterval}`;
      window.open(`${Constants.FRONTEND_URL}${url}`, "_blank");
    } else {
      alert("Please select an indicator!");
    }
  };

  useEffect(() => {
    if (!priceData || priceData.length === 0 || !chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const chartWidth = container.clientWidth;
    const chartHeight = container.clientHeight;

    const chart = createChart(container, {
      width: chartWidth,
      height: chartHeight,
      layout: {
        textColor: "#dce0dc",
        background: {
          type: ColorType.VerticalGradient,
          topColor: "#021e5c",
          bottomColor: "#151515",
        },
      },
    });

    chartInstance.current = chart;

    const lineSeries = chart.addLineSeries({ color: "#ffffff" });
    lineSeries.setData(priceData);

    const handleResize = () => {
      if (chartInstance.current) {
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        chartInstance.current.resize(newWidth, newHeight);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartInstance.current) {
        chartInstance.current.remove();
      }
    };
  }, [priceData]);

  return (
    <div className="home-container">
      <WaveBackGround />
      <div className="navbar">
        <img src="/logo_black.png" alt="Logo" className="logo" />
        <h3>Indicator Builder</h3>
      </div>
      <div className="tile top-left">
        <h3>Today at a Glance</h3>
        <div>
          {stocks.map((stock, index) => (
            <div key={index} className="stock-info">
              <p>{stock.ticker} - {stock.full_name}</p>
              <p className={`price ${stock.is_positive ? "" : "negative"}`}>
                {stock.price} ({stock.percent}%)
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className="tile bottom-right">
        <h3 className="indicator-title">{asset} Pricing Information</h3>
        <div className="sample-container" ref={chartContainerRef} />
      </div>
      <div className="tile bottom-left">
        <h3>How It Works</h3>
        <p> 
          Trading indicators are tools used by traders to analyze market data, such as price and volume, in order to identify trends, momentum, volatility, and potential buy or sell signals. Common indicators include Moving Averages, Relative Strength Index, Bollinger Bands, Moving Average Convergence Divergence, and others. These indicators help traders make informed decisions by providing insights into market conditions and potential future price movements.<br/><br/>
          The app generates trading indicators for selected stocks by retrieving historical price data at specified time intervals using APIs like Yahoo Finance. Users can select individual stocks, and the app fetches the relevant price data over a defined period. Based on this data, the app calculates various trading indicators and displays them alongside the stock's price chart. The app helps analyze stock performance through these indicators, helping them identify trends and make data-driven trading decisions.
        </p>
      </div>
      <div className="tile top-right small-height">
        <h3>Select Indicator Details</h3>
        <div className="form-container">
          <div className="dropdown-container">
            <Autocomplete suggestions={assets} setValue={setAsset} />
            <select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
              <option value="">Select Indicator</option>
              <option value="MACD">MACD</option>
              <option value="RSI">RSI</option>
              <option value="TRIPLEEMA">Triple EMA</option>
              <option value="AWESOME">Awesome Oscillator</option>
              <option value="BOLLINGERBANDS">Bollinger Bands</option>
              <option value="STOCHASTICOSCILLATOR">Stochastic Oscillator</option>
              <option value="ICHIMOKUCLOUD">Ichimoku Cloud</option>
              <option value="FIBONACCIRETRACEMENT">Fibonacci Retracement</option>
              <option value="AROONINDICATOR">Aroon Indicator</option>
              <option value="FAIRGAPVALUE">Fair Gap Value</option>
              <option value="SMA">Simple Moving Average</option>
            </select>
            <select value={timeInterval} onChange={(e) => setTimeInterval(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <button onClick={handleGenerateUrl}>Build Indicator!</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
