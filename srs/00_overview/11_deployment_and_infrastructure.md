# Deployment & Infrastructure Specification

**Document:** 11_deployment_and_infrastructure.md
**Status:** Draft
**Version:** 1.0

---

## 1. Overview

HealthSync utilizes a containerized, cloud-native deployment strategy designed for high availability, security, and low-latency performance in India data center regions (e.g., AWS `ap-south-1` Mumbai).

---

## 2. Infrastructure Architecture

```
                       [ Cloudflare CDN / WAF ]
                                  │
                       [ AWS ALB (Load Balancer) ]
                                  │
             ┌────────────────────┴────────────────────┐
             ▼                                         ▼
  [ NestJS API Instance 1 ]                 [ NestJS API Instance 2 ]
             │                                         │
             ├────────────────────┬────────────────────┤
             ▼                    ▼                    ▼
   [ PostgreSQL Cluster ]  [ Redis Sentinel ]  [ AWS S3 Encrypted ]
     (Primary/Standby)      (Cache & WS PubSub)   (Medical Records)
```

---

## 3. Environments

1. **Development (`dev`):** Local Docker Compose environment for feature development and integration tests.
2. **Staging (`staging`):** Replica of production topology; used for UAT, QA automation, and performance benchmark testing.
3. **Production (`prod`):** Multi-AZ deployment with automated auto-scaling, continuous monitoring, and automated daily backups.

---

## 4. Environment Variables & Secret Management

Secrets (JWT private keys, database passwords, API credentials) MUST NOT be committed to Git. Production secrets are loaded securely at runtime via AWS Secrets Manager or HashiCorp Vault into Docker container runtime environments.
