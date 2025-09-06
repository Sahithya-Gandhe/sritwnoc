import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { auth } from '../firebaseconfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './StudentDashboard.css';
import { db } from '../firebaseconfig';
import { collection, addDoc, query, where, getDocs, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import Noc from './Noc';
import { examBranchEmail, libraryEmail, tnpEmail, ieeeEmail, sportsEmail, alumniEmail } from "./facultymails";

// Exportable variables for NOC
export let exportedStudentName = '';
export let exportedRollNo = '';
export let exportedBranch = '';
export let exportedYear = '';
export let exportedMentor = '';
export let curemailid = '';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // loading state
  const [showNocSection, setShowNocSection] = useState(false); // New state to control NOC section visibility
  const [rollNo, setRollNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [branch, setBranch] = useState('');
  const [year, setYear] = useState(''); // New state for year
  const [purpose, setPurpose] = useState('');
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [mentor, setMentor] = useState('');
  const [nocRequestStatus, setNocRequestStatus] = useState(null); // New state for NOC request status

  // Submit form data to Firestore - memoized to prevent recreation
  const adduser = useCallback(async (e) => {
    e.preventDefault();
    
    // Validate rollNo is provided
    if (!rollNo.trim()) {
      alert('Roll Number is required.');
      return;
    }
    
    try {
      // Check if rollNo already exists
      const userDocRef = doc(db, "users", rollNo);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        alert('A user with this Roll Number already exists. Please use a different Roll Number.');
        return;
      }
      
      // Create user document with rollNo as document ID
      await setDoc(userDocRef, {
        rollNo,
        studentName,
        branch,
        year,
        purpose,
        mentor,
        email: user.email,
        timestamp: new Date()
      });
      
      console.log("Document written with ID: ", rollNo);
      alert('NOC request submitted successfully!');
      setHasSentRequest(true);

      // Clear form
      setRollNo('');
      setStudentName('');
      setBranch('');
      setYear('');
      setPurpose('');
      setMentor('');

      // Update exported variables
      exportedRollNo = rollNo;
      exportedStudentName = studentName;
      exportedBranch = branch;
      exportedYear = year;
      exportedMentor = mentor;
      curemailid = user.email;

    } catch (error) {
      console.error("Error adding document:", error.message);
      alert('Error submitting NOC request: ' + error.message);
    }
  }, [rollNo, studentName, branch, year, purpose, mentor, user?.email]);

  // Check login state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // First, try to find user by email to check if they have any existing records
        const q = query(collection(db, "users"), where("email", "==", currentUser.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // User has existing record(s)
          const userData = querySnapshot.docs[0].data();
          const userRollNo = userData.rollNo;
          
          setHasSentRequest(true);
          setRollNo(userRollNo || '');
          setStudentName(userData.studentName || '');
          setBranch(userData.branch || '');
          setYear(userData.year || '');
          setPurpose(userData.purpose || '');
          setMentor(userData.mentor || '');

          exportedRollNo = userRollNo || '';
          exportedStudentName = userData.studentName || '';
          exportedBranch = userData.branch || '';
          exportedYear = userData.year || '';
          exportedMentor = userData.mentor || '';
          curemailid = currentUser.email;

          // Listen for real-time updates on NOC request status using rollNo
          console.log("Listening for NOC request status for rollNo:", userRollNo);
          if (userRollNo) {
            const nocDocRef = doc(db, "nocRequests", userRollNo);
            onSnapshot(nocDocRef, (docSnap) => {
              if (docSnap.exists()) {
                setNocRequestStatus(docSnap.data());
              } else {
                setNocRequestStatus(null);
              }
            });
          }
        } else {
          // No existing record, user can create new one
          setHasSentRequest(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Logout - memoized to prevent recreation
  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      alert('Logged out successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out: ' + error.message);
    }
  }, [navigate]);

  // Memoize faculty role mapping to prevent recreation on every render
  const facultyRoleMap = useMemo(() => ({
    [exportedMentor]: "Mentor", // Add mentor mapping
    [examBranchEmail]: "Examination Branch",
    [libraryEmail]: "Library",
    [tnpEmail]: "Training & Placement Cell",
    [ieeeEmail]: "IEEE / ISTE / CSI",
    [sportsEmail]: "Sports / Games",
    [alumniEmail]: "Alumni Association",
  }), [exportedMentor]);

  // While checking auth
  if (loading) {
    return (
      <div className="student-dashboard-container">
        <div className="student-dashboard-content">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="student-dashboard-container">
        <div className="student-dashboard-content">
          <p>Please log in to view this page.</p>
        </div>
      </div>
    );
  }

  // Logged in
  return (
    <div className="student-dashboard-container">
      <div className="student-dashboard-content">
        <div className="dashboard-header">
          <h1>Welcome, {user.displayName || user.email}!</h1>
        </div>

        {/* Only show the two buttons */}
        <div className="form-container service-buttons">
          <h2>Student Services</h2>
          <div className="button-container">
            <button 
              onClick={() => navigate('/bonafide-form')}
              className="service-button bonafide-button"
            >
              Apply for Bonafide
            </button>
            
            <button 
              onClick={() => setShowNocSection(true)}
              className="service-button noc-button"
            >
              Apply for NOC
            </button>
          </div>
        </div>

        {/* Only show NOC section when the button is clicked */}
        {showNocSection && (
          <div className="form-container">
            <h2>NOC Request Form</h2>
            {hasSentRequest && nocRequestStatus && nocRequestStatus.finalStatus !== "Accepted" ? (
              <div>
                <p>You have an active NOC request.</p>
                <p><strong>Final Status:</strong> {nocRequestStatus.finalStatus}</p>
                {nocRequestStatus.facultyStatuses && (
                  <div>
                    <h4>Individual Faculty Statuses:</h4>
                    <ul>
                      {Object.entries(nocRequestStatus.facultyStatuses).map(([email, status]) => {
                        const facultyRoleMap = {
                          [exportedMentor]: "Mentor", // Add mentor mapping
                          [examBranchEmail]: "Examination Branch",
                          [libraryEmail]: "Library",
                          [tnpEmail]: "Training & Placement Cell",
                          [ieeeEmail]: "IEEE / ISTE / CSI",
                          [sportsEmail]: "Sports / Games",
                          [alumniEmail]: "Alumni Association",
                        };
                        const role = facultyRoleMap[email] || `Unknown Faculty (${email})`;
                        return (
                          <li key={email}>{role}: {status}</li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {nocRequestStatus.finalStatus === "Rejected" && (
                  <p style={{ color: 'red' }}>Your NOC request has been rejected by one or more faculty members. Please contact the college administration for further details.</p>
                )}
                {nocRequestStatus.finalStatus === "Partially Rejected" && (
                  <div>
                    <p style={{ color: 'orange', fontWeight: 'bold' }}>⚠️ Your NOC request has been partially rejected.</p>
                    <p style={{ color: 'blue' }}>You can resend your request to the faculty members who rejected or are still pending. Please check the NOC section below to resend.</p>
                  </div>
                )}
                {nocRequestStatus.finalStatus === "Pending" && (
                  <p style={{ color: 'orange' }}>Your NOC request is pending review by faculty members. Please check back later for updates.</p>
                )}
              </div>
            ) : hasSentRequest ?(
              <p style={{textAlign:"center"}}>You have already sent an NOC request.</p>
            ) : (
              <form onSubmit={adduser}>
                <div className="form-group">
                  <label htmlFor="rollNo">Roll No.:</label>
                  <input
                    type="text"
                    id="rollNo"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="studentName">Name:</label>
                  <input
                    type="text"
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="branch">Branch:</label>
                  <select
                    id="branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                  >
                    <option value="">Select Branch</option>
                    <option value="CSE">CSE</option>
                    <option value="CSD">CSD</option>
                    <option value="CSM">CSM</option>
                    <option value="CSC">CSC</option>
                    <option value="ECE">ECE</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="year">Year:</label>
                  <select
                    id="year"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="I">I</option>
                    <option value="II">II</option>
                    <option value="III">III</option>
                    <option value="IV">IV</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="purpose">Purpose of NOC:</label>
                  <textarea
                    id="purpose"
                    rows="4"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="mentor">Mentor:</label>
                  <input
                      type="email"
                      id="mentor"
                      placeholder="Mentor's Email"
                      value={mentor}
                      onChange={(e) => setMentor(e.target.value)}
                      required
                    />
                </div>
                <button type="submit" className="submit-button">Submit Request</button>
              </form>
            )}
          </div>
        )}

        {showNocSection && nocRequestStatus && nocRequestStatus.finalStatus === "Accepted" ? (
          <div className="form-container">
            <h2>No Dues Certificate Issued</h2>
            <p style={{textAlign:"center"}}>Your No Dues Certificate has been successfully issued.</p>
            <p style={{textAlign:"center"}}>Please download the certificate by contacting the NOC Admin.</p>
            <p style={{textAlign:"center"}}>Thank you for using our service  :-)</p>
          </div>
        ) : showNocSection && (
          <div className="form-container">
            <Noc />
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;