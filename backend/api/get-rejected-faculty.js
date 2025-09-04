const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID || "sritwnoc",
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
      universe_domain: "googleapis.com"
    }),
    projectId: process.env.FIREBASE_PROJECT_ID || "sritwnoc"
  });
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { rollNo } = req.query;

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
}