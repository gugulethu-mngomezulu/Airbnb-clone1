import React, { useState } from 'react';
import './Banner.css';
import Search from './Search';
import { FaMapMarkerAlt, FaRegCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; 

function Banner() {
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate(); 

  return (
    <div className='banner'>
      <div className='banner__search'>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className='banner__searchButton'
        >
          <FaRegCalendarAlt size={18} style={{ marginRight: '8px' }} />
          {showSearch ? 'Hide Dates' : 'Search Dates'}
        </button>

        {showSearch && (
          <div className='banner__searchOverlay'>
            <Search />
          </div>
        )}
      </div>

      <div className='banner__info'>
        <h1>Get out and stretch your imagination</h1>
        <h5>
          Plan a different kind of getaway to uncover the hidden gems near you.
        </h5>
        <button onClick={() => navigate('/search')}>
          Explore Nearby
        </button>
      </div>
    </div>
  );
}

export default Banner;
