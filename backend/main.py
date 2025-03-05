from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.responses import JSONResponse
import requests
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import os
import logging
import uvicorn
import json

import constants
try:
    import redis
    r = redis.Redis(host=constants.REDIS_HOST, port=constants.REDIS_PORT, decode_responses=True)
    REDIS_EXPIRY = 60 * 30 # 30 minutes (arbitrary idk)
    r.ping()
    redis_available = True
except:
    redis_available = False

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
    for entry in data:
        redis_entry = json.dumps(entry)
        r.rpush(redis_name, redis_entry)
    r.expire(redis_name, REDIS_EXPIRY)
    inserted = r.llen(redis_name)
    # for debug, remove later?
    LOG.debug('Redis: inserted {} items into \'{}\''.format(inserted, redis_name))

def get_series_data_redis(symbol, interval, background_tasks: BackgroundTasks):
    ticker = yf.Ticker(symbol)
    redis_name = ':'.join([symbol, interval])

    # load data from redis if exists
    if r.exists(redis_name):
        formatted_data = list(map(json.loads, r.lrange(redis_name, 0, -1)))
        # for debug, remove later?
        retrieved = r.llen(redis_name)
        LOG.debug('Redis: retrieved {} items from \'{}\''.format(retrieved, redis_name))
    else:
        data = ticker.history(period='max', interval=interval).Close
        formatted_data = [
            {"time": pd.Timestamp(date).strftime('%Y-%m-%d'), "value": round(value, 2)}
            for date, value in data.items()
        ]
        # do redis insert in background cus it might take a bit
        background_tasks.add_task(insert_redis_data, redis_name, formatted_data)

    return formatted_data

def get_series_data(symbol, interval):
    ticker = yf.Ticker(symbol)
    data = ticker.history(period='max', interval=interval).Close
    formatted_data = [
        {"time": pd.Timestamp(date).strftime('%Y-%m-%d'), "value": round(value, 2)}
        for date, value in data.items()
    ]

    return formatted_data


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
