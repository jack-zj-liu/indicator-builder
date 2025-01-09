import requests
from datetime import datetime, timedelta


url = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&interval=60min&apikey=V4AWGG4Y2EOQ7SES'

r = requests.get(url)
data = r.json()

time_series = data['Time Series (Daily)']
result = [(date, float(values['4. close'])) for date, values in time_series.items()]

print(result)