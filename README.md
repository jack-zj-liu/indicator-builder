# Indicator Builder

**Indicator Builder** project for Waterloo Software Engineering Capstone 2025.

---

The currently implemented indicators include:

- **MACD (Moving Average Convergence Divergence):**  
  A momentum oscillator that compares two exponential moving averages (typically the 12-day and 26-day EMAs) to reveal changes in a trend’s strength, direction, momentum, and duration. It also computes a signal line (usually a 9-day EMA of the MACD) to aid in generating buy or sell signals.

- **RSI (Relative Strength Index):**  
  A momentum oscillator that measures the velocity and magnitude of price movements on a scale from 0 to 100. It is frequently used to identify overbought conditions (typically above 70) or oversold conditions (typically below 30), helping traders spot potential reversals.

- **Triple EMA (Triple Exponential Moving Average):**  
  A trend indicator that employs three consecutive EMAs to smooth price data more effectively and reduce lag. It enhances trend detection by weighting recent price data more heavily compared to traditional single-period EMAs.

- **Awesome Oscillator:**  
  Developed by Bill Williams, this indicator measures market momentum by calculating the difference between a 5-period and a 34-period simple moving average of the price midpoints (high plus low divided by two). The histogram visualization helps signal potential trend reversals or confirm ongoing trends.

- **Bollinger Bands:**  
  A volatility indicator that plots a simple moving average (SMA) along with an upper and lower band at a specified number of standard deviations (commonly 2) from the SMA. These bands widen during periods of high volatility and contract during low volatility, providing insights into potential overbought or oversold price levels.

---

## Setup Instructions

### Frontend

The frontend is built using **ReactJS**, managed with **NPM**.

To launch a development instance, run:  
```bash
npm run dev
```
If you encounter any issues, try installing the dependencies first:
```bash
npm i
```

### Backend
The backend is built with Python's FastAPI and uses `yfinance` to retrieve data. It's recommended to use a virtual environment (venv) for package management.
Set up the virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate
```
Install the required packages:
```bash
pip install "fastapi[standard]"
pip install yfinance --upgrade --no-cache-dir
pip install pandas
```
Install Redis (optional, for caching pricing data):
```bash
pip install redis
sudo ./redis-setup.sh
```
Start the backend:
```bash
source .venv/bin/activate
fastapi dev main.py
```

Replace main.py with the name of your main backend script if it's different.

### Notes
- The frontend and backend must run concurrently for the application to function as expected.
- Ensure CORS is properly configured in your FastAPI backend if you're running the frontend on a separate domain or port.

