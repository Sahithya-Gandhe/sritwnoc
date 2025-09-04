import React from 'react';
import './HomePage.css';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleprovider } from '../firebaseconfig';

const HomePage = () => {
  const navigate = useNavigate();
  
  const handleStudentAccess = async () => {
    try {
      // Clear any existing popup requests first
      if (window.googleSignInPopup) {
        window.googleSignInPopup.close();
      }
      
      const result = await signInWithPopup(auth, googleprovider);
      const user = result.user;
      console.log('Signed in successfully:', user.displayName);
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
      if (error.code === 'auth/cancelled-popup-request') {
        console.log('Previous popup was cancelled, please try again');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in popup was closed by user');
      } else if (error.code === 'auth/operation-not-allowed') {
        console.error('🚫 Google Sign-In is not enabled in Firebase Console');
        alert('Google Sign-In is not configured. Please contact the administrator.\n\nAdmin: Enable Google Sign-In in Firebase Console > Authentication > Sign-in method > Google');
      } else {
        alert('Failed to sign in with Google. Please try again.');
      }
    }
  };

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">Digital NOC Management System</h1>
            <p className="hero-subtitle">
              Streamline your No Objection Certificate process with our modern, 
              secure, and efficient digital platform designed for academic excellence.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">NOCs Generated</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">95%</span>
                <span className="stat-label">Processing Speed</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Availability</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Why Choose Our Platform</h2>
          <p>Experience the future of NOC management with cutting-edge features designed for efficiency</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#007bff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Lightning Fast</h3>
            <p>Generate and process NOCs in minutes, not days. Our automated system eliminates bottlenecks.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Secure & Reliable</h3>
            <p>Bank-grade security with encrypted data storage and secure authentication protocols.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="#6f42c1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Real-time Tracking</h3>
            <p>Monitor your NOC status in real-time with instant notifications and progress updates.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Get Started Today</h2>
          <p>Choose your access level to begin using our NOC management system</p>
          <div className="cta-buttons">
            <button className="cta-button primary" onClick={handleStudentAccess}>
              <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 3.48c1.86 0 3.24.8 3.98 1.55l2.6-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.94L3.6 7.04C4.24 5.27 6.4 3.48 9 3.48z" fill="#EA4335"/>
                <path d="M17.64 9.2c0-.65-.06-1.28-.17-1.88H9v3.57h4.77c-.2.98-.86 2.4-2.77 3.64l2.86 2.2c1.7-1.57 2.68-3.88 2.68-6.53z" fill="#4285F4"/>
                <path d="M3.6 10.96c-.1-.29-.16-.59-.16-.9s.06-.61.16-.9L.96 6.2C.35 7.44 0 8.78 0 10.2c0 1.42.35 2.76.96 4L3.6 10.96z" fill="#FBBC05"/>
                <path d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.86-2.2c-1.17.8-2.6 1.27-3.1 1.27-2.6 0-4.76-1.79-5.4-3.56L.96 14C2.44 16.98 5.48 18 9 18z" fill="#34A853"/>
              </svg>
              Student Access
            </button>
            <button className="cta-button secondary" onClick={() => navigate('/admin-login')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Admin Portal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;