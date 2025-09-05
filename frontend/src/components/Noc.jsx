import React, { useState, useEffect } from "react";
import axios from "axios";
import { fetchAllFacultyEmails, examBranchEmail, libraryEmail, tnpEmail, ieeeEmail, sportsEmail, alumniEmail } from "./facultymails";

// Import exported student details from StudentDashboard
import { exportedStudentName,
  exportedRollNo,
  exportedBranch,
  exportedYear,
  exportedMentor,
  curemailid,
} from "./StudentDashboard";
import { db } from "../firebaseconfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Noc() {
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [emailsLoaded, setEmailsLoaded] = useState(false);
  const [isResendMode, setIsResendMode] = useState(false);
  const [rejectedFaculty, setRejectedFaculty] = useState([]);
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [resendMessage, setResendMessage] = useState('');
  const [nocRequestStatus, setNocRequestStatus] = useState(null);

  // Load faculty emails from Firestore and check for existing NOC request
  useEffect(() => {
    const loadFacultyEmailsAndCheckStatus = async () => {
      await fetchAllFacultyEmails(); // populates the exported variables

      // Check if student has an existing NOC request
      if (exportedRollNo) {
        try {
          const nocRef = doc(db, "nocRequests", exportedRollNo);
          const nocDoc = await getDoc(nocRef);
          
          if (nocDoc.exists()) {
            const nocData = nocDoc.data();
            setNocRequestStatus(nocData);
            
            const facultyStatuses = nocData.facultyStatuses || {};
            const rejected = [];
            const pending = [];
            
            // Separate rejected and pending faculty
            for (const [email, status] of Object.entries(facultyStatuses)) {
              if (status === "Rejected") {
                rejected.push(email);
              } else if (status === "Pending") {
                pending.push(email);
              }
            }
            
            setRejectedFaculty(rejected);
            setPendingFaculty(pending);
            
            // If there are rejected faculty, enable resend mode (ignore pending - they will auto-reject after 24h)
            if (rejected.length > 0) {
              setIsResendMode(true);
              
              // Build faculty list with role mapping
              const facultyRoleMap = {
                [exportedMentor]: "Mentor",
                [examBranchEmail]: "Examination Branch",
                [libraryEmail]: "Library",
                [tnpEmail]: "Training & Placement Cell",
                [ieeeEmail]: "IEEE / ISTE / CSI",
                [sportsEmail]: "Sports / Games",
                [alumniEmail]: "Alumni Association",
              };
              
              // Only show rejected faculty (pending will auto-reject after 24h)
              const resendFacultyList = rejected.map(email => ({
                role: facultyRoleMap[email] || `Unknown Faculty`,
                email: email,
                status: "Rejected"
              }));
              
              setFacultyList(resendFacultyList);
              setSelectedFaculties(rejected); // Auto-select rejected faculty for resend
              setEmailsLoaded(true);
              return;
            }
          }
        } catch (error) {
          console.error("Error checking NOC request status:", error);
        }
      }
      
      // If no existing request or no rejected/pending faculty, show all 7 mandatory faculty
      setIsResendMode(false);
      
      // Build faculty list array from exported variables - ALL 7 MANDATORY
      const list = [
        { role: "Mentor", email: exportedMentor }, // Use exportedMentor
        { role: "Examination Branch", email: examBranchEmail },
        { role: "Library", email: libraryEmail },
        { role: "Training & Placement Cell", email: tnpEmail },
        { role: "IEEE / ISTE / CSI", email: ieeeEmail },
        { role: "Sports / Games", email: sportsEmail },
        { role: "Alumni Association", email: alumniEmail },
      ].filter(f => f.email); // only keep roles that have emails

      // Validate that all 7 faculty members are available
      if (list.length !== 7) {
        console.error(`Missing faculty emails. Expected 7, got ${list.length}`);
        alert(`Error: Missing faculty emails. Expected 7 faculty members, but only ${list.length} are configured. Please contact admin.`);
        return;
      }

      setFacultyList(list);
      setSelectedFaculties(list.map(f => f.email)); // ALL 7 are mandatory - selected by default
      setEmailsLoaded(true);
    };

    loadFacultyEmailsAndCheckStatus();
  }, [exportedRollNo, exportedMentor]); // Add dependencies

  // Send emails using Resend API or Resend to rejected faculty
  const handleSendRequest = async () => {
    if (isResendMode) {
      // Resend mode - only send to rejected/pending faculty
      if (selectedFaculties.length === 0) {
        alert('Please select at least one faculty member to resend the request.');
        return;
      }
      
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await axios.post(`${apiUrl}/resend-to-rejected`, {
          rollNo: exportedRollNo,
          resendMessage: resendMessage
        });
        
        alert(`Resend successful! Emails sent to ${response.data.details.sent.length} faculty members.`);
        setResendMessage(''); // Clear message
        
        // Refresh the component to check new status
        window.location.reload();
        
      } catch (err) {
        console.error('Resend error:', err);
        alert('Error resending emails: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    } else {
      // Normal mode - validate that all 7 faculty members are selected (mandatory)
      if (selectedFaculties.length !== 7) {
        alert(`All 7 faculty members are mandatory for NOC approval. Currently ${selectedFaculties.length}/7 selected.`);
        return;
      }

      setLoading(true);
      try {
        // Use environment variable for API URL
        const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await axios.post(`${apiUrl}/send-email`, {
          studentName: exportedStudentName,
          rollNo: exportedRollNo,
          branch: exportedBranch,
          year: exportedYear,
          mentor: exportedMentor,
          email: curemailid,
          facultyEmails: selectedFaculties,
        });

        // Store NOC request in Firestore
        try {
          await setDoc(doc(db, "nocRequests", exportedRollNo), {
            studentName: exportedStudentName,
            rollNo: exportedRollNo,
            branch: exportedBranch,
            year: exportedYear,
            mentor: exportedMentor,
            studentEmail: curemailid,
            facultyEmails: selectedFaculties, // Keep this for reference of who was sent
            facultyStatuses: selectedFaculties.reduce((acc, email) => ({ ...acc, [email]: "Pending" }), {}), // Initialize all selected to Pending
            finalStatus: "Pending", // Initial final status
            timestamp: new Date(),
          });
          alert("NOC request submitted and saved!");
        } catch (firestoreError) {
          console.error("Error saving NOC request to Firestore:", firestoreError);
          alert("Error saving NOC request. Please try again.");
        }

        alert(response.data.message);
        setSelectedFaculties([]); // reset selections
      } catch (err) {
        console.error("Error sending emails:", err);
        
        // More detailed error handling
        let errorMessage = "Error sending emails.";
        
        if (err.response) {
          // Server responded with error status
          console.error("Response data:", err.response.data);
          console.error("Response status:", err.response.status);
          
          if (err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
            
            // Add specific error details if available
            if (err.response.data.error) {
              errorMessage += "\n\nDetails: " + err.response.data.error;
              
              // If it's an authentication error, suggest checking credentials
              if (err.response.data.error.includes("Authentication Failed")) {
                errorMessage += "\n\nPlease check your SMTP credentials in the .env file.";
              }
            }
          } else {
            errorMessage = `Server error (${err.response.status}): ${err.response.statusText}`;
          }
        } else if (err.request) {
          // Request was made but no response received
          errorMessage = "No response from server. Please check if the backend is running.";
        } else {
          // Something else happened
          errorMessage = "Error: " + err.message;
        }
        
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!emailsLoaded) {
    return <p>Loading faculty emails...</p>;
  }

  return (
    <div style={{ padding: "20px"  }}>
      <h2>{isResendMode ? "Resend NOC Request" : "No Dues Certificate Request"}</h2>
      
      {isResendMode && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <h3 style={{ color: '#856404', marginTop: 0 }}>🔄 Resend Mode Active</h3>
          <p style={{ color: '#856404', marginBottom: 0 }}>Some faculty members have rejected your request. You can resend your request only to rejected faculty.</p>
          {rejectedFaculty.length > 0 && (
            <p style={{ color: '#dc3545', fontWeight: 'bold' }}>❌ Rejected by: {rejectedFaculty.length} faculty</p>
          )}
          {pendingFaculty.length > 0 && (
            <p style={{ color: '#28a745', fontWeight: 'bold' }}>ℹ️ Pending faculty ({pendingFaculty.length}) will be auto-rejected after 24 hours</p>
          )}
        </div>
      )}
      
      <p style={{textAlign:"center"}}><strong>Student:</strong> {exportedStudentName}</p>
      <p style={{textAlign:"center"}}><strong>Roll No:</strong> {exportedRollNo}</p>
      <p style={{textAlign:"center"}}><strong>Branch:</strong> {exportedBranch}</p>
      <p style={{textAlign:"center"}}><strong>Mentor:</strong> {exportedMentor}</p>
      <p style={{textAlign:"center"}}><strong>Email:</strong> {curemailid}</p>

      {isResendMode && (
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="resendMessage" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Optional Message for Faculty (explain changes made):</label>
          <textarea
            id="resendMessage"
            value={resendMessage}
            onChange={(e) => setResendMessage(e.target.value)}
            placeholder="Optional: Explain what changes you have made or why you are resubmitting..."
            style={{ width: '100%', minHeight: '80px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
      )}

      <h3>{isResendMode ? `Faculty to Resend (${rejectedFaculty.length} selected)` : "Faculty Approval Required (All 7 Mandatory)"}</h3>
      {facultyList.length === 0 ? (
        <p>No faculty emails found.</p>
      ) : !isResendMode && facultyList.length !== 7 ? (
        <div>
          <p style={{color: 'red'}}>❌ Error: Missing faculty configuration. Expected 7 faculty members, found {facultyList.length}.</p>
          <p>Please contact the admin to configure all required faculty emails.</p>
        </div>
      ) : (
        <div>
          {isResendMode ? (
            <p style={{color: 'orange', marginBottom: '15px'}}>🔄 Resending to faculty who rejected your request:</p>
          ) : (
            <p style={{color: 'green', marginBottom: '15px'}}>✅ All 7 required faculty members are configured and will receive the NOC request:</p>
          )}
          {facultyList.map((faculty) => (
            <div key={faculty.role} style={{
              margin: '10px 0', 
              padding: '8px', 
              border: faculty.status === 'Rejected' ? '2px solid #dc3545' : faculty.status === 'Pending' ? '2px solid #ffc107' : '1px solid #ddd', 
              borderRadius: '4px',
              backgroundColor: faculty.status === 'Rejected' ? '#f8d7da' : faculty.status === 'Pending' ? '#fff3cd' : 'white'
            }}>
              <label style={{display: 'flex', alignItems: 'center'}}>
                <input
                  type="checkbox"
                  value={faculty.email}
                  checked={selectedFaculties.includes(faculty.email)}
                  onChange={(e) => {
                    if (isResendMode) {
                      // In resend mode, allow toggling
                      if (e.target.checked) {
                        setSelectedFaculties([...selectedFaculties, faculty.email]);
                      } else {
                        setSelectedFaculties(selectedFaculties.filter(email => email !== faculty.email));
                      }
                    }
                    // In normal mode, checkboxes are disabled
                  }}
                  disabled={!isResendMode}
                  style={{marginRight: '10px'}}
                />
                <div>
                  <strong>{faculty.role}</strong> - {faculty.email}
                  {faculty.status && (
                    <span style={{ 
                      marginLeft: '10px', 
                      padding: '2px 6px', 
                      borderRadius: '3px', 
                      fontSize: '12px',
                      backgroundColor: faculty.status === 'Rejected' ? '#dc3545' : '#ffc107',
                      color: 'white'
                    }}>
                      {faculty.status}
                    </span>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSendRequest}
        disabled={loading || (!isResendMode && facultyList.length !== 7) || (isResendMode && selectedFaculties.length === 0)}
        className="send-request-button"
        style={{
          backgroundColor: isResendMode ? '#ffc107' : '#007bff',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: (loading || (!isResendMode && facultyList.length !== 7) || (isResendMode && selectedFaculties.length === 0)) ? 0.6 : 1
        }}
      >
        {loading 
          ? "Sending..." 
          : isResendMode 
            ? `Resend to ${selectedFaculties.length} Faculty` 
            : facultyList.length !== 7 
              ? "Missing Faculty Configuration" 
              : "Send Request to All 7 Faculty"
        }
      </button>
    </div>
  );
}
