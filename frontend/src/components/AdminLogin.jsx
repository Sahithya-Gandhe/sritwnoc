import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';
import './AdminLogin.css'; // Assuming you'll create this CSS file

const AdminLogin = ({ setIsAdminLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      console.log('Attempting login with:', { email: trimmedEmail, password: trimmedPassword });

      // Since your Admin collection has a specific document with ID "NocAdmin"
      // we'll directly access that document instead of querying the collection
      const adminDocRef = doc(db, "Admin", "NocAdmin");
      const adminDocSnap = await getDoc(adminDocRef);

      if (adminDocSnap.exists()) {
        const adminData = adminDocSnap.data();
        console.log('Admin document data:', adminData);
        
        // Check if the provided credentials match the stored credentials
        // Note: The database uses "Password" with capital P, not "password"
        if (adminData.email === trimmedEmail && adminData.Password === trimmedPassword) {
          console.log('Login successful!');
          alert('Admin login successful!');
          setIsAdminLoggedIn(true);
          navigate('/admin-dashboard');
        } else {
          // Check which credential is incorrect for better error messaging
          if (adminData.email !== trimmedEmail) {
            console.log('Email mismatch. Expected:', adminData.email, 'Got:', trimmedEmail);
            alert('Invalid email.');
          } else if (adminData.Password !== trimmedPassword) {
            console.log('Password mismatch. Expected:', adminData.Password, 'Got:', trimmedPassword);
            alert('Invalid password.');
          } else {
            console.log('Credentials mismatch.');
            alert('Invalid admin credentials.');
          }
        }
      } else {
        console.log('Admin document not found');
        alert('Admin account not found.');
      }
    } catch (error) {
      console.error("Error during admin login:", error);
      alert('Error during admin login: ' + error.message);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-content">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button">Login</button>
          <button type="button" className="back-button" onClick={() => navigate('/')}>Back to Home</button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;