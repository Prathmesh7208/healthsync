# Phase 1 — Appointment Engine

**Module Prefix:** `APT`
**Priority:** P1 — Must Have

---

## 7.1 Purpose

The Appointment Engine is the **heart of HealthSync**. It orchestrates the entire appointment lifecycle — from booking through consultation completion — coordinating between patients, doctors, and receptionists in real-time.

---

## 7.2 Appointment Lifecycle

### Status Flow

```
    ┌──────────┐
    │ PENDING   │ ◄── Patient books appointment
    └─────┬─────┘
          │ Doctor/Reception accepts
          ▼
    ┌──────────┐
    │ CONFIRMED │ ◄── Confirmation notification sent to patient
    └─────┬─────┘
          │ Patient arrives, checked in by reception
          ▼
    ┌──────────┐
    │ CHECKED_IN│ ◄── Token assigned, enters queue
    └─────┬─────┘
          │ Doctor starts consultation
          ▼
    ┌───────────┐
    │IN_PROGRESS│ ◄── Consultation happening
    └─────┬─────┘
          │ Doctor completes consultation
          ▼
    ┌──────────┐
    │ COMPLETED │ ◄── Records generated, queue advances
    └──────────┘

    Alternative flows:
    PENDING/CONFIRMED → CANCELLED (by patient, doctor, or reception)
    PENDING/CONFIRMED → RESCHEDULED → PENDING (new slot)
    CONFIRMED → NO_SHOW (patient doesn't arrive)
```

---

## 7.3 End-to-End Appointment Flow

```
1. Patient books appointment
        ↓
2. Doctor receives notification
        ↓
3. Doctor accepts appointment
        ↓
4. Patient receives confirmation
        ↓
5. Reception dashboard updates
        ↓
6. Doctor calendar updates
        ↓
7. Reminder notification sent (1 hour before)
        ↓
8. Patient arrives → Reception checks in
        ↓
9. Token generated → Queue starts
        ↓
10. Doctor starts consultation
        ↓
11. Prescription created → Records stored
        ↓
12. Consultation completed → Queue advances
```

---

## 7.4 Functional Requirements

### Booking

| ID | Requirement | Priority |
|----|-------------|----------|
| APT-FR-001 | System MUST allow patients to book appointments for available slots | P1 |
| APT-FR-002 | System MUST enforce one patient per slot (no double-booking) | P1 |
| APT-FR-003 | System MUST validate that the selected slot is still available at booking time (optimistic locking) | P1 |
| APT-FR-004 | System MUST set initial appointment status to `PENDING` | P1 |
| APT-FR-005 | System MUST notify the doctor of new appointment requests | P1 |
| APT-FR-006 | System MUST allow booking up to 7 days in advance | P1 |
| APT-FR-007 | System MUST prevent booking for past dates/times | P1 |

### Confirmation

| ID | Requirement | Priority |
|----|-------------|----------|
| APT-FR-010 | Doctor MUST be able to accept pending appointments | P1 |
| APT-FR-011 | Doctor MUST be able to decline pending appointments with a reason | P1 |
| APT-FR-012 | Reception MUST be able to confirm appointments on behalf of the doctor | P1 |
| APT-FR-013 | Acceptance MUST change status to `CONFIRMED` and notify the patient | P1 |
| APT-FR-014 | System SHOULD auto-confirm if doctor has auto-accept enabled | P2 |

### Rescheduling

| ID | Requirement | Priority |
|----|-------------|----------|
| APT-FR-020 | Patient MUST be able to reschedule a PENDING or CONFIRMED appointment | P1 |
| APT-FR-021 | Reception MUST be able to reschedule appointments | P1 |
| APT-FR-022 | Rescheduling MUST release the original slot and book the new slot | P1 |
| APT-FR-023 | Rescheduling MUST notify all affected parties | P1 |
| APT-FR-024 | System MUST prevent rescheduling within 1 hour of appointment time | P2 |

### Cancellation

| ID | Requirement | Priority |
|----|-------------|----------|
| APT-FR-030 | Patient MUST be able to cancel a PENDING or CONFIRMED appointment | P1 |
| APT-FR-031 | Doctor MUST be able to cancel appointments with a reason | P1 |
| APT-FR-032 | Reception MUST be able to cancel appointments | P1 |
| APT-FR-033 | Cancellation MUST release the slot for other patients | P1 |
| APT-FR-034 | Cancellation MUST notify all affected parties | P1 |
| APT-FR-035 | Cancellation MUST record the reason and the cancelling party | P1 |

### Slot Management

| ID | Requirement | Priority |
|----|-------------|----------|
| APT-FR-040 | Slots MUST be generated based on doctor's availability schedule | P1 |
| APT-FR-041 | Slot duration MUST match doctor's configured slot duration | P1 |
| APT-FR-042 | Blocked dates MUST NOT generate slots | P1 |
| APT-FR-043 | Break periods MUST NOT generate slots | P1 |
| APT-FR-044 | Booked slots MUST NOT appear in available slots for other patients | P1 |
| APT-FR-045 | Slots MUST be generated for the next 7 days on demand | P1 |

---

## 7.5 Business Rules

| ID | Rule |
|----|------|
| APT-BR-001 | A patient can have a maximum of 3 active (PENDING/CONFIRMED) appointments at any time |
| APT-BR-002 | A patient cannot book two appointments with the same doctor on the same day |
| APT-BR-003 | Appointment reminders are sent 1 hour before the scheduled time |
| APT-BR-004 | Unconfirmed appointments (PENDING for > 24 hours) are auto-cancelled |
| APT-BR-005 | Cancellation records are retained for analytics (not hard-deleted) |
| APT-BR-006 | Walk-in appointments do not go through the PENDING state; they start as CONFIRMED |

---

## 7.6 Appointment Data Model

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `patient_id` | UUID | FK to patients |
| `doctor_id` | UUID | FK to doctors |
| `clinic_id` | UUID | FK to clinics |
| `slot_date` | Date | Appointment date |
| `slot_start_time` | Time | Slot start |
| `slot_end_time` | Time | Slot end |
| `status` | Enum | PENDING, CONFIRMED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, RESCHEDULED, NO_SHOW |
| `type` | Enum | SCHEDULED, WALK_IN |
| `token_number` | Integer | Assigned upon check-in |
| `visit_reason` | Text | Optional patient note |
| `cancellation_reason` | Text | Filled on cancellation |
| `cancelled_by` | Enum | PATIENT, DOCTOR, RECEPTION, SYSTEM |
| `checked_in_at` | Timestamp | When patient checked in |
| `consultation_started_at` | Timestamp | When doctor started |
| `consultation_completed_at` | Timestamp | When doctor completed |
| `created_at` | Timestamp | Auto-generated |
| `updated_at` | Timestamp | Auto-updated |

---

## 7.7 Concurrency Handling

| Scenario | Solution |
|----------|----------|
| Two patients book the same slot simultaneously | Optimistic locking with version field; second booking fails gracefully with "Slot no longer available" message |
| Doctor updates availability while patient is booking | Slot validation at booking time; stale slots rejected |
| Multiple receptionists modify the same appointment | Database-level row locking; last-write-wins with conflict notification |

---

## 7.8 Acceptance Criteria

| ID | Criteria |
|----|----------|
| APT-AC-001 | Patient can book an available slot and status is set to PENDING |
| APT-AC-002 | Double-booking the same slot is prevented |
| APT-AC-003 | Doctor can accept/decline appointments |
| APT-AC-004 | Patient receives confirmation notification upon acceptance |
| APT-AC-005 | Appointment can be rescheduled; original slot is released |
| APT-AC-006 | Appointment can be cancelled; slot is released |
| APT-AC-007 | All status transitions trigger appropriate notifications |
| APT-AC-008 | Reminder is sent 1 hour before the appointment |
| APT-AC-009 | Walk-in appointments are created as CONFIRMED |
| APT-AC-010 | Unconfirmed appointments auto-cancel after 24 hours |
