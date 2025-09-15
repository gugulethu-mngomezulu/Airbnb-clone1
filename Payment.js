// src/Payment.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Payment.css';

function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stay, checkIn, checkOut, guests } = location.state || {};

  if (!stay) {
    navigate('/');
    return null;
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
  const pricePerNight = 930;
  const subtotal = nights * pricePerNight;
  const serviceFee = Math.round(subtotal * 0.1);
  const total = subtotal + serviceFee;

  const handleFakePayment = () => {
    navigate('/confirmation', {
      state: {
        bookingDetails: { stay, checkIn, checkOut, guests },
        totalAmount: total,
        paymentStatus: 'succeeded',
      },
    });
  };

  return (
    <div className="payment">
      <div className="payment__container">
        <div className="payment__details">
          <h2>Complete Your Booking</h2>

          <div className="booking__summary">
            <h3>Booking Summary</h3>
            <div className="stay__info">
              <img src={stay.img} alt={stay.title} className="stay__thumbnail" />
              <div>
                <h4>{stay.title}</h4>
                <p>{stay.location}</p>
              </div>
            </div>

            <div className="booking__details">
              <div className="detail__row">
                <span>Check-in:</span>
                <span>{checkInDate.toLocaleDateString()}</span>
              </div>
              <div className="detail__row">
                <span>Check-out:</span>
                <span>{checkOutDate.toLocaleDateString()}</span>
              </div>
              <div className="detail__row">
                <span>Guests:</span>
                <span>{guests}</span>
              </div>
              <div className="detail__row">
                <span>Nights:</span>
                <span>{nights}</span>
              </div>
            </div>

            <div className="price__breakdown">
              <div className="detail__row">
                <span>Subtotal:</span>
                <span>R{subtotal.toLocaleString()} ZAR</span>
              </div>
              <div className="detail__row">
                <span>Service fee:</span>
                <span>R{serviceFee.toLocaleString()} ZAR</span>
              </div>
              <div className="detail__row total">
                <span><strong>Total:</strong></span>
                <span><strong>R{total.toLocaleString()} ZAR</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="payment__form">
          <h3>Payment Information</h3>
          <p>This is a demo. No real payment will be processed.</p>
          <button className="btn primary" onClick={handleFakePayment}>
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default Payment;
