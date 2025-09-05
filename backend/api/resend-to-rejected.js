const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
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
}

// Initialize Nodemailer with GoDaddy SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rollNo, resendMessage } = req.body;

  if (!rollNo) {
    return res.status(400).json({
      success: false,
      message: "Roll number is required"
    });
  }

  try {
    const db = admin.firestore();
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
    const backendUrl = process.env.BACKEND_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    
    if (!backendUrl) {
      return res.status(500).json({ 
        success: false, 
        message: "BACKEND_URL not set in environment variables" 
      });
    }

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
                <a href="${backendUrl}/api/accept?rollNo=${rollNo}&facultyEmail=${encodeURIComponent(facultyEmail)}" class="btn btn-accept">✅ Accept</a>
                <a href="${backendUrl}/api/reject?rollNo=${rollNo}&facultyEmail=${encodeURIComponent(facultyEmail)}" class="btn btn-reject">❌ Reject</a>
              </div>
              
              <p style="text-align: center; color: #666; font-size: 14px;">Please click one of the buttons above to register your decision.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                <p><strong>Contact:</strong> For any queries, please reply to this email (replies go to: ${process.env.REPLY_TO_EMAIL || process.env.FROM_EMAIL})</p>
                <p><strong>System:</strong> NOC Management System</p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Validate required environment variables
        const fromEmail = process.env.FROM_EMAIL;
        if (!fromEmail) {
          throw new Error("FROM_EMAIL not set in environment variables");
        }

        const mailOptions = {
          from: `"NOC System (RESEND)" <${fromEmail}>`,
          to: facultyEmail,
          replyTo: process.env.REPLY_TO_EMAIL || fromEmail,
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
          smtpServer: process.env.SMTP_HOST,
          fromEmail: process.env.FROM_EMAIL
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
}