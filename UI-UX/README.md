# MainDevEnv-CRAB-UIUX Features

This document provides a comprehensive overview of the features, components, and functionality of the MainDevEnv-CRAB-UIUX application.

## System Overview

MainDevEnv-CRAB-UIUX is a web application designed for conducting technical interviews and coding assessments. The system consists of both candidate-facing and admin-facing interfaces with the following core features:

- User authentication and authorization
- Automated interview sessions with AI-powered interaction
- Coding assessment environments
- Candidate session recording and monitoring
- Comprehensive admin dashboard for management

## Architecture

The application follows a MERN stack architecture:

- **Frontend**: React.js application
- **Backend**: Node.js/Express server
- **Database**: MongoDB
- **Cloud Services**: GCP (Google Cloud Platform) integration

## Core Components

### 1. Authentication System

- User login/signup
- Role-based access control (Admin vs Candidate)
- JWT-based authentication
- SSO integration with Microsoft

### 2. Interview Module

#### Candidate Features
- **InterviewScreen**: Main interface for candidates during interview sessions
- **Chat Interface**: AI-powered chatbot for conducting interviews
- **Video Recording**: Records candidate during the interview session
- **Session Management**: Tracks start/end time and completion status

#### Admin Features
- **Interview Assignment**: Assign interviews to candidates
- **Scheduling**: Set interview dates and time slots
- **Drive Management**: Create and manage interview drives
- **Result Processing**: View and analyze interview results

### 3. Coding Assessment Module

- **CodingScreen**: Interactive coding environment for candidates
- **CodingChat**: AI-powered interaction for coding problems and guidance
- **EnhancedCodingInput**: Custom code editor interface
- **Session Recording**: Monitors and records candidate activity

### 4. Admin Dashboard

- **User Management**: Add/edit/view candidate information
- **Upload Associates**: Bulk user management
- **JD Management**: Create and manage job descriptions
- **Result Analysis**: View assessment results
- **Leaderboard**: Rankings and performance metrics
- **Download Results**: Export assessment data

### 5. Media Processing

- **Video Recording**: Capture candidate during sessions
- **Screen Recording**: Monitor candidate activity
- **Audio Processing**: Voice interaction support

### 6. External Integrations

- **WhisperFastAPI**: Speech-to-text functionality
- **Cloud Functions**: Various GCP functions for processing data
  - Text-to-speech (TTS)
  - Speech-to-text (STT)
  - AI chat capabilities
  - Interview completion checks
  - Cover letter processing

## Database Models

### User Model
- Basic user information (name, email, password)
- Role-based access (isAdmin flag)
- Interview associations
- Security features (CSRF protection, password hashing)

### Interview Model
- Session tracking (UUID, timestamps)
- User association
- Interview status management
- Chat logs and session recordings
- Result storage

### JD Model
- Job description details
- Skill requirements
- Question patterns and banks
- Difficulty levels

### Evaluation Model
- Assessment results
- Scoring metrics
- Performance analytics

## Security Features

- Password hashing with bcrypt
- JWT authentication
- CSRF protection
- Helmet.js for HTTP security headers
- Content Security Policy implementation
- Input sanitization for MongoDB queries

## Frontend Features

- Responsive design with Bootstrap
- React Router for navigation
- Redux for state management
- Real-time chat interfaces
- Video components
- Data export capabilities
- Form validation
- Error handling and recovery mechanisms

## Backend APIs

### User Routes
- Authentication endpoints
- User management
- Profile updates

### Upload Routes
- File upload handlers
- Image processing
- Document management

### Function Routes
- External service integrations
- Cloud function interactions

### Coding Routes
- Code execution
- Assessment management
- Result processing

## System Requirements

- Node.js environment
- MongoDB database
- GCP service account access
- Various environment variables for configuration

## Deployment Architecture

- Backend server deployment
- Frontend static serving
- GCP cloud function integration
- MongoDB Atlas connection

## Application Flow

### Candidate Experience
1. Login to the system
2. Upload profile image (required)
3. Select interview or coding assessment
4. Complete session with AI interviewer
5. Submit responses and end session
6. Optionally provide feedback

### Admin Experience
1. Login with admin credentials
2. Upload job descriptions and configure assessments
3. Add candidates and assign to drives
4. Schedule interviews and coding sessions
5. Monitor progress and completion status
6. Download and analyze results



---------------------------------



# DEV NOTES: For testing in local dev environment

1. use env.development
2. use server_dev.js as server.js 
3. use key.pem and cert.pem by uploading it in Backend
4. run an ssh tunnelling command to be able to access the vm
```
gcloud compute ssh savant-mongodb-vm \ # vm name
    --project=cog01k2y024cd8wbctssq11xdjrs6 \ # project id
    --zone=us-central1-a \
    --tunnel-through-iap \
    -- -N -L 27017:localhost:27017 &
```
5. after these steps, run start_server.sh 

# PROD NOTES: Before prod
1. use original server.js which does not use key and cert pem
2. delete key and cert pem files

SSL PEM FILES GENERATION GUIDE:
```
# SSL Certificate Setup Guide

 This guide explains how to generate self-signed SSL certificates for local development on any EC2 instance.

 ## Prerequisites

 - OpenSSL installed (comes pre-installed on most Linux distributions)
 - Access to your EC2 instance terminal

 ## Step 1: Find Your EC2 Instance IP Address

 First, determine your EC2 instance's public IP address:

 ```bash
 curl -s http://checkip.amazonaws.com
 ```

 Or check your AWS console to find the public IPv4 address.

 ## Step 2: Generate SSL Certificates

 Navigate to the Backend directory:

 ```bash
 cd /home/ubuntu/CRAB-Google-Repo/UI-UX/Backend
 ```

 Run the following OpenSSL command to generate your certificate and private key:

 ```bash
 openssl req -x509 -newkey rsa:4096 \
   -keyout key.pem \
   -out cert.pem \
   -days 365 \
   -nodes \
   -subj "/C=IN/ST=TamilNadu/L=Chennai/O=Cognizant/OU=AIA/CN=YOUR_EC2_IP/emailAddress=your-email@example.com" \
   -addext "subjectAltName = IP:YOUR_EC2_IP,DNS:localhost"
 ```

 ### Important: Replace the following values:

 - **`YOUR_EC2_IP`** - Replace with your actual EC2 public IP (appears twice in the command)
 - **`your-email@example.com`** - Replace with your email address

 ### Example with actual IP:

 If your EC2 IP is `54.123.45.67`:

 ```bash
 openssl req -x509 -newkey rsa:4096 \
   -keyout key.pem \
   -out cert.pem \
   -days 365 \
   -nodes \
   -subj "/C=IN/ST=TamilNadu/L=Chennai/O=Cognizant/OU=AIA/CN=54.123.45.67/emailAddress=john.doe@cognizant.com" \
   -addext "subjectAltName = IP:54.123.45.67,DNS:localhost"
 ```

 ## Step 3: Verify Certificate Generation

 Check that both files were created:

 ```bash
 ls -lh key.pem cert.pem
 ```

 You should see two files:
 - `key.pem` (approximately 3.2 KB) - Your private key
 - `cert.pem` (approximately 2.2 KB) - Your public certificate

 ## Step 4: Verify Certificate Details

 To check the certificate expiration and details:

 ```bash
 openssl x509 -in cert.pem -noout -dates -subject
 ```

 Output should show:
 - `notBefore`: Certificate creation date
 - `notAfter`: Certificate expiration date (1 year from creation)
 - `subject`: Certificate details including your IP

 ## Step 5: Update Environment Variables (if needed)

 If your EC2 IP changed, update the `.env` file:

 ```bash
 cd /home/ubuntu/CRAB-Google-Repo/UI-UX
 nano .env
 ```

 Update the `CORS_ORIGINS` line to include your new IP:

 ```
 CORS_ORIGINS="https://YOUR_NEW_EC2_IP:8080;https://cognizant-role-accredit-bot-dot-cog01k2y024cd8wbctssq11xdjrs6.uc
 .r.appspot.com;https://login.microsoftonline.com;https://graph.microsoft.com"
 ```

 ## Step 6: Restart the Server

 The server will automatically restart if nodemon is running. Otherwise, restart manually:

 ```bash
 ./start_server.sh
 ```

 ## Understanding the OpenSSL Parameters

 | Parameter | Description |
 |-----------|-------------|
 | `-x509` | Generate a self-signed certificate |
 | `-newkey rsa:4096` | Create a new 4096-bit RSA key pair |
 | `-keyout key.pem` | Output filename for private key |
 | `-out cert.pem` | Output filename for certificate |
 | `-days 365` | Certificate validity period (1 year) |
 | `-nodes` | Don't encrypt the private key (no password required) |
 | `-subj` | Certificate subject information |
 | `-addext` | Add Subject Alternative Name (required for modern browsers) |

 ## Security Notes

 ⚠️ **Important Security Considerations:**

 1. **Private Key Security**: The `key.pem` file contains your private key. Never commit it to Git or share it
 publicly.

 2. **Self-Signed Certificates**: These certificates are for development only. Browsers will show security warnings
 because they're not signed by a trusted Certificate Authority.

 3. **Production Environment**: For production, use proper SSL certificates from:
    - Let's Encrypt (free)
    - AWS Certificate Manager (for AWS hosted services)
    - Commercial Certificate Authority

 4. **Certificate Expiration**: Self-signed certificates expire after 365 days. Set a reminder to regenerate before
 expiration.

 5. **Git Ignore**: Ensure `key.pem` and `cert.pem` are in `.gitignore` to prevent accidental commits.

 ## Troubleshooting

 ### Certificate Expired Error

 If you see certificate errors, check expiration:

 ```bash
 openssl x509 -in Backend/cert.pem -noout -enddate
 ```

 If expired, regenerate using Step 2.

 ### Browser Security Warnings

 When accessing `https://YOUR_EC2_IP:8080`:

 - **Chrome**: Click "Advanced" → "Proceed to [IP] (unsafe)"
 - **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
 - **Safari**: Click "Show Details" → "visit this website"

 This is expected for self-signed certificates.

 ### Server Not Starting

 If the server crashes after certificate generation:

 1. Verify file permissions:
    ```bash
    chmod 644 Backend/cert.pem
    chmod 600 Backend/key.pem
    ```

 2. Check Server.js is reading from correct path:
    ```bash
    grep -A 2 "readFileSync" Backend/Server.js
    ```

 ## Quick Reference

 ### Generate new certificates (one-liner):

 ```bash
 cd Backend && openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj
 "/C=IN/ST=TamilNadu/L=Chennai/O=Cognizant/OU=AIA/CN=$(curl -s
 http://checkip.amazonaws.com)/emailAddress=your-email@example.com" -addext "subjectAltName = IP:$(curl -s
 http://checkip.amazonaws.com),DNS:localhost"
 ```

 (Remember to replace `your-email@example.com` with your actual email)

 ### Check certificate expiration:

 ```bash
 openssl x509 -in Backend/cert.pem -noout -enddate
 ```

 ### View full certificate details:

 ```bash
 openssl x509 -in Backend/cert.pem -noout -text
 ```

 ---
```