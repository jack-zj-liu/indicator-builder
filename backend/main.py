from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
import requests
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import os

import constants


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[constants.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/time_series_daily/{symbol}")
async def get_time_series_daily(symbol):
    ticker = yf.Ticker(symbol)

    data = ticker.history(period='max', interval='1d').Close
    formatted_data = [
        {"time": pd.Timestamp(date).strftime('%Y-%m-%d'), "value": round(value, 2)}
        for date, value in data.items()
    ]

    return formatted_data


@app.get("/time_series_weekly/{symbol}")
async def get_time_series_weekly(symbol):
    ticker = yf.Ticker(symbol)

    data = ticker.history(period='max', interval='1wk').Close
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


@app.get("/list_assets")
async def list_assets():
    if not os.path.exists(constants.ASSETS_FILE_PATH):
        raise HTTPException(status_code=404, detail="Assets file not found")
    
    try:
        assets_map = {}
        with open(constants.ASSETS_FILE_PATH, "r") as file:
            for line in file:
                line = line.strip()
                if line:
                    parts = line.split(": ", 1)
                    if len(parts) == 2:
                        symbol = parts[0].strip()
                        assets_map[symbol] = line
        
        return JSONResponse(content={"assets": assets_map})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading assets file: {str(e)}")

