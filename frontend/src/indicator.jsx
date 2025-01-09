import React, { useState, useEffect } from 'react';
import './Indicator.css';

const Indicator = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data for the selected indicator, asset, and time interval.
    // For example, based on URL params, you could fetch corresponding data
    const fetchData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const asset = urlParams.get('asset');
      const indicator = urlParams.get('indicator');
      const ti = urlParams.get('ti');

      // Example API call (you can replace it with your actual API endpoint)
      try {
        const response = await fetch(`http://127.0.0.1:8000/data?asset=${asset}&indicator=${indicator}&ti=${ti}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="indicator-container">
      <h1>Indicator Data</h1>
      {data ? (
        <div className="indicator-data">
          <p>Asset: {data.asset}</p>
          <p>Indicator: {data.indicator}</p>
          <p>Time Interval: {data.timeInterval}</p>
          {/* Display the actual data here */}
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
};

export default Indicator;
