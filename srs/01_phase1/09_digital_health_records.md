# Phase 1 — Digital Health Records

**Module Prefix:** `DHR`
**Priority:** P1 — Must Have

---

## 9.1 Purpose

The Digital Health Records module provides a centralized, secure, and patient-owned repository for all medical information generated through HealthSync. Every consultation automatically produces structured records, ensuring no medical data is lost and patients have a complete, portable health history.

---

## 9.2 Record Types

| Type | Source | Description |
|------|--------|-------------|
| **Prescription** | Doctor (during consultation) | Medications, dosage, diagnosis, instructions |
| **Consultation Notes** | Doctor (during consultation) | Clinical observations, examination findings |
| **Medical Reports** | Doctor (uploaded) | Lab results, imaging, diagnostic reports |
| **Allergies** | Patient / Doctor | Known allergies and sensitivities |
| **Medical History** | System (auto-generated) | Chronological record of all consultations |
| **Follow-up Records** | Doctor (during consultation) | Recommended follow-up dates and reasons |

---

## 9.3 Functional Requirements

### Record Generation

| ID | Requirement | Priority |
|----|-------------|----------|
| DHR-FR-001 | System MUST automatically create a health record entry upon consultation completion | P1 |
| DHR-FR-002 | Health record MUST link: patient ID, doctor ID, clinic ID, appointment ID, date | P1 |
| DHR-FR-003 | Prescription MUST be stored as a structured record (not just PDF) | P1 |
| DHR-FR-004 | Consultation notes MUST be stored as part of the health record | P1 |
| DHR-FR-005 | Uploaded reports MUST be stored with metadata (type, date, description) | P1 |

### Record Access

| ID | Requirement | Priority |
|----|-------------|----------|
| DHR-FR-010 | Patient MUST be able to view all their health records | P1 |
| DHR-FR-011 | Records MUST be displayed in reverse chronological order | P1 |
| DHR-FR-012 | Patient MUST be able to filter records by type (prescription, report, consultation) | P1 |
| DHR-FR-013 | Patient MUST be able to filter records by doctor | P2 |
| DHR-FR-014 | Patient MUST be able to filter records by date range | P2 |
| DHR-FR-015 | Patient MUST be able to download prescriptions as PDF | P1 |
| DHR-FR-016 | Patient MUST be able to view reports (images, PDFs) | P1 |

### Record Sharing

| ID | Requirement | Priority |
|----|-------------|----------|
| DHR-FR-020 | Doctors MUST request consent before accessing patient records | P1 |
| DHR-FR-021 | Patient MUST be able to share specific records with a doctor | P2 |
| DHR-FR-022 | Shared records MUST have a defined access duration (e.g., 24 hours, 7 days, until revoked) | P2 |
| DHR-FR-023 | All record access events MUST be logged in the audit trail | P1 |

### Record Storage

| ID | Requirement | Priority |
|----|-------------|----------|
| DHR-FR-030 | Medical records MUST NOT be hard-deleted (soft delete only) | P1 |
| DHR-FR-031 | Uploaded files MUST be stored in secure cloud storage | P1 |
| DHR-FR-032 | Sensitive health data MUST be encrypted at rest | P1 |
| DHR-FR-033 | Records MUST be available for offline viewing if previously downloaded | P2 |
| DHR-FR-034 | System MUST support file uploads up to 10MB per file | P1 |
| DHR-FR-035 | Supported file formats: PDF, JPG, JPEG, PNG | P1 |

---

## 9.4 Health Record Data Model

### Consultation Record

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `patient_id` | UUID | FK to patients |
| `doctor_id` | UUID | FK to doctors |
| `clinic_id` | UUID | FK to clinics |
| `appointment_id` | UUID | FK to appointments |
| `record_date` | Date | Date of consultation |
| `diagnosis` | Text | Primary diagnosis |
| `symptoms` | JSONB | Array of reported symptoms |
| `examination_notes` | Text | Doctor's clinical notes |
| `prescription_id` | UUID | FK to prescriptions |
| `follow_up_date` | Date | Optional recommended follow-up |
| `follow_up_reason` | Text | Optional reason for follow-up |
| `created_at` | Timestamp | Auto-generated |

### Medical Report

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `patient_id` | UUID | FK to patients |
| `doctor_id` | UUID | FK to doctors (uploader) |
| `consultation_id` | UUID | FK to consultation record |
| `report_type` | Enum | LAB_RESULT, IMAGING, DIAGNOSTIC, OTHER |
| `title` | String | Descriptive title |
| `description` | Text | Optional description |
| `file_url` | String | Secure storage URL |
| `file_type` | String | PDF, JPG, PNG |
| `file_size_bytes` | Integer | File size |
| `report_date` | Date | Date of the report |
| `created_at` | Timestamp | Auto-generated |

### Patient Allergy

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `patient_id` | UUID | FK to patients |
| `allergy_type` | Enum | DRUG, FOOD, ENVIRONMENTAL, OTHER |
| `allergen` | String | Name of the allergen |
| `severity` | Enum | MILD, MODERATE, SEVERE |
| `notes` | Text | Additional details |
| `reported_by` | UUID | FK to users (patient or doctor) |
| `created_at` | Timestamp | Auto-generated |

---

## 9.5 Acceptance Criteria

| ID | Criteria |
|----|----------|
| DHR-AC-001 | Health record is auto-created upon consultation completion |
| DHR-AC-002 | Patient can view all records in reverse chronological order |
| DHR-AC-003 | Patient can filter records by type, doctor, and date range |
| DHR-AC-004 | Prescriptions can be downloaded as PDF |
| DHR-AC-005 | Reports (images, PDFs) can be viewed in-app |
| DHR-AC-006 | All record access events are logged in audit trail |
| DHR-AC-007 | Records are encrypted at rest |
| DHR-AC-008 | Previously downloaded records are viewable offline |
