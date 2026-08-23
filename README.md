# 🏥 HealthSync — Complete Healthcare Access, Hospital Coordination & Emergency Response Platform

![HealthSync Banner](https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80)

HealthSync is an enterprise-grade healthcare platform connecting **Patients**, **Doctors**, **Hospital Receptionists**, and **Ambulance Operators** in a unified real-time ecosystem with multi-language support (English, Hindi, Marathi) and live GPS Emergency SOS tracking.

---

## 🌟 Key Features

### 👤 Patient Portal
- **Trilingual Interface**: Dynamic switching between **English**, **हिंदी (Hindi)**, and **मराठी (Marathi)**.
- **OTP-Based Authentication**: Secure login with international phone number support and 20+ country flags.
- **3-Step Profile Wizard**: Personal details, emergency contacts, medical history, blood group, and allergy profiles.
- **Doctor Discovery & Booking**: Filter by specialization, fee, language, and real-time availability; 30-day dynamic slot calendar.
- **Digital Health Records**: Upload & categorize prescriptions, lab test reports, scans, and insurance documents.
- **Medicine Reminders**: Dosage tracking with daily adherence progress and scheduled time alerts.
- **Emergency SOS HUD**: Floating SOS trigger with live GPS coordinates, closest hospital routing, and bi-directional response tracking.

### 👨‍⚕️ Doctor Dashboard
- **Schedule Planner**: Configure weekly shifts, 10–60 minute slot durations, break intervals, and overlap protection.
- **Live Consultation Queue**: Today's appointments with real-time KPI counters (waiting, in-consultation, completed).
- **Split-Screen Clinical Workspace**: Patient history, allergy warning banners, symptoms tag builder, observations, and advice.
- **Digital Rx Prescriptions**: Multi-item prescription builder with dosage, form, timing, frequency, and automatic patient record syncing.
- **Real-Time Availability Toggle**: Instant status broadcast (*Available / Busy / Off Duty*) via WebSockets.

### 🏥 Hospital Receptionist Desk
- **Arrival & Check-In Desk**: 1-click patient arrival verification (`checkedInAt`) with doctor queue dispatch alerts.
- **Live 3-Column Kanban Board**: Real-time consultation progression (*Waiting in Lobby → In Consultation → Completed*).
- **Doctor Availability Board**: Live status grid of all affiliated doctors and queue lengths.
- **Walk-in Registration**: Instant patient creation and immediate queue assignment.
- **Emergency Triage Desk**: Incoming SOS alert tracking, triage status, and ambulance unit dispatching.

### 🚑 Ambulance Operator Mobile Interface
- **Night-Driving High-Contrast Theme**: Mobile-first dark HUD (#0F172A) with ON DUTY / OFF DUTY status toggle.
- **Standing-by Radar**: Live GPS broadcasting and instant dispatch alerts with audio/haptic simulation.
- **Active Navigation View**: Destination HUD with ETA counter, patient allergy warning banner, and 1-click call emergency contact.
- **6-Stage Lifecycle Stepper**: One-tap status progression (*Assigned → En Route to Patient → Arrived at Patient → Patient Picked Up → En Route to Hospital → Handover Complete*).

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, React Router v6, Zustand, Socket.io-client, react-i18next, React Hook Form, Zod, Lucide Icons, Custom Design System (CSS) |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, Socket.io, JWT (jsonwebtoken), bcryptjs, Winston, Multer, Zod |
| **Database & Cache** | PostgreSQL 15, Redis 7 (with in-memory fallback) |
| **Background Jobs** | BullMQ & Scheduled Background Reminder Worker |

---

## 🚀 Quick Start & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Prathmesh7208/healthsync.git
cd healthsync
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Copy `.env.example` in `/server`:
```bash
cp server/.env.example server/.env
```
Ensure your `DATABASE_URL` in `server/.env` points to PostgreSQL:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/healthsync_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=5000
CORS_ORIGIN="http://localhost:5173"
```

### 4. Start PostgreSQL & Redis (Docker)
```bash
docker compose up -d
```

### 5. Run Database Migrations & Seed Data
```bash
npm run prisma:migrate --workspace=server
npm run prisma:seed --workspace=server
```

### 6. Run the Platform
```bash
# Runs both Backend (port 5000) and Frontend (port 5173) concurrently
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api/v1`
- **API Health Check**: `http://localhost:5000/health`

---

## 🔑 Demo Login Credentials

All demo accounts use password **`HealthSync@123`** (or OTP `123456` in development mode):

| Role | Phone Number | Default View |
| :--- | :--- | :--- |
| **Patient** | `+919811100001` | Patient Dashboard & Doctor Search |
| **Doctor** | `+919822011111` | Doctor Dashboard & Consultation Workspace |
| **Receptionist** | `+919833300001` | Hospital Arrival Desk & Queue Kanban |
| **Ambulance Operator** | `+919844400001` | Ambulance Night HUD & Navigation |
| **Admin** | `+919999999999` | Admin Overview |

---

## 📁 Repository Structure

```
healthsync/
├── client/                     # Vite + React TypeScript Frontend
│   ├── src/
│   │   ├── components/         # UI Components (Buttons, Modals, Cards, Toasts, Badges)
│   │   ├── layouts/            # Role Layouts (Patient, Doctor, Receptionist, Ambulance)
│   │   ├── pages/              # Role-specific Pages & Views
│   │   ├── i18n/               # Localization files (en, hi, mr)
│   │   ├── stores/             # Zustand Global State (authStore, notificationStore)
│   │   ├── services/           # Socket.io Client & API instances
│   │   └── styles/             # Design Tokens & CSS Utilities
├── server/                     # Node.js + Express TypeScript Backend
│   ├── prisma/                 # Prisma Schema & Database Seed Script
│   ├── src/
│   │   ├── routes/             # REST API Route Handlers
│   │   ├── services/           # Slot Engine, Notification Dispatcher, Auth Services
│   │   ├── socket/             # Socket.io Gateway & Event Rooms
│   │   ├── jobs/               # Background Scheduled Reminder Workers
│   │   ├── middleware/         # Auth, RBAC, Validation & Error Handling
│   │   └── utils/              # Winston Logger, Prisma Client, Redis Wrapper
├── docs/                       # Product Requirements & IEEE SRS Documentation
├── docker-compose.yml          # PostgreSQL 15 & Redis 7 Configuration
└── package.json                # Monorepo Workspace Configuration
```

---

## 📄 License
This project is licensed under the MIT License.
