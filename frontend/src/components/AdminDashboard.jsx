import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// import { auth } from '../firebaseconfig'; // Assuming you have auth exported from firebaseconfig

import './AdminDashboard.css'; // Import the new CSS file
import './AdminDashboardBonafide.css'; // Import the bonafide CSS file
import './AdminDashboardStudent.css'; // Import the student requests CSS file

import { collection, addDoc, getDocs, updateDoc, doc, query, where, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseconfig'; // Assuming you have db exported from firebaseconfig
import BonafidePdf from './BonafidePdf';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ... existing code ...

const downloadBonafideCertificate = async (request) => {
  const docRef = doc(db, 'bonafideRequests', request.id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();

    // Render the BonafidePdf component to a canvas
    const pdfComponent = document.createElement('div');
    pdfComponent.innerHTML = `
      <div className="bonafide-container">
        <div className="bonafide-header">
          <img src="${logo}" alt="College Logo" className="college-logo" />
          <h2>SUMATHI REDDY INSTITUTE OF TECHNOLOGY FOR WOMEN</h2>
          <p>Ananthasagar, Warangal - 506 371</p>
          <h3>BONAFIDE / CONDUCT CERTIFICATE</h3>
        </div>
        <div className="bonafide-details">
          <p>Date: ${new Date().toLocaleDateString('en-GB')}</p>
          <p>
            This is to Certify that Ms. <b>${data.studentName}</b>, D/O <b>${data.dob}</b>,
            was a bonafide student of this college during the academic year <b>${data.academicYear}</b> and studied <b>${data.course}</b>.
          </p>
          <p>
            His/Her Roll No: <b>${data.rollNo}</b> & Admin. No: <b>${data.adminNo}</b>
          </p>
          <p>
            His/Her Conduct is: <b>${data.conduct}</b>
          </p>
        </div>
        <div className="bonafide-signatures">
          <div className="signature-block">
            <p>PRINCIPAL</p>
          </div>
        </div>
      </div>
    `;

    const canvas = await html2canvas(pdfComponent);
    const imgData = canvas.toDataURL('image/png');

    // Create a new jsPDF instance and add the image
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`bonafide_certificate_${data.rollNo}.pdf`);
  } else {
    console.log("No such document!");
  }
};

// ... existing code ...
const AdminDashboard = () => {

  const [activeSection, setActiveSection] = useState('faculty'); // 'faculty', 'studentRequests', or 'bonafideRequests'
  const [facultyRoll, setFacultyRoll] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [editingFaculty, setEditingFaculty] = useState(null); // To store faculty being edited
  const [nocRequests, setNocRequests] = useState([]); // New state for NOC requests
  const [bonafideRequests, setBonafideRequests] = useState([]); // New state for Bonafide requests
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

  const fetchBonafideRequests = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'bonafideRequests'));
      const requestsData = [];
      querySnapshot.forEach((doc) => {
        requestsData.push({ 
          id: doc.id,
          ...doc.data() 
        });
      });
      setBonafideRequests(requestsData);
    } catch (error) {
      console.error('Error fetching Bonafide requests:', error);
      alert('Error fetching Bonafide requests: ' + error.message);
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

  // Effect to fetch requests when sections are active
  useEffect(() => {
    if (activeSection === 'studentRequests') {
      fetchNocRequests();
    } else if (activeSection === 'bonafideRequests') {
      fetchBonafideRequests();
    }
  }, [activeSection, fetchNocRequests, fetchBonafideRequests]);

  // Function to download bonafide certificate (dummy implementation)
  const downloadBonafideCertificate = async (request) => {
    // Create a container for rendering the BonafidePdf component
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Render BonafidePdf into the container
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(container);
    const ref = React.createRef();
    root.render(
      <BonafidePdf
        ref={ref}
        studentName={request.studentName}
        fatherName={request.fatherName || request.dob || ''}
        academicYear={request.academicYear || ''}
        course={request.course || request.branch || ''}
        rollNo={request.rollNo}
        adminNo={request.adminNo || ''}
        conduct={request.conduct || ''}
      />
    );

    // Wait for the component to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Use html2canvas to capture the rendered component
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    const element = ref.current || container.firstChild;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');

    // Create PDF
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`bonafide_certificate_${request.rollNo}.pdf`);

    // Clean up
    root.unmount();
    document.body.removeChild(container);
  };

  return (
    <div className="admin-dashboard-container">
      <div className="admin-dashboard-content">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p className="dashboard-subtitle">Manage faculty and student requests efficiently</p>
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
          <button
            className={`switcher-button ${activeSection === 'bonafideRequests' ? 'active' : ''}`}
            onClick={() => setActiveSection('bonafideRequests')}
          >
            Manage Bonafide
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
                  <div className="student-table-container">
                    <table className="student-table">
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
                            <td>
                              <span className={`status-badge status-${request.finalStatus ? request.finalStatus.toLowerCase().replace(' ', '-') : 'pending'}`}>
                                {request.finalStatus || 'Pending'}
                              </span>
                            </td>
                            <td>
                              {request.finalStatus === 'Accepted' && (
                                <button
                                  className="generate-noc-btn"
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
                  <div className="no-requests">
                    <p>No student NOC requests to display.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'bonafideRequests' && (
            <div className="bonafide-requests-management">
              <h2>Manage Bonafide Requests</h2>
              <p>Here you can view and manage student Bonafide requests.</p>
              <div className="bonafide-requests-display">
                <h3>Student Bonafide Requests</h3>
                {bonafideRequests.length > 0 ? (
                  <div className="bonafide-table-container">
                    <table className="bonafide-table">
                      <thead>
                        <tr>
                          <th>Student Roll</th>
                          <th>Student Name</th>
                          <th>Branch</th>
                          <th>Year</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bonafideRequests.map((request) => (
                          <tr key={request.id}>
                            <td>{request.rollNo}</td>
                            <td>{request.studentName}</td>
                            <td>{request.branch}</td>
                            <td>{request.year}</td>
                            <td>
                              <span className={request.status === 'Generated' ? 'status-generated' : 'status-pending'}>
                                {request.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="download-btn"
                                onClick={() => downloadBonafideCertificate(request)}
                              >
                                Download Certificate
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-requests">
                    <p>No student Bonafide requests to display.</p>
                  </div>
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