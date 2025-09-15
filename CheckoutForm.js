// src/CheckoutForm.js
import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import './CheckoutForm.css';

export default function CheckoutForm({ totalAmount, bookingDetails }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking-confirmation`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else {
      // Payment succeeded, redirect to confirmation
      navigate('/booking-confirmation', {
        state: {
          bookingDetails,
          totalAmount,
          paymentStatus: 'succeeded'
        }
      });
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs"
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="checkout-form">
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      
      <div className="payment__actions">
        <button 
          disabled={isLoading || !stripe || !elements} 
          id="submit"
          className="pay__button"
        >
          <span id="button-text">
            {isLoading ? (
              <div className="spinner" id="spinner"></div>
            ) : (
              `Pay R${totalAmount.toLocaleString()} ZAR`
            )}
          </span>
        </button>
      </div>
      
      {message && <div id="payment-message" className="payment__message">{message}</div>}
    </form>
  );
}