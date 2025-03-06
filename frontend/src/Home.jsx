import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as Constants from "../constants";
import Autocomplete from "./Autocomplete";
import { createChart, ColorType } from "lightweight-charts";
import "./Home.css";
import "./App.css";

// Placeholder function: Replace with actual implementation
const calculateEMA = (data, period) => {
  return data.map((point) => ({ time: point.time, value: point.value }));
};

const Home = () => {
  useEffect(() => {
    document.title = "Indicator Builder";
  }, []);

  const [indicator, setIndicator] = useState("");
  const [asset, setAsset] = useState("NVDA");
  const [assets, setAssets] = useState({});
  const [timeInterval, setTimeInterval] = useState("daily");
  const [priceData, setPriceData] = useState([]);
  const chartContainerRef = useRef(null);
  const chartInstance = useRef(null);
  const navigate = useNavigate();

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
      const firstKey = Object.keys(data.assets)[0];
      setAsset(firstKey);
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
          topColor: "#36004d",
          bottomColor: "#151515",
        },
      },
    });

    chartInstance.current = chart;

    const lineSeries = chart.addLineSeries({ color: "#ffffff" });
    lineSeries.setData(priceData);

    const ema12 = calculateEMA(priceData, 12);
    const ema26 = calculateEMA(priceData, 26);
    const macdLine = ema12.map((point, index) => ({
      time: point.time,
      value: point.value - ema26[index]?.value || 0,
    }));
    const signalLine = calculateEMA(macdLine, 9);

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
      {/* Navbar */}
      <div className="navbar">TraderHub</div>

      {/* Top Left: Title */}
      <div className="tile top-left">
        <h1>Welcome to the Indicator Builder</h1>
        <p>Build and analyze technical indicators for different assets with ease.</p>
      </div>

      {/* Top Right: NVDA Price */}
      <div className="tile top-right">
        <h2 className="indicator-title">
          {asset} Pricing Data
        </h2>
        <div className="sample-container" ref={chartContainerRef} />
      </div>

      {/* Bottom Left: Additional Info Placeholder */}
      <div className="tile bottom-left">
        <h2>How It Works</h2>
        <p>Select an indicator, choose an asset, and pick a time interval to analyze.</p>
      </div>

      {/* Bottom Right: Existing Form */}
      <div className="tile bottom-right">
        <div className="form-container">
          <div className="dropdown-container">
            <select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
              <option value="">Select Indicator</option>
              <option value="MACD">MACD</option>
              <option value="RSI">RSI</option>
              <option value="TRIPLEEMA">Triple EMA</option>
              <option value="AWESOME">Awesome Oscillator</option>
              <option value="BOLLINGERBANDS">Bollinger Bands</option>
            </select>

            <Autocomplete suggestions={assets} setValue={setAsset} />

            <select value={timeInterval} onChange={(e) => setTimeInterval(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <button onClick={handleGenerateUrl}>Generate URL</button>
        </div>
      </div>
    </div>
  );
};

export default Home;
