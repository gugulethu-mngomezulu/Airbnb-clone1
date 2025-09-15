import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './Login';
import Home from './Home';
import Header from './Header';
import Footer from './Footer';
import SearchPage from './SearchPage';
import StayDetails from './StayDetails';
import Payment from './Payment';
import CheckoutForm from './CheckoutForm';
import BookingConfirmation from './BookingConfirmation';
import Success from './Success';

import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

function App() {
  // Always start with user not authenticated (forces login)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Optional: Check localStorage on component mount if you want to persist login across sessions
  useEffect(() => {
    const savedAuthState = localStorage.getItem('isAuthenticated');
    if (savedAuthState === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Function to handle login
  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <div className="App">
      <Router>
        {isAuthenticated && <Header onLogout={handleLogout} />}

        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/home" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/home"
            element={
              isAuthenticated ? <Home /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/search"
            element={
              isAuthenticated ? <SearchPage /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/staydetails"
            element={
              isAuthenticated ? <StayDetails /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/payment"
            element={
              isAuthenticated ? <Payment /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/success"
            element={
              isAuthenticated ? <Success /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/checkoutForm"
            element={
              isAuthenticated ? <CheckoutForm /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/BookingConfirmation"
            element={
              isAuthenticated ? <BookingConfirmation /> : <Navigate to="/login" replace />
            }
          />
          {/* Redirect root path to login - this ensures app starts at login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch-all route - redirect any unknown routes to login if not authenticated */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        {isAuthenticated && <Footer />}
      </Router>
    </div>
  );
}

export default App;