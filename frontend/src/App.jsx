import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Macd from './Macd';
import Rsi from './Rsi';
import TripleEma from './TripleEma';
import Awesome from './Awesome';
import BollingerBands from './BollingerBands';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/macd" element={<Macd />} />
        <Route path="/rsi" element={<Rsi />} />
        <Route path="/tripleema" element={<TripleEma />} />
        <Route path="/awesome" element={<Awesome />} />
        <Route path="/bollingerbands" element={<BollingerBands />} />
      </Routes>
    </Router>
  );
};

export default App;
