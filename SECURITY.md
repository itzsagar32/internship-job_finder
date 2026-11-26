# Security Policy & Implementation Report

This document outlines the security architecture, hardening measures, threat modeling, and defensive controls implemented across the Internshala Clone full-stack application.

---

## 1. Executive Summary

As required by the security evaluation, the codebase has undergone comprehensive security hardening across both transport and application layers. All user inputs, authentication flows, data storage, and role boundaries are strictly governed by defense-in-depth principles.

---

## 2. Security Controls Implemented

### 🛡️ 1. HTTP Header Hardening (`helmet`)
- **Package**: `helmet` (^8.0.0)
- **Configuration**: Applied globally in `backend/index.js`
- **Mitigations**:
  - `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing attacks.
  - `X-Frame-Options: SAMEORIGIN`: Prevents Clickjacking attacks by forbidding external iframe embedding.
  - `X-XSS-Protection`: Enables legacy browser XSS filters.
  - `Strict-Transport-Security` (HSTS): Enforces secure HTTPS communication in production.
  - `Referrer-Policy: no-referrer`: Mitigates credential leakage via referrer headers.

### 🛑 2. Authentication Brute-Force Defense (`express-rate-limit`)
- **Package**: `express-rate-limit` (^7.5.0)
- **Scope**: Applied to `/api/auth/*` and `/api/admin/adminlogin`
- **Configuration**:
  - Window: 15 minutes (`windowMs = 15 * 60 * 1000`)
  - Request Cap: 30 attempts per IP address
  - Rejection: Returns `HTTP 429 Too Many Requests` with rate-limit headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`).
- **General Protection**: A separate general limiter caps overall API usage at 1,000 requests per 15 minutes to mitigate volumetric denial of service.

### 💉 3. NoSQL Injection Prevention (`express-mongo-sanitize`)
- **Package**: `express-mongo-sanitize` (^2.2.0)
- **Scope**: Evaluates all incoming `req.body`, `req.query`, and `req.params`
- **Mechanism**:
  - Strips and replaces characters prohibited in MongoDB queries (such as `$` and `.`) with an underscore `_`.
  - Blocks operators like `{"$gt": ""}` or `{"$ne": null}` from bypassing authentication or retrieving unauthorized document sets.
  - Logs sanitization warnings with security context.

### 🔑 4. Cryptographic Password Hashing (`bcryptjs`)
- **Algorithm**: Blowfish-based bcrypt with adaptive cost factor.
- **Salt Rounds**: 10 rounds (`bcrypt.hash(password, 10)`).
- **Enforcement**:
  - Passwords are never stored in plaintext.
  - All password checks utilize constant-time comparison `bcrypt.compare()` to mitigate timing side-channel attacks.
  - Model responses and serialization sanitize the `password` field before dispatching JSON responses.

### 👥 5. Strict Role-Based Access Control (RBAC)
- **Middleware**: `backend/middleware/auth.js` (`verifyToken`, `requireRole`)
- **Tokens**: Stateless JSON Web Tokens (`jsonwebtoken`) signed with a dedicated `JWT_SECRET`, expiring in 7 days.
- **Access Control Matrix**:

| Endpoint / Operation | Allowed Roles | Student | Company | Admin |
| :--- | :--- | :---: | :---: | :---: |
| `POST /api/auth/register` | Public | ✅ | ✅ | ❌ |
| `POST /api/auth/login` | Public | ✅ | ✅ | ✅ |
| `GET /api/internship`, `GET /api/job` | Public | ✅ | ✅ | ✅ |
| `POST /api/application` | Student / Authenticated | ✅ | ❌ | ❌ |
| `GET /api/application/my` | Student | ✅ | ❌ | ❌ |
| `PUT /api/profile/me` | Authenticated Owner | ✅ | ✅ | ✅ |
| `POST /api/internship`, `POST /api/job` | Company, Admin | 🚫 403 | ✅ | ✅ |
| `DELETE /api/internship/:id` | Company Owner, Admin | 🚫 403 | ✅ (Own Only) | ✅ |
| `GET /api/application/company` | Company, Admin | 🚫 403 | ✅ | ✅ |
| `PUT /api/application/:id` (Accept/Reject) | Company Owner, Admin | 🚫 403 | ✅ (Own Only) | ✅ |
| `GET /api/admin/users` | Admin | 🚫 403 | 🚫 403 | ✅ |
| `DELETE /api/admin/users/:id` | Admin | 🚫 403 | 🚫 403 | ✅ |
| `GET /api/admin/stats` | Admin | 🚫 403 | 🚫 403 | ✅ |
| `DELETE /api/admin/internship/:id` | Admin | 🚫 403 | 🚫 403 | ✅ |

- **Ownership Validation**: Even within company privileges, companies can only review and accept/reject applicants applying for their *own* posted opportunities, preventing cross-tenant data access.

---

## 3. Real-Time Security
- **Socket.io Channels**: Recruiter sockets subscribe to isolated rooms (`company_${companyId}`) to ensure applicant data is never broadcasted across tenant boundaries.

---

## 4. Vulnerability Reporting
For any security disclosures or researcher reviews, please contact the repository security administrator or file a private security advisory.
