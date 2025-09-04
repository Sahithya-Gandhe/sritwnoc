import React from "react";
import "./NocPdf.css";
import logo from "../assets/logo3.png";

const NocPdf = React.forwardRef(({ studentName, rollNo, branch }, ref) => {
  return (
    <div className="noc-container" ref={ref}>
      {/* Logo Placeholder */}
      <div className="noc-header">
        <img src={logo} alt="College Logo" className="college-logo" />
        <h2>SUMATHI REDDY INSTITUTE OF TECHNOLOGY FOR WOMEN</h2>
        <p>Learning at its best</p>
        <p>AN AUTONOMOUS INSTITUTION</p>
        <h3>NO OBJECTION CERTIFICATE</h3>
      </div>

      {/* Certificate Details */}
      <div className="noc-details">
        <p>Date: {new Date().toLocaleDateString('en-GB')} </p>
        <p>Time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</p>
        <p>
          Certified that Ms. <b>{studentName}</b>, H.T No: 
          <b>{rollNo}</b>, B.Tech <b>{branch}</b> has 
          <b>"NO DUES"</b> to the college.
        </p>
        <p>
          This certificate is issued upon the student's request and after
          verification that all departmental clearances have been obtained.
        </p>
      </div>

      {/* Department Approvals Table */}
      <table className="noc-table">
        <thead>
          <tr>
            <th>Name of the Department/Section</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Examination Branch</td>
            <td className="accepted">Accepted</td>
          </tr>
          <tr>
            <td>Library</td>
            <td className="accepted">Accepted</td>
          </tr>
          <tr>
            <td>Account Section</td>
            <td>
               <table>
                 <tbody>
                   <tr><td>Tuition Fee</td></tr>
                   <tr><td>Bus Fee</td></tr>
                   <tr><td>Hostel Fee</td></tr>
                   <tr><td>Other Fee</td></tr>
                 </tbody>
               </table>
             </td>
          </tr>
          <tr>
            <td>Training and Placement Officer</td>
            <td className="accepted">Accepted</td>
          </tr>
          <tr>
            <td>IEEE/ISTE/CSI</td>
            <td className="accepted">Accepted</td>
          </tr>
          <tr>
            <td>Sports/Games</td>
            <td className="accepted">Accepted</td>
          </tr>
          <tr>
            <td>Mentor</td>
            <td className="accepted">Accepted</td>
          </tr>
          <tr>
            <td>Alumni Association</td>
            <td className="accepted">Accepted</td>
          </tr>
        </tbody>
      </table>

      {/* Scholarship Information */}
      <div className="noc-scholarship">
        <h4>IF Scholarship (RTF) Holder</h4>
        <p>Scholarship Application No.</p>
        <p>Scholarship Status (Attach Status Report)</p>
        <p>Remarks of the HoD:</p>
      </div>

      {/* Signatures */}
      <div className="noc-signatures">
        {/* <div className="signature-block">
          <p>Head of Department</p>
        </div> */}
        <div className="signature-block">
          <p>Administrative Officer</p>
        </div>
        <div className="signature-block">
          <p>Principal</p>
        </div>
      </div>

      {/* Footer */}
      {/* <div className="noc-footer">
        <p>This NOC is valid for a period of 6 months from the date of issue.</p>
      </div> */}
    </div>
  );
});

export default NocPdf;
