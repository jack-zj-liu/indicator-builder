import { useState } from "react";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TextField } from "@mui/material";
import dayjs from "dayjs";
import * as Constants from '../constants';
import './Backtest.css';

export default function Backtest_result({type, asset}) {
  const [startDate, setStartDate] = useState(dayjs().subtract(10, 'year'));
  const [endDate, setEndDate] = useState(dayjs());
  const [iframeSrc, setIframeSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [shorter, setShorter] = useState(10);
  const [longer, setLonger] = useState(25);
  const [commission, setCommission] = useState(0.002);

  const fetchHtml = async () => {
    setLoading(true); // Start loading
    try {
      const url = `${Constants.BACKEND_URL}/backtest/${type}/${asset}?` + new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
          short: shorter,
          long: longer,
          commission: commission
      }).toString();
      const response = await fetch(url);
      const htmlText = await response.text();
      
      // Create a Blob URL for the HTML content
      const blob = new Blob([htmlText], { type: "text/html" });
      const blobUrl = URL.createObjectURL(blob);
      
      setIframeSrc(blobUrl);
    } catch (error) {
      console.error("Error fetching HTML:", error);
    }
    setLoading(false); // Stop loading
  };

  const addRate = (num) => {
    if (typeof num !== "number" || isNaN(num) || num > 1) {
      setCommission(0);
    } else {
      setCommission(num);
    }
  };

  const shortPeriod = (num) => {
    if (typeof num !== "number" || isNaN(num)) {
      setShorter(0);
    } else {
      setShorter(num);
    }
  };

  const longPeriod = (num) => {
    if (typeof num !== "number" || isNaN(num)) {
      setLonger(0);
    } else {
      setLonger(num);
    }
  };

  return (
  <div className="backtest-container">
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label="Start Date"
        value={startDate}
        onChange={(newValue) => {
          setStartDate(newValue);
          if (endDate && newValue && dayjs(newValue).isAfter(endDate)) {
            setEndDate(null); // Reset end date if invalid
          }
        }}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />

      <DatePicker
        label="End Date"
        value={endDate}
        onChange={(newValue) => setEndDate(newValue)}
        shouldDisableDate={(date) => startDate && dayjs(date).isBefore(startDate)}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
    </LocalizationProvider>
    <TextField
      type="number"
      label="Commission"
      value={commission}
      inputProps={{
        maxLength: 5,
        step: "0.001"
      }}
      onChange={(e) => addRate(parseFloat(e.target.value))}
    />
    <TextField
      type="number"
      label="Shorter period"
      value={shorter}
      inputProps={{
        maxLength: 5,
        step: "1"
      }}
      onChange={(e) => shortPeriod(parseInt(e.target.value))}
    />
    <TextField
      type="number"
      label="Longer period"
      value={longer}
      inputProps={{
        maxLength: 5,
        step: "1"
      }}
      onChange={(e) => longPeriod(parseInt(e.target.value))}
    />
    <button
      onClick={fetchHtml}
      className="backtest-run-button"
      disabled={loading || startDate === null || endDate === null}
    >
      {loading ? "Running..." : "Start Backtest"}
    </button> <br/>
    <div className="backtest-results-container">
      {loading && <p className="mt-2 text-gray-500">Running Backtest...</p>}

      {iframeSrc && !loading && (
        <iframe
          src={iframeSrc}
          title="Backtest Results"
          className="backtest-results-iframe"
        />
      )}
    </div>
  </div>
  );
};
