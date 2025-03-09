import React, { useEffect, useState } from 'react';
import './Autocomplete.css';

function swap(m){
  var ret = {};
  for(var key in m){
    ret[m[key]] = key;
  }
  return ret;
}

const Autocomplete = ({ suggestions, setValue }) => {
  const [query, SetQuery] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [acceptedValue, setAcceptedValue] = useState('');
  const displayValues = Array.from(Object.values(suggestions));
  const nameToSymbol = swap(suggestions);

  const handleChange = (value) => {
    const inputValue = value.toLowerCase();
    setInputValue(inputValue);

    // Filter items that start with the search string
    const startsWithSearchString = displayValues.filter(item => item.toLowerCase().startsWith(inputValue));

    // Filter items that don't start with the search string but contain it
    const containsSearchString = displayValues.filter(item => !item.toLowerCase().startsWith(inputValue)
                                                      && item.toLowerCase().includes(inputValue));
    const resultArray = startsWithSearchString.concat(containsSearchString);
    setFilteredSuggestions(resultArray);
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

  const handleType = (value) => {
    setInputValue(value);
    SetQuery(value);
  }

  useEffect(() => {
    const timeOutId = setTimeout(() => handleChange(query), 250);
    return () => clearTimeout(timeOutId);
  }, [query])

  return (
    <div className="autocomplete-container">
      <input
        className="autocomplete-input"
        type="text"
        value={inputValue}
        onChange={event => handleType(event.target.value)}
        placeholder="Search Assets..."
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
