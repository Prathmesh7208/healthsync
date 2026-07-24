# Phase 1 — Patient Module

**Module Prefix:** `PAT`
**Priority:** P1 — Must Have

---

## 3.1 Purpose

The Patient Module is the primary user-facing interface of HealthSync. It enables patients to register, discover doctors, book appointments, track queues, access medical records, and manage their healthcare journey from a single application.

---

## 3.2 Sub-Modules

1. Patient Registration
2. Patient Dashboard
3. Doctor Search
4. Doctor Profile
5. Appointment Booking
6. Queue Tracking
7. Digital Health Records
8. Prescription Viewer
9. Notifications
10. Emergency

---

## 3.3 Patient Registration

### User Stories

| ID | Story | Priority |
|----|-------|----------|
| PAT-US-001 | As a new patient, I want to register with my basic details so I can start using HealthSync | P1 |
| PAT-US-002 | As a patient, I want to receive my HealthSync ID after registration so I can use it at any clinic | P1 |

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PAT-FR-001 | System MUST collect the following during registration: name, mobile number, gender, date of birth | P1 |
| PAT-FR-002 | System SHOULD collect: blood group, address, emergency contact | P2 |
| PAT-FR-003 | System MUST generate a unique HealthSync ID upon successful registration (format: `HS-YYYY-XXXXXX`) | P1 |
| PAT-FR-004 | System MUST validate date of birth (patient must be 18+ for self-registration) | P1 |
| PAT-FR-005 | System MUST allow patients to edit their profile after registration | P1 |
| PAT-FR-006 | System MUST store a profile photo (optional) | P3 |

### Registration Fields

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `full_name` | String | Yes | 2–100 characters, alphabets and spaces only |
| `mobile_number` | String | Yes | Pre-filled from OTP verification |
| `gender` | Enum | Yes | Male, Female, Other |
| `date_of_birth` | Date | Yes | Must be 18+ years ago |
| `blood_group` | Enum | No | A+, A-, B+, B-, AB+, AB-, O+, O- |
| `address` | Object | No | Street, city, state, pincode |
| `emergency_contact_name` | String | No | 2–100 characters |
| `emergency_contact_number` | String | No | Valid 10-digit Indian mobile number |
| `profile_photo` | Image | No | Max 2MB, JPG/PNG |

---

## 3.4 Patient Dashboard

### User Stories

| ID | Story | Priority |
|----|-------|----------|
| PAT-US-003 | As a patient, I want to see my upcoming appointments on the dashboard so I know my schedule | P1 |
| PAT-US-004 | As a patient, I want quick access to doctor search from the dashboard | P1 |
| PAT-US-005 | As a patient, I want to see recent prescriptions and reports on the dashboard | P2 |

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PAT-FR-010 | Dashboard MUST display upcoming appointments (next 7 days) | P1 |
| PAT-FR-011 | Dashboard MUST display recent prescriptions (last 3) | P2 |
| PAT-FR-012 | Dashboard MUST display recent reports (last 3) | P2 |
| PAT-FR-013 | Dashboard MUST display unread notification count | P1 |
| PAT-FR-014 | Dashboard MUST include an emergency button | P1 |
| PAT-FR-015 | Dashboard MUST include doctor search access | P1 |
| PAT-FR-016 | Dashboard SHOULD display the patient's HealthSync ID | P2 |

### Dashboard Layout

```
┌─────────────────────────────────┐
│  HealthSync          🔔 (3)    │
│  Welcome, [Name]               │
│  HS-2026-XXXXXX                │
├─────────────────────────────────┤
│  🔍 Search Doctors...          │
├─────────────────────────────────┤
│  📅 Upcoming Appointments      │
│  ┌───────────────────────────┐ │
│  │ Dr. Amit Shah             │ │
│  │ Orthopedics | Tomorrow 10AM│ │
│  │ [View] [Cancel]           │ │
│  └───────────────────────────┘ │
├─────────────────────────────────┤
│  💊 Recent Prescriptions       │
│  ┌───────────────────────────┐ │
│  │ Dr. Priya • 15 Jul 2026  │ │
│  │ [View PDF]                │ │
│  └───────────────────────────┘ │
├─────────────────────────────────┤
│  📋 Recent Reports             │
│  ┌───────────────────────────┐ │
│  │ Blood Test • 10 Jul 2026 │ │
│  │ [View]                    │ │
│  └───────────────────────────┘ │
├─────────────────────────────────┤
│  🚨 EMERGENCY                  │
├─────────────────────────────────┤
│  🏠  📅  🔍  📋  👤           │
│  Home Appt Search Rec Profile  │
└─────────────────────────────────┘
```

---

## 3.5 Doctor Search

### User Stories

| ID | Story | Priority |
|----|-------|----------|
| PAT-US-006 | As a patient, I want to search for doctors by name so I can find a specific doctor | P1 |
| PAT-US-007 | As a patient, I want to filter doctors by specialization so I find the right type of doctor | P1 |
| PAT-US-008 | As a patient, I want to filter by availability so I only see doctors I can book today | P2 |

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PAT-FR-020 | System MUST support search by doctor name | P1 |
| PAT-FR-021 | System MUST support search by specialization | P1 |
| PAT-FR-022 | System MUST support search by clinic name | P1 |
| PAT-FR-023 | System MUST support search by city | P1 |
| PAT-FR-024 | System SHOULD support filter by experience | P2 |
| PAT-FR-025 | System SHOULD support filter by consultation fee range | P2 |
| PAT-FR-026 | System SHOULD support filter by languages spoken | P2 |
| PAT-FR-027 | System SHOULD support filter by "Available Today" | P2 |
| PAT-FR-028 | Search results MUST display: doctor name, specialization, clinic, consultation fee, rating summary | P1 |
| PAT-FR-029 | Search results MUST be paginated (20 results per page) | P1 |
| PAT-FR-030 | System MAY support search by distance/location (future enhancement) | P4 |

---

## 3.6 Doctor Profile

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PAT-FR-035 | Doctor profile MUST display: name, photo, specialization, qualifications, experience | P1 |
| PAT-FR-036 | Doctor profile MUST display: clinic name and address | P1 |
| PAT-FR-037 | Doctor profile MUST display: available appointment slots | P1 |
| PAT-FR-038 | Doctor profile MUST display: consultation fee | P1 |
| PAT-FR-039 | Doctor profile SHOULD display: languages spoken | P2 |
| PAT-FR-040 | Doctor profile SHOULD display: services offered | P2 |
| PAT-FR-041 | Doctor profile MUST display: verified badge (if admin-verified) | P1 |
| PAT-FR-042 | Doctor profile MUST display: patient reviews (verified only) | P2 |
| PAT-FR-043 | Doctor profile MUST include a "Book Appointment" CTA button | P1 |

---

## 3.7 Appointment Booking

### User Stories

| ID | Story | Priority |
|----|-------|----------|
| PAT-US-010 | As a patient, I want to book an appointment by selecting a time slot | P1 |
| PAT-US-011 | As a patient, I want to reschedule my appointment if my plans change | P1 |
| PAT-US-012 | As a patient, I want to cancel my appointment if I can't make it | P1 |
| PAT-US-013 | As a patient, I want to track my appointment status | P1 |

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PAT-FR-050 | System MUST allow patients to select a clinic (if doctor practices at multiple locations) | P1 |
| PAT-FR-051 | System MUST display available time slots for the selected doctor and clinic | P1 |
| PAT-FR-052 | System MUST allow patients to book an available slot | P1 |
| PAT-FR-053 | System MUST send a booking confirmation notification upon successful booking | P1 |
| PAT-FR-054 | System MUST allow patients to reschedule an appointment (subject to availability) | P1 |
| PAT-FR-055 | System MUST allow patients to cancel an appointment | P1 |
| PAT-FR-056 | System MUST display appointment status (Pending, Confirmed, Checked In, In Progress, Completed, Cancelled) | P1 |
| PAT-FR-057 | System MUST allow booking up to 7 days in advance | P1 |
| PAT-FR-058 | System MUST prevent double-booking the same slot | P1 |
| PAT-FR-059 | System SHOULD allow adding a reason/note for the visit | P2 |

### Booking Flow

```
Select Doctor → Select Clinic → Select Date → Select Slot → Confirm Booking → Receive Confirmation
```

---

## 3.8 Queue Tracking

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PAT-FR-060 | System MUST display the patient's token number | P1 |
| PAT-FR-061 | System MUST display the current token being served | P1 |
| PAT-FR-062 | System MUST display estimated waiting time | P1 |
| PAT-FR-063 | System MUST display doctor status (available, in consultation, on break) | P1 |
| PAT-FR-064 | System MUST update queue position in real-time (within 3 seconds) | P1 |
| PAT-FR-065 | System MUST notify the patient when they are next in queue | P1 |
| PAT-FR-066 | System SHOULD display queue progress indicator | P2 |

---

## 3.9 Digital Health Records & Prescription Viewer

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PAT-FR-070 | System MUST store all prescriptions linked to the patient's HealthSync ID | P1 |
| PAT-FR-071 | System MUST store all medical reports linked to the patient's HealthSync ID | P1 |
| PAT-FR-072 | System MUST store consultation history with date, doctor, and notes | P1 |
| PAT-FR-073 | System MUST allow patients to view prescriptions in a formatted layout | P1 |
| PAT-FR-074 | System MUST allow patients to download prescriptions as PDF | P1 |
| PAT-FR-075 | System MUST allow patients to share prescriptions with another doctor (with consent) | P2 |
| PAT-FR-076 | System SHOULD display allergies and ongoing medications | P2 |
| PAT-FR-077 | Records MUST be viewable offline if previously downloaded | P2 |

---

## 3.10 Emergency

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PAT-FR-080 | Dashboard MUST display a prominently visible emergency button | P1 |
| PAT-FR-081 | Emergency button MUST trigger an alert to saved emergency contacts | P1 |
| PAT-FR-082 | System SHOULD display nearby emergency numbers | P2 |
| PAT-FR-083 | Ambulance integration is planned for future phases | P4 |

---

## 3.11 API Endpoints (Patient Module)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/patients/register` | Register new patient |
| `GET` | `/patients/profile` | Get own profile |
| `PUT` | `/patients/profile` | Update profile |
| `GET` | `/patients/dashboard` | Get dashboard data |
| `GET` | `/doctors/search` | Search doctors |
| `GET` | `/doctors/:id` | Get doctor profile |
| `GET` | `/doctors/:id/slots` | Get available slots |
| `POST` | `/appointments` | Book appointment |
| `PUT` | `/appointments/:id/reschedule` | Reschedule appointment |
| `PUT` | `/appointments/:id/cancel` | Cancel appointment |
| `GET` | `/appointments` | List patient appointments |
| `GET` | `/appointments/:id` | Get appointment details |
| `GET` | `/queue/:appointmentId` | Get queue status |
| `GET` | `/records/prescriptions` | List prescriptions |
| `GET` | `/records/prescriptions/:id` | View prescription |
| `GET` | `/records/prescriptions/:id/pdf` | Download prescription PDF |
| `GET` | `/records/reports` | List medical reports |
| `GET` | `/records/reports/:id` | View report |
| `GET` | `/records/history` | Get consultation history |
| `POST` | `/emergency/alert` | Trigger emergency alert |

---

## 3.12 Acceptance Criteria

| ID | Criteria |
|----|----------|
| PAT-AC-001 | New patient can register and receive a HealthSync ID |
| PAT-AC-002 | Patient dashboard displays upcoming appointments, prescriptions, reports |
| PAT-AC-003 | Doctor search returns relevant results based on name, specialization, and filters |
| PAT-AC-004 | Patient can view doctor profile with qualifications, availability, and reviews |
| PAT-AC-005 | Patient can book an appointment by selecting an available slot |
| PAT-AC-006 | Patient can reschedule and cancel appointments |
| PAT-AC-007 | Queue tracking shows real-time position and estimated wait time |
| PAT-AC-008 | Patient can view and download prescriptions as PDF |
| PAT-AC-009 | Emergency button triggers alert to emergency contacts |
| PAT-AC-010 | All features work in English, Hindi, and Marathi |
