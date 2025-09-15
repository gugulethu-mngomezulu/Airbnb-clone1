
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCalendarAlt, FaUsers, FaMapMarkerAlt } from 'react-icons/fa';
import './BookingConfirmation.css';

function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingDetails, totalAmount, paymentStatus } = location.state || {};

  if (!bookingDetails || paymentStatus !== 'succeeded') {
    return (
      <div className="confirmation">
        <div className="confirmation__error">
          <h2>Booking Not Found</h2>
          <p>We couldn't find your booking details.</p>
          <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
      </div>
    );
  }

  const { stay, checkIn, checkOut, guests } = bookingDetails;
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 3600 * 24));

  return (
    <div className="confirmation">
      <div className="confirmation__container">
        <div className="confirmation__header">
          <FaCheckCircle className="success__icon" />
          <h1>Booking Confirmed!</h1>
          <p>Your reservation has been successfully completed.</p>
        </div>

        <div className="confirmation__details">
          <div className="booking__card">
            <div className="booking__image">
              <img src={stay.img} alt={stay.title} />
            </div>
            
            <div className="booking__info">
              <h2>{stay.title}</h2>
              <p className="location">
                <FaMapMarkerAlt /> {stay.location}
              </p>
              
              <div className="booking__dates">
                <div className="date__item">
                  <FaCalendarAlt />
                  <div>
                    <span className="label">Check-in</span>
                    <span className="date">{new Date(checkIn).toLocaleDateString('en-GB', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                </div>
                
                <div className="date__separator">→</div>
                
                <div className="date__item">
                  <FaCalendarAlt />
                  <div>
                    <span className="label">Check-out</span>
                    <span className="date">{new Date(checkOut).toLocaleDateString('en-GB', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                </div>
              </div>
              
              <div className="booking__guests">
                <FaUsers />
                <span>{guests} • {nights} night{nights > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div className="payment__summary">
            <h3>Payment Summary</h3>
            <div className="summary__row">
              <span>Total Paid:</span>
              <span className="amount">R{totalAmount.toLocaleString()} ZAR</span>
            </div>
            <div className="summary__row">
              <span>Payment Status:</span>
              <span className="status success">Completed</span>
            </div>
          </div>

          <div className="next__steps">
            <h3>What's Next?</h3>
            <div className="steps__list">
              <div className="step__item">
                <div className="step__number">1</div>
                <div className="step__content">
                  <h4>Check your email</h4>
                  <p>We've sent confirmation details to your email address.</p>
                </div>
              </div>
              
              <div className="step__item">
                <div className="step__number">2</div>
                <div className="step__content">
                  <h4>Contact your host</h4>
                  <p>Your host Amy will contact you with check-in instructions.</p>
                </div>
              </div>
              
              <div className="step__item">
                <div className="step__number">3</div>
                <div className="step__content">
                  <h4>Prepare for your trip</h4>
                  <p>Pack your bags and get ready for an amazing stay!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="confirmation__actions">
            <button 
              className="btn primary"
              onClick={() => navigate('/')}
            >
              Back to Home
            </button>
            <button 
              className="btn secondary"
              onClick={() => window.print()}
            >
              Print Confirmation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;