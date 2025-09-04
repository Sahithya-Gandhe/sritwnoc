import React, { useState } from 'react';
import axios from 'axios';

export default function NoDuesForm() {
  const [studentName, setStudentName] = useState('');
  const [htNo, setHtNo] = useState('');
  const [department, setDepartment] = useState('');

  const handleRequest = async () => {
    try {
      const response = await axios.post('http://localhost:3001/send-request', {
        studentName,
        htNo,
        department,
      });
      alert(response.data);
    } catch (error) {
      console.error('Error sending request:', error);
      alert('Failed to send request. Please try again later.');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: 24, border: "2px solid #333", borderRadius: 8, fontFamily: 'Arial, sans-serif', background: '#fff' }}>
      <h2 style={{ textAlign: "center", marginBottom: 8 }}>SUMATHI REDDY INSTITUTE OF TECHNOLOGY FOR WOMEN</h2>
      <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: 16 }}>Ananthasagar, Warangal-506 371. (T.S)</div>
      <div style={{ textAlign: "center", fontWeight: "bold", fontSize: 18, marginBottom: 16 }}>STUDENT - NO DUES CERTIFICATE</div>
      <div style={{ marginBottom: 16 }}>
        Certified that Ms. <input type="text" placeholder="Enter Name" style={{ border: "none", borderBottom: "1px solid #333", width: "150px" }} value={studentName} onChange={(e) => setStudentName(e.target.value)} /> &nbsp; HT No: <input type="text" placeholder="Enter HT No" style={{ border: "none", borderBottom: "1px solid #333", width: "100px" }} value={htNo} onChange={(e) => setHtNo(e.target.value)} /><br />
        B.Tech - <input type="text" placeholder="Enter Department" style={{ border: "none", borderBottom: "1px solid #333", width: "150px" }} value={department} onChange={(e) => setDepartment(e.target.value)} /> has "NO DUES" to the college.
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={{ border: "1px solid #333", padding: 6 }}>S. No</th>
            <th style={{ border: "1px solid #333", padding: 6 }}>Name of the Dept./Section</th>
            <th style={{ border: "1px solid #333", padding: 6 }}>Name & Signature of the In-charge of the Dept./Section</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #333", padding: 6 }}>1</td>
            <td style={{ border: "1px solid #333", padding: 6 }}>Examination Branch</td>
            <td style={{ border: "1px solid #333", padding: 6 }}></td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #333", padding: 6 }}>2</td>
            <td style={{ border: "1px solid #333", padding: 6 }}>Library</td>
            <td style={{ border: "1px solid #333", padding: 6 }}></td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #333", padding: 6 }}>3</td>
            <td style={{ border: "1px solid #333", padding: 6 }}>Accounts</td>
            <td style={{ border: "1px solid #333", padding: 6 }}>
              <div>Tuition Fee:</div>
              <div>Bus Fee:</div>
              <div>Hostel Fee:</div>
              <div>Other Fee:</div>
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #333", padding: 6 }}>4</td>
            <td style={{ border: "1px solid #333", padding: 6 }}>Training & Placement Cell</td>
            <td style={{ border: "1px solid #333", padding: 6 }}>
            <button type="submit" className="request-button" onClick={handleRequest}>
              Request
            </button>
            </td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #333", padding: 6 }}>5</td>
            <td style={{ border: "1px solid #333", padding: 6 }}>IEEE / ISTE / CSI</td>
            <td style={{ border: "1px solid #333", padding: 6 }}></td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #333", padding: 6 }}>6</td>
            <td style={{ border: "1px solid #333", padding: 6 }}>Sports / Games</td>
            <td style={{ border: "1px solid #333", padding: 6 }}></td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #333", padding: 6 }}>7</td>
            <td style={{ border: "1px solid #333", padding: 6 }}>Mentor</td>
            <td style={{ border: "1px solid #333", padding: 6 }}></td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #333", padding: 6 }}>8</td>
            <td style={{ border: "1px solid #333", padding: 6 }}>Alumni Association</td>
            <td style={{ border: "1px solid #333", padding: 6 }}></td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginBottom: 16, fontWeight: "bold" }}>If Scholarship (RTF) Holder</div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
        <tbody>
          <tr>
            <td style={{ border: "1px solid #333", padding: 6, width: "50%" }}>Scholarship Application No.</td>
            <td style={{ border: "1px solid #333", padding: 6, width: "50%" }}></td>
          </tr>
          <tr>
            <td style={{ border: "1px solid #333", padding: 6, width: "50%" }}>Scholarship Status (Attach Status Report)</td>
            <td style={{ border: "1px solid #333", padding: 6, width: "50%" }}></td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginBottom: 32 }}>Remarks of the HoD (If any): ____________________________________________</div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
        <div>Head of the Department</div>
        <div>Administrative Officer</div>
        <div>PRINCIPAL</div>
      </div>
    </div>
  );
}