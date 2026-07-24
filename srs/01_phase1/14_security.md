# Phase 1 — Security

**Module Prefix:** `SEC`
**Priority:** P1 — Must Have
**Status:** Draft

---

## 14.1 Purpose

The Security module defines the comprehensive security architecture for HealthSync — protecting patient privacy, ensuring data integrity, securing authentication flows, and defending the platform against common web/mobile vulnerabilities. Given that HealthSync handles sensitive healthcare data, security is **non-negotiable** and must meet the highest industry standards from day one.

> **Guiding Standard:** All security implementations MUST align with **OWASP Application Security Verification Standard (ASVS) Level 2** as a baseline, with Level 3 aspirations for medical data handling.

---

## 14.2 User Stories

| ID | Role | Story | Priority |
|----|------|-------|----------|
| SEC-US-001 | Patient | As a patient, I want my medical data encrypted so no unauthorized person can read it | P1 |
| SEC-US-002 | Patient | As a patient, I want to know who accessed my data so I can trust the platform | P1 |
| SEC-US-003 | Doctor | As a doctor, I want to be confident that patient data I access is protected | P1 |
| SEC-US-004 | Admin | As an admin, I want to review security audit logs to detect suspicious activity | P1 |
| SEC-US-005 | All Users | As a user, I want my session to be protected so nobody can hijack my account | P1 |

---

## 14.3 Data Classification

All data handled by HealthSync is classified into tiers that determine encryption, access control, and retention requirements:

| Tier | Classification | Examples | Encryption | Access |
|------|---------------|----------|------------|--------|
| **Tier 1** | Critical / PHI | Medical records, prescriptions, diagnosis, allergies, consultation notes | AES-256 at rest + TLS 1.2+ in transit | Patient + consented doctor only |
| **Tier 2** | Sensitive / PII | Name, mobile number, DOB, gender, address, emergency contacts | AES-256 at rest + TLS 1.2+ in transit | Owner + authorized roles |
| **Tier 3** | Internal | Appointment metadata, queue status, clinic schedules, tokens | TLS 1.2+ in transit | Role-based access |
| **Tier 4** | Public | Doctor public profiles, clinic info, specializations | TLS 1.2+ in transit | Public |

---

## 14.4 Functional Requirements

### Authentication Security

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-FR-001 | All API traffic MUST use HTTPS (TLS 1.2 or higher) | P1 |
| SEC-FR-002 | Authentication MUST use OTP-based verification with secure JWT tokens | P1 |
| SEC-FR-003 | OTP codes MUST be hashed before storage (never stored in plaintext) | P1 |
| SEC-FR-004 | JWT access tokens MUST expire after 1 hour | P1 |
| SEC-FR-005 | JWT refresh tokens MUST expire after 30 days | P1 |
| SEC-FR-006 | System MUST support token revocation (blacklisting via Redis) | P1 |
| SEC-FR-007 | JWT tokens MUST include: user ID, role, issued-at, and expiry claims | P1 |
| SEC-FR-008 | JWT signing MUST use RS256 (asymmetric) or HS256 with a 256-bit secret minimum | P1 |

### Authorization & Access Control

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-FR-010 | System MUST enforce Role-Based Access Control (RBAC) on every API endpoint | P1 |
| SEC-FR-011 | Each API endpoint MUST define allowed roles explicitly | P1 |
| SEC-FR-012 | Unauthorized access attempts MUST return HTTP 403 with no sensitive data leakage | P1 |
| SEC-FR-013 | Admin accounts MUST NOT have access to patient medical records (enforced at API and database level) | P1 |
| SEC-FR-014 | Receptionist accounts MUST NOT have access to patient medical records | P1 |
| SEC-FR-015 | Doctor access to patient records MUST require active consent | P1 |

### RBAC Permission Matrix

| Resource | Patient | Doctor | Receptionist | Admin |
|----------|---------|--------|--------------|-------|
| Own profile (CRUD) | ✅ | ✅ | ✅ | ✅ |
| Patient medical records | Own only | With consent | ❌ | ❌ |
| Prescription creation | ❌ | ✅ | ❌ | ❌ |
| Appointment booking | ✅ | ❌ | ✅ (on behalf) | ❌ |
| Appointment management | Own only | Own patients | Clinic scope | ❌ |
| Queue management | View own | Own queue | Clinic scope | ❌ |
| Doctor verification | ❌ | ❌ | ❌ | ✅ |
| User management | ❌ | ❌ | ❌ | ✅ |
| Audit logs | Own access log | ❌ | ❌ | ✅ |
| Analytics dashboard | ❌ | ❌ | ❌ | ✅ |
| System monitoring | ❌ | ❌ | ❌ | ✅ |

### Data Encryption

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-FR-020 | All Tier 1 and Tier 2 data MUST be encrypted at rest using AES-256 | P1 |
| SEC-FR-021 | All data in transit MUST be encrypted using TLS 1.2 or higher | P1 |
| SEC-FR-022 | Database connection strings and API keys MUST NOT be stored in source code | P1 |
| SEC-FR-023 | Secrets MUST be managed using environment variables or a secrets manager | P1 |
| SEC-FR-024 | File uploads (reports, images) MUST be stored in encrypted cloud storage | P1 |
| SEC-FR-025 | Database backups MUST be encrypted | P1 |

### Input Validation & Injection Prevention

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-FR-030 | System MUST validate and sanitize ALL user inputs on both client and server side | P1 |
| SEC-FR-031 | System MUST use parameterized queries or ORM to prevent SQL injection | P1 |
| SEC-FR-032 | System MUST sanitize all outputs to prevent Cross-Site Scripting (XSS) | P1 |
| SEC-FR-033 | System MUST implement CSRF protection for all state-changing operations | P1 |
| SEC-FR-034 | File uploads MUST be validated for type, size, and content (not just extension) | P1 |
| SEC-FR-035 | File uploads MUST be scanned for malicious content before storage | P2 |

### Rate Limiting & Abuse Prevention

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-FR-040 | System MUST implement rate limiting on authentication endpoints | P1 |
| SEC-FR-041 | OTP requests MUST be limited to 5 per mobile number per hour | P1 |
| SEC-FR-042 | Failed OTP verification MUST lock the account after 3 consecutive failures (1-hour cooldown) | P1 |
| SEC-FR-043 | API endpoints MUST enforce per-user rate limits | P1 |
| SEC-FR-044 | System MUST detect and block automated abuse (bot detection) | P2 |

### Rate Limiting Configuration

| Endpoint Category | Rate Limit | Window |
|-------------------|-----------|--------|
| OTP Send | 5 requests | Per hour per mobile |
| OTP Verify | 3 attempts | Per OTP request |
| Login | 10 requests | Per minute per IP |
| API Read (authenticated) | 100 requests | Per minute per user |
| API Write (authenticated) | 30 requests | Per minute per user |
| File Upload | 10 requests | Per hour per user |
| Search | 30 requests | Per minute per user |

### Security Headers

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-FR-050 | API responses MUST include `Strict-Transport-Security` header (HSTS) | P1 |
| SEC-FR-051 | API responses MUST include `X-Content-Type-Options: nosniff` | P1 |
| SEC-FR-052 | API responses MUST include `X-Frame-Options: DENY` | P1 |
| SEC-FR-053 | API responses MUST include `Content-Security-Policy` header | P1 |
| SEC-FR-054 | API responses MUST include `X-XSS-Protection: 0` (rely on CSP instead) | P1 |
| SEC-FR-055 | API responses MUST remove `X-Powered-By` and server version headers | P1 |
| SEC-FR-056 | CORS policy MUST whitelist only authorized frontend domains | P1 |

### Audit Logging

| ID | Requirement | Priority |
|----|-------------|----------|
| SEC-FR-060 | System MUST log all authentication events (login, logout, OTP send, OTP verify, token refresh) | P1 |
| SEC-FR-061 | System MUST log all authorization failures (403 responses) | P1 |
| SEC-FR-062 | System MUST log all medical record access events | P1 |
| SEC-FR-063 | System MUST log all admin actions (verification, account changes, moderation) | P1 |
| SEC-FR-064 | Audit logs MUST include: timestamp, actor ID, actor role, action, target, result, IP address, user agent | P1 |
| SEC-FR-065 | Audit logs MUST be immutable (append-only, no modification or deletion) | P1 |
| SEC-FR-066 | Audit logs MUST be retained for a minimum of 3 years | P1 |
| SEC-FR-067 | Audit logs MUST be stored separately from application data | P2 |

---

## 14.5 OWASP Top 10 Mapping

| OWASP Category | HealthSync Mitigation |
|----------------|----------------------|
| **A01: Broken Access Control** | RBAC enforcement on every endpoint; consent-based record access; row-level authorization checks |
| **A02: Cryptographic Failures** | AES-256 at rest; TLS 1.2+ in transit; hashed OTPs; secure JWT signing; no plaintext secrets |
| **A03: Injection** | Parameterized queries via ORM; input sanitization; output encoding |
| **A04: Insecure Design** | Threat modeling per module; principle of least privilege; defense in depth |
| **A05: Security Misconfiguration** | Security headers; no default credentials; environment-specific configs; automated security scans |
| **A06: Vulnerable Components** | Dependency scanning (npm audit); regular updates; no deprecated packages |
| **A07: Auth Failures** | OTP-based auth; rate limiting; account lockout; session management |
| **A08: Software/Data Integrity** | Signed JWTs; file upload validation; CI/CD pipeline integrity checks |
| **A09: Logging Failures** | Comprehensive audit logging; security event monitoring; log integrity |
| **A10: SSRF** | URL validation; no user-controlled server-side requests; network segmentation |

---

## 14.6 Threat Model Summary

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Unauthorized access to patient records | Medium | Critical | RBAC + consent system + audit logging |
| Session hijacking | Low | High | Secure JWT; HTTPS-only; token rotation |
| OTP interception (SMS) | Medium | High | OTP expiry (5 min); rate limiting; future: app-based OTP |
| Brute force OTP | Medium | Medium | 3-attempt limit; account lockout; rate limiting |
| SQL injection | Low | Critical | ORM; parameterized queries; input validation |
| Data breach (database) | Low | Critical | Encryption at rest; network isolation; access logging |
| Insider threat (admin) | Low | High | Admin cannot access medical data; audit logging; principle of least privilege |
| DDoS attack | Medium | High | Rate limiting; CDN; cloud-based DDoS protection |
| File upload malware | Medium | Medium | File type validation; content scanning; isolated storage |

---

## 14.7 Incident Response

### Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| **P0 — Critical** | Active data breach or system compromise | < 1 hour | Patient data exposed; unauthorized access to production |
| **P1 — High** | Vulnerability with active exploit potential | < 4 hours | Authentication bypass; privilege escalation |
| **P2 — Medium** | Vulnerability without active exploitation | < 24 hours | XSS in non-critical path; information disclosure |
| **P3 — Low** | Minor security issue | < 1 week | Missing security header; minor config issue |

### Response Procedure

```
1. DETECT → Automated monitoring, audit log alerts, user reports
        ↓
2. TRIAGE → Classify severity, assign incident owner
        ↓
3. CONTAIN → Isolate affected systems, revoke compromised tokens
        ↓
4. INVESTIGATE → Determine scope, root cause, affected data
        ↓
5. REMEDIATE → Deploy fix, patch vulnerability
        ↓
6. NOTIFY → Inform affected users (if data exposed), notify regulators (if required)
        ↓
7. POST-MORTEM → Document findings, update security controls, share learnings
```

---

## 14.8 Security Testing Requirements

| Test Type | Frequency | Scope |
|-----------|-----------|-------|
| Dependency vulnerability scan (`npm audit`) | Every CI build | All dependencies |
| Static Application Security Testing (SAST) | Every CI build | Application code |
| OWASP ZAP automated scan | Weekly | All API endpoints |
| Manual penetration testing | Quarterly | Full application |
| Access control audit | Monthly | RBAC matrix verification |
| Encryption verification | Quarterly | Data at rest and in transit |

---

## 14.9 API Endpoints (Security-Specific)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/sessions` | List active sessions for current user |
| `DELETE` | `/auth/sessions/:id` | Terminate a specific session |
| `POST` | `/auth/logout-all` | Terminate all sessions |
| `GET` | `/admin/audit-logs` | Query audit logs (admin only) |
| `GET` | `/admin/audit-logs/export` | Export audit logs (admin only) |
| `GET` | `/patients/access-log` | View personal data access history |

---

## 14.10 Acceptance Criteria

| ID | Criteria |
|----|----------|
| SEC-AC-001 | All API traffic is served over HTTPS; HTTP requests are rejected or redirected |
| SEC-AC-002 | JWT tokens are issued with correct expiry and contain required claims |
| SEC-AC-003 | RBAC is enforced on every API endpoint; unauthorized access returns 403 |
| SEC-AC-004 | Tier 1 and Tier 2 data is encrypted at rest (verified via database inspection) |
| SEC-AC-005 | OTP codes are stored hashed, never in plaintext |
| SEC-AC-006 | Rate limiting blocks excessive requests (verified via load test) |
| SEC-AC-007 | All security headers are present in API responses |
| SEC-AC-008 | SQL injection attempts are blocked (verified via OWASP ZAP scan) |
| SEC-AC-009 | XSS payloads are sanitized in all user inputs |
| SEC-AC-010 | Admin cannot access patient medical records (verified via API test) |
| SEC-AC-011 | All auth events and record access events are logged in audit trail |
| SEC-AC-012 | File uploads are validated for type, size, and content |
| SEC-AC-013 | No secrets or credentials are present in source code or client bundles |
| SEC-AC-014 | Dependency scan reports zero critical/high vulnerabilities |
