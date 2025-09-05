const express = require("express");
const { Resend } = require("resend");
const cors = require("cors");
const admin = require("firebase-admin");

// Initialize app
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Firebase Admin (for Vercel)
if (!admin.apps.length) {
  try {
    // For Vercel deployment, use environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    admin.initializeApp({
      credential: admin.credential.cert({
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universe_domain: "googleapis.com"
      }),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    console.log('Firebase Admin initialized for Vercel');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();

// Routes
app.post("/send-email", async (req, res) => {
  const { studentName, rollNo, branch, mentor, email, facultyEmails } = req.body;

  console.log('Email sending request received:', {
    studentName,
    rollNo,
    facultyEmails: facultyEmails?.length || 0,
    resendKeyExists: !!process.env.RESEND_API_KEY
  });

  // Validate Resend API key
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set in environment variables');
    return res.status(500).json({ 
      success: false, 
      message: "Email service not configured. Missing API key." 
    });
  }

  try {
    const emailsSent = [];
    const emailsFailed = [];
    
    // TESTING MODE: During development, send to verified email only
    const testingMode = process.env.TESTING_MODE === 'true'; // Controlled by environment variable
    const verifiedEmail = process.env.VERIFIED_TEST_EMAIL; // Your verified email
    const backendUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.BACKEND_URL;
    
    // Validate required environment variables
    if (testingMode && !verifiedEmail) {
      return res.status(500).json({ 
        success: false, 
        message: "Testing mode enabled but VERIFIED_TEST_EMAIL not set" 
      });
    }
    
    if (!backendUrl) {
      return res.status(500).json({ 
        success: false, 
        message: "BACKEND_URL not set in environment variables" 
      });
    }
    
    // Loop through each selected faculty email
    for (let facultyEmail of facultyEmails) {
      try {
        const recipientEmail = testingMode ? verifiedEmail : facultyEmail;
        console.log(`Sending email to: ${recipientEmail} ${testingMode ? '(intended for ' + facultyEmail + ')' : ''}`);
        
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
              <div class="info-row"><span><strong>Mentor:</strong></span><span>${mentor}</span></div>
              <div class="info-row"><span><strong>Email:</strong></span><span>${email}</span></div>
            </div>
            <div class="buttons">
              <a href="${backendUrl}/api/noc-request/accept?rollNo=${rollNo}&facultyEmail=${encodeURIComponent(facultyEmail)}" class="btn btn-accept">✅ Accept</a>
              <a href="${backendUrl}/api/noc-request/reject?rollNo=${rollNo}&facultyEmail=${encodeURIComponent(facultyEmail)}" class="btn btn-reject">❌ Reject</a>
            </div>
            <p style="text-align: center; color: #666; font-size: 14px;">Please click one of the buttons above to register your decision.</p>
          </div>
        </body>
        </html>
      `;

        const fromEmail = process.env.FROM_EMAIL_RESEND;
        if (!fromEmail) {
          throw new Error("FROM_EMAIL_RESEND not set in environment variables");
        }

        await resend.emails.send({
          from: `NOC System <${fromEmail}>`,
          replyTo: process.env.REPLY_TO_EMAIL || fromEmail,
          to: [recipientEmail],
          subject: `NOC Approval Request - ${studentName} (${rollNo}) ${testingMode ? '[TESTING - Faculty: ' + facultyEmail + ']' : ''}`,
          html: emailHtml,
        });
        
        if (testingMode) {
          console.log(`⚠️ TESTING MODE: Email intended for ${facultyEmail} sent to ${recipientEmail} instead`);
          emailsSent.push(`${facultyEmail} (TEST: sent to ${recipientEmail})`);
        } else {
          console.log(`✅ PRODUCTION MODE: Email sent to ${facultyEmail}`);
          emailsSent.push(facultyEmail);
        }
        
      } catch (emailError) {
        console.error(`Failed to send email to ${facultyEmail}:`, emailError);
        
        // Check if it's a domain verification error
        if (emailError.message && emailError.message.includes('domain is not verified')) {
          emailsFailed.push({ 
            email: facultyEmail, 
            error: 'Domain verification required',
            solution: 'Verify domain at https://resend.com/domains or enable testing mode'
          });
        } else if (emailError.message && emailError.message.includes('testing emails')) {
          emailsFailed.push({ 
            email: facultyEmail, 
            error: 'Can only send to verified email during testing',
            solution: 'Enable testing mode or verify domain'
          });
        } else {
          emailsFailed.push({ email: facultyEmail, error: emailError.message });
        }
      }
    }

    // Return detailed response
    if (emailsSent.length > 0) {
      console.log(`Successfully sent ${emailsSent.length} emails`);
      res.json({
        success: true,
        message: `Emails processed for ${emailsSent.length} faculty members`,
        testingMode: testingMode,
        mode: testingMode ? "TESTING" : "PRODUCTION",
        note: testingMode ? 
          `TESTING MODE: All emails redirected to ${verifiedEmail}` : 
          "PRODUCTION MODE: Emails sent to actual faculty addresses",
        details: {
          sent: emailsSent,
          failed: emailsFailed,
          total: facultyEmails.length,
          verifiedEmail: testingMode ? verifiedEmail : null,
          instructions: testingMode ? 
            "All faculty emails are being sent to your verified email address for testing" :
            "Emails are being sent to real faculty addresses using your configured email"
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
    console.error("Error sending emails:", error);
    res.status(500).json({ success: false, message: "Failed to send emails", error: error.message });
  }
});

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
    await nocRef.update({ 
      facultyStatuses,
      finalStatus: "Rejected" 
    });

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

app.get("/test-firebase", async (req, res) => {
  try {
    const testRef = db.collection("test").doc("connection");
    await testRef.set({ timestamp: new Date(), status: "connected" });
    
    res.json({ 
      success: true, 
      message: "Firebase connection successful",
      projectId: process.env.FIREBASE_PROJECT_ID || 'sritwnoc'
    });
  } catch (error) {
    console.error("Firebase test error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Firebase connection failed", 
      error: error.message 
    });
  }
});

app.get("/", (req, res) => {
  res.json({ message: "NOC Management API is running on Vercel" });
});

// Export for Vercel
module.exports = app;