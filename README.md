# Internshala Clone — Production-Ready Job & Internship Portal

A modern, full-stack, security-hardened clone of **Internshala** built with **Next.js 15**, **React 19**, **Tailwind CSS**, **Node.js Express**, **MongoDB** (with automated high-performance in-memory fallback), and **Socket.io** real-time applicant push notifications.

---

## 🌟 Key Highlights

- **Complete User Flows**:
  - 🎓 **Student**: Register, login, edit comprehensive profile (skills tags, education history, resume link), search and filter opportunities by category and location, submit application with cover letter, and track real-time application status.
  - 🏢 **Company / Recruiter**: Register, login, publish internships & full-time jobs, manage applicant pipeline in a modern dashboard with sidebars and data tables, receive **instant real-time notifications** when students apply, review cover letters & resumes, and Accept/Reject candidates with one click.
  - 👑 **Admin**: Authenticate via secure JWT credentials, monitor portal analytics & statistics, govern user accounts, and moderate inappropriate internship/job postings.
- **⚡ Real-Time Notifications**: Integrated WebSocket system via **Socket.io** (with fallback event polling). Companies are notified instantly with audio-visual toast notifications whenever a candidate applies.
- **🛡️ Enterprise Security Hardening**:
  - `helmet`: Secure HTTP headers (preventing MIME-sniffing, clickjacking, etc.).
  - `express-rate-limit`: Auth brute-force protection on `/api/auth/*` and admin routes.
  - `express-mongo-sanitize`: Defense against NoSQL injection vectors.
  - `bcryptjs`: Adaptive password hashing with 10 salt rounds.
  - **Strict Role-Based Access Control (RBAC)**: Enforced via middleware (`verifyToken`, `requireRole`). Students are strictly prohibited from accessing Company or Admin routes (returns `403 Forbidden`).

---

## 🏗️ Architecture & Tech Stack

```
internshala-clone/
├── backend/
│   ├── data/
│   │   └── store.js           # Resilient in-memory & file-backed fallback database engine
│   ├── middleware/
│   │   └── auth.js            # JWT verification & strict RBAC authorization middleware
│   ├── Model/
│   │   ├── Application.js     # Application schema & proxy model
│   │   ├── Internship.js      # Internship schema & proxy model
│   │   ├── Job.js             # Job schema & proxy model
│   │   └── User.js            # User profile schema with bcrypt support
│   ├── Routes/
│   │   ├── admin.js           # Admin stats, user management, and moderation
│   │   ├── application.js     # Student apply, company pipeline, status updates, socket events
│   │   ├── auth.js            # Student & company registration and login (rate-limited)
│   │   ├── internship.js      # Internship listings, filters, and creation
│   │   ├── job.js             # Job listings, filters, and creation
│   │   ├── profile.js         # Student profile management
│   │   └── index.js           # Centralized route index
│   ├── db.js                  # Database connector with auto-fallback
│   ├── index.js               # Express server with Helmet, RateLimiter, MongoSanitize, Socket.io
│   └── .env                   # Backend environment configuration
│
├── internarea/                # Frontend Next.js Application
│   ├── src/
│   │   ├── Components/
│   │   │   ├── Navbar.tsx     # Modern responsive navbar with 1-Click Fast Login modal
│   │   │   └── Fotter.tsx     # Clean footer
│   │   ├── Feature/
│   │   │   └── Userslice.js   # Redux auth & profile slice with localStorage persistence
│   │   ├── pages/
│   │   │   ├── company/
│   │   │   │   └── dashboard/ # Modern company dashboard with sidebar, stats, data table
│   │   │   ├── adminpanel/    # Modern admin dashboard with user governance & moderation
│   │   │   ├── adminlogin/    # Dedicated administrator login
│   │   │   ├── internship/    # Search and filter internships
│   │   │   ├── job/           # Search and filter jobs
│   │   │   ├── profile/       # Student profile editor
│   │   │   ├── userapplication/# Student application status tracker
│   │   │   ├── postInternship/# Company post internship form
│   │   │   ├── postJob/       # Company post job form
│   │   │   └── _app.tsx       # Root layout with global Socket.io real-time listener
│   │   └── utils/
│   │       └── api.ts         # Centralized Axios client with JWT interceptor
│   ├── .env.local             # Frontend environment configuration
│   └── package.json
│
├── test-verification.js       # Automated 26-step End-to-End test suite
├── SECURITY.md                # Detailed security policy & implementation audit
└── README.md                  # Project documentation
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js** (v18+ recommended, tested on v24)
- **npm** (v9+)
- *(Optional)* Local MongoDB instance on port 27017 (If MongoDB is not installed, the application automatically engages its high-performance in-memory fallback engine with pre-seeded demo data).

---

### Step 1: Backend Setup & Launch

```powershell
# Navigate into the backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# Start the backend server
node index.js
```
The backend starts on `http://localhost:5000` with WebSockets enabled.

---

### Step 2: Frontend Setup & Launch

```powershell
# Open a new terminal and navigate to the frontend directory
cd internarea

# Install dependencies (if not already installed)
npm install --legacy-peer-deps

# Build and start the production Next.js server
npm run build
npm run start -- -p 3000
```
Open **`http://localhost:3000`** in your browser.

---

## 🔑 Pre-Configured Demo Accounts (1-Click Login)

The portal provides pre-configured accounts and a **1-Click Evaluator Fast Login** bar in the Login Modal:

| Role | Email | Password | Pre-loaded Data |
| :--- | :--- | :--- | :--- |
| **Student** | `student@example.com` | `student123` | Aarav Sharma (CS Undergrad, B.Tech IIT, skills, resume) |
| **Company** | `recruiter@google.com` | `company123` | Google India Recruiter (Active internship & job postings) |
| **Company 2** | `hr@microsoft.com` | `company123` | Microsoft HR (Active postings) |
| **Admin** | `admin@internshala.com` | `admin123` | System Administrator (Full platform moderation access) |

---

## 🧪 Automated End-to-End Verification

To execute the automated 26-step verification suite:

```powershell
# Run from repository root
$env:NODE_PATH = "$PWD\backend\node_modules"; node test-verification.js
```

### Verification Results (26/26 Passed):
- ✅ Backend Online & Security Enabled
- ✅ Security Header `X-Content-Type-Options: nosniff` verified
- ✅ Student Registration & Profile Update (Skills, Education, Resume)
- ✅ Company Registration, Post Internship, Post Job
- ✅ Student Search & Filter Internships by Category
- ✅ Student Apply to Internship with Cover Letter
- ✅ Student View Application Status in Dashboard
- ✅ Company View Applicants for Company Postings
- ✅ Company Accept Candidate (Status updated to `accepted`)
- ✅ **RBAC Enforcement**: Student cannot post internship (`403 Forbidden`)
- ✅ **RBAC Enforcement**: Student cannot access Admin routes (`403 Forbidden`)
- ✅ **RBAC Enforcement**: Company cannot access Admin routes (`403 Forbidden`)
- ✅ Admin Authentication, Platform Analytics, User Governance, Content Moderation
- ✅ All 7 Core Frontend Routes (`/`, `/internship`, `/job`, `/company/dashboard`, `/adminpanel`, `/profile`, `/userapplication`) verified HTTP 200 OK

---

## 🔒 Security Summary

For an in-depth security report, see [SECURITY.md](SECURITY.md).
- **Helmet**: Secures response headers against sniffing, XSS, and clickjacking.
- **Rate Limiting**: Protects authentication endpoints against credential stuffing and brute-force attacks (30 attempts / 15 minutes).
- **NoSQL Injection**: Express Mongo Sanitize replaces query operators (`$`, `.`) with underscores.
- **Password Protection**: Passwords hashed with bcrypt (10 rounds); omitted from all JSON serialization.
- **Strict RBAC**: Route-level middleware guarantees separation between students, companies, and platform administrators.
