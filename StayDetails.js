import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './StayDetails.css';
import { FaStar, FaDoorOpen, FaMapMarkedAlt, FaCalendarCheck } from "react-icons/fa";

function StayDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const stay = location.state?.stay || {};

  // Get current date and tomorrow's date dynamically
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getDefaultCheckOut = () => {
    const checkOutDate = new Date();
    checkOutDate.setDate(checkOutDate.getDate() + 5); // Default 5 nights stay
    return checkOutDate.toISOString().split('T')[0];
  };

  const [checkIn, setCheckIn] = useState(getTomorrowDate());
  const [checkOut, setCheckOut] = useState(getDefaultCheckOut());
  const [guests, setGuests] = useState("1 guest");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [reviews, setReviews] = useState([
    { name: "Sarah", comment: "Beautiful place, loved my stay!", rating: 5 },
    { name: "James", comment: "Very clean and host was friendly.", rating: 4 }
  ]);
  const [newComment, setNewComment] = useState("");
  const [newName, setNewName] = useState("");
  const [newRating, setNewRating] = useState(5);

  // Calculate price based on selected dates
  const calculatePrice = () => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (nights <= 0) return 0;
    return nights * 930; // R930 per night
  };

  const totalPrice = calculatePrice();
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 3600 * 24));

  // Validate booking dates
  const validateDates = () => {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return "Check-in date cannot be in the past";
    }

    if (checkOutDate <= checkInDate) {
      return "Check-out date must be after check-in date";
    }

    if (nights > 28) {
      return "Maximum stay is 28 nights";
    }

    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newComment && newName) {
      setReviews([...reviews, { name: newName, comment: newComment, rating: newRating }]);
      setNewComment("");
      setNewName("");
      setNewRating(5);
    }
  };

  const handleReserve = () => {
    setError("");
    
    // Validate dates
    const dateError = validateDates();
    if (dateError) {
      setError(dateError);
      return;
    }

    if (!stay.title) {
      setError("Stay information is missing. Please go back and select a property.");
      return;
    }

    setIsLoading(true);

    // Simulate loading delay (remove this in production)
    setTimeout(() => {
      navigate('/payment', {
        state: {
          stay,
          checkIn,
          checkOut,
          guests,
          totalPrice,
          nights
        }
      });
      setIsLoading(false);
    }, 1000);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Get dynamic cancellation date (3 days from now)
  const getCancellationDate = () => {
    const cancellationDate = new Date();
    cancellationDate.setDate(cancellationDate.getDate() + 3);
    return cancellationDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="stayDetails">
      <h2>{stay.title || "Stay Details"}</h2>
      <p>{stay.location || "Private apartment hosted by Ghazal"}</p>

      <div className="stayDetails__images">
        <img src={stay.img} alt="Main stay" className="stayDetails__mainImage" />
        <div className="stayDetails__gallery">
          {(stay.interiors || []).map((src, index) => (
            <img key={index} src={src} alt={`Interior ${index + 1}`} className="stayDetails__interiorImage" />
          ))}
        </div>
      </div>

      <div className="stayDetails__infoCard">
        <div className="stayDetails__left">
          <div className="stayDetails__badge">
            <p>🌟 Guest favorite</p>
            <p>One of the most loved homes on Airbnb, according to guests</p>
            <p><FaStar /> 5.0 · {reviews.length} Reviews</p>
          </div>

          <div className="stayDetails__host">
            <img
              src="https://randomuser.me/api/portraits/women/44.jpg"
              alt="host"
            />
            <div>
              <p><strong>Hosted by Amy</strong></p>
              <p>1 month hosting</p>
            </div>
          </div>

          <div className="stayDetails__features">
            <div>
              <FaDoorOpen />
              <p><strong>Self check-in:</strong> Check yourself in with the lockbox.</p>
            </div>
            <div>
              <FaMapMarkedAlt />
              <p><strong>Beautiful and walkable:</strong> Scenic area, easy to get around.</p>
            </div>
            <div>
              <FaCalendarCheck />
              <p><strong>Free cancellation before {getCancellationDate()}</strong></p>
            </div>
          </div>

          <div className="stayDetails__description">
            <p>
              This newly renovated stylish 1-bedroom apartment is close to vibrant Main Road and scenic Beach Road – just 100 steps
              from the iconic promenade. Enjoy a spacious bedroom with a king-size bed, streaming services, and a separate bathroom,
              fully equipped kitchen, and living/dining area with high-speed wifi & dedicated work space. A secure parking bay is
              available in the complex. The apartment is walking distance to top restaurants and beaches, making it your ideal base
              for exploring Cape Town.
            </p>
          </div>
        </div>

        <div className="stayDetails__bookingBox">
          <p className="stayDetails__priceLine">
            <span className="oldPrice">R2,214 ZAR</span> 
            <strong>R{totalPrice.toLocaleString()} ZAR</strong> for {nights} night{nights !== 1 ? 's' : ''}
          </p>
          
          {error && (
            <div className="stayDetails__error">
              <p>{error}</p>
            </div>
          )}

          <div className="stayDetails__dateSelector">
            <div>
              <p>CHECK-IN</p>
              <input 
                type="date" 
                value={checkIn} 
                onChange={(e) => setCheckIn(e.target.value)}
                min={getCurrentDate()}
              />
              <span className="dateDisplay">{formatDate(checkIn)}</span>
            </div>
            <div>
              <p>CHECKOUT</p>
              <input 
                type="date" 
                value={checkOut} 
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn}
              />
              <span className="dateDisplay">{formatDate(checkOut)}</span>
            </div>
          </div>

          <div className="stayDetails__guestSelect">
            <label>Guests</label>
            <select value={guests} onChange={(e) => setGuests(e.target.value)}>
              <option>1 guest</option>
              <option>2 guests</option>
              <option>3 guests</option>
              <option>4 guests</option>
            </select>
          </div>

          <button 
            className={`reserveBtn ${isLoading ? 'loading' : ''}`}
            onClick={handleReserve}
            disabled={isLoading || nights <= 0}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              'Reserve'
            )}
          </button>
          
          <p className="note">You won't be charged yet</p>
          
          {totalPrice > 0 && (
            <div className="priceBreakdown">
              <div className="breakdownRow">
                <span>R930 ZAR × {nights} nights</span>
                <span>R{totalPrice.toLocaleString()} ZAR</span>
              </div>
              <div className="breakdownRow">
                <span>Service fee</span>
                <span>R{Math.round(totalPrice * 0.1).toLocaleString()} ZAR</span>
              </div>
              <div className="breakdownRow total">
                <span><strong>Total</strong></span>
                <span><strong>R{Math.round(totalPrice * 1.1).toLocaleString()} ZAR</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="stayDetails__reviews">
        <h3>⭐ {(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)} · {reviews.length} reviews</h3>
        
        <div className="reviewsGrid">
          {reviews.map((review, index) => (
            <div key={index} className="review">
              <div className="reviewHeader">
                <strong>{review.name}</strong>
                <div className="reviewRating">
                  {'⭐'.repeat(review.rating)}
                </div>
              </div>
              <p>{review.comment}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="reviewForm">
          <h4>Leave a review</h4>
          <div className="formGroup">
            <input
              type="text"
              placeholder="Your name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="formGroup">
            <textarea
              placeholder="Your comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows="4"
              required
            />
          </div>
          <div className="formGroup">
            <label>
              Rating:
              <select
                value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {'⭐'.repeat(r)} ({r})
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className="submitReview">
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
}

export default StayDetails;