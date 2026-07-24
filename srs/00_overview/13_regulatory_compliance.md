# Regulatory & Legal Compliance Framework

**Document:** 13_regulatory_compliance.md
**Status:** Draft
**Version:** 1.0

---

## 1. Statutory Compliance Requirements

HealthSync operations adhere strictly to Indian healthcare and data privacy regulations:

1. **Digital Personal Data Protection Act (DPDPA 2023):** Enforces data minimization, explicit consent managers, right to data erasure, and strict personal data breach notification SLAs.
2. **Information Technology Act, 2000 (and 2011 Sensitive Personal Data Rules):** Regulates digital signatures on prescriptions and encryption standards for electronic health data.
3. **Telemedicine Practice Guidelines (NMC):** Standards governing digital record retention, verified doctor registration, and prescription formats.
4. **Ayushman Bharat Digital Mission (ABDM / ABHA):** Architecture alignment for future integration with India's national health stack (Phase 3).

---

## 2. Data Sovereignty & Residency

All production databases, cloud backups, and file storage instances MUST reside within physical data centers located inside the Republic of India (e.g., AWS Mumbai / Hyderabad regions). Transfer of patient PHI outside Indian borders is strictly prohibited.
