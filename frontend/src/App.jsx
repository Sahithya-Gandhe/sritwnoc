import React, { useState, useEffect, lazy, Suspense } from 'react';
import { auth } from './firebaseconfig';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import { LoadingSpinner, ErrorBoundary } from './components/LoadingComponents';
import { PerformanceMonitor } from './utils/performance';
import './App.css';

// Lazy load components for better performance
const HomePage = lazy(() => import('./components/HomePage'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const NocGenerator = lazy(() => import('./components/NocGenerator'));

function App() {
  const [user, setUser] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);

      // If a student logs in, go to student dashboard
      if (currentUser) {
        if (location.pathname === '/') {
          navigate('/student-dashboard');
        }
      } else {
        // If user logs out AND they are not on admin or NOC generation pages, go to home
        if (!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/generate-noc')) {
          navigate('/');
        }
      }
    });

    return () => unsubscribe();
  }, [navigate, location]);

  return (
    <ErrorBoundary>
      <PerformanceMonitor />
      <div className="App">
        <Navbar user={user} isAdminLoggedIn={isAdminLoggedIn} />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/admin-login" element={<AdminLogin setIsAdminLoggedIn={setIsAdminLoggedIn} />} />
            {/* <Route path="/about-us" element={<AboutUs />} /> */}
            {/* <Route path="/contact-us" element={<ContactUs />} /> */}

            {/* Student routes */}
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/generate-noc" element={<NocGenerator />} />

            {/* Admin protected route */}
            <Route
              path="/admin-dashboard"
              element={isAdminLoggedIn ? <AdminDashboard /> : <AdminLogin setIsAdminLoggedIn={setIsAdminLoggedIn} />}
            />
          </Routes>
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

export default App;
