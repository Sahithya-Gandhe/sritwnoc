import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// import { auth } from '../firebaseconfig'; // Assuming you have auth exported from firebaseconfig

import './AdminDashboard.css'; // Import the new CSS file

import { collection, addDoc, getDocs, updateDoc, doc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebaseconfig'; // Assuming you have db exported from firebaseconfig

const AdminDashboard = () => {

  const [activeSection, setActiveSection] = useState('faculty'); // 'faculty' or 'studentRequests'
  const [facultyRoll, setFacultyRoll] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [editingFaculty, setEditingFaculty] = useState(null); // To store faculty being edited
  const [nocRequests, setNocRequests] = useState([]); // New state for NOC requests
  const navigate = useNavigate();

  const handleAddFaculty = useCallback(async () => {
    if (!facultyRoll || !facultyEmail) {
      alert('Please enter both faculty roll and email.');
      return;
    }

    try {
      // Check if faculty with the same roll already exists
      const facultyRef = collection(db, 'faculty');
      const q = await getDocs(facultyRef);
      const existingFaculty = q.docs.find(doc => doc.data().roll === facultyRoll);

      if (existingFaculty) {
        alert('Faculty with this roll number already exists.');
        return;
      }

      await addDoc(facultyRef, {
        roll: facultyRoll,
        email: facultyEmail,
      });
      alert('Faculty added successfully!');
      setFacultyRoll('');
      setFacultyEmail('');
      handleDisplayFaculty(); // Refresh the list
    } catch (error) {
      console.error('Error adding faculty:', error);
      alert('Error adding faculty: ' + error.message);
    }
  }, [facultyRoll, facultyEmail]);

  const handleDisplayFaculty = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'faculty'));
      const facultyData = [];
      querySnapshot.forEach((doc) => {
        facultyData.push({ id: doc.id, ...doc.data() });
      });
      setFacultyList(facultyData);
    } catch (error) {
      console.error('Error fetching faculty:', error);
      alert('Error fetching faculty: ' + error.message);
    }
  }, []);

  const fetchNocRequests = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'nocRequests'));
      const requestsData = [];
      querySnapshot.forEach((doc) => {
        // doc.id is now the rollNo since we use setDoc(doc(db, "nocRequests", rollNo), ...)
        requestsData.push({ 
          id: doc.id, // This is the rollNo
          rollNo: doc.id, // Explicitly set rollNo for clarity
          ...doc.data() 
        });
      });
      setNocRequests(requestsData);
    } catch (error) {
      console.error('Error fetching NOC requests:', error);
      alert('Error fetching NOC requests: ' + error.message);
    }
  }, []);

  const handleEditClick = useCallback((faculty) => {
    setEditingFaculty(faculty);
    setFacultyRoll(faculty.roll ? String(faculty.roll) : ''); // Ensure it's a string, default to empty
    setFacultyEmail(faculty.email ? String(faculty.email) : ''); // Ensure it's a string, default to empty
  }, []);

  const handleUpdateFaculty = useCallback(async () => {
    console.log('handleUpdateFaculty called. editingFaculty:', editingFaculty); // Debugging
    if (!editingFaculty || !editingFaculty.id) {
      alert('Error: No faculty selected for update or missing ID.');
      return;
    }
    if (!facultyRoll || !facultyEmail) {
      alert('Please enter both faculty roll and email.');
      return;
    }

    try {
      // Find the document ID based on the roll number
      await updateDoc(doc(db, 'faculty', String(editingFaculty.id)), {
        roll: String(facultyRoll),
        email: String(facultyEmail),
      });
      alert('Faculty updated successfully!');
      setFacultyRoll('');
      setFacultyEmail('');
      setEditingFaculty(null);
      handleDisplayFaculty(); // Refresh the list
    } catch (error) {
      console.error('Error updating faculty:', error);
      alert('Error updating faculty: ' + error.message);
    }
  }, [editingFaculty, facultyRoll, facultyEmail, handleDisplayFaculty]);

  const handleLogout = useCallback(async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      navigate('/');
    }
  }, [navigate]);

  const handleDeleteFaculty = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this faculty?')) {
      try {
        await deleteDoc(doc(db, 'faculty', id));
        alert('Faculty deleted successfully!');
        handleDisplayFaculty(); // Refresh the list
      } catch (error) {
        console.error('Error deleting faculty:', error);
        alert('Error deleting faculty: ' + error.message);
      }
    }
  }, [handleDisplayFaculty]);

  // Effect to fetch NOC requests when the studentRequests section is active
  useEffect(() => {
    if (activeSection === 'studentRequests') {
      fetchNocRequests();
    }
  }, [activeSection]);

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-content">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">Manage faculty and student NOC requests efficiently</p>
        </div>
        <div className="section-switcher">
          <button
            className={`switcher-button ${activeSection === 'faculty' ? 'active' : ''}`}
            onClick={() => setActiveSection('faculty')}
          >
            Manage Faculty
          </button>
          <button
            className={`switcher-button ${activeSection === 'studentRequests' ? 'active' : ''}`}
            onClick={() => setActiveSection('studentRequests')}
          >
            Manage Student Requests
          </button>
        </div>

        <div className="section-content">
          {activeSection === 'faculty' && (
            <div className="faculty-management">
              <h2>Manage Faculty</h2>
              <p>Here you can view and manage faculty details, add new faculty members, or update existing ones.</p>
              <div className="faculty-form">
                <input
                  type="text"
                  placeholder="Faculty Roll (Primary Key)"
                  value={facultyRoll}
                  onChange={(e) => setFacultyRoll(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="Faculty Email"
                  value={facultyEmail}
                  onChange={(e) => setFacultyEmail(e.target.value)}
                />
                <button onClick={editingFaculty ? handleUpdateFaculty : handleAddFaculty}>
                  {editingFaculty ? 'Update Faculty' : 'Add Faculty'}
                </button>
              </div>
              <div className="faculty-display">
                <h3>Faculty Details</h3>
                <button onClick={handleDisplayFaculty}>Display Faculty</button>
                {facultyList.length > 0 ? (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Roll</th>
                          <th>Email</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facultyList.map((faculty) => (
                          <tr key={faculty.roll}>
                            <td>{faculty.roll}</td>
                            <td>{faculty.email}</td>
                            <td>
                              <button onClick={() => handleEditClick(faculty)}><i className="fas fa-pencil-alt"></i> Edit</button>
                              <button onClick={() => handleDeleteFaculty(faculty.id)} className="delete-button"><i className="fas fa-trash-alt"></i> Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No faculty details to display.</p>
                )}
              </div>
            </div>
          )}

          {activeSection === 'studentRequests' && (
            <div className="student-requests-management">
              <h2>Manage Student Requests</h2>
              <p>Here you can view and manage student NOC requests.</p>
              <div className="student-requests-display">
                <h3>Student NOC Requests</h3>
                {nocRequests.length > 0 ? (
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Student Roll</th>
                          <th>Student Name</th>
                          <th>Branch</th>
                          <th>Year</th>
                          <th>Final Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nocRequests.map((request) => (
                          <tr key={request.rollNo}>
                            <td>{request.rollNo}</td>
                            <td>{request.studentName}</td>
                            <td>{request.branch}</td>
                            <td>{request.year || 'N/A'}</td>
                            <td>{request.finalStatus}</td>
                            <td>
                            {request.finalStatus === 'Accepted' && (
                                <button
                                  onClick={() =>
                                    navigate('/generate-noc', {
                                      state: {
                                        studentData: {
                                          studentName: request.studentName,
                                          rollNo: request.rollNo,
                                          branch: request.branch,
                                          year: request.year,
                                        },
                                      },
                                    })
                                  }
                                >
                                  Generate NOC
                                </button>
                              )}
                  

                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No student NOC requests to display.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;