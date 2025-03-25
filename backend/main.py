from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
import requests
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import os
import logging
import uvicorn
import json

from backtest import Backtest, SmaCross, SmaPullbackStrategy

import constants
try:
    import redis
    r = redis.Redis(host=constants.REDIS_HOST, port=constants.REDIS_PORT, decode_responses=True)
    REDIS_EXPIRY = 60 * 30 # 30 minutes (arbitrary idk)
    r.ping()
    redis_available = True
except:
    redis_available = False


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[constants.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
LOG = logging.getLogger('uvicorn.error')
LOG.setLevel(logging.DEBUG)


@app.get("/")
async def root():
    return {"message": "Hello World"}


def insert_redis_data(redis_name, data):
    # serialize each dict as a string and insert into redis
    redis_entry = data
    r.rpush(redis_name, redis_entry)
    r.expire(redis_name, REDIS_EXPIRY)

def get_series_data_redis(symbol, interval, background_tasks: BackgroundTasks):
    ticker = yf.Ticker(symbol)
    redis_name = ':'.join([symbol, interval])

    # load data from redis if exists
    if r.exists(redis_name):
        data = pd.read_json(r.lindex(redis_name, 0))
        data = data.Close
        formatted_data = [
            {"time": pd.Timestamp(date).strftime('%Y-%m-%d'), "value": round(value, 2)}
            for date, value in data.items()
        ]
        formatted_data = list(map(json.loads, r.lrange(redis_name, 0, -1)))
    else:
        data = ticker.history(period='max', interval=interval)
        data_redis = data.to_json()
        data = data.Close
        formatted_data = [
            {"time": pd.Timestamp(date).strftime('%Y-%m-%d'), "value": round(value, 2)}
            for date, value in data.items()
        ]
        # do redis insert in background cus it might take a bit
        background_tasks.add_task(insert_redis_data, redis_name, data_redis)

    return formatted_data

def get_series_data(symbol, interval):
    ticker = yf.Ticker(symbol)
    data = ticker.history(period='max', interval=interval)
    data = data.Close
    formatted_data = [
        {"time": pd.Timestamp(date).strftime('%Y-%m-%d'), "value": round(value, 2)}
        for date, value in data.items()
    ]

    return formatted_data

def get_backtest_data(symbol):
    ticker = yf.Ticker(symbol)
    redis_name = ':'.join([symbol, "1d"])

    if redis_available and r.exists(redis_name):
        data = pd.read_json(r.lindex(redis_name, 0))
    else:
        data = ticker.history(period='max', interval="1d")
    return data


@app.get("/backtest/SMA_crossover/{symbol}")
async def get_backtest_results(symbol: str, start_date: str, end_date: str, short: int, long: int, commission: float):
    data = get_backtest_data(symbol)
    filtered_data = data[(data.index >= start_date) & (data.index <= end_date)]
    bt = Backtest(filtered_data, SmaCross, commission=commission, margin=0.5)
    bt.run(n1=short, n2=long)
    fname = f'SmaCross-{symbol}.html'
    bt.plot(filename=fname, plot_volume=False, superimpose=False, open_browser=False)
    HtmlFile = open(fname, 'r', encoding='utf-8')
    plot = HtmlFile.read()
    HtmlFile.close()
    os.remove(fname)
    return HTMLResponse(content=plot)

@app.get("/backtest/SMA_pullback/{symbol}")
async def get_backtest_results(symbol: str, start_date: str, end_date: str, period: int, commission: float):
    data = get_backtest_data(symbol)
    filtered_data = data[(data.index >= start_date) & (data.index <= end_date)]
    bt = Backtest(filtered_data, SmaPullbackStrategy, commission=commission, margin=0.5)
    bt.run(n=period, buffer=0.02)
    fname = f'SmaPullbackStrategy-{symbol}.html'
    bt.plot(filename=fname, plot_volume=False, superimpose=False, open_browser=False)
    HtmlFile = open(fname, 'r', encoding='utf-8')
    plot = HtmlFile.read()
    HtmlFile.close()
    os.remove(fname)
    return HTMLResponse(content=plot)

@app.get("/time_series_daily/{symbol}")
async def get_time_series_daily(symbol, background_tasks: BackgroundTasks):
    if redis_available:
        formatted_data = get_series_data_redis(symbol, '1d', background_tasks)
    else:
        formatted_data = get_series_data(symbol, '1d')

    return formatted_data


@app.get("/time_series_weekly/{symbol}")
async def get_time_series_weekly(symbol, background_tasks: BackgroundTasks):
    if redis_available:
        formatted_data = get_series_data_redis(symbol, '1wk', background_tasks)
    else:
        formatted_data = get_series_data(symbol, '1wk')

    return formatted_data


@app.get("/time_series_monthly/{symbol}")
async def get_time_series_monthly(symbol, background_tasks: BackgroundTasks):
    if redis_available:
        formatted_data = get_series_data_redis(symbol, '1mo', background_tasks)
    else:
        formatted_data = get_series_data(symbol, '1mo')

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


@app.get("/get_common_stocks")
async def list_assets():
    if not os.path.exists(constants.COMMON_STOCKS_FILE_PATH):
        raise HTTPException(status_code=404, detail="Common stocks file not found")
    
    info = {}
    with open(constants.COMMON_STOCKS_FILE_PATH, "r") as file:
        for line in file:
            symbol = line.strip()
            if symbol:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period="2d")  # Get last 2 days of data
                
                if len(hist) >= 2:
                    full_name = ticker.info.get("longName", "Name not found")[0:18]
                    latest_price = hist["Close"].iloc[-1]
                    prev_price = hist["Close"].iloc[-2]
                    change = latest_price - prev_price
                    change_percent = (change / prev_price) * 100
                    positive = bool(change_percent >= 0)

                    # Round values to 2 decimal places
                    latest_price = round(latest_price, 2)
                    change = round(change, 2)
                    change_percent = round(change_percent, 2)

                    info[symbol] = {
                        'ticker': symbol,
                        'full_name': full_name,
                        'price': latest_price,
                        'change': change, 
                        'percent': change_percent, 
                        'is_positive': positive
                    }
    
    return JSONResponse(content={"common_stocks": info})


