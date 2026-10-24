# MediFlow-AI — AI-Assisted Hospital Management System

MediFlow-AI is a modern, role-based Hospital Information Management System (HIMS) augmented with Google Gemini AI for pre-consultation symptom triage, multimodal diagnostic report analysis, and longitudinal clinical history summarization.

---

## Technology Stack

### Frontend
- **Framework & Core:** React 18 with pure JavaScript (ES6+)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS (Professional clinical theme with clean white backgrounds & subtle blue accents)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Iconography:** Lucide React

### Backend
- **Runtime & Framework:** Node.js with Express.js (ES modules)
- **Database:** MongoDB Atlas with Mongoose ODM
- **Environment Management:** dotenv
- **Cross-Origin Security:** CORS

### Architecture Highlights (Phase 1)
- **Decoupled Database Bootstrapping:** The Express server starts reliably even if MongoDB credentials are pending, reporting transparent connection state via the health check.
- **Strict JavaScript Only:** Strictly avoids TypeScript, TSX, TanStack Query, Bun, or superfluous dependencies.
- **Role-Based Navigation Scaffold:** Dedicated navigation for 7 primary modules: Dashboard, Appointments, Patients, Doctors, Departments, AI Assistant, and Settings.

---

## Project Structure

```text
mediflow-ai/
├── client/                      # React frontend
│   ├── public/                  # Public static assets & favicon
│   ├── src/
│   │   ├── assets/              # Static media assets
│   │   ├── components/          # Reusable UI (Sidebar, TopNavbar, Button, Card, PageHeader)
│   │   ├── context/             # React context providers (AuthContext stub)
│   │   ├── hooks/               # Custom hooks (useApi)
│   │   ├── layouts/             # Shared layouts (DashboardLayout)
│   │   ├── pages/               # Module pages (Dashboard, Appointments, Patients, etc.)
│   │   ├── routes/              # Client-side route configuration (AppRoutes)
│   │   ├── services/            # Axios API client (api.js)
│   │   ├── App.jsx              # Application root
│   │   ├── index.css            # Tailwind CSS directives
│   │   └── main.jsx             # React DOM entry point
│   ├── .env.example             # Frontend environment template
│   ├── index.html               # Vite HTML entry
│   ├── package.json             # Frontend dependencies
│   ├── postcss.config.js        # PostCSS configuration
│   ├── tailwind.config.js       # Tailwind CSS theme configuration
│   └── vite.config.js           # Vite server configuration
├── server/                      # Express backend
│   ├── src/
│   │   ├── config/              # Environment (env.js) and Database (db.js)
│   │   ├── controllers/         # Request handlers (healthController.js)
│   │   ├── middleware/          # Error and 404 handlers (errorHandler.js, notFoundHandler.js)
│   │   ├── models/              # Future Mongoose schemas
│   │   ├── routes/              # Express API routers (healthRoutes.js)
│   │   ├── services/            # Future business & AI services
│   │   ├── utils/               # Helper utilities
│   │   ├── app.js               # Express application setup
│   │   └── server.js            # Server entry point & graceful shutdown
│   ├── .env.example             # Backend environment template
│   └── package.json             # Backend dependencies
├── .gitignore                   # Repository ignore rules
├── package.json                 # Monorepo root scripts (concurrent dev runner)
└── README.md                    # Project documentation
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher recommended, tested on Node v22)
- npm (v9.0.0 or higher)
- Git

### 1. Installation

Install dependencies across the root, client, and server:

```bash
# From the project root
npm run install:all
```

Alternatively, install individually:

```bash
# Install root concurrency tools
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

---

### 2. Environment Configuration

Copy the example environment templates:

```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

#### Backend `.env` Variables:
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend HTTP server listening port | `5000` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `MONGODB_URI` | MongoDB Atlas connection string | *(Optional in Phase 1)* |
| `JWT_SECRET` | Secret key for signing session tokens | *(Configured in Phase 2)* |
| `GEMINI_API_KEY` | Google Gemini API key for clinical AI | *(Configured in Phase 5)* |
| `CLOUDINARY_*` | Cloudinary storage credentials | *(Configured in Phase 4)* |

#### Frontend `.env` Variables:
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for backend REST API calls | `http://localhost:5000/api` |

---

### 3. Running the Development Servers

#### Option A: Run Both Concurrently (Recommended)
From the root directory:

```bash
npm run dev
```
> Uses the lightweight `concurrently` package to start both the Node.js backend (`http://localhost:5000`) and the Vite React frontend (`http://localhost:5173`) simultaneously in a single terminal.

#### Option B: Run Separately in Dedicated Terminals

**Terminal 1 — Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend Client:**
```bash
cd client
npm run dev
```

---

### 4. Verification Endpoints & URLs

- **Frontend Application:** [http://localhost:5173](http://localhost:5173)
  - Public routes: `/login`, `/register`, `/unauthorized`
  - Admin routes: `/admin/dashboard`, `/admin/users`, `/admin/doctors`, `/admin/nurses`, `/admin/departments`, `/admin/appointments`, `/admin/assignments`, `/admin/settings`
  - Doctor routes: `/doctor/dashboard`, `/doctor/appointments`, `/doctor/patients`, `/doctor/medical-records`, `/doctor/ai-assistant`, `/doctor/settings`
  - Nurse routes: `/nurse/dashboard`, `/nurse/assigned-patients`, `/nurse/appointments`, `/nurse/care-records`, `/nurse/settings`
  - Patient routes: `/patient/dashboard`, `/patient/book-appointment`, `/patient/appointments`, `/patient/doctors`, `/patient/medical-records`, `/patient/ai-assistant`, `/patient/profile`, `/patient/settings`
- **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Backend Authentication APIs:**
  - `POST /api/auth/register` (Public, creates Patient role only)
  - `POST /api/auth/login` (Returns JWT & sets HTTP-only cookie)
  - `POST /api/auth/logout` (Clears HTTP-only cookie)
  - `GET /api/auth/me` (Protected, restores session)
  - `GET /api/auth/test-role` (Protected, verifies user role)
- **Backend Admin APIs (Admin Only):**
  - `POST /api/admin/staff` (Provisions Doctor, Nurse, or Admin)
  - `GET /api/admin/staff` (Lists hospital staff by role)
  - `GET /api/admin/users` (Lists all users with search & role filters)
  - `GET /api/admin/users/:id` (Retrieves user profile details without password hash)
  - `PATCH /api/admin/users/:id/status` (Toggle active/inactive status with self-lockout prevention)
  - `POST /api/admin/departments` (Creates hospital department with unique name)
  - `GET /api/admin/departments` (Lists departments with search & status filters)
  - `GET /api/admin/departments/:id` (Retrieves department details with head doctor)
  - `PUT /api/admin/departments/:id` (Updates department name, location, code, head doctor)
  - `PATCH /api/admin/departments/:id/status` (Toggles department active/inactive status)
  - `DELETE /api/admin/departments/:id` (Soft-deactivates department preserving historical records)
  - `GET /api/admin/doctors` (Lists doctor profiles with department, specialty, and availability filters)
  - `GET /api/admin/doctors/:id` (Retrieves doctor profile details by profile or user ID)
  - `POST /api/admin/doctors` (Creates doctor clinical profile linked to doctor User account)
  - `PUT /api/admin/doctors/:id` (Updates doctor specialty, qualification, experience, fee, room)
  - `PUT /api/admin/doctors/:id/availability` (Updates doctor weekly consultation schedule and slot duration)
  - `PATCH /api/admin/doctors/:id/status` (Toggles doctor active availability status)
- **Backend Doctor Self-Service APIs (Doctor Role Only):**
  - `GET /api/doctor/profile` (Retrieves doctor's own clinical profile using `req.user._id`)
  - `PUT /api/doctor/profile` (Updates doctor's permitted practice fields, fee, cabin, and bio)
  - `GET /api/doctor/availability` (Retrieves doctor's weekly shift schedule and booking settings)
  - `PUT /api/doctor/availability` (Updates weekly consulting days, 24h hours, and slot intervals)
  - `PATCH /api/doctor/availability/toggle` (Toggles doctor's online/offline availability status)
  - `GET /api/doctor/appointments` (Retrieves appointments assigned to doctor)
  - `GET /api/doctor/appointments/:id` (Retrieves single appointment details)
  - `PATCH /api/doctor/appointments/:id/confirm` (Confirms pending appointment)
  - `PATCH /api/doctor/appointments/:id/complete` (Completes appointment with clinical notes)
  - `PATCH /api/doctor/appointments/:id/no-show` (Marks patient as no-show)
  - `PATCH /api/doctor/appointments/:id/cancel` (Cancels appointment with reason)
  - `POST /api/doctor/medical-records` (Creates consultation chart with structured prescriptions)
  - `GET /api/doctor/patients/:patientId/medical-records` (Retrieves medical records for treated patient)
  - `PUT /api/doctor/medical-records/:id` (Updates clinical findings and notes on own record)
  - `GET /api/doctor/admissions` (Retrieves doctor's assigned inpatient caseload)
  - `PATCH /api/doctor/admissions/:id/discharge` (Executes patient discharge with clinical summary)
- **Backend Patient Self-Service APIs (Patient Role Only):**
  - `POST /api/patient/appointments` (Books appointment with double-booking prevention)
  - `GET /api/patient/appointments` (Lists patient's own appointments)
  - `GET /api/patient/appointments/:id` (Retrieves appointment details with strict patient isolation)
  - `PATCH /api/patient/appointments/:id/cancel` (Cancels own active appointment)
  - `POST /api/patient/appointments/:id/reschedule` (Atomically cancels old slot and books new slot)
  - `GET /api/patient/medical-records` (Lists patient's own medical records and prescriptions)
  - `GET /api/patient/medical-records/:id` (Retrieves own medical record details with 403 isolation)
  - `GET /api/patient/admissions` (Lists patient's own inpatient admission stay history)
- **Backend Nurse APIs (Nurse Role Only):**
  - `GET /api/nurse/patients/:patientId/medical-records` (Views relevant patient medical records)
  - `POST /api/nurse/observations` (Logs vitals and observation notes; strictly blocked from diagnosing/prescribing)
  - `GET /api/nurse/admissions` (Lists active ward inpatients under care)
  - `PATCH /api/nurse/admissions/:id/care` (Updates bedside nursing care directives)
- **Backend Admin Oversight APIs (Admin Role Only):**
  - `GET /api/admin/appointments` (Global outpatient schedule monitor with multi-criteria filters)
  - `GET /api/admin/appointments/:id` (Global appointment inspection)
  - `PATCH /api/admin/appointments/:id/assign-doctor` (Reassigns doctor with conflict prevention)
  - `PATCH /api/admin/appointments/:id/status` (Updates appointment status with transition guard)
  - `GET /api/admin/medical-records` (Global EMR repository inspection and audit search)
  - `PATCH /api/admin/medical-records/:id/archive` (Non-destructive soft archival for audit compliance)
  - `GET /api/admin/admissions` (Global inpatient roster with bed and doctor filters)
  - `POST /api/admin/admissions` (Admits inpatient with single-active-admission enforcement)
  - `PATCH /api/admin/admissions/:id` (Updates room/bed allocation and transfer notes)
  - `PATCH /api/admin/admissions/:id/discharge` (Discharges patient with clinical summary)
  - `GET /api/admin/admissions/metrics` (Live inpatient count, discharge counts, recent arrivals)
- **Backend Public APIs:**
  - `GET /api/departments` (Lists all active hospital specialty divisions)
  - `GET /api/doctors` (Public sanitized physician directory with department & search filters)
  - `GET /api/doctors/:id` (Public safe profile view for single physician)
  - `GET /api/appointments/available-slots` (Live appointment slot generator respecting schedules, breaks, and existing bookings)

---

### 5. Running Automated Tests

```bash
# Service & credential connectivity test (MongoDB Atlas, Cloudinary, Gemini)
npm run check:services

# Safe initial administrator account provisioning
npm run seed:admin

# Initial hospital departments bootstrap
npm run seed:departments

# Demo doctor clinical profiles bootstrap
npm run seed:doctors

# Automated Auth & RBAC test suite (14 core tests)
npm run test:auth

# Extended RBAC & security test suite (25 tests)
npm run test:rbac

# Staff & Department Management test suite (32 tests)
npm run test:departments

# Doctor Profiles & Availability test suite (31 tests)
npm run test:doctors

# Appointment Booking & Rostering test suite (37 tests)
npm run test:appointments

# Medical Records & Prescriptions test suite (19 tests)
npm run test:records

# Inpatient Admission & Discharge test suite (19 tests)
npm run test:admissions

# Run all automated test suites (177 tests across Phase 2 and Phase 3)
npm run test:all
```


---

