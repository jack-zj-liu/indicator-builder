import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Macd from './Macd';
import Rsi from './Rsi';
import TripleEma from './TripleEma';
import Awesome from './Awesome';
import BollingerBands from './BollingerBands';
import StochasticOscillator from './StochasticOscillator';
import Ichimoku from './IchimokuCloud';
import FibonacciRetracement from './FibonacciRetracement'
import AroonIndicator from './Aroon';
import FairGapValue from './FairGapValue';
import Sma from './SMA';
import Ema from './Ema';
import Adx from './Adx';
import StdDev from './StandardDeviation';
import CciOscillator from './CciOscillator';
import EMA_BB from './EMA+BollingerBands';
import MACD_AwesomeOscillator from './MACD+AwesomeOscillator';
import SMA_crossover_strategy from './SMA_crossover_strategy';
import SMA_pullback_strategy from './SMA_pullback_strategy';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/macd" element={<Macd />} />
        <Route path="/rsi" element={<Rsi />} />
        <Route path="/sma" element={<Sma />} />
        <Route path="/ema" element={<Ema />} />
        <Route path="/adx" element={<Adx />} />
        <Route path="/tripleema" element={<TripleEma />} />
        <Route path="/stddev" element={<StdDev />} />
        <Route path="/awesome" element={<Awesome />} />
        <Route path="/bollingerbands" element={<BollingerBands />} />
        <Route path="/ccioscillator" element={<CciOscillator />} />
        <Route path="/stochasticoscillator" element={<StochasticOscillator />} />
        <Route path="/ichimokucloud" element={<Ichimoku />} />
        <Route path="/fibonacciretracement" element={<FibonacciRetracement />} />
        <Route path="/aroonindicator" element={<AroonIndicator />} />
        <Route path="/fairgapvalue" element={<FairGapValue />} />
        <Route path="/ema-bb" element={<EMA_BB />} />
        <Route path="/macd-awesomeoscillator" element={<MACD_AwesomeOscillator />} />
        <Route path="/sma-crossover-strategy" element={<SMA_crossover_strategy />} />
        <Route path="/sma-pullback-strategy" element={<SMA_pullback_strategy />} />
      </Routes>
    </Router>
  );
};

export default App;
