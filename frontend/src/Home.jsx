import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [indicator, setIndicator] = useState('');
  const [asset, setAsset] = useState('IBM');
  const [timeInterval, setTimeInterval] = useState('daily');
  const navigate = useNavigate();

  const handleGenerateUrl = () => {
    let url = '';

    if (indicator === 'MACD') {
      url = `/macd?asset=${asset}&ti=${timeInterval}`;
    } else if (indicator === 'RSI') {
      url = `/rsi?asset=${asset}&ti=${timeInterval}`;
    }

    // Open the URL in a new tab
    window.open(`http://localhost:5173${url}`, '_blank');
  };

  return (
    <div>
      <h1>Welcome to the Indicator Builder</h1>

      <div>
        <label>Select Indicator:</label>
        <select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
          <option value="">Select Indicator</option>
          <option value="MACD">MACD</option>
          <option value="RSI">RSI</option> {/* Add RSI option */}
        </select>
      </div>

      <div>
        <label>Select Asset:</label>
        <select value={asset} onChange={(e) => setAsset(e.target.value)}>
          <option value="IBM">IBM</option>
          <option value="AAPL">AAPL</option>
          <option value="GOOG">GOOG</option>
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
