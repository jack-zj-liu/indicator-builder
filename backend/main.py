# main.py

from fastapi import FastAPI
import requests
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Replace with your frontend's URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

APIKEY = 'V4AWGG4Y2EOQ7SES'

@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/time_series_daily/{symbol}")
async def get_time_series_daily(symbol):
    ticker = yf.Ticker(symbol)

    data = ticker.history(period='5y', interval='1d').Close
    formatted_data = [
        {"time": pd.Timestamp(date).strftime('%Y-%m-%d'), "value": round(value, 2)}
        for date, value in data.items()
    ]

    return formatted_data


@app.get("/time_series_weekly/{symbol}")
async def get_time_series_weekly(symbol):
    ticker = yf.Ticker(symbol)

    data = ticker.history(period='10y', interval='1wk').Close
    formatted_data = [
        {"time": pd.Timestamp(date).strftime('%Y-%m-%d'), "value": round(value, 2)}
        for date, value in data.items()
    ]

    return formatted_data


@app.get("/time_series_monthly/{symbol}")
async def get_time_series_monthly(symbol):
    ticker = yf.Ticker(symbol)

    data = ticker.history(period='max', interval='1mo').Close
    formatted_data = [
        {"time": pd.Timestamp(date).strftime('%Y-%m-%d'), "value": round(value, 2)}
        for date, value in data.items()
    ]

    return formatted_data
