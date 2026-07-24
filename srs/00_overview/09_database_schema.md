# Unified Database Schema Reference

**Document:** 09_database_schema.md
**Status:** Draft
**Version:** 1.0

---

## 1. Overview

This document provides a consolidated Entity Relationship Diagram (ERD) and relational schema specification for the PostgreSQL database powering the HealthSync platform.

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ PATIENTS : "is a"
    USERS ||--o{ DOCTORS : "is a"
    USERS ||--o{ RECEPTIONISTS : "is a"
    CLINICS ||--o{ DOCTORS : "employs"
    CLINICS ||--o{ RECEPTIONISTS : "employs"
    PATIENTS ||--o{ APPOINTMENTS : "books"
    DOCTORS ||--o{ APPOINTMENTS : "conducts"
    CLINICS ||--o{ APPOINTMENTS : "hosts"
    APPOINTMENTS ||--o| QUEUE_ENTRIES : "generates"
    APPOINTMENTS ||--o| PRESCRIPTIONS : "results in"
    PATIENTS ||--o{ HEALTH_RECORDS : "owns"
    PATIENTS ||--o{ CONSENTS : "grants"
    DOCTORS ||--o{ CONSENTS : "requests"
    PATIENTS ||--o{ REVIEWS : "writes"
    DOCTORS ||--o{ REVIEWS : "receives"

    USERS {
        uuid id PK
        string mobile_number UK
        enum role
        boolean is_active
        timestamp created_at
    }

    PATIENTS {
        uuid id PK
        uuid user_id FK
        string healthsync_id UK
        string full_name
        enum gender
        date date_of_birth
        string blood_group
    }

    DOCTORS {
        uuid id PK
        uuid user_id FK
        string full_name
        string specialization
        string qualification
        string registration_number
        boolean is_verified
    }

    CLINICS {
        uuid id PK
        string name
        string address
        string city
        boolean is_active
    }

    APPOINTMENTS {
        uuid id PK
        uuid patient_id FK
        uuid doctor_id FK
        uuid clinic_id FK
        date slot_date
        time slot_start_time
        enum status
        enum type
    }

    QUEUE_ENTRIES {
        uuid id PK
        uuid appointment_id FK
        integer token_number
        integer position
        enum status
    }

    PRESCRIPTIONS {
        uuid id PK
        uuid appointment_id FK
        uuid patient_id FK
        uuid doctor_id FK
        text diagnosis
        jsonb medications
    }
```

---

## 3. Core Tables Summary

1. `users`: Base authentication table storing credentials, roles, and status.
2. `patients`: Detailed profile linked to `users`, holding the unique `healthsync_id`.
3. `doctors`: Medical credentials, specializations, and verification status.
4. `clinics`: Healthcare facility records and addresses.
5. `appointments`: Central table tracking slots, statuses, and scheduling type (`SCHEDULED` vs `WALK_IN`).
6. `queue_entries`: Daily sequential tokens and live queue progression.
7. `prescriptions`: Formatted digital prescription data with JSONB medication lists.
8. `consents`: Medical record access authorizations and auto-expiry timestamps.
9. `audit_logs`: Immutable security audit trails for all critical operations.
