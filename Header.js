import React from 'react';
import './Header.css';
import { FaSearch, FaGlobe, FaUserCircle, FaBars } from 'react-icons/fa';
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="header">
      <Link to="/" className="header__logo">
        <img
          src="https://i.pinimg.com/originals/3c/bf/be/3cbfbe148597341fa56f2f87ade90956.png"
          alt="StayBNB Logo"
        />
      </Link>

      <div className="header__search">
        <input type="text" placeholder="Anywhere | Any week | Add guests" />
        <FaSearch className="searchIcon" />
      </div>

      <div className="header__menu">
        <p>Become a host</p>
        <FaGlobe className="icon" />
        <div className="header__profile">
          <FaBars className="icon" />
          <FaUserCircle className="icon" />
        </div>
      </div>
    </header>
  );
}

export default Header;
