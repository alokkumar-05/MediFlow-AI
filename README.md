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
  - Navigation available for: `/`, `/appointments`, `/patients`, `/doctors`, `/departments`, `/ai-assistant`, `/settings`
- **Backend Health Check:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
  - Expected JSON Response:
    ```json
    {
      "success": true,
      "message": "MediFlow-AI API is running",
      "environment": "development",
      "timestamp": "2026-10-23T...",
      "database": {
        "connected": false,
        "status": "not_configured"
      }
    }
    ```

---

## Phase Roadmap

- [x] **Phase 1: Foundation Setup** — Vite React frontend with Tailwind CSS, React Router, modular Express server, and decoupled MongoDB Mongoose connector.
- [ ] **Phase 2: Authentication & RBAC** — JWT auth, password hashing with bcrypt, role-based middleware for Admin, Doctor, Nurse, and Patient.
- [ ] **Phase 3: Appointments & Doctor Rostering** — Conflict-free dynamic slot engine, appointment lifecycle status transitions, and doctor assignments.
- [ ] **Phase 4: Patient EMR & Admissions** — Medical records, Multer + Cloudinary document attachments, and inpatient (IPD) ward admissions.
- [ ] **Phase 5: Gemini AI Clinical Intelligence** — Pre-consultation symptom triage, multimodal lab report biomarker extraction with clinician review, and patient-history briefs.
- [ ] **Phase 6: Production Polish & Deployment** — Security auditing, end-to-end integration testing, seed scripts, and deployment.
