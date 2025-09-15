import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { FaCalendarAlt, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; 
import 'react-datepicker/dist/react-datepicker.css';
import './Search.css';

function Search() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [guests, setGuests] = useState(1);

  const navigate = useNavigate(); 

  return (
    <div className="search">
      <div className="search__field">
        <FaCalendarAlt className="search__icon" />
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          placeholderText="Check-in"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          placeholderText="Check-out"
        />
      </div>

      <div className="search__field">
        <FaUser className="search__icon" />
        <input
          type="number"
          min="1"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          placeholder="Guests"
        />
      </div>

      <button
        className="search__button"
        onClick={() => navigate('/search')} // ✅ navigate on click
      >
        Search Airbnb
      </button>
    </div>
  );
}

export default Search;
