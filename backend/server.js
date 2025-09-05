const express = require("express");
// const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");
require('dotenv').config();

// Initialize Nodemailer with GoDaddy SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'rudra@exoticaexperience.in',
    pass: process.env.SMTP_PASS
  },
  // Additional GoDaddy specific settings
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  }
});

// Log SMTP configuration (without password)
console.log('📧 SMTP Configuration:');
console.log(`  Host: ${process.env.SMTP_HOST || 'smtpout.secureserver.net'}`);
console.log(`  Port: ${process.env.SMTP_PORT || 465}`);
console.log(`  User: ${process.env.SMTP_USER || 'rudra@exoticaexperience.in'}`);
console.log(`  Password: ${process.env.SMTP_PASS ? '[SET - LENGTH: ' + process.env.SMTP_PASS.length + ']' : '[NOT SET - PLEASE UPDATE .env FILE]'}`);

// Verify environment variables are loaded
if (!process.env.SMTP_PASS) {
  console.error('❌ CRITICAL: SMTP_PASS not found in environment variables!');
} else if (process.env.SMTP_PASS.length < 5) {
  console.warn('⚠️  WARNING: SMTP_PASS seems too short, please verify it is correct');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL || "https://sritwnoc-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// Email sending route
app.post("/send-email", async (req, res) => {
  const { studentName, rollNo, branch, year, mentor, email, facultyEmails } = req.body;

  console.log('Email sending request received:', {
    studentName,
    rollNo,
    facultyEmails: facultyEmails?.length || 0,
    transporterConfigured: !!transporter
  });

  // Test transporter configuration
  try {
    await transporter.verify();
    console.log('✅ SMTP server connection verified');
  } catch (error) {
    console.error('❌ SMTP server connection failed:', error);
    // More detailed error response
    return res.status(500).json({ 
      success: false, 
      message: "Email service configuration error. SMTP connection failed.",
      error: error.message,
      details: {
        code: error.code,
        response: error.response,
        command: error.command
      }
    });
  }

  try {
    const emailsSent = [];
    const emailsFailed = [];

    // Loop through each selected faculty email
    for (let facultyEmail of facultyEmails) {
      try {
        console.log(`Sending email to: ${facultyEmail}`);
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>NOC Approval Request - ${studentName}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
              .header { text-align: center; color: #2c3e50; margin-bottom: 30px; }
              .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
              .buttons { text-align: center; margin: 30px 0; }
              .btn { display: inline-block; padding: 12px 30px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .btn-accept { background: #28a745; color: white; }
              .btn-reject { background: #dc3545; color: white; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎓 NOC Approval Request</h1>
              </div>
              <p>Dear Faculty Member,</p>
              <p>A student has submitted a No Objection Certificate request that requires your approval.</p>
              <div class="info">
                <h3>Student Information</h3>
                <div class="info-row"><span><strong>Name:</strong></span><span>${studentName}</span></div>
                <div class="info-row"><span><strong>Roll No:</strong></span><span>${rollNo}</span></div>
                <div class="info-row"><span><strong>Branch:</strong></span><span>${branch}</span></div>
                <div class="info-row"><span><strong>Year:</strong></span><span>${year || 'N/A'}</span></div>
                <div class="info-row"><span><strong>Mentor:</strong></span><span>${mentor}</span></div>
                <div class="info-row"><span><strong>Email:</strong></span><span>${email}</span></div>
              </div>
              <div class="buttons">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/noc-request/accept?rollNo=${rollNo}&facultyEmail=${encodeURIComponent(facultyEmail)}" class="btn btn-accept">✅ Accept</a>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/noc-request/reject?rollNo=${rollNo}&facultyEmail=${encodeURIComponent(facultyEmail)}" class="btn btn-reject">❌ Reject</a>
              </div>
              <p style="text-align: center; color: #666; font-size: 14px;">Please click one of the buttons above to register your decision.</p>
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                <p><strong>Contact:</strong> For any queries, please reply to this email (replies go to: ${process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL || 'rudra@exoticaexperience.in'})</p>
                <p><strong>System:</strong> NOC Management System</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email using nodemailer
        const mailOptions = {
          from: `"NOC System" <${process.env.FROM_EMAIL || 'rudra@exoticaexperience.in'}>`,
          to: facultyEmail,
          replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL || 'rudra@exoticaexperience.in',
          subject: `NOC Approval Request - ${studentName} (${rollNo})`,
          html: emailHtml
        };
        
        const result = await transporter.sendMail(mailOptions);
        
        console.log(`✅ Email sent successfully to ${facultyEmail}:`, result.messageId);
        emailsSent.push(facultyEmail);
        
      } catch (emailError) {
        console.error(`Failed to send email to ${facultyEmail}:`, emailError);
        emailsFailed.push({ 
          email: facultyEmail, 
          error: emailError.message || 'Unknown error'
        });
      }
    }

    // Return detailed response
    if (emailsSent.length > 0) {
      console.log(`Successfully sent ${emailsSent.length} emails`);
      res.json({
        success: true,
        message: `Emails sent to ${emailsSent.length} faculty members`,
        details: {
          sent: emailsSent,
          failed: emailsFailed,
          total: facultyEmails.length,
          smtpServer: process.env.SMTP_HOST || 'smtpout.secureserver.net (GoDaddy)',
          fromEmail: process.env.FROM_EMAIL || 'rudra@exoticaexperience.in'
        }
      });
    } else {
      console.error('All emails failed to send');
      res.status(500).json({ 
        success: false, 
        message: "Failed to send any emails", 
        details: { failed: emailsFailed, total: facultyEmails.length }
      });
    }
    
  } catch (error) {
    console.error("Critical error in email sending:", error);
    res.status(500).json({ 
      success: false, 
      message: "Critical error in email service", 
      error: error.message 
    });
  }
});

// Handle NOC request acceptance
app.get("/noc-request/accept", async (req, res) => {
  const { rollNo, facultyEmail } = req.query;

  if (!rollNo || !facultyEmail) {
    return res.status(400).send(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2 style="color: #dc3545;">❌ Error</h2>
        <p>Missing required parameters.</p>
      </body></html>
    `);
  }

  try {
    const nocRef = db.collection("nocRequests").doc(rollNo);
    const doc = await nocRef.get();

    if (!doc.exists) {
      return res.status(404).send(`
        <html><body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2 style="color: #dc3545;">❌ Not Found</h2>
          <p>NOC request not found for Roll No: ${rollNo}</p>
        </body></html>
      `);
    }

    const data = doc.data();
    const facultyStatuses = data.facultyStatuses || {};
    
    // Check if already responded
    if (facultyStatuses[facultyEmail] && facultyStatuses[facultyEmail] !== "Pending") {
      return res.send(`
        <html><body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2 style="color: #ffc107;">⚠️ Already Responded</h2>
          <p>You have already responded to this NOC request.</p>
          <p>Your response: <strong>${facultyStatuses[facultyEmail]}</strong></p>
        </body></html>
      `);
    }
    
    facultyStatuses[facultyEmail] = "Accepted";
    await nocRef.update({ facultyStatuses });

    // Check final status - MUST have exactly 7 faculty approvals
    // Count total number of "Accepted" statuses
    const acceptedCount = Object.values(facultyStatuses).filter(status => status === "Accepted").length;
    const totalFacultyRequired = 7; // Mentor + 6 other faculty members
    
    console.log(`Faculty acceptance progress: ${acceptedCount}/${totalFacultyRequired}`);
    
    // Only set final status to "Accepted" if ALL 7 faculty members have accepted
    if (acceptedCount === totalFacultyRequired) {
      await nocRef.update({ finalStatus: "Accepted" });
      console.log(`✅ All ${totalFacultyRequired} faculty members have accepted. Final status set to Accepted.`);
    } else {
      console.log(`⏳ Waiting for ${totalFacultyRequired - acceptedCount} more faculty approvals.`);
    }

    res.send(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2 style="color: #28a745;">✅ Request Accepted</h2>
        <p>NOC request for <strong>${data.studentName}</strong> (${rollNo}) has been accepted.</p>
        <p>Thank you for your response!</p>
      </body></html>
    `);
  } catch (error) {
    console.error("Error accepting NOC request:", error);
    res.status(500).send(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2 style="color: #dc3545;">❌ Server Error</h2>
        <p>Error: ${error.message}</p>
      </body></html>
    `);
  }
});

// Handle NOC request rejection
app.get("/noc-request/reject", async (req, res) => {
  const { rollNo, facultyEmail } = req.query;

  if (!rollNo || !facultyEmail) {
    return res.status(400).send(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2 style="color: #dc3545;">❌ Error</h2>
        <p>Missing required parameters.</p>
      </body></html>
    `);
  }

  try {
    const nocRef = db.collection("nocRequests").doc(rollNo);
    const doc = await nocRef.get();

    if (!doc.exists) {
      return res.status(404).send(`
        <html><body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2 style="color: #dc3545;">❌ Not Found</h2>
          <p>NOC request not found for Roll No: ${rollNo}</p>
        </body></html>
      `);
    }

    const data = doc.data();
    const facultyStatuses = data.facultyStatuses || {};
    
    // Check if already responded
    if (facultyStatuses[facultyEmail] && facultyStatuses[facultyEmail] !== "Pending") {
      return res.send(`
        <html><body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2 style="color: #ffc107;">⚠️ Already Responded</h2>
          <p>You have already responded to this NOC request.</p>
          <p>Your response: <strong>${facultyStatuses[facultyEmail]}</strong></p>
        </body></html>
      `);
    }
    
    facultyStatuses[facultyEmail] = "Rejected";
    
    // Count rejected and accepted statuses
    const rejectedCount = Object.values(facultyStatuses).filter(status => status === "Rejected").length;
    const acceptedCount = Object.values(facultyStatuses).filter(status => status === "Accepted").length;
    const totalFacultyRequired = 7;
    
    console.log(`Faculty rejection: ${rejectedCount} rejected, ${acceptedCount} accepted out of ${totalFacultyRequired}`);
    
    // Only set final status to "Rejected" if all faculty have responded and there are rejections
    // Otherwise, keep it as "Pending" so student can resend to rejected faculty
    const respondedCount = rejectedCount + acceptedCount;
    
    if (respondedCount === totalFacultyRequired) {
      if (rejectedCount > 0) {
        // Some rejections exist, but don't set final status to rejected yet
        // Student should be able to resend to rejected faculty
        await nocRef.update({ 
          facultyStatuses,
          finalStatus: "Partially Rejected", // New status for partial rejection
          lastRejectedAt: new Date().toISOString() // Track when rejection occurred
        });
        console.log(`⚠️ ${rejectedCount} faculty rejected. Status set to 'Partially Rejected' for resending.`);
      } else {
        // All accepted
        await nocRef.update({ 
          facultyStatuses,
          finalStatus: "Accepted" 
        });
        console.log(`✅ All faculty accepted. Final status set to Accepted.`);
      }
    } else {
      // Not all faculty have responded yet
      await nocRef.update({ 
        facultyStatuses,
        finalStatus: "Pending"
      });
      console.log(`⏳ Waiting for ${totalFacultyRequired - respondedCount} more faculty responses.`);
    }

    res.send(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2 style="color: #dc3545;">❌ Request Rejected</h2>
        <p>NOC request for <strong>${data.studentName}</strong> (${rollNo}) has been rejected.</p>
        <p>Thank you for your response!</p>
      </body></html>
    `);
  } catch (error) {
    console.error("Error rejecting NOC request:", error);
    res.status(500).send(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2 style="color: #dc3545;">❌ Server Error</h2>
        <p>Error: ${error.message}</p>
      </body></html>
    `);
  }
});

// Get rejected faculty emails for resending
app.get("/get-rejected-faculty/:rollNo", async (req, res) => {
  const { rollNo } = req.params;

  if (!rollNo) {
    return res.status(400).json({
      success: false,
      message: "Roll number is required"
    });
  }

  try {
    const nocRef = db.collection("nocRequests").doc(rollNo);
    const doc = await nocRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "NOC request not found"
      });
    }

    const data = doc.data();
    const facultyStatuses = data.facultyStatuses || {};
    
    // Get all rejected faculty emails
    const rejectedFaculty = [];
    const pendingFaculty = [];
    const acceptedFaculty = [];
    
    for (const [email, status] of Object.entries(facultyStatuses)) {
      if (status === "Rejected") {
        rejectedFaculty.push(email);
      } else if (status === "Pending") {
        pendingFaculty.push(email);
      } else if (status === "Accepted") {
        acceptedFaculty.push(email);
      }
    }
    
    console.log(`Rejected faculty for ${rollNo}:`, rejectedFaculty);
    
    res.json({
      success: true,
      data: {
        rollNo: rollNo,
        studentName: data.studentName,
        finalStatus: data.finalStatus,
        rejectedFaculty: rejectedFaculty,
        pendingFaculty: pendingFaculty,
        acceptedFaculty: acceptedFaculty,
        totalRejected: rejectedFaculty.length,
        totalPending: pendingFaculty.length,
        totalAccepted: acceptedFaculty.length,
        canResend: rejectedFaculty.length > 0 && (data.finalStatus === "Partially Rejected" || data.finalStatus === "Pending"),
        lastRejectedAt: data.lastRejectedAt
      }
    });
    
  } catch (error) {
    console.error("Error getting rejected faculty:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get rejected faculty list",
      error: error.message
    });
  }
});

// Resend NOC request to rejected faculty only
app.post("/resend-to-rejected", async (req, res) => {
  const { rollNo, resendMessage } = req.body;

  if (!rollNo) {
    return res.status(400).json({
      success: false,
      message: "Roll number is required"
    });
  }

  try {
    const nocRef = db.collection("nocRequests").doc(rollNo);
    const doc = await nocRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "NOC request not found"
      });
    }

    const data = doc.data();
    const facultyStatuses = data.facultyStatuses || {};
    
    // Get rejected faculty emails
    const rejectedFacultyEmails = [];
    for (const [email, status] of Object.entries(facultyStatuses)) {
      if (status === "Rejected") {
        rejectedFacultyEmails.push(email);
        // Reset status to Pending for resend
        facultyStatuses[email] = "Pending";
      }
    }
    
    if (rejectedFacultyEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No rejected faculty found for this request"
      });
    }

    // Test transporter configuration
    await transporter.verify();
    console.log('✅ SMTP server connection verified for resend');

    const emailsSent = [];
    const emailsFailed = [];

    // Send emails only to rejected faculty
    for (let facultyEmail of rejectedFacultyEmails) {
      try {
        console.log(`Resending email to: ${facultyEmail}`);
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>NOC Approval Request (RESEND) - ${data.studentName}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
              .header { text-align: center; color: #2c3e50; margin-bottom: 30px; }
              .resend-notice { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
              .buttons { text-align: center; margin: 30px 0; }
              .btn { display: inline-block; padding: 12px 30px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: bold; }
              .btn-accept { background: #28a745; color: white; }
              .btn-reject { background: #dc3545; color: white; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔄 NOC Approval Request (RESEND)</h1>
              </div>
              
              <div class="resend-notice">
                <h3 style="color: #856404; margin-top: 0;">⚠️ This is a Resend Request</h3>
                <p style="color: #856404; margin-bottom: 0;">The student is resubmitting this NOC request for your reconsideration.</p>
                ${resendMessage ? `<p style="color: #856404;"><strong>Student's message:</strong> ${resendMessage}</p>` : ''}
              </div>
              
              <p>Dear Faculty Member,</p>
              <p>A student has resubmitted a No Objection Certificate request that requires your approval.</p>
              
              <div class="info">
                <h3>Student Information</h3>
                <div class="info-row"><span><strong>Name:</strong></span><span>${data.studentName}</span></div>
                <div class="info-row"><span><strong>Roll No:</strong></span><span>${data.rollNo}</span></div>
                <div class="info-row"><span><strong>Branch:</strong></span><span>${data.branch}</span></div>
                <div class="info-row"><span><strong>Year:</strong></span><span>${data.year || 'N/A'}</span></div>
                <div class="info-row"><span><strong>Mentor:</strong></span><span>${data.mentor}</span></div>
                <div class="info-row"><span><strong>Email:</strong></span><span>${data.email}</span></div>
              </div>
              
              <div class="buttons">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/noc-request/accept?rollNo=${rollNo}&facultyEmail=${encodeURIComponent(facultyEmail)}" class="btn btn-accept">✅ Accept</a>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/noc-request/reject?rollNo=${rollNo}&facultyEmail=${encodeURIComponent(facultyEmail)}" class="btn btn-reject">❌ Reject</a>
              </div>
              
              <p style="text-align: center; color: #666; font-size: 14px;">Please click one of the buttons above to register your decision.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                <p><strong>Contact:</strong> For any queries, please reply to this email (replies go to: ${process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL || 'rudra@exoticaexperience.in'})</p>
                <p><strong>System:</strong> NOC Management System</p>
              </div>
            </div>
          </body>
          </html>
        `;

        const mailOptions = {
          from: `"NOC System (RESEND)" <${process.env.FROM_EMAIL || 'rudra@exoticaexperience.in'}>`,
          to: facultyEmail,
          replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL || 'rudra@exoticaexperience.in',
          subject: `NOC Approval Request (RESEND) - ${data.studentName} (${rollNo})`,
          html: emailHtml
        };
        
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Resend email sent successfully to ${facultyEmail}:`, result.messageId);
        emailsSent.push(facultyEmail);
        
      } catch (emailError) {
        console.error(`Failed to resend email to ${facultyEmail}:`, emailError);
        emailsFailed.push({ 
          email: facultyEmail, 
          error: emailError.message || 'Unknown error'
        });
      }
    }

    // Update database with new pending statuses and resend timestamp
    await nocRef.update({ 
      facultyStatuses,
      finalStatus: "Pending",
      lastResendAt: new Date().toISOString(),
      resendCount: (data.resendCount || 0) + 1
    });

    // Return response
    if (emailsSent.length > 0) {
      console.log(`Successfully resent ${emailsSent.length} emails to rejected faculty`);
      res.json({
        success: true,
        message: `Resend emails sent to ${emailsSent.length} rejected faculty members`,
        details: {
          sent: emailsSent,
          failed: emailsFailed,
          total: rejectedFacultyEmails.length,
          resendCount: (data.resendCount || 0) + 1,
          smtpServer: process.env.SMTP_HOST || 'smtpout.secureserver.net (GoDaddy)',
          fromEmail: process.env.FROM_EMAIL || 'rudra@exoticaexperience.in'
        }
      });
    } else {
      console.error('All resend emails failed');
      res.status(500).json({ 
        success: false, 
        message: "Failed to send any resend emails", 
        details: { failed: emailsFailed, total: rejectedFacultyEmails.length }
      });
    }
    
  } catch (error) {
    console.error("Critical error in resend email service:", error);
    res.status(500).json({ 
      success: false, 
      message: "Critical error in resend email service", 
      error: error.message 
    });
  }
});

app.get("/", (req, res) => {
  res.send("NOC Management Server is running");
});

// Test email endpoint
app.post("/test-email", async (req, res) => {
  const { testEmail } = req.body;
  
  if (!testEmail) {
    return res.status(400).json({ 
      success: false, 
      message: "Test email address is required" 
    });
  }

  try {
    // Test transporter configuration
    await transporter.verify();
    console.log('✅ SMTP server connection verified');
    
    const mailOptions = {
      from: `"NOC System Test" <${process.env.FROM_EMAIL || 'rudra@exoticaexperience.in'}>`,
      to: testEmail,
      replyTo: process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL || 'rudra@exoticaexperience.in',
      subject: 'NOC System - Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #28a745;">✅ Email Configuration Test Successful!</h2>
          <p>This is a test email to verify that the NOC System email configuration is working properly.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>SMTP Server:</strong> ${process.env.SMTP_HOST || 'smtpout.secureserver.net (GoDaddy)'}</p>
            <p><strong>From Email:</strong> ${process.env.FROM_EMAIL || 'rudra@exoticaexperience.in'}</p>
            <p><strong>Test Email:</strong> ${testEmail}</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>If you received this email, the email service is configured correctly and ready to send NOC approval requests to faculty members.</p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', result.messageId);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      details: {
        testEmail: testEmail,
        messageId: result.messageId,
        smtpServer: process.env.SMTP_HOST || 'smtpout.secureserver.net (GoDaddy)',
        fromEmail: process.env.FROM_EMAIL || 'rudra@exoticaexperience.in'
      }
    });
    
  } catch (error) {
    console.error('Test email failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test email failed',
      error: error.message
    });
  }
});

// Auto-rejection functionality: Check and auto-reject pending faculty after 24 hours
async function checkAndAutoRejectExpiredRequests() {
  console.log('🔍 Checking for expired pending requests...');
  
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get all NOC requests from Firestore
    const nocRequestsSnapshot = await db.collection('nocRequests').get();
    
    if (nocRequestsSnapshot.empty) {
      console.log('ℹ️ No NOC requests found in database.');
      return;
    }
    
    let autoRejectedCount = 0;
    
    for (const doc of nocRequestsSnapshot.docs) {
      const data = doc.data();
      const rollNo = doc.id;
      const facultyStatuses = data.facultyStatuses || {};
      const requestTimestamp = data.timestamp ? data.timestamp.toDate() : null;
      
      // Skip if no timestamp or request is too new (less than 24 hours)
      if (!requestTimestamp || requestTimestamp > twentyFourHoursAgo) {
        continue;
      }
      
      let hasChanges = false;
      let rejectedThisRound = [];
      
      // Auto-reject all pending faculty after 24 hours
      for (const [email, status] of Object.entries(facultyStatuses)) {
        if (status === "Pending") {
          facultyStatuses[email] = "Rejected";
          hasChanges = true;
          rejectedThisRound.push(email);
          autoRejectedCount++;
        }
      }
      
      if (hasChanges) {
        // Update the document with new statuses
        const acceptedCount = Object.values(facultyStatuses).filter(status => status === "Accepted").length;
        const rejectedCount = Object.values(facultyStatuses).filter(status => status === "Rejected").length;
        const totalRequired = 7;
        
        let finalStatus = data.finalStatus;
        
        // Determine new final status
        if (acceptedCount === totalRequired) {
          finalStatus = "Accepted";
        } else if (rejectedCount > 0) {
          finalStatus = "Partially Rejected"; // Allow resending to rejected faculty
        } else {
          finalStatus = "Pending";
        }
        
        await db.collection('nocRequests').doc(rollNo).update({
          facultyStatuses,
          finalStatus,
          lastAutoRejectionAt: new Date().toISOString(),
          autoRejectedFaculty: rejectedThisRound
        });
        
        console.log(`⏰ Auto-rejected ${rejectedThisRound.length} pending faculty for student ${data.studentName} (${rollNo}):`);
        console.log(`   - Rejected faculty: ${rejectedThisRound.join(', ')}`);
        console.log(`   - New status: ${finalStatus}`);
      }
    }
    
    if (autoRejectedCount === 0) {
      console.log('✅ No expired pending requests found.');
    } else {
      console.log(`✅ Auto-rejection completed. Total faculty auto-rejected: ${autoRejectedCount}`);
    }
    
  } catch (error) {
    console.error('❌ Error in auto-rejection process:', error);
  }
}

// Run auto-rejection check every hour (3600000 ms)
setInterval(checkAndAutoRejectExpiredRequests, 60 * 60 * 1000);

// Run initial check when server starts
setTimeout(() => {
  console.log('🚀 Running initial auto-rejection check...');
  checkAndAutoRejectExpiredRequests();
}, 5000); // Wait 5 seconds after server starts

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Email service: NodeMailer with GoDaddy SMTP (${process.env.FROM_EMAIL || 'rudra@exoticaexperience.in'})`);
  console.log(`Test email endpoint: POST /test-email`);
  console.log(`🔄 Auto-rejection service: Checking every hour for requests older than 24h`);
  console.log(`New endpoints added:`);
  console.log(`  - GET /get-rejected-faculty/:rollNo - Get list of rejected faculty`);
  console.log(`  - POST /resend-to-rejected - Resend emails to rejected faculty only`);
});