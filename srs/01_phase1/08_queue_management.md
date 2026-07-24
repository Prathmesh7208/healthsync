# Phase 1 — Smart Queue Management

**Module Prefix:** `QUE`
**Priority:** P1 — Must Have

---

## 8.1 Purpose

The Smart Queue Management system provides **real-time, synchronized queue tracking** across all user roles — patients, doctors, and receptionists. It replaces physical token systems with a digital queue that provides transparency, reduces uncertainty, and optimizes patient flow.

---

## 8.2 Multi-Role Queue Views

### Patient View

| Information | Description |
|-------------|-------------|
| Current Token | Token number currently being served |
| Your Token | Patient's assigned token number |
| Queue Position | Number of patients ahead |
| Estimated Wait | Calculated wait time in minutes |
| Doctor Status | Available / In Consultation / On Break |

### Doctor View

| Information | Description |
|-------------|-------------|
| Today's Queue | Complete list of queued patients |
| Current Patient | Patient currently in consultation |
| Next Patient | Next patient to be called |
| Completed Count | Number of consultations completed today |
| Remaining Count | Number of patients still waiting |

### Reception View

| Information | Description |
|-------------|-------------|
| Clinic-wide Queue | All queues across all doctors |
| Walk-in Integration | Walk-ins merged into queue |
| Doctor Statuses | Real-time status of all doctors |
| Queue Controls | Skip, reorder, add walk-in |

---

## 8.3 Functional Requirements

### Queue Operations

| ID | Requirement | Priority |
|----|-------------|----------|
| QUE-FR-001 | System MUST create a queue entry when a patient is checked in | P1 |
| QUE-FR-002 | System MUST assign a sequential token number per doctor per day | P1 |
| QUE-FR-003 | Token numbering MUST reset daily (starting from 1) | P1 |
| QUE-FR-004 | System MUST track queue position for each patient | P1 |
| QUE-FR-005 | Queue MUST advance automatically when a doctor completes a consultation | P1 |
| QUE-FR-006 | System MUST calculate and display estimated waiting time | P1 |
| QUE-FR-007 | Estimated wait MUST be recalculated whenever queue changes occur | P1 |
| QUE-FR-008 | System MUST support walk-in patient insertion into the queue | P1 |

### Real-Time Updates

| ID | Requirement | Priority |
|----|-------------|----------|
| QUE-FR-010 | Queue updates MUST be pushed to all connected clients within 3 seconds | P1 |
| QUE-FR-011 | System MUST use WebSocket connections for real-time queue updates | P1 |
| QUE-FR-012 | System MUST fallback to polling (every 10 seconds) if WebSocket is unavailable | P1 |
| QUE-FR-013 | Patient MUST receive a push notification when they are next in queue | P1 |
| QUE-FR-014 | Patient MUST receive a push notification when their turn arrives | P1 |

### Queue Controls (Reception/Doctor)

| ID | Requirement | Priority |
|----|-------------|----------|
| QUE-FR-020 | Reception MUST be able to skip a patient (mark as missed) | P1 |
| QUE-FR-021 | Skipped patients SHOULD be offered to rejoin at the end of the queue | P2 |
| QUE-FR-022 | Reception SHOULD be able to reorder queue positions in exceptional cases | P2 |
| QUE-FR-023 | Doctor MUST be able to call the next patient from their dashboard | P1 |
| QUE-FR-024 | Doctor MUST be able to mark current consultation as complete (advances queue) | P1 |

---

## 8.4 Wait Time Estimation Algorithm

### Calculation Method

```
Estimated Wait = (Patients Ahead) × (Average Consultation Duration)

Where:
- Patients Ahead = Current queue position - Current token
- Average Consultation Duration = 
    Rolling average of last 10 completed consultations for this doctor today
    OR
    Doctor's configured slot duration (if fewer than 3 consultations completed today)
```

### Business Rules

| ID | Rule |
|----|------|
| QUE-BR-001 | Minimum estimated wait time is 0 minutes (when patient is next) |
| QUE-BR-002 | If no consultation data exists, default to the doctor's slot duration |
| QUE-BR-003 | Wait time recalculates on every queue event (completion, skip, walk-in addition) |
| QUE-BR-004 | Wait time display rounds to the nearest 5 minutes |
| QUE-BR-005 | If doctor goes on break, estimated wait time adds the break duration |

---

## 8.5 Queue Data Model

### Queue Entry

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `appointment_id` | UUID | FK to appointments |
| `doctor_id` | UUID | FK to doctors |
| `patient_id` | UUID | FK to patients |
| `clinic_id` | UUID | FK to clinics |
| `queue_date` | Date | Today's date |
| `token_number` | Integer | Sequential per doctor per day |
| `position` | Integer | Current queue position |
| `status` | Enum | WAITING, IN_CONSULTATION, COMPLETED, SKIPPED, CANCELLED |
| `checked_in_at` | Timestamp | When patient joined queue |
| `called_at` | Timestamp | When doctor called patient |
| `completed_at` | Timestamp | When consultation ended |
| `estimated_wait_minutes` | Integer | Calculated wait time |

---

## 8.6 Queue State Diagram

```
    ┌─────────┐
    │ WAITING  │ ◄── Patient checks in / Walk-in registered
    └────┬─────┘
         │ Doctor calls next
         ▼
┌─────────────────┐
│ IN_CONSULTATION  │ ◄── Doctor starts consultation
└────┬─────┬──────┘
     │     │
     │     │ Doctor completes
     ▼     ▼
┌─────────┐  ┌───────────┐
│ SKIPPED │  │ COMPLETED  │
└─────────┘  └───────────┘
     │
     │ Patient returns
     ▼
┌──────────────┐
│ WAITING (end)│ ◄── Rejoins at end of queue
└──────────────┘
```

---

## 8.7 WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `queue:updated` | Server → Client | Full queue state for the doctor |
| `queue:position_changed` | Server → Patient | New position and estimated wait |
| `queue:your_turn` | Server → Patient | Notification that it's their turn |
| `queue:next_patient` | Server → Doctor | Next patient details |
| `queue:doctor_status` | Server → All | Doctor status change |
| `queue:patient_skipped` | Server → Patient | Notification of being skipped |

---

## 8.8 Acceptance Criteria

| ID | Criteria |
|----|----------|
| QUE-AC-001 | Token is assigned upon patient check-in |
| QUE-AC-002 | Queue position updates in real-time (within 3 seconds) |
| QUE-AC-003 | Estimated wait time is displayed and recalculates on queue changes |
| QUE-AC-004 | Queue advances when doctor completes a consultation |
| QUE-AC-005 | Patient receives notification when next in queue and when it's their turn |
| QUE-AC-006 | Walk-in patients are integrated into the queue |
| QUE-AC-007 | Skipped patients can rejoin at the end of the queue |
| QUE-AC-008 | Queue view is consistent across patient, doctor, and reception interfaces |
