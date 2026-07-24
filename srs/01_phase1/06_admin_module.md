# Phase 1 — Admin Module

**Module Prefix:** `ADM`
**Priority:** P1 — Must Have

---

## 6.1 Purpose

The Admin Module provides platform administrators with tools to manage the HealthSync ecosystem — including doctor and clinic verification, receptionist assignment, user management, analytics, audit logging, and system health monitoring. This module ensures platform integrity, trust, and operational visibility.

---

## 6.2 User Stories

| ID | Story | Priority |
|----|-------|----------|
| ADM-US-001 | As an admin, I want to verify doctor registrations so only legitimate doctors are on the platform | P1 |
| ADM-US-002 | As an admin, I want to verify clinics so patients can trust clinic information | P1 |
| ADM-US-003 | As an admin, I want to manage receptionist accounts and assign them to clinics | P1 |
| ADM-US-004 | As an admin, I want to view platform analytics to understand usage and growth | P1 |
| ADM-US-005 | As an admin, I want to review audit logs for security and compliance | P1 |
| ADM-US-006 | As an admin, I want to monitor system health and uptime | P2 |
| ADM-US-007 | As an admin, I want to manage user accounts (activate, deactivate, suspend) | P1 |

---

## 6.3 Doctor Verification

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-FR-001 | Admin MUST be able to view pending doctor verification requests | P1 |
| ADM-FR-002 | Verification request MUST include: name, qualifications, registration number, clinic, specialization, uploaded documents | P1 |
| ADM-FR-003 | Admin MUST be able to approve or reject doctor verification | P1 |
| ADM-FR-004 | Approval MUST activate the doctor's profile and display a verification badge | P1 |
| ADM-FR-005 | Rejection MUST include a reason and notify the doctor | P1 |
| ADM-FR-006 | Admin SHOULD be able to request additional documents before making a decision | P2 |
| ADM-FR-007 | Admin MUST be able to revoke verification and deactivate a doctor | P1 |

### Verification Flow

```
Doctor Submits Registration → Admin Reviews Documents → 
  ├── Approve → Doctor Profile Activated (Verified Badge) → Notification Sent
  ├── Request More Info → Doctor Notified → Resubmission → Re-review
  └── Reject → Reason Recorded → Doctor Notified
```

---

## 6.4 Clinic Verification

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-FR-010 | Admin MUST be able to view pending clinic registration requests | P1 |
| ADM-FR-011 | Clinic registration MUST include: name, address, contact, type, doctors, license info | P1 |
| ADM-FR-012 | Admin MUST be able to approve or reject clinic registration | P1 |
| ADM-FR-013 | Approved clinics MUST appear in patient search results | P1 |
| ADM-FR-014 | Admin MUST be able to deactivate a clinic | P1 |

---

## 6.5 Reception Management

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-FR-020 | Admin MUST be able to create receptionist accounts | P1 |
| ADM-FR-021 | Admin MUST be able to assign receptionists to specific clinics | P1 |
| ADM-FR-022 | Admin MUST be able to reassign or remove receptionist-clinic associations | P1 |
| ADM-FR-023 | Admin MUST be able to activate or deactivate receptionist accounts | P1 |

---

## 6.6 User Management

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-FR-030 | Admin MUST be able to view all registered users with filtering (role, status, registration date) | P1 |
| ADM-FR-031 | Admin MUST be able to activate, deactivate, or suspend user accounts | P1 |
| ADM-FR-032 | Admin MUST be able to view user activity summary | P2 |
| ADM-FR-033 | Account status changes MUST be logged in the audit trail | P1 |
| ADM-FR-034 | Admin MUST NOT be able to access patient medical records | P1 |

---

## 6.7 Analytics & Reports

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-FR-040 | Admin MUST be able to view platform-wide analytics dashboard | P1 |
| ADM-FR-041 | Dashboard MUST display: total users (by role), total appointments, active clinics, active doctors | P1 |
| ADM-FR-042 | Dashboard MUST display: daily/weekly/monthly growth trends | P2 |
| ADM-FR-043 | Dashboard SHOULD display: appointment completion rate, no-show rate, average queue time | P2 |
| ADM-FR-044 | Admin SHOULD be able to export reports as CSV | P3 |

### Key Metrics

| Metric | Description |
|--------|-------------|
| Total Registered Patients | Cumulative patient count |
| Total Verified Doctors | Active, verified doctor count |
| Total Active Clinics | Clinics with at least one active doctor |
| Daily Appointments | Appointments booked per day |
| Appointment Completion Rate | Completed / Total booked (%) |
| No-Show Rate | No-show / Total confirmed (%) |
| Average Queue Wait Time | Average minutes from check-in to consultation start |
| Platform Uptime | System availability percentage |

---

## 6.8 Audit Logs

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-FR-050 | System MUST log all administrative actions (verification, account changes, permission changes) | P1 |
| ADM-FR-051 | System MUST log all medical record access events | P1 |
| ADM-FR-052 | Audit logs MUST include: timestamp, actor (user ID), action, target, result | P1 |
| ADM-FR-053 | Audit logs MUST be searchable by date range, actor, and action type | P1 |
| ADM-FR-054 | Audit logs MUST be immutable (append-only, no deletion) | P1 |
| ADM-FR-055 | Audit logs SHOULD support export for compliance review | P2 |

### Audit Log Entry Structure

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique log entry ID |
| `timestamp` | Timestamp | When the action occurred |
| `actor_id` | UUID | User who performed the action |
| `actor_role` | Enum | Role of the actor |
| `action` | String | Action performed (e.g., `DOCTOR_VERIFIED`, `RECORD_ACCESSED`) |
| `target_type` | String | Entity type affected (e.g., `DOCTOR`, `PATIENT`, `APPOINTMENT`) |
| `target_id` | UUID | Entity ID affected |
| `details` | JSONB | Additional action-specific details |
| `ip_address` | String | Actor's IP address |
| `result` | Enum | `SUCCESS`, `FAILURE`, `DENIED` |

---

## 6.9 System Monitoring

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-FR-060 | Admin SHOULD be able to view system health status | P2 |
| ADM-FR-061 | Monitoring SHOULD display: API response times, error rates, active users | P2 |
| ADM-FR-062 | Monitoring SHOULD display: database connection status, Redis status, FCM status | P2 |
| ADM-FR-063 | System SHOULD send alerts when error rates exceed thresholds | P3 |

---

## 6.10 API Endpoints (Admin Module)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/dashboard` | Admin dashboard data |
| `GET` | `/admin/doctors/pending` | Pending doctor verifications |
| `PUT` | `/admin/doctors/:id/verify` | Approve doctor |
| `PUT` | `/admin/doctors/:id/reject` | Reject doctor |
| `PUT` | `/admin/doctors/:id/revoke` | Revoke doctor verification |
| `GET` | `/admin/clinics/pending` | Pending clinic registrations |
| `PUT` | `/admin/clinics/:id/verify` | Approve clinic |
| `PUT` | `/admin/clinics/:id/reject` | Reject clinic |
| `POST` | `/admin/receptionists` | Create receptionist account |
| `PUT` | `/admin/receptionists/:id/assign` | Assign to clinic |
| `GET` | `/admin/users` | List all users |
| `PUT` | `/admin/users/:id/status` | Change user status |
| `GET` | `/admin/analytics` | Get analytics data |
| `GET` | `/admin/audit-logs` | Search audit logs |
| `GET` | `/admin/system/health` | System health status |

---

## 6.11 Acceptance Criteria

| ID | Criteria |
|----|----------|
| ADM-AC-001 | Admin can view and process pending doctor verification requests |
| ADM-AC-002 | Approved doctors receive verification badge and become searchable |
| ADM-AC-003 | Rejected doctors receive notification with rejection reason |
| ADM-AC-004 | Admin can create, assign, and manage receptionist accounts |
| ADM-AC-005 | Admin can view platform analytics with key metrics |
| ADM-AC-006 | All admin actions are recorded in immutable audit logs |
| ADM-AC-007 | Admin cannot access patient medical records |
| ADM-AC-008 | Audit logs are searchable and filterable |
