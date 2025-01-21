import React, { useState } from 'react';
import './Autocomplete.css';

function swap(m){
  var ret = {};
  for(var key in m){
    ret[m[key]] = key;
  }
  return ret;
}

const Autocomplete = ({ suggestions, setValue }) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [acceptedValue, setAcceptedValue] = useState('');
  const displayValues = Array.from(Object.values(suggestions));
  const nameToSymbol = swap(suggestions);

  const handleChange = (event) => {
    const inputValue = event.target.value;
    setInputValue(inputValue);

    // Filter suggestions based on input value
    const filteredSuggestions = displayValues.filter(suggestion =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredSuggestions(filteredSuggestions);
  };

  const handleSelect = (value) => {
    setInputValue(value);
    setAcceptedValue(value);
    setValue(nameToSymbol[value]);
    setFilteredSuggestions([]);
  };

  const handleBlur = () => {
    setInputValue(acceptedValue);
    setFilteredSuggestions([]);
  }

  return (
    <div className="autocomplete-container">
      <input
        className="autocomplete-input"
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Type to search..."
        onBlur={handleBlur}
      />
      <ul className="autocomplete-suggestions">
        {filteredSuggestions.map((suggestion, index) => (
          <li key={index} className="autocomplete-suggestion" onMouseDown={() => handleSelect(suggestion)}>
            {suggestion}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Autocomplete;
