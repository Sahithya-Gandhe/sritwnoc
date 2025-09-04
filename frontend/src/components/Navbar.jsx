import React, { useState } from 'react';
import './Navbar.css';
import logo from "../assets/logo3.png";
import { signInWithPopup, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleprovider } from '../firebaseconfig';

const Navbar = ({ user, isAdminLoggedIn }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const signInWithGoogle = async () => {
    if (isSigningIn) return; // Prevent multiple simultaneous requests
    
    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleprovider);
      const user = result.user;
      console.log('Signed in successfully:', user.displayName);
      // Navigate to student dashboard after successful login
      navigate('/student-dashboard');
    } catch (error) {
      console.error('Error signing in with Google:', error.message);
      if (error.code === 'auth/cancelled-popup-request') {
        console.log('Sign-in popup was cancelled');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in popup was closed by user');
      } else if (error.code === 'auth/operation-not-allowed') {
        console.error('🚫 Google Sign-In is not enabled in Firebase Console');
        alert('Google Sign-In is not configured. Please contact the administrator.\n\nAdmin: Enable Google Sign-In in Firebase Console > Authentication > Sign-in method > Google');
      } else {
        alert('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      console.log('Logged out successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out: ' + error.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo and Brand Section */}
        <div className="navbar-brand">
          <a href="/" className="brand-link">
            <img src={logo} alt="College Logo" className="college-logo" />
            <div className="brand-text">
              <h1 className="brand-title">SRITW NOC</h1>
              <p className="brand-subtitle">Digital Certificate System</p>
            </div>
          </a>
        </div>

        {/* Navigation Menu */}
        <ul className={`nav-menu ${isMenuOpen ? 'nav-menu-active' : ''}`}>
          {/* Show logout button if user is logged in (student or admin) */}
          {(user || isAdminLoggedIn) ? (
            <li className="nav-item">
              <button 
                className="nav-links logout-btn" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <svg className="nav-icon animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"/>
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
                    </svg>
                    <span>Logging Out...</span>
                  </>
                ) : (
                  <>
                    <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Logout</span>
                  </>
                )}
              </button>
            </li>
          ) : (
            /* Show login buttons if user is not logged in */
            <>
              <li className="nav-item">
                <button 
                  className="nav-links student-signin-btn" 
                  onClick={signInWithGoogle}
                  disabled={isSigningIn}
                >
                  {isSigningIn ? (
                    <>
                      <svg className="nav-icon animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.25"/>
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
                      </svg>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <svg className="nav-icon" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 3.48c1.86 0 3.24.8 3.98 1.55l2.6-2.59C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.94L3.6 7.04C4.24 5.27 6.4 3.48 9 3.48z" fill="#EA4335"/>
                        <path d="M17.64 9.2c0-.65-.06-1.28-.17-1.88H9v3.57h4.77c-.2.98-.86 2.4-2.77 3.64l2.86 2.2c1.7-1.57 2.68-3.88 2.68-6.53z" fill="#4285F4"/>
                        <path d="M3.6 10.96c-.1-.29-.16-.59-.16-.9s.06-.61.16-.9L.96 6.2C.35 7.44 0 8.78 0 10.2c0 1.42.35 2.76.96 4L3.6 10.96z" fill="#FBBC05"/>
                        <path d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.86-2.2c-1.17.8-2.6 1.27-3.1 1.27-2.6 0-4.76-1.79-5.4-3.56L.96 14C2.44 16.98 5.48 18 9 18z" fill="#34A853"/>
                      </svg>
                      <span>Student Access</span>
                    </>
                  )}
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-links admin-signin-btn" onClick={() => navigate('/admin-login')}>
                  <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Admin Portal</span>
                </button>
              </li>
            </>
          )}
        </ul>

        {/* Mobile Menu Button */}
        <div className="hamburger" onClick={toggleMenu}>
          <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
          <span className={`bar ${isMenuOpen ? 'active' : ''}`}></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
