# Phase 1 — Reviews & Feedback

**Module Prefix:** `REV`
**Priority:** P2 — Should Have
**Status:** Draft

---

## 13.1 Purpose

The Reviews & Feedback module provides a **trust-building mechanism** by enabling patients to share authentic, verified feedback about their consultation experience. Unlike generic review platforms, HealthSync reviews are **tied to completed appointments** — only patients who have actually consulted with a doctor can leave a review. This eliminates fake reviews, builds doctor credibility, and helps other patients make informed decisions.

> **Key Principle:** No star ratings. HealthSync uses **text-based feedback only** to encourage thoughtful, authentic reviews rather than superficial numerical scoring.

---

## 13.2 User Stories

| ID | Role | Story | Priority |
|----|------|-------|----------|
| REV-US-001 | Patient | As a patient, I want to leave feedback after my appointment so other patients can benefit from my experience | P2 |
| REV-US-002 | Patient | As a patient, I want to read reviews of a doctor before booking so I can make an informed choice | P2 |
| REV-US-003 | Patient | As a patient, I want to edit my review if I change my mind | P2 |
| REV-US-004 | Patient | As a patient, I want to delete my review if I no longer want it visible | P2 |
| REV-US-005 | Doctor | As a doctor, I want to see feedback from my patients so I can improve my service | P3 |
| REV-US-006 | Doctor | As a doctor, I want to report an inappropriate review so the platform can take action | P2 |
| REV-US-007 | Admin | As an admin, I want to moderate reported reviews to maintain platform integrity | P2 |

---

## 13.3 Functional Requirements

### Review Creation

| ID | Requirement | Priority |
|----|-------------|----------|
| REV-FR-001 | System MUST prompt patients to leave a review after an appointment is marked COMPLETED | P2 |
| REV-FR-002 | Reviews MUST consist of text feedback only (no star ratings, no numerical scores) | P2 |
| REV-FR-003 | System MUST only allow reviews for appointments with status COMPLETED | P2 |
| REV-FR-004 | System MUST only allow one review per completed appointment | P2 |
| REV-FR-005 | Review prompt SHOULD appear 1 hour after consultation completion via notification | P3 |
| REV-FR-006 | Review text MUST have a minimum of 20 characters and maximum of 1000 characters | P2 |
| REV-FR-007 | System MUST store the relationship between review, appointment, patient, and doctor | P2 |

### Review Display

| ID | Requirement | Priority |
|----|-------------|----------|
| REV-FR-010 | Reviews MUST be displayed on the doctor's public profile | P2 |
| REV-FR-011 | Reviews MUST be displayed in reverse chronological order | P2 |
| REV-FR-012 | Each review MUST display: patient first name (last name initial only), review date, and review text | P2 |
| REV-FR-013 | Reviews MUST be paginated (10 reviews per page) | P2 |
| REV-FR-014 | Doctor profile MUST display total review count | P2 |
| REV-FR-015 | System MUST display a "Verified Consultation" badge on each review | P2 |

### Review Management

| ID | Requirement | Priority |
|----|-------------|----------|
| REV-FR-020 | Patients MUST be able to edit their own reviews within 7 days of posting | P2 |
| REV-FR-021 | Patients MUST be able to delete their own reviews at any time | P2 |
| REV-FR-022 | Edited reviews MUST display an "Edited" indicator with edit timestamp | P2 |
| REV-FR-023 | Deleted reviews MUST be soft-deleted (retained in database, hidden from display) | P2 |

### Review Moderation

| ID | Requirement | Priority |
|----|-------------|----------|
| REV-FR-030 | Doctors MUST be able to report a review as inappropriate | P2 |
| REV-FR-031 | Patients MUST be able to report a review as inappropriate | P3 |
| REV-FR-032 | Reported reviews MUST be queued for admin moderation | P2 |
| REV-FR-033 | Admin MUST be able to approve (keep visible), hide, or permanently remove reported reviews | P2 |
| REV-FR-034 | Admin MUST record the moderation decision with reason | P2 |
| REV-FR-035 | System MUST notify the review author if their review is removed by moderation | P2 |
| REV-FR-036 | System MUST auto-flag reviews containing profanity or abusive language for moderation | P3 |

---

## 13.4 Business Rules

| ID | Rule |
|----|------|
| REV-BR-001 | Only patients who have completed a consultation can leave a review (verified by appointment status = COMPLETED) |
| REV-BR-002 | One review per appointment — patients cannot leave multiple reviews for the same consultation |
| REV-BR-003 | Reviews are text-only. No star ratings, numerical scores, or emoji-only reviews are permitted |
| REV-BR-004 | Review editing window closes 7 days after initial posting |
| REV-BR-005 | Patient names on reviews are partially anonymized: first name + last name initial (e.g., "Priya S.") |
| REV-BR-006 | Incentivized reviews (e.g., discount for review) are prohibited and grounds for removal |
| REV-BR-007 | Doctors cannot leave reviews for other doctors |
| REV-BR-008 | Deleted reviews remain in the database for audit purposes but are hidden from all public views |

---

## 13.5 Moderation Workflow

```
1. Doctor or patient reports a review
        ↓
2. Review flagged in admin moderation queue
        ↓
3. Admin reviews the report and original review
        ↓
4. Admin decision:
    ├── APPROVE → Review remains visible, report dismissed
    ├── HIDE → Review hidden from public view, author notified
    └── REMOVE → Review soft-deleted, author notified with reason
        ↓
5. Decision logged in audit trail
```

---

## 13.6 Data Model

### Review

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `appointment_id` | UUID | FK to appointments (unique — one review per appointment) |
| `patient_id` | UUID | FK to patients |
| `doctor_id` | UUID | FK to doctors |
| `review_text` | Text | 20–1000 characters |
| `is_edited` | Boolean | Default: false |
| `edited_at` | Timestamp | Null until edited |
| `is_visible` | Boolean | Default: true |
| `is_deleted` | Boolean | Default: false (soft delete) |
| `deleted_at` | Timestamp | Null until deleted |
| `created_at` | Timestamp | Auto-generated |
| `updated_at` | Timestamp | Auto-updated |

### Review Report

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `review_id` | UUID | FK to reviews |
| `reported_by` | UUID | FK to users |
| `reporter_role` | Enum | PATIENT, DOCTOR |
| `reason` | Text | Required, 10–500 characters |
| `status` | Enum | PENDING, APPROVED, HIDDEN, REMOVED |
| `moderated_by` | UUID | FK to admins (null until moderated) |
| `moderation_reason` | Text | Required on moderation action |
| `moderated_at` | Timestamp | Null until moderated |
| `created_at` | Timestamp | Auto-generated |

---

## 13.7 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/reviews` | Create a review for a completed appointment |
| `GET` | `/reviews/doctor/:doctorId` | Get paginated reviews for a doctor (public) |
| `GET` | `/reviews/mine` | Get current patient's submitted reviews |
| `PUT` | `/reviews/:id` | Edit own review (within 7-day window) |
| `DELETE` | `/reviews/:id` | Soft-delete own review |
| `POST` | `/reviews/:id/report` | Report a review as inappropriate |
| `GET` | `/admin/reviews/reported` | Get pending moderation queue |
| `PUT` | `/admin/reviews/:reportId/moderate` | Process moderation decision |

---

## 13.8 Error Handling

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| `REV_001` | Appointment not completed | "You can only leave a review after your consultation is complete" |
| `REV_002` | Review already exists for appointment | "You have already reviewed this consultation" |
| `REV_003` | Review text too short | "Please write at least 20 characters" |
| `REV_004` | Review text too long | "Review must be under 1000 characters" |
| `REV_005` | Edit window expired | "Reviews can only be edited within 7 days of posting" |
| `REV_006` | Unauthorized edit/delete | "You can only modify your own reviews" |
| `REV_007` | Review not found | "This review is no longer available" |
| `REV_008` | Already reported | "You have already reported this review" |

---

## 13.9 Acceptance Criteria

| ID | Criteria |
|----|----------|
| REV-AC-001 | Patient is prompted to leave a review after appointment completion |
| REV-AC-002 | Review can only be created for a COMPLETED appointment |
| REV-AC-003 | Only one review per appointment is allowed |
| REV-AC-004 | Reviews are text-only with no star ratings |
| REV-AC-005 | Reviews appear on the doctor's profile in reverse chronological order |
| REV-AC-006 | Each review shows "Verified Consultation" badge |
| REV-AC-007 | Patient can edit review within 7 days; "Edited" indicator is shown |
| REV-AC-008 | Patient can delete their review at any time |
| REV-AC-009 | Doctor can report an inappropriate review |
| REV-AC-010 | Reported reviews appear in admin moderation queue |
| REV-AC-011 | Admin can approve, hide, or remove reported reviews |
| REV-AC-012 | Review author is notified when their review is removed by moderation |
| REV-AC-013 | Patient names are displayed as first name + last initial only |
