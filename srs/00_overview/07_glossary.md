# 7. Glossary

A comprehensive glossary of terms, acronyms, and domain-specific vocabulary used throughout the HealthSync SRS documentation.

---

## General Terms

| Term | Definition |
|------|-----------|
| **HealthSync** | The cross-platform digital healthcare ecosystem product described in this SRS |
| **HealthSync ID** | A unique patient identifier assigned upon registration (format: `HS-YYYY-XXXXXX`) enabling cross-clinic identification |
| **Platform** | The complete HealthSync system including frontend applications, backend services, and infrastructure |
| **Ecosystem** | The network of patients, doctors, receptionists, clinics, and administrators connected through HealthSync |
| **Outpatient** | A patient who visits a healthcare facility for diagnosis or treatment without being admitted overnight |
| **Consultation** | A medical appointment where a doctor examines and advises a patient |
| **Walk-in** | A patient who arrives at a clinic without a prior appointment |
| **No-show** | A patient who has a confirmed appointment but does not arrive |
| **Token** | A digital queue number assigned to a patient for tracking their position in the queue |
| **Slot** | A specific time window available for booking an appointment with a doctor |
| **Consent** | Explicit permission granted by a patient for a doctor to access their medical records |

---

## Technical Acronyms

| Acronym | Full Form | Context |
|---------|-----------|---------|
| **SRS** | Software Requirements Specification | This document |
| **MVP** | Minimum Viable Product | Phase 1 deliverable |
| **API** | Application Programming Interface | Backend service endpoints |
| **REST** | Representational State Transfer | API architecture style |
| **JWT** | JSON Web Token | Authentication token standard |
| **OTP** | One-Time Password | Login verification method |
| **RBAC** | Role-Based Access Control | Authorization model |
| **HTTPS** | Hypertext Transfer Protocol Secure | Encrypted communication protocol |
| **CRUD** | Create, Read, Update, Delete | Basic data operations |
| **ORM** | Object-Relational Mapping | Database abstraction layer |
| **FCM** | Firebase Cloud Messaging | Push notification service |
| **OWASP** | Open Web Application Security Project | Security standards organization |
| **WCAG** | Web Content Accessibility Guidelines | Accessibility standards |
| **ACID** | Atomicity, Consistency, Isolation, Durability | Database transaction properties |
| **TTL** | Time To Live | Cache expiration duration |
| **UUID** | Universally Unique Identifier | Unique ID generation standard |
| **JSONB** | JSON Binary | PostgreSQL binary JSON column type |
| **RLS** | Row-Level Security | Database access control mechanism |
| **CI/CD** | Continuous Integration / Continuous Deployment | Automated build and deployment pipeline |
| **WebRTC** | Web Real-Time Communication | Video/audio communication protocol (Phase 2) |
| **FHIR** | Fast Healthcare Interoperability Resources | Healthcare data exchange standard (Phase 3) |
| **HL7** | Health Level Seven | Healthcare data interchange standard (Phase 3) |
| **IoT** | Internet of Things | Connected device ecosystem (Phase 3) |
| **EHR** | Electronic Health Record | Digital medical records |

---

## User Roles

| Role | Definition |
|------|-----------|
| **Patient** | An individual seeking healthcare services through the HealthSync platform |
| **Doctor** | A licensed medical practitioner registered and verified on the HealthSync platform |
| **Receptionist** | Clinic staff responsible for managing appointments, patient check-ins, and queue operations |
| **Admin** | HealthSync platform administrator responsible for verification, user management, and system monitoring |
| **Super Admin** | Highest-level administrator with full system access (future) |

---

## Status Values

### Appointment Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Appointment booked, awaiting doctor confirmation |
| `CONFIRMED` | Doctor has accepted the appointment |
| `CHECKED_IN` | Patient has arrived and checked in at the clinic |
| `IN_PROGRESS` | Consultation is currently happening |
| `COMPLETED` | Consultation is finished |
| `CANCELLED` | Appointment was cancelled by patient, doctor, or receptionist |
| `NO_SHOW` | Patient did not arrive for the confirmed appointment |
| `RESCHEDULED` | Appointment has been moved to a different slot |

### Doctor Availability Statuses

| Status | Description |
|--------|-------------|
| `AVAILABLE` | Doctor is available for consultations |
| `IN_CONSULTATION` | Doctor is currently with a patient |
| `ON_BREAK` | Doctor is on a scheduled break |
| `OFFLINE` | Doctor is not available |

### Consent Statuses

| Status | Description |
|--------|-------------|
| `REQUESTED` | Doctor has requested access to patient records |
| `GRANTED` | Patient has approved the access request |
| `DENIED` | Patient has rejected the access request |
| `REVOKED` | Patient has withdrawn previously granted access |
