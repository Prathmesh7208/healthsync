# 8. Document Conventions

This document defines the formatting standards, requirement identification conventions, and priority classifications used throughout the HealthSync SRS.

---

## 8.1 Requirement Identification

Every requirement in this SRS is assigned a unique identifier following this pattern:

```
[MODULE]-[TYPE]-[NUMBER]
```

### Module Prefixes

| Prefix | Module |
|--------|--------|
| `AUTH` | Authentication |
| `PAT` | Patient |
| `DOC` | Doctor |
| `REC` | Reception |
| `ADM` | Admin |
| `APT` | Appointment Engine |
| `QUE` | Queue Management |
| `DHR` | Digital Health Records |
| `HSID` | HealthSync ID |
| `CON` | Consent & Privacy |
| `NOT` | Notifications |
| `REV` | Reviews |
| `SEC` | Security |
| `NET` | Low Network Optimization |
| `PLT` | Cross-Platform Support |
| `NFR` | Non-Functional Requirements |

### Requirement Types

| Type | Description |
|------|-------------|
| `FR` | Functional Requirement |
| `NFR` | Non-Functional Requirement |
| `BR` | Business Rule |
| `US` | User Story |
| `UI` | User Interface Requirement |
| `DR` | Data Requirement |
| `AC` | Acceptance Criteria |

### Examples

- `AUTH-FR-001` — First functional requirement in the Authentication module
- `PAT-US-003` — Third user story in the Patient module
- `QUE-BR-002` — Second business rule in Queue Management
- `NFR-NFR-005` — Fifth non-functional requirement

---

## 8.2 Priority Levels

Requirements are classified using the MoSCoW prioritization method:

| Priority | Label | Description |
|----------|-------|-------------|
| **P1** | Must Have | Critical for Phase 1 launch. System cannot function without it. |
| **P2** | Should Have | Important but not blocking. Should be included if time permits. |
| **P3** | Could Have | Desirable enhancement. Can be deferred without impacting core functionality. |
| **P4** | Won't Have (this phase) | Acknowledged but explicitly excluded from the current phase. |

---

## 8.3 Formatting Conventions

### Keywords

The following keywords follow RFC 2119 conventions:

| Keyword | Meaning |
|---------|---------|
| **MUST** | Absolute requirement |
| **MUST NOT** | Absolute prohibition |
| **SHALL** | Mandatory requirement (interchangeable with MUST) |
| **SHOULD** | Recommended but not mandatory |
| **SHOULD NOT** | Discouraged but not prohibited |
| **MAY** | Optional |

### Text Formatting

- **Bold** — Key terms, important concepts, and emphasis
- *Italic* — First use of a defined term, or references to external documents
- `Code` — Technical values, API endpoints, status codes, field names, and database columns
- > Blockquote — Principles, vision statements, and important callouts

### Diagrams

- Architecture diagrams use ASCII art for portability
- Flow diagrams describe sequential processes
- State diagrams describe entity lifecycle

---

## 8.4 Document Status

Each document in this SRS carries an implicit status:

| Status | Description |
|--------|-------------|
| **Draft** | Initial version, under active authoring |
| **Review** | Content complete, awaiting stakeholder review |
| **Approved** | Reviewed and approved for development |
| **Updated** | Modified after initial approval (change log required) |

All Phase 1 documents in this SRS are currently in **Draft** status.

---

## 8.5 Cross-References

Documents reference each other using relative paths:

- `See [Glossary](../00_overview/07_glossary.md)` — Reference to another SRS document
- `See APT-FR-003` — Reference to a specific requirement by ID
- `See Phase 2 → Video Consultation` — Reference to a future phase module
