import pandas as pd
import numpy as np

from backtesting import Backtest
from backtesting.test import GOOG
from backtesting.test import SMA
from backtesting.lib import SignalStrategy, TrailingStrategy

class SmaCross(SignalStrategy, TrailingStrategy):
    n1 = 10
    n2 = 25
    
    def init(self):
        # In init() and in next() it is important to call the
        # super method to properly initialize the parent classes
        super().init()
        
        # Precompute the two moving averages
        sma1 = self.I(SMA, self.data.Close, self.n1)
        sma2 = self.I(SMA, self.data.Close, self.n2)
        
        # Where sma1 crosses sma2 upwards. Diff gives us [-1,0, *1*]
        signal = (pd.Series(sma1) > sma2).astype(int).diff().fillna(0)
        signal = signal.replace(-1, 0)  # Upwards/long only
        
        # Use 95% of available liquidity (at the time) on each order.
        # (Leaving a value of 1. would instead buy a single share.)
        entry_size = signal * .95
                
        # Set order entry sizes using the method provided by 
        # `SignalStrategy`. See the docs.
        self.set_signal(entry_size=entry_size)
        
        # Set trailing stop-loss to 2x ATR using
        # the method provided by `TrailingStrategy`
        self.set_trailing_sl(2)


class SmaPullbackStrategy(SignalStrategy, TrailingStrategy):
    n = 20  # SMA period
    buffer = 0.02  # Pullback percentage buffer

    def init(self):
        super().init()

        # Compute the SMA
        sma = self.I(SMA, self.data.Close, self.n)

        # Ensure same length by shifting manually (avoiding pandas shift)
        close_prev = np.roll(self.data.Close, 1)  # Shifted close prices
        close_prev[0] = close_prev[1]  # Handle first element

        # Identify pullback signals: price drops near SMA after being above it
        signal = ((self.data.Close > sma) & (close_prev < sma * (1 + self.buffer))).astype(int)

        # Use 95% of available liquidity per trade
        entry_size = signal * 0.95
        
        self.set_signal(entry_size=entry_size)
