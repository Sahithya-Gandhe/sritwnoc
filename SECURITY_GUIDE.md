# Security Guide - Immediate Actions Required

## ⚠️ CRITICAL: Your credentials have been exposed!

Based on the security scan results, the following sensitive files have been publicly exposed:

1. **Frontend .env file** - Contains Firebase API keys
2. **Backend send-email.js** - Contains SMTP credentials
3. **Backend serviceAccountKey.json** - Contains Google Cloud/Firebase service account keys

## 🔥 IMMEDIATE ACTIONS REQUIRED

### 1. Rotate All Exposed Credentials

**Firebase Credentials:**
- Go to Firebase Console → Project Settings → Service Accounts
- Generate a new private key (this will invalidate the old one)
- Update your environment variables with the new key

**SMTP Credentials:**
- Change your GoDaddy email password immediately
- Update your environment variables with the new password

**Resend API Key (if used):**
- Go to Resend dashboard and revoke the current API key
- Generate a new API key and update your environment variables

### 2. Environment Variable Setup

Create a new [.env](file:///c:/Users/GRK/OneDrive/Desktop/NOC_NEW/sritwnoc/backend/.env) file in your backend directory with the following structure:

```env
# GoDaddy SMTP Configuration
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=465
SMTP_USER=your_new_email@yourdomain.com
SMTP_PASS=your_new_password

# Server Configuration
BACKEND_URL=https://your-backend-url.vercel.app
FRONTEND_URL=https://your-frontend-url.vercel.app

# Email Configuration
FROM_EMAIL=your_new_email@yourdomain.com
REPLY_TO_EMAIL=your_new_email@yourdomain.com
VERIFIED_TEST_EMAIL=your_verified_email@yourdomain.com

# Firebase Configuration (new service account key)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_new_private_key_id
FIREBASE_PRIVATE_KEY=your_new_private_key
FIREBASE_CLIENT_EMAIL=your_client_email@project_id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_X509_CERT_URL=your_cert_url

# Resend Configuration (if used)
RESEND_API_KEY=your_new_resend_api_key
FROM_EMAIL_RESEND=your_new_email@yourdomain.com

# Testing Configuration
TESTING_MODE=false

# Database URL
DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

### 3. Frontend Environment Variables

Create a new [.env.local](file:///c:/Users/GRK/OneDrive/Desktop/NOC_NEW/sritwnoc/frontend/.env.local) file in your frontend directory:

```env
# API Configuration
VITE_API_URL=https://your-backend-url.vercel.app
VITE_BACKEND_URL=https://your-backend-url.vercel.app

# Firebase Configuration (new keys)
VITE_FIREBASE_API_KEY=your_new_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Update Your Repository

1. **Remove sensitive files from git history:**
   ```bash
   # Remove the files from git history
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch backend/.env frontend/.env backend/serviceAccountKey.json' \
   --prune-empty --tag-name-filter cat -- --all
   
   # Push the changes
   git push origin --force --all
   ```

2. **Add all sensitive files to [.gitignore](file:///c:/Users/GRK/OneDrive/Desktop/NOC_NEW/sritwnoc/.gitignore):**
   The [.gitignore](file:///c:/Users/GRK/OneDrive/Desktop/NOC_NEW/sritwnoc/.gitignore) file has already been updated in this repository to prevent future exposure.

### 5. Deploy Updated Code

1. **Redeploy your backend and frontend** to ensure the new environment variables are used
2. **Test email functionality** with the new credentials
3. **Verify Firebase connection** with the new service account key

### 6. Monitor for Unauthorized Activity

- Check Firebase usage logs for unusual activity
- Monitor your email account for unauthorized access
- Check Resend dashboard for unexpected email sending (if used)

## 🔐 Best Practices for Future Security

1. **Never commit sensitive files** to version control
2. **Use environment variables** for all credentials
3. **Regularly rotate credentials** (every 90 days)
4. **Use [.env.example](file:///c:/Users/GRK/OneDrive/Desktop/NOC_NEW/sritwnoc/backend/.env.example) files** to document required variables without exposing values
5. **Enable 2-factor authentication** on all accounts
6. **Use service accounts with minimal required permissions**
7. **Regularly audit your code** for exposed credentials

## 🆘 Need Help?

If you need assistance with any of these steps:
1. Generate new Firebase service account keys
2. Configure environment variables
3. Test email functionality
4. Deploy the updated application

Please reach out for support. Security is critical, and we're here to help you secure your application properly.