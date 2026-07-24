# Phase 1 — Non-Functional Requirements

**Module Prefix:** `NFR`
**Priority:** P1 — Must Have
**Status:** Draft

---

## 17.1 Purpose

This document defines the **system quality attributes** that govern how HealthSync performs, scales, recovers, and operates — independent of specific functional features. These requirements apply **across all modules** and establish the baseline for production readiness.

---

## 17.2 Performance

| ID | Category | Requirement | Target | Priority |
|----|----------|-------------|--------|----------|
| NFR-001 | Screen Load | Normal screens MUST load in under 2 seconds on 4G networks | p95 < 2s | P1 |
| NFR-002 | API Read | API read response time MUST be under 500ms | p95 < 500ms | P1 |
| NFR-003 | API Write | API write response time MUST be under 1000ms | p95 < 1s | P1 |
| NFR-004 | Search | Doctor search results MUST return in under 800ms | p95 < 800ms | P1 |
| NFR-005 | Queue Update | Queue position updates MUST propagate within 3 seconds | p95 < 3s | P1 |
| NFR-006 | Database Query | Database query execution MUST be under 200ms for indexed queries | p95 < 200ms | P1 |
| NFR-007 | File Upload | Report/image upload MUST complete within 10 seconds for files up to 10MB on 4G | p95 < 10s | P2 |
| NFR-008 | Notification | Push notifications MUST be delivered within 5 seconds of trigger event | p95 < 5s | P1 |

---

## 17.3 Availability & Reliability

| ID | Category | Requirement | Target | Priority |
|----|----------|-------------|--------|----------|
| NFR-010 | Uptime | Platform MUST target 99.5% uptime | ≥ 99.5% monthly | P1 |
| NFR-011 | Planned Downtime | Maintenance windows MUST be scheduled during off-peak hours (2:00–5:00 AM IST) | Max 2 hours/month | P1 |
| NFR-012 | MTTR | Mean Time To Recovery for critical failures MUST be under 30 minutes | < 30 min | P1 |
| NFR-013 | MTBF | Mean Time Between Failures MUST exceed 720 hours (30 days) | > 720 hours | P2 |
| NFR-014 | Failover | System MUST support automated failover for database and application servers | < 60s failover | P2 |
| NFR-015 | Health Checks | System MUST expose health check endpoints for automated monitoring | `/health`, `/ready` | P1 |
| NFR-016 | Zero-Downtime Deploy | Deployments MUST NOT cause downtime (rolling or blue-green deployment) | Zero downtime | P1 |

---

## 17.4 Scalability

| ID | Category | Requirement | Target | Priority |
|----|----------|-------------|--------|----------|
| NFR-020 | Horizontal Scaling | Application servers MUST be horizontally scalable using Docker containerization | Auto-scale on load | P1 |
| NFR-021 | Concurrent Users | System MUST support 1,000 concurrent users without degradation | 1,000 CCU | P1 |
| NFR-022 | Database Connections | Database MUST support 500 concurrent connections without degradation | 500 connections | P2 |
| NFR-023 | WebSocket | WebSocket server MUST support 5,000 concurrent connections | 5,000 connections | P2 |
| NFR-024 | Growth | Architecture MUST support 10x growth without architectural changes | 10,000 CCU | P2 |
| NFR-025 | Load Balancing | System MUST support load balancing across multiple application instances | Round-robin / least-conn | P1 |

### Scaling Triggers

| Metric | Scale-Up Threshold | Scale-Down Threshold |
|--------|-------------------|---------------------|
| CPU Utilization | > 70% for 5 minutes | < 30% for 10 minutes |
| Memory Utilization | > 80% for 5 minutes | < 40% for 10 minutes |
| Request Latency | p95 > 2x target | p95 < 0.5x target |
| Active Connections | > 80% capacity | < 30% capacity |

---

## 17.5 Data Retention & Backup

| ID | Category | Requirement | Target | Priority |
|----|----------|-------------|--------|----------|
| NFR-030 | Backup Frequency | Database MUST be backed up daily with point-in-time recovery | Daily + WAL | P1 |
| NFR-031 | Backup Retention | Backups MUST be retained for 90 days | 90 days | P1 |
| NFR-032 | RPO | Recovery Point Objective: maximum data loss in a disaster | < 1 hour | P1 |
| NFR-033 | RTO | Recovery Time Objective: maximum time to restore service | < 2 hours | P1 |
| NFR-034 | Backup Testing | Backup restoration MUST be tested monthly | Monthly test | P2 |
| NFR-035 | Data Retention | Medical records MUST be retained indefinitely (no hard deletes) | Indefinite | P1 |
| NFR-036 | Audit Log Retention | Audit logs MUST be retained for a minimum of 3 years | 3 years | P1 |
| NFR-037 | Transient Data | OTP codes, expired sessions, and cache data MUST be purged automatically | TTL-based | P1 |

### Retention Policy Summary

| Data Type | Retention Period | Deletion Type |
|-----------|-----------------|---------------|
| Medical Records | Indefinite | Soft delete only |
| Patient Profiles | Indefinite (deactivation, not deletion) | Soft delete |
| Appointments | Indefinite | Soft delete |
| Audit Logs | 3 years minimum | Archive after 1 year |
| OTP Records | 24 hours after expiry | Hard delete |
| Expired Sessions | 7 days after expiry | Hard delete |
| Notification History | 1 year | Archive |
| Cache Data (Redis) | TTL-based (5 min – 24 hours) | Auto-eviction |

---

## 17.6 Monitoring & Alerting

| ID | Category | Requirement | Priority |
|----|----------|-------------|----------|
| NFR-040 | APM | System MUST implement application performance monitoring | P1 |
| NFR-041 | Metrics | System MUST collect: request rate, error rate, latency (p50, p95, p99), active users | P1 |
| NFR-042 | Dashboards | Operations team MUST have real-time monitoring dashboards | P1 |
| NFR-043 | Alerting | System MUST send alerts when metrics exceed defined thresholds | P1 |
| NFR-044 | Log Aggregation | Application logs MUST be aggregated centrally for search and analysis | P1 |
| NFR-045 | Tracing | System SHOULD support distributed request tracing | P2 |

### Alert Thresholds

| Metric | Warning | Critical | Notification |
|--------|---------|----------|--------------|
| Error Rate (5xx) | > 1% of requests | > 5% of requests | Slack + Email |
| API Latency (p95) | > 1.5x target | > 3x target | Slack |
| CPU Utilization | > 70% | > 90% | Slack + PagerDuty |
| Memory Utilization | > 80% | > 95% | Slack + PagerDuty |
| Disk Usage | > 70% | > 90% | Email |
| Database Connections | > 80% pool | > 95% pool | Slack + PagerDuty |
| Uptime | < 99.9% (rolling 24h) | < 99.5% (rolling 24h) | Slack + Email |
| Failed OTP Delivery | > 5% failure rate | > 15% failure rate | Slack |

---

## 17.7 Logging Standards

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-050 | All application logs MUST use structured JSON format | P1 |
| NFR-051 | Every log entry MUST include: timestamp, log level, service name, request ID, message | P1 |
| NFR-052 | Log levels MUST follow: DEBUG, INFO, WARN, ERROR, FATAL | P1 |
| NFR-053 | Sensitive data (OTP, tokens, medical data) MUST NOT appear in logs | P1 |
| NFR-054 | Every API request MUST generate an INFO log with method, path, status code, and duration | P1 |
| NFR-055 | Errors MUST include stack trace and context in ERROR logs | P1 |

### Log Entry Example

```json
{
  "timestamp": "2026-07-18T10:15:30.123Z",
  "level": "INFO",
  "service": "healthsync-api",
  "requestId": "req-abc123",
  "method": "POST",
  "path": "/appointments",
  "statusCode": 201,
  "durationMs": 145,
  "userId": "usr-xyz789",
  "userRole": "PATIENT",
  "message": "Appointment created successfully"
}
```

---

## 17.8 Internationalization

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-060 | All user-facing text MUST be externalized in localization files | P1 |
| NFR-061 | System MUST support English, Hindi, and Marathi in Phase 1 | P1 |
| NFR-062 | Date and time formats MUST respect the user's locale | P1 |
| NFR-063 | Number formats MUST respect the user's locale | P2 |
| NFR-064 | Adding a new language MUST NOT require code changes (config-only) | P2 |
| NFR-065 | Right-to-left (RTL) layout support SHOULD be architecturally planned for future use | P3 |

---

## 17.9 Maintainability

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-070 | Codebase MUST follow strict linting and standard style guidelines | P1 |
| NFR-071 | Frontend (Flutter) MUST follow clean architecture with separation of concerns | P1 |
| NFR-072 | Backend (NestJS) MUST use modular architecture with dependency injection | P1 |
| NFR-073 | All public APIs MUST have automated API documentation (Swagger/OpenAPI) | P1 |
| NFR-074 | Unit test coverage MUST reach minimum 70% for business logic | P2 |
| NFR-075 | Code MUST pass all linting rules before merge (enforced in CI) | P1 |
| NFR-076 | Dependencies MUST be pinned to specific versions in lock files | P1 |

---

## 17.10 Capacity Planning (Phase 1 Launch Targets)

| Metric | Initial Target | 6-Month Target |
|--------|---------------|----------------|
| Registered Patients | 5,000 | 50,000 |
| Active Doctors | 50 | 500 |
| Active Clinics | 20 | 200 |
| Daily Appointments | 500 | 5,000 |
| Concurrent Users | 200 | 1,000 |
| Data Storage | 50 GB | 500 GB |
| Monthly API Requests | 5 million | 50 million |

---

## 17.11 Acceptance Criteria

| ID | Criteria |
|----|----------|
| NFR-AC-001 | Screens load within 2 seconds under normal network (verified via performance test) |
| NFR-AC-002 | API response times meet defined targets (verified via load test) |
| NFR-AC-003 | System maintains 99.5% uptime during 30-day validation period |
| NFR-AC-004 | System handles 1,000 concurrent users without degradation (verified via load test) |
| NFR-AC-005 | Database backups run daily and can be restored (verified via monthly drill) |
| NFR-AC-006 | Monitoring dashboards display real-time metrics |
| NFR-AC-007 | Alerts fire correctly when thresholds are exceeded |
| NFR-AC-008 | Application logs are structured, aggregated, and searchable |
| NFR-AC-009 | No sensitive data appears in logs (verified via log audit) |
| NFR-AC-010 | Deployments cause zero downtime (verified via deployment test) |
