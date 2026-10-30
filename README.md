# MediFlow-AI — Intelligent Hospital Management & Clinical Decision Support System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://medi-flow-ai-navy.vercel.app/login)

**MediFlow-AI** is an enterprise-grade, cloud-native Hospital Management System (HMS) integrated with assistive multimodal clinical intelligence. It seamlessly unifies hospital administration, outpatient scheduling, inpatient bed management, and electronic health records (EHR) with automated diagnostic lab report extraction and pre-consultation patient history summarization.

🌐 **Live Application URL:** [https://medi-flow-ai-navy.vercel.app/login](https://medi-flow-ai-navy.vercel.app/login)

---

## Table of Contents

- [Core Capabilities](#core-capabilities)
- [System Architecture](#system-architecture)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [MediFlow-AI Clinical Intelligence Engine](#mediflow-ai-clinical-intelligence-engine)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Environment Configuration](#environment-configuration)
- [Local Setup & Development](#local-setup--development)
- [Comprehensive API Specification](#comprehensive-api-specification)
- [Automated Testing Suite](#automated-testing-suite)
- [Deployment Guide (Vercel)](#deployment-guide-vercel)
- [Clinical Safety & Compliance](#clinical-safety--compliance)

---

## Core Capabilities

- **Clinical Consultation Lifecycle:** 30-minute intelligent dynamic slot booking, concurrency locks against double-booking, and status transition workflows (`pending` → `confirmed` → `completed` / `cancelled` / `no_show`).
- **Multimodal Lab Report Extraction:** Instant extraction of biomarkers, measured values, units, reference intervals, and out-of-range flags directly from uploaded PDFs and medical scans in ~1.5 seconds.
- **Longitudinal History Briefing:** Distills historical consultations, prior diagnoses, inpatient admissions, and prescription timelines into a concise 1-page briefing for doctors before visits.
- **Inpatient Care & Bed Management:** Single-active admission enforcement, ward/room/bed allocation tracking, bedside nursing notes, and discharge summaries.
- **Doctor Roster & Availability:** Configurable weekly recurring availability schedules, vacation toggles, consultation fees, and department assignments.
- **Administrative Control Plane:** Hospital department CRUD with auto-generated specialty codes, staff onboarding, user status toggles with self-lockout safeguards, and EMR audit preservation.

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLIENT TIER (React + Vite SPA)                      │
│   Super Admin Portal  │  Doctor Workspace  │  Nurse Station  │ Patient │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTPS / REST (JSON)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│               API GATEWAY & MIDDLEWARE (Express.js / Node.js)          │
│   • JWT Auth via HTTP-Only Cookies & Bearer Headers                    │
│   • Role-Based Access Control (RBAC) Enforcement                       │
│   • Input Sanitization, Request Validation & Centralized Errors       │
└──────────────────┬─────────────────┬─────────────────┬─────────────────┘
                   │                 │                 │
                   ▼                 ▼                 ▼
        ┌──────────────────┐ ┌───────────────┐ ┌─────────────────────────┐
        │  MongoDB Atlas   │ │  Cloudinary   │ │  MediFlow-AI Engine     │
        │  (Mongoose ODM)  │ │ (Secure Media)│ │ (Multimodal Extraction) │
        │                  │ │               │ │                         │
        │ • Users & Roles  │ │ • Diagnostic  │ │ • Schema-Constrained    │
        │ • Doctor Profiles│ │   Lab PDFs    │ │   Biomarker Parsing     │
        │ • Departments    │ │ • Imaging &   │ │ • Out-of-Range Flags    │
        │ • Appointments   │ │   Pathology   │ │ • Plain-Language Lay    │
        │ • Medical Records│ │   Scans       │ │   Summaries (< 1.5s)    │
        │ • Inpatient Beds │ └───────────────┘ └─────────────────────────┘
        └──────────────────┘
```

---

## Role-Based Access Control (RBAC)

MediFlow-AI enforces strict multi-tier permissions where access to data is completely isolated by authenticated identity:

| Role | Access Scope & Permitted Actions |
| :--- | :--- |
| **Super Admin** | Full organizational oversight: department configuration, staff provisioning (Doctors, Nurses, Admins), global schedule monitoring, bed allocations, user status management, and audit inspection. |
| **Doctor** | Clinical self-service: consultation schedule & slot intervals, assigned outpatient queue, diagnostic lab report analysis, digital prescription creation, patient history synthesis, and inpatient discharge. |
| **Nurse** | Bedside patient care: active ward roster inspection, vitals and nursing observation logging, medication administration tracking, and clinic queue assistance. |
| **Patient** | Patient self-service: directory search by medical specialty, appointment reservation & rescheduling, personal health record access, and diagnostic document uploads. |

---

## MediFlow-AI Clinical Intelligence Engine

The platform features an embedded, zero-leakage clinical documentation engine designed with strict medical boundaries:

1. **Schema-Constrained JSON Extraction:** Output is strictly constrained to standard clinical schemas without conversational filler:
   - `reportType`, `reportDate`
   - `keyFindings` (objective documented findings)
   - `testResults` (`testName`, `value`, `unit`, `referenceRange`, `flag`)
   - `valuesMarkedAbnormal`
   - `plainLanguageSummary` (objective educational summary for the patient)
   - `doctorDiscussionQuestions` (clarifying topics for outpatient consultations)
   - `unreadableOrMissingInfo` (explicit flagging of cut-off or degraded scans)
2. **Sub-1.5s High-Throughput Inference:** Utilizes optimized multimodal streaming pipelines, eliminating long reasoning delays and returning complete diagnostic extractions in ~1.2s to 1.5s.
3. **Deterministic EHR Fallback:** If upstream network availability fluctuates, the system automatically builds grounded summaries from structured database encounters.
4. **Physician-in-the-Loop Safeguards:** Output includes mandatory clinical disclaimers. The engine never prescribes treatments or provides autonomous medical diagnoses.

---

## Technology Stack

### Frontend Client
- **Framework:** React 18 / 19 with ECMAScript modern standards
- **Build Engine:** Vite
- **Styling:** Tailwind CSS (Responsive medical theme)
- **Routing:** React Router v6
- **HTTP Client:** Axios (Configured with credentials and interceptors)
- **Icons:** Lucide React

### Backend API
- **Runtime:** Node.js (v20+ / v22+)
- **Framework:** Express.js (ES Modules)
- **Database:** MongoDB Atlas via Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT) signed with SHA-256 in HTTP-only cookies
- **Document & Image Storage:** Cloudinary SDK
- **Security:** Helmet, CORS with strict origin validation, centralized error handling

---

## Repository Structure

```text
MediFlow-AI/
├── client/                          # React Frontend Single Page Application
│   ├── public/                      # Static assets & branding
│   ├── src/
│   │   ├── components/              # Modular UI components & clinical modals
│   │   ├── context/                 # AuthContext (session persistence & user state)
│   │   ├── hooks/                   # Custom API hooks
│   │   ├── layouts/                 # Role-based dashboard layouts
│   │   ├── pages/                   # Admin, Doctor, Nurse, and Patient views
│   │   ├── routes/                  # Guarded client-side routing
│   │   ├── services/                # Axios API instance
│   │   ├── App.jsx                  # Root component
│   │   └── main.jsx                 # Application entry point
│   ├── package.json                 # Client dependencies
│   ├── tailwind.config.js           # Tailwind configuration
│   ├── vercel.json                  # Client SPA deployment rewrite rules
│   └── vite.config.js               # Vite build configuration
├── server/                          # Node.js Express REST API
│   ├── scripts/                     # Automated test suites & seeding scripts
│   ├── src/
│   │   ├── config/                  # Database (db.js) & Environment (env.js)
│   │   ├── controllers/             # Business logic & endpoint handlers
│   │   ├── middleware/              # JWT auth, role validation, error handlers
│   │   ├── models/                  # Mongoose data schemas (User, Appointment, etc.)
│   │   ├── routes/                  # Express route definitions
│   │   ├── services/                # MediFlow-AI extraction & fallback services
│   │   ├── app.js                   # Express application setup
│   │   └── server.js                # Server entry point
│   ├── package.json                 # Backend dependencies
│   └── vercel.json                  # Serverless deployment configuration
├── package.json                     # Monorepo root scripts
└── README.md                        # Documentation
```

---

## Environment Configuration

### Backend Configuration (`server/.env`)

```env
# Server Port & CORS
PORT=5000
NODE_ENV=production
CLIENT_URL=https://medi-flow-ai-navy.vercel.app

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mediflow?retryWrites=true&w=majority

# Security
JWT_SECRET=your_super_secret_high_entropy_jwt_key_at_least_32_characters
JWT_EXPIRES_IN=24h
INITIAL_ADMIN_PASSWORD=Admin@123456

# Clinical AI Engine
GEMINI_API_KEY=your_google_ai_studio_api_key

# Cloudinary Encrypted Document Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Frontend Configuration (`client/.env`)

```env
# Full backend URL including the /api path prefix
VITE_API_BASE_URL=https://your-backend-api-url.com/api
```

---

## Local Setup & Development

### 1. Prerequisites
- **Node.js:** v20.x or v22.x
- **npm:** v10.x+
- **MongoDB Atlas:** Free cluster or local MongoDB instance

### 2. Installation

Clone the repository and install dependencies across the monorepo:

```bash
git clone https://github.com/your-username/MediFlow-AI.git
cd MediFlow-AI

# Install monorepo root dependencies
npm install

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
cd ..
```

### 3. Bootstrap Initial Database Data

From the project root:

```bash
# Seed initial administrator account (admin@mediflow.com)
npm run seed:admin

# Seed hospital departments (Cardiology, Pediatrics, etc.)
npm run seed:departments

# Seed demo doctors and availability profiles
npm run seed:doctors
```

### 4. Run Development Servers

Run both backend and frontend concurrently:

```bash
npm run dev
```

- **Frontend Client:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Comprehensive API Specification

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Patient self-registration.
- `POST /api/auth/login` — Authenticates user, issues JWT in HTTP-only cookie and bearer response.
- `POST /api/auth/logout` — Revokes session and clears authentication cookies.
- `GET /api/auth/me` — Restores active session and returns authenticated user payload.

### Doctor Operations (`/api/doctor`)
- `GET /api/doctor/profile` & `PUT /api/doctor/profile` — View/update professional profile.
- `GET /api/doctor/availability` & `PUT /api/doctor/availability` — Configure weekly shift schedules.
- `PATCH /api/doctor/availability/toggle` — Instant availability toggle.
- `GET /api/doctor/appointments` — Fetch assigned outpatient appointments.
- `PATCH /api/doctor/appointments/:id/confirm` — Confirm pending booking.
- `PATCH /api/doctor/appointments/:id/complete` — Mark encounter complete with clinical notes.
- `POST /api/doctor/medical-records` — Issue consultation record and prescriptions.
- `POST /api/doctor/patients/:patientId/ai-summary` — Generate grounded patient history briefing.
- `POST /api/doctor/patients/:patientId/analyze-report` — Multimodal diagnostic report extraction.
- `PATCH /api/doctor/admissions/:id/discharge` — Discharge inpatient with clinical notes.

### Patient Operations (`/api/patient`)
- `POST /api/patient/appointments` — Reserve appointment with double-booking prevention.
- `GET /api/patient/appointments` — List personal appointment bookings.
- `PATCH /api/patient/appointments/:id/cancel` — Cancel active appointment.
- `POST /api/patient/appointments/:id/reschedule` — Atomic cancellation and rebooking.
- `GET /api/patient/medical-records` — Access personal health records and prescriptions.
- `GET /api/patient/admissions` — View historical inpatient stays.
- `POST /api/patient/analyze-report` — Upload and analyze diagnostic lab reports.

### Nurse Operations (`/api/nurse`)
- `GET /api/nurse/admissions` — List active inpatients under ward care.
- `POST /api/nurse/observations` — Log patient bedside vitals and care notes.
- `PATCH /api/nurse/admissions/:id/care` — Update bedside nursing directives.
- `GET /api/nurse/patients/:patientId/medical-records` — Inspect patient clinical charts.

### Administration & Operations (`/api/admin`)
- `POST /api/admin/staff` — Provision new Doctor, Nurse, or Admin accounts.
- `GET /api/admin/users` — Search and manage user accounts.
- `PATCH /api/admin/users/:id/status` — Toggle user activation status.
- `POST /api/admin/departments` — Create hospital division with auto-generated code.
- `GET /api/admin/departments` — List specialty departments.
- `POST /api/admin/doctors` — Create and link clinical doctor profiles.
- `GET /api/admin/appointments` — Global schedule monitoring with multi-filter queries.
- `POST /api/admin/admissions` — Process patient inpatient admission with bed allocation.
- `GET /api/admin/admissions/metrics` — Live occupancy, available beds, and discharge counts.

---

## Automated Testing Suite

The repository includes comprehensive, automated test suites verifying security, concurrency, RBAC isolation, and clinical report extraction:

```bash
# Verify external connectivity (MongoDB Atlas, Cloudinary, Gemini API)
npm run check:services

# Execute Authentication & RBAC security tests
npm run test:auth
npm run test:rbac

# Execute Department & Staff management tests
npm run test:departments

# Execute Doctor Profiles & Availability tests
npm run test:doctors

# Execute Appointment Booking & Concurrency tests
npm run test:appointments

# Execute Medical Records & Prescriptions tests
npm run test:records

# Execute Inpatient Admissions & Bed Management tests
npm run test:admissions

# Execute all automated suites sequentially
npm run test:all
```

---

## Deployment Guide (Vercel)

The application is deployed on Vercel:

🌐 **Production Link:** [https://medi-flow-ai-navy.vercel.app/login](https://medi-flow-ai-navy.vercel.app/login)

### Frontend Deployment (`client/vercel.json`)
The client directory includes standard SPA routing rewrites:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Production Build Command
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `client` (when deploying frontend separately)

---

## Clinical Safety & Compliance

> [!IMPORTANT]
> **Clinical Review Notice:** MediFlow-AI is designed strictly as an assistive clinical documentation tool. It does not provide autonomous medical diagnoses, suggest therapeutic changes, or replace independent medical judgment. All extracted biomarkers, abnormal flags, and patient summaries must be reviewed and verified by a licensed healthcare professional prior to clinical decision-making.

- **Zero-Fabrication Guardrails:** Test parameters and reference ranges not clearly visible in documents are labeled as unreadable or missing rather than guessed.
- **Privacy First:** Medical reports uploaded for analysis are processed securely in-memory with strict access controls.

---

## License

This project is licensed under the [MIT License](LICENSE).
