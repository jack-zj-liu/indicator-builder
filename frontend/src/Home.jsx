import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Constants from '../constants'

const Home = () => {
  useEffect(() => {
    document.title = "Indicator Builder";
  }, []);

  const [indicator, setIndicator] = useState('');
  const [asset, setAsset] = useState('');
  const [assets, setAssets] = useState({});
  const [timeInterval, setTimeInterval] = useState('daily');
  const navigate = useNavigate();

  const fetchAssets = async () => {
    try {
      const response = await fetch(`${Constants.BACKEND_URL}/list_assets`);
      if (!response.ok) {
        throw new Error('Failed to fetch assets');
      }
      const data = await response.json();
      setAssets(data.assets); 
      const firstKey = Object.keys(data.assets)[0];
      setAsset(firstKey);
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleGenerateUrl = () => {
    if (indicator) {
      const url = `/${indicator.toLowerCase()}?asset=${asset}&ti=${timeInterval}`;
      window.open(`${Constants.FRONTEND_URL}${url}`, '_blank');
    } else {
      alert('Please select an indicator!');
    }
  };
  

  return (
    <div>
      <h1>Welcome to the Indicator Builder</h1>

      <div>
        <label>Select Indicator:</label>
        <select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
          <option value="">Select Indicator</option>
          <option value="MACD">MACD</option>
          <option value="RSI">RSI</option>
        </select>
      </div>

      <div>
        <label>Select Asset:</label>
        <select value={asset} onChange={(e) => setAsset(e.target.value)}>
          <option value="">Select Asset</option>
          {Object.entries(assets).map(([key, value]) => (
            <option key={key} value={key}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Select Time Interval:</label>
        <select value={timeInterval} onChange={(e) => setTimeInterval(e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <button onClick={handleGenerateUrl}>Generate URL</button>
    </div>
  );
};

export default Home;
