// src/Success.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Success.css';

function Success() {
  return (
    <div className="success-container">
      <div className="success-card">
        <h1>🎉 Payment Successful!</h1>
        <p>Thank you for your reservation. We hope you enjoy your stay!</p>
        <Link to="/" className="back-home-btn">
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

export default Success;
