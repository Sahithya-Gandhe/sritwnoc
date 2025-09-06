import React from "react";

import "./BonafidePdf.css";

import logo from "../assets/logo3.png";



const BonafidePdf = React.forwardRef(

  ({ studentName, fatherName, academicYear, course, branch, rollNo, adminNo, conduct }, ref) => {

    const currentDate = new Date();

    const formattedDate = `${currentDate.getDate().toString().padStart(2, "0")}/${

      (currentDate.getMonth() + 1).toString().padStart(2, "0")

    }/${currentDate.getFullYear()}`;



    // Format time as HH:MM:SS

    const formattedTime = currentDate.toLocaleTimeString("en-GB", {

      hour: "2-digit",

      minute: "2-digit",

      second: "2-digit",

    });



    return (

      <div className="certificate-container" ref={ref}>

        {/* Header */}

        <div className="certificate-header">

          <img src={logo} alt="College Logo" className="certificate-logo" />

          <h2>SUMATHI REDDY INSTITUTE OF TECHNOLOGY FOR WOMEN</h2>

          <p className="certificate-address">Ananthasagar, Warangal - 506 371</p>

        </div>



        {/* Certificate No (Time) and Date */}

        <div className="certificate-no-date">

          <div>

            Time: <span className="certificate-field" style={{ width: "120px" }}>{formattedTime}</span>

          </div>

          <div>

            Date: <span className="certificate-field" style={{ width: "120px" }}>{formattedDate}</span>

          </div>

        </div>



        {/* Title */}

        <div className="certificate-title">BONAFIDE / CONDUCT CERTIFICATE</div>



        {/* Body */}

        <div className="certificate-body">

          <div className="certificate-line">

            <span className="label">This is to Certify that Ms.</span>

            <span className="certificate-field">{studentName}</span>

          </div>



          <div className="certificate-line">

            <span className="label">D/o</span>

            <span className="certificate-field">{fatherName}</span>

          </div>



          <div className="certificate-line">

            <span className="label">Was a bonafide student of this college during the academic year</span>

            <span className="certificate-field">{academicYear}</span>

          </div>



          <div className="certificate-line">

            <span className="label">and studied</span>

            <span className="certificate-field">{course}</span>

            <span className="label">in Branch:</span>
            <br></br>
            <span className="certificate-field">{branch} .<br></br></span>
            <span className="certificate-field">{branch} .<br></br></span>
          </div>



          <div className="certificate-line">

            <span className="label">His/Her Roll No.</span>

            <span className="certificate-field">{rollNo}</span>

            <span className="label">& Admin. No.</span>

            <span className="certificate-field">{adminNo}</span>

          </div>



          <div className="certificate-line">

            <span className="label">His/Her Conduct is</span>

            <span className="certificate-field">Satisfactory</span>

          </div>

        </div>

        <br></br>
        <br></br>
        <br></br>
        <br></br>


        {/* Signature with spacing */}

        <div style={{ marginTop: "60px", textAlign: "right", paddingRight: "50px" }}>

          <div className="certificate-signature">PRINCIPAL</div>

        </div>

      </div>

    );

  }

);



export default BonafidePdf;