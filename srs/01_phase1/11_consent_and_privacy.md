# Phase 1 — Consent and Privacy

**Module Prefix:** `CON`
**Priority:** P1 — Must Have

---

## 11.1 Purpose

The Consent and Privacy module ensures that **patients own and control their medical data**. No healthcare provider can access patient records without explicit, informed consent. This module implements transparent, auditable consent workflows that build trust and comply with data protection principles.

---

## 11.2 Core Privacy Principles

1. **Patient Ownership** — Medical records belong to the patient, not the platform or the healthcare provider
2. **Explicit Consent** — Every record access requires active patient approval
3. **Granular Control** — Patients choose what to share and for how long
4. **Revocability** — Consent can be withdrawn at any time
5. **Transparency** — Patients can see who accessed their data and when
6. **Data Minimization** — Only necessary data is collected and shared

---

## 11.3 Consent Workflow

```
1. Doctor requests access to patient's medical history
        ↓
2. Patient receives notification: "[Doctor Name] requests access to your medical records"
        ↓
3. Patient reviews request details (doctor name, clinic, purpose)
        ↓
4. Patient chooses:
    ├── ALLOW → Specify duration (This visit / 24 hours / 7 days / Until revoked)
    │           → Select records to share (All / Specific types)
    │           → Doctor gains read-only access
    └── DENY  → Doctor notified; no access granted
        ↓
5. Access is logged in audit trail
        ↓
6. Patient can revoke access at any time from their Privacy Settings
```

---

## 11.4 Functional Requirements

### Consent Requests

| ID | Requirement | Priority |
|----|-------------|----------|
| CON-FR-001 | Doctor MUST send a consent request before accessing patient medical history | P1 |
| CON-FR-002 | Consent request MUST include: doctor name, clinic, purpose of access | P1 |
| CON-FR-003 | Patient MUST receive a push notification for consent requests | P1 |
| CON-FR-004 | Patient MUST be able to approve or deny consent requests | P1 |
| CON-FR-005 | Consent approval MUST specify access duration | P1 |
| CON-FR-006 | Patient SHOULD be able to select which record types to share | P2 |

### Consent Management

| ID | Requirement | Priority |
|----|-------------|----------|
| CON-FR-010 | Patient MUST be able to view all active consent grants | P1 |
| CON-FR-011 | Patient MUST be able to revoke any consent at any time | P1 |
| CON-FR-012 | Revoked consent MUST immediately terminate doctor's access | P1 |
| CON-FR-013 | System MUST auto-revoke consent when the specified duration expires | P1 |
| CON-FR-014 | Patient MUST be able to view consent history (past grants and denials) | P1 |

### Access Logging

| ID | Requirement | Priority |
|----|-------------|----------|
| CON-FR-020 | System MUST log every record access event with timestamp, accessor, and records viewed | P1 |
| CON-FR-021 | Patient MUST be able to view their access log | P1 |
| CON-FR-022 | Access logs MUST be immutable (append-only) | P1 |
| CON-FR-023 | Patient SHOULD receive a notification when their records are accessed | P2 |

---

## 11.5 Access Duration Options

| Option | Duration | Auto-Revoke |
|--------|----------|-------------|
| This Visit Only | Until current consultation is completed | Yes |
| 24 Hours | 24 hours from approval time | Yes |
| 7 Days | 7 days from approval time | Yes |
| Until Revoked | Indefinite | No (patient must manually revoke) |

---

## 11.6 Consent Data Model

### Consent Record

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `patient_id` | UUID | FK to patients |
| `doctor_id` | UUID | FK to doctors |
| `status` | Enum | REQUESTED, GRANTED, DENIED, REVOKED, EXPIRED |
| `access_duration` | Enum | THIS_VISIT, 24_HOURS, 7_DAYS, UNTIL_REVOKED |
| `record_types` | JSONB | Array of allowed record types, or ALL |
| `purpose` | Text | Reason for access request |
| `granted_at` | Timestamp | When patient approved |
| `expires_at` | Timestamp | Calculated expiry |
| `revoked_at` | Timestamp | When patient revoked |
| `created_at` | Timestamp | Request creation time |

### Access Log Entry

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `consent_id` | UUID | FK to consent records |
| `doctor_id` | UUID | FK to doctors |
| `patient_id` | UUID | FK to patients |
| `records_accessed` | JSONB | Record IDs and types accessed |
| `accessed_at` | Timestamp | When the access occurred |
| `ip_address` | String | Accessor's IP |

---

## 11.7 Business Rules

| ID | Rule |
|----|------|
| CON-BR-001 | Doctors can only see patient basic profile (name, age, gender) without consent |
| CON-BR-002 | Medical history, prescriptions, reports, and allergy data require consent |
| CON-BR-003 | Admins can NEVER access patient medical records |
| CON-BR-004 | Receptionists can NEVER access patient medical records |
| CON-BR-005 | A doctor can have only one active consent from a patient at a time |
| CON-BR-006 | Expired consents cannot be extended; a new request must be made |

---

## 11.8 Privacy Settings Screen

```
┌─────────────────────────────────┐
│  🔒 Privacy Settings           │
├─────────────────────────────────┤
│  Active Access Grants           │
│  ┌───────────────────────────┐ │
│  │ Dr. Amit Shah             │ │
│  │ Expires: 20 Jul 2026      │ │
│  │ Records: All              │ │
│  │ [Revoke Access]           │ │
│  └───────────────────────────┘ │
├─────────────────────────────────┤
│  Pending Requests (1)          │
│  ┌───────────────────────────┐ │
│  │ Dr. Priya Mehra           │ │
│  │ Purpose: Follow-up review │ │
│  │ [Allow]    [Deny]         │ │
│  └───────────────────────────┘ │
├─────────────────────────────────┤
│  Access History                 │
│  ┌───────────────────────────┐ │
│  │ Dr. Amit Shah             │ │
│  │ Viewed: Prescriptions     │ │
│  │ 18 Jul 2026, 10:15 AM     │ │
│  └───────────────────────────┘ │
│  [View Full History →]         │
└─────────────────────────────────┘
```

---

## 11.9 Acceptance Criteria

| ID | Criteria |
|----|----------|
| CON-AC-001 | Doctor must request consent before accessing patient records |
| CON-AC-002 | Patient receives notification of consent request |
| CON-AC-003 | Patient can approve with specified duration |
| CON-AC-004 | Patient can deny consent request |
| CON-AC-005 | Patient can revoke consent at any time with immediate effect |
| CON-AC-006 | Consent auto-expires based on selected duration |
| CON-AC-007 | All record access events are logged and viewable by patient |
| CON-AC-008 | Admins and receptionists cannot access medical records |
