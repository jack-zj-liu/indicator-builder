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

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/macd" element={<Macd />} />
        <Route path="/rsi" element={<Rsi />} />
        <Route path="/sma" element={<Sma />} />
        <Route path="/tripleema" element={<TripleEma />} />
        <Route path="/awesome" element={<Awesome />} />
        <Route path="/bollingerbands" element={<BollingerBands />} />
        <Route path="/stochasticoscillator" element={<StochasticOscillator />} />
        <Route path="/ichimokucloud" element={<Ichimoku />} />
        <Route path="/fibonacciretracement" element={<FibonacciRetracement />} />
        <Route path="/aroonindicator" element={<AroonIndicator />} />
        <Route path="/fairgapvalue" element={<FairGapValue />} />
      </Routes>
    </Router>
  );
};

export default App;
