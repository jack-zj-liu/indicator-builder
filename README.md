# Indicator Builder

**Indicator Builder** project for Waterloo Software Engineering Capstone 2025.

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

