import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Macd from './Macd';
import Rsi from './Rsi';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/macd" element={<Macd />} />
        <Route path="/rsi" element={<Rsi />} />
      </Routes>
    </Router>
  );
};

export default App;
