# Phase 1 — Doctor Module

**Module Prefix:** `DOC`
**Priority:** P1 — Must Have

---

## 4.1 Purpose

The Doctor Module provides healthcare practitioners with tools to manage their daily workflow — including schedule management, patient consultations, digital prescription creation, report uploads, and access to patient medical history (with consent). The module is designed to reduce administrative overhead and allow doctors to focus on patient care.

---

## 4.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| DOC-US-001 | As a doctor, I want to see today's appointments so I know my schedule | P1 |
| DOC-US-002 | As a doctor, I want to manage my availability so patients can book only when I'm free | P1 |
| DOC-US-003 | As a doctor, I want to view the patient queue so I know who is next | P1 |
| DOC-US-004 | As a doctor, I want to create digital prescriptions during consultations | P1 |
| DOC-US-005 | As a doctor, I want to upload reports and consultation notes | P1 |
| DOC-US-006 | As a doctor, I want to view a patient's medical history (with their consent) | P1 |
| DOC-US-007 | As a doctor, I want to accept or decline appointment requests | P1 |
| DOC-US-008 | As a doctor, I want a calendar view of my appointments | P2 |

---

## 4.3 Doctor Dashboard

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| DOC-FR-001 | Dashboard MUST display today's appointment list with patient names, time, and status | P1 |
| DOC-FR-002 | Dashboard MUST display current queue position and next patient | P1 |
| DOC-FR-003 | Dashboard MUST display total appointments for today (completed / remaining) | P1 |
| DOC-FR-004 | Dashboard MUST provide quick access to start the next consultation | P1 |
| DOC-FR-005 | Dashboard SHOULD display a weekly/monthly calendar view | P2 |
| DOC-FR-006 | Dashboard MUST show pending appointment requests requiring acceptance | P1 |

### Dashboard Layout

```
┌─────────────────────────────────┐
│  HealthSync Doctor       🔔    │
│  Dr. [Name] | [Specialization] │
├─────────────────────────────────┤
│  📊 Today's Summary            │
│  Total: 25 | Done: 12 | Left: 13│
├─────────────────────────────────┤
│  ▶ Current: Token #13          │
│    Patient: Rajesh Kumar        │
│    [Start Consultation]         │
├─────────────────────────────────┤
│  ⏳ Up Next                    │
│  #14 - Priya Sharma  | 11:30AM │
│  #15 - Amit Patel    | 11:45AM │
│  #16 - Sunita Devi   | 12:00PM │
├─────────────────────────────────┤
│  📅 Pending Requests (2)       │
│  [Accept] [Decline]            │
├─────────────────────────────────┤
│  🏠  📅  👥  ⚙️              │
│  Home Cal Patients Settings     │
└─────────────────────────────────┘
```

---

## 4.4 Availability Management

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| DOC-FR-010 | Doctor MUST be able to set weekly recurring availability schedules | P1 |
| DOC-FR-011 | Schedule MUST define: day of week, start time, end time, slot duration | P1 |
| DOC-FR-012 | Doctor MUST be able to set slot duration (default: 15 minutes) | P1 |
| DOC-FR-013 | Doctor MUST be able to block specific dates (holidays, leave) | P1 |
| DOC-FR-014 | Doctor MUST be able to add break periods within a day | P1 |
| DOC-FR-015 | Doctor SHOULD be able to set maximum patients per day | P2 |
| DOC-FR-016 | Changes to availability MUST NOT affect already booked appointments | P1 |
| DOC-FR-017 | Doctor MUST be able to set availability per clinic (if multiple) | P1 |

### Availability Data Model

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `doctor_id` | UUID | FK to doctors |
| `clinic_id` | UUID | FK to clinics |
| `day_of_week` | Enum | MON, TUE, WED, THU, FRI, SAT, SUN |
| `start_time` | Time | HH:MM format |
| `end_time` | Time | Must be after start_time |
| `slot_duration_minutes` | Integer | 10, 15, 20, 30 |
| `max_patients` | Integer | Optional cap |
| `is_active` | Boolean | Default: true |

---

## 4.5 Consultation Workflow

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| DOC-FR-020 | Doctor MUST be able to start a consultation for the current queue patient | P1 |
| DOC-FR-021 | Starting a consultation MUST update the queue (move to next patient) | P1 |
| DOC-FR-022 | During consultation, doctor MUST see patient's basic profile | P1 |
| DOC-FR-023 | During consultation, doctor MUST be able to request access to patient's medical history | P1 |
| DOC-FR-024 | Doctor MUST be able to create a digital prescription | P1 |
| DOC-FR-025 | Doctor MUST be able to add consultation notes | P1 |
| DOC-FR-026 | Doctor MUST be able to upload reports (images, PDFs) | P1 |
| DOC-FR-027 | Doctor MUST be able to mark consultation as completed | P1 |
| DOC-FR-028 | System MUST auto-create a health record entry upon consultation completion | P1 |
| DOC-FR-029 | Doctor SHOULD be able to recommend follow-up with a suggested date | P2 |

### Consultation Flow

```
Start Consultation → View Patient Info → Request History (consent) →
Examine → Create Prescription → Add Notes → Upload Reports →
Recommend Follow-up → Complete Consultation → Queue advances
```

---

## 4.6 Prescription Creation

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| DOC-FR-030 | Prescription MUST include: patient name, date, diagnosis | P1 |
| DOC-FR-031 | Prescription MUST include medication list: name, dosage, frequency, duration | P1 |
| DOC-FR-032 | Prescription SHOULD support medication search/autocomplete | P2 |
| DOC-FR-033 | Prescription MUST include doctor's name, qualifications, registration number | P1 |
| DOC-FR-034 | Prescription MUST be digitally signed (doctor's identifier) | P1 |
| DOC-FR-035 | Prescription MUST be automatically shared with the patient | P1 |
| DOC-FR-036 | Prescription MUST be stored as a health record linked to the patient's HealthSync ID | P1 |
| DOC-FR-037 | Doctor SHOULD be able to add special instructions/advice | P2 |

### Prescription Data Model

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `appointment_id` | UUID | FK to appointments |
| `patient_id` | UUID | FK to patients |
| `doctor_id` | UUID | FK to doctors |
| `diagnosis` | Text | Required |
| `medications` | JSONB | Array of medication objects |
| `instructions` | Text | Optional |
| `follow_up_date` | Date | Optional |
| `created_at` | Timestamp | Auto-generated |

### Medication Object Structure

```json
{
  "name": "Paracetamol 500mg",
  "dosage": "1 tablet",
  "frequency": "Twice a day",
  "duration": "5 days",
  "timing": "After meals",
  "notes": "Take with warm water"
}
```

---

## 4.7 API Endpoints (Doctor Module)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/doctor/dashboard` | Get dashboard data |
| `GET` | `/doctor/appointments` | List appointments |
| `GET` | `/doctor/appointments/today` | Today's appointments |
| `PUT` | `/doctor/appointments/:id/accept` | Accept appointment |
| `PUT` | `/doctor/appointments/:id/decline` | Decline appointment |
| `GET` | `/doctor/availability` | Get availability schedule |
| `PUT` | `/doctor/availability` | Update availability |
| `POST` | `/doctor/availability/block` | Block specific dates |
| `GET` | `/doctor/queue` | Get current queue |
| `POST` | `/doctor/consultation/start` | Start consultation |
| `POST` | `/doctor/consultation/complete` | Complete consultation |
| `POST` | `/doctor/prescriptions` | Create prescription |
| `POST` | `/doctor/reports/upload` | Upload report |
| `POST` | `/doctor/notes` | Add consultation notes |
| `POST` | `/doctor/consent/request` | Request patient record access |
| `GET` | `/doctor/patients/:id/history` | View patient history (with consent) |

---

## 4.8 Acceptance Criteria

| ID | Criteria |
|----|----------|
| DOC-AC-001 | Doctor dashboard shows today's appointments, queue, and pending requests |
| DOC-AC-002 | Doctor can set and modify weekly availability schedule |
| DOC-AC-003 | Doctor can block specific dates and availability changes don't affect existing bookings |
| DOC-AC-004 | Doctor can accept or decline appointment requests |
| DOC-AC-005 | Doctor can start consultation and view patient profile |
| DOC-AC-006 | Doctor can request and receive consent-based access to patient history |
| DOC-AC-007 | Doctor can create a digital prescription with medications, dosage, and instructions |
| DOC-AC-008 | Prescription is automatically shared with the patient and stored in health records |
| DOC-AC-009 | Doctor can upload reports and add consultation notes |
| DOC-AC-010 | Completing consultation advances the queue automatically |
