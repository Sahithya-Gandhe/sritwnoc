import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseconfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './AdminLogin.css'; // Assuming you'll create this CSS file

const AdminLogin = ({ setIsAdminLoggedIn }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const trimmedEmail = email.trim();
      const trimmedName = name.trim();
      const trimmedPassword = password.trim();

      const q = query(
        collection(db, "Admin"),
        where("Email_id", "==", trimmedEmail),
        where("Name", "==", trimmedName),
        where("password", "==", trimmedPassword)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        alert('Admin login successful!');
        setIsAdminLoggedIn(true);
        navigate('/admin-dashboard');
      } else {
        alert('Invalid admin credentials.');
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
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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