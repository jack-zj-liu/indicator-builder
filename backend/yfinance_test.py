import yfinance as yf
import pandas as pd


ticker = yf.Ticker("msft")

# print(type(msft.history(period='1mo').Close))
data = ticker.history(period='5y', interval='1mo').Close
# print(data)
# Convert the Series into the desired format
formatted_data = [
    {"time": pd.Timestamp(date).strftime('%Y-%m-%d'), "value": round(value, 2)}
    for date, value in data.items()
]

# Output the result
print(formatted_data)
