# Phase 1 — HealthSync ID

**Module Prefix:** `HSID`
**Priority:** P1 — Must Have

---

## 10.1 Purpose

The HealthSync ID is a **unique, portable patient identifier** that eliminates repeated registrations across participating clinics. It serves as the single key linking a patient to all their appointments, prescriptions, reports, and medical history within the HealthSync ecosystem.

---

## 10.2 ID Format

```
HS-YYYY-XXXXXX

Where:
  HS      = HealthSync prefix
  YYYY    = Year of registration
  XXXXXX  = 6-digit unique alphanumeric code (uppercase letters + digits)

Examples:
  HS-2026-A3K9M2
  HS-2026-7BX4N1
  HS-2026-QW8E5R
```

---

## 10.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| HSID-FR-001 | System MUST generate a unique HealthSync ID upon patient registration | P1 |
| HSID-FR-002 | HealthSync ID MUST be globally unique across the platform | P1 |
| HSID-FR-003 | HealthSync ID MUST be immutable (cannot be changed after generation) | P1 |
| HSID-FR-004 | HealthSync ID MUST be displayed on the patient's dashboard and profile | P1 |
| HSID-FR-005 | Reception MUST be able to look up patients by HealthSync ID | P1 |
| HSID-FR-006 | HealthSync ID MUST be linked to all medical records, appointments, and prescriptions | P1 |
| HSID-FR-007 | System MUST prevent duplicate ID generation | P1 |
| HSID-FR-008 | HealthSync ID SHOULD be searchable at any participating clinic | P1 |
| HSID-FR-009 | System SHOULD generate a QR code representation of the HealthSync ID | P2 |
| HSID-FR-010 | Patient SHOULD be able to share their HealthSync ID (text, QR) for quick identification | P2 |

---

## 10.4 Benefits

| Benefit | Description |
|---------|-------------|
| **No Repeated Registration** | Patient registers once; HealthSync ID works at any participating clinic |
| **Easy Identification** | Reception can quickly find patient records using the ID |
| **Secure Record Sharing** | ID links to consent-based medical records, enabling controlled sharing |
| **Portable Health History** | All medical data follows the patient across clinics |
| **Future Interoperability** | Foundation for integration with national health IDs (ABHA) in Phase 3 |

---

## 10.5 Business Rules

| ID | Rule |
|----|------|
| HSID-BR-001 | One HealthSync ID per patient (one mobile number = one ID) |
| HSID-BR-002 | HealthSync ID is not transferable |
| HSID-BR-003 | Deactivated accounts retain their HealthSync ID (can be reactivated) |
| HSID-BR-004 | ID generation uses cryptographically random alphanumeric characters |
| HSID-BR-005 | Collision check is mandatory before ID assignment |

---

## 10.6 Data Model

| Field | Type | Constraints |
|-------|------|-------------|
| `healthsync_id` | String | Unique, indexed, format: `HS-YYYY-XXXXXX` |
| `patient_id` | UUID | FK to patients (one-to-one) |
| `generated_at` | Timestamp | Registration timestamp |
| `is_active` | Boolean | Default: true |

---

## 10.7 Acceptance Criteria

| ID | Criteria |
|----|----------|
| HSID-AC-001 | Unique HealthSync ID is generated upon patient registration |
| HSID-AC-002 | ID follows the `HS-YYYY-XXXXXX` format |
| HSID-AC-003 | No two patients share the same HealthSync ID |
| HSID-AC-004 | Reception can look up patient by HealthSync ID |
| HSID-AC-005 | HealthSync ID is displayed on patient dashboard and profile |
| HSID-AC-006 | All records are linked to the HealthSync ID |
