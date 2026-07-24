# Phase 1 — Reception Module

**Module Prefix:** `REC`
**Priority:** P1 — Must Have

---

## 5.1 Purpose

The Reception Module provides clinic staff with a centralized dashboard to manage all front-desk operations — including scheduled appointments, walk-in registrations, patient check-ins, digital token generation, queue management, and coordination with doctors. It eliminates manual paper-based tracking and reduces administrative chaos.

---

## 5.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| REC-US-001 | As a receptionist, I want to see all of today's appointments so I can prepare for the day | P1 |
| REC-US-002 | As a receptionist, I want to register walk-in patients quickly | P1 |
| REC-US-003 | As a receptionist, I want to check in patients when they arrive | P1 |
| REC-US-004 | As a receptionist, I want to generate digital tokens for queue management | P1 |
| REC-US-005 | As a receptionist, I want to see which doctors are available, in consultation, or on break | P1 |
| REC-US-006 | As a receptionist, I want to reschedule appointments for patients who call | P1 |
| REC-US-007 | As a receptionist, I want to mark no-show patients | P2 |
| REC-US-008 | As a receptionist, I want to confirm appointments via the dashboard | P1 |

---

## 5.3 Reception Dashboard

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REC-FR-001 | Dashboard MUST display today's appointments grouped by doctor | P1 |
| REC-FR-002 | Dashboard MUST display appointment status (Pending, Confirmed, Checked In, In Progress, Completed, Cancelled, No-Show) | P1 |
| REC-FR-003 | Dashboard MUST display doctor availability status for all clinic doctors | P1 |
| REC-FR-004 | Dashboard MUST display the current queue for each doctor | P1 |
| REC-FR-005 | Dashboard MUST provide a "Walk-in Registration" action | P1 |
| REC-FR-006 | Dashboard MUST provide a "Check-in Patient" action | P1 |
| REC-FR-007 | Dashboard MUST display summary counts: total, checked-in, waiting, completed, no-show | P1 |
| REC-FR-008 | Dashboard SHOULD support filtering by doctor, status, and time | P2 |
| REC-FR-009 | Dashboard MUST auto-refresh in real-time (WebSocket or polling) | P1 |

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────┐
│  HealthSync Reception | [Clinic Name]          🔔       │
├──────────────────────────────────────────────────────────┤
│  📊 Today's Summary                                     │
│  Total: 65 | Checked In: 22 | Waiting: 8 | Done: 30    │
│  No-Show: 3 | Cancelled: 2                              │
├──────────────────────────────────────────────────────────┤
│  [+ Walk-in]  [Check-in]  [Reschedule]                  │
├──────────────────────────────────────────────────────────┤
│  👨‍⚕️ Dr. Amit Shah (Orthopedics)                       │
│  Status: 🟢 In Consultation | Current: Token #13        │
│  ┌────────┬──────────────┬──────────┬────────┐          │
│  │ Token  │ Patient      │ Time     │ Status │          │
│  ├────────┼──────────────┼──────────┼────────┤          │
│  │ #13    │ Rajesh Kumar │ 10:00 AM │ In Prg │          │
│  │ #14    │ Priya Sharma │ 10:15 AM │ Wait   │          │
│  │ #15    │ Walk-in      │ --       │ Wait   │          │
│  │ #16    │ Amit Patel   │ 10:30 AM │ ChkIn  │          │
│  └────────┴──────────────┴──────────┴────────┘          │
├──────────────────────────────────────────────────────────┤
│  👨‍⚕️ Dr. Priya Mehra (Dermatology)                     │
│  Status: 🟡 On Break | Resumes: 11:00 AM                │
│  ...                                                     │
└──────────────────────────────────────────────────────────┘
```

---

## 5.4 Walk-in Registration

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REC-FR-010 | Receptionist MUST be able to register a walk-in patient with: name, mobile number | P1 |
| REC-FR-011 | If patient has HealthSync ID, system MUST auto-populate their details | P1 |
| REC-FR-012 | Walk-in registration MUST assign the patient to a doctor's queue | P1 |
| REC-FR-013 | Walk-in patients MUST receive a digital token | P1 |
| REC-FR-014 | Walk-in patients SHOULD be integrated into the existing queue order | P1 |
| REC-FR-015 | If patient doesn't have HealthSync account, receptionist SHOULD be able to create a basic profile | P2 |

---

## 5.5 Patient Check-in

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REC-FR-020 | Receptionist MUST be able to check in patients who have scheduled appointments | P1 |
| REC-FR-021 | Check-in MUST generate a digital token and assign queue position | P1 |
| REC-FR-022 | Check-in MUST update the appointment status to "Checked In" | P1 |
| REC-FR-023 | Check-in MUST notify the patient of their token number and queue position | P1 |
| REC-FR-024 | System SHOULD support check-in via HealthSync ID lookup | P2 |
| REC-FR-025 | System SHOULD support check-in via QR code (future) | P3 |

---

## 5.6 Token & Queue Management

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REC-FR-030 | System MUST auto-generate sequential tokens per doctor per day | P1 |
| REC-FR-031 | Token numbering MUST reset daily | P1 |
| REC-FR-032 | Receptionist MUST be able to view the complete queue for each doctor | P1 |
| REC-FR-033 | Receptionist MUST be able to skip a patient (mark as no-show) | P1 |
| REC-FR-034 | Receptionist MUST be able to reorder queue in exceptional cases | P2 |
| REC-FR-035 | Queue changes MUST be reflected in real-time for all connected clients | P1 |

---

## 5.7 Appointment Management

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REC-FR-040 | Receptionist MUST be able to confirm pending appointments | P1 |
| REC-FR-041 | Receptionist MUST be able to reschedule appointments on behalf of patients | P1 |
| REC-FR-042 | Receptionist MUST be able to cancel appointments with a reason | P1 |
| REC-FR-043 | All appointment changes MUST trigger notifications to the affected patient | P1 |
| REC-FR-044 | Receptionist MUST be able to mark patients as no-show | P2 |
| REC-FR-045 | Receptionist SHOULD be able to book appointments on behalf of patients (phone bookings) | P2 |

---

## 5.8 Doctor Status Tracking

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| REC-FR-050 | Dashboard MUST show real-time status for each doctor: Available, In Consultation, On Break, Offline | P1 |
| REC-FR-051 | Status changes MUST update automatically when doctor starts/completes consultations | P1 |
| REC-FR-052 | Dashboard SHOULD show how long the doctor has been in current status | P2 |

---

## 5.9 API Endpoints (Reception Module)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/reception/dashboard` | Get dashboard data |
| `GET` | `/reception/appointments/today` | Today's appointments |
| `POST` | `/reception/walkin` | Register walk-in patient |
| `POST` | `/reception/checkin/:appointmentId` | Check in patient |
| `GET` | `/reception/queue/:doctorId` | Get doctor's queue |
| `PUT` | `/reception/queue/:doctorId/skip` | Skip patient (no-show) |
| `PUT` | `/reception/queue/:doctorId/reorder` | Reorder queue |
| `PUT` | `/reception/appointments/:id/confirm` | Confirm appointment |
| `PUT` | `/reception/appointments/:id/reschedule` | Reschedule appointment |
| `PUT` | `/reception/appointments/:id/cancel` | Cancel appointment |
| `PUT` | `/reception/appointments/:id/noshow` | Mark no-show |
| `GET` | `/reception/doctors/status` | Get all doctor statuses |

---

## 5.10 Acceptance Criteria

| ID | Criteria |
|----|----------|
| REC-AC-001 | Reception dashboard displays all today's appointments grouped by doctor |
| REC-AC-002 | Walk-in patient can be registered and assigned to a queue in under 30 seconds |
| REC-AC-003 | Patient check-in generates a token and updates queue position |
| REC-AC-004 | Doctor status is updated in real-time on the dashboard |
| REC-AC-005 | Receptionist can confirm, reschedule, and cancel appointments |
| REC-AC-006 | Queue updates are reflected in real-time for receptionist, doctor, and patient views |
| REC-AC-007 | No-show patients can be skipped without disrupting queue order |
| REC-AC-008 | Appointment changes trigger notifications to affected patients |
