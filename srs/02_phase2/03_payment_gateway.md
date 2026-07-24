# Phase 2 — Payment Gateway Integration

**Module Prefix:** `PAY`
**Priority:** P1 — Must Have (Phase 2)
**Status:** Draft

---

## 3.1 Purpose

The Payment Gateway module manages online fee collection for in-clinic and video consultations, integrated via Razorpay / Stripe (supporting UPI, Credit/Debit Cards, NetBanking, and Wallets).

---

## 3.2 Key Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| PAY-FR-001 | System MUST accept payment at the time of appointment booking for video consultations | P1 |
| PAY-FR-002 | System MUST support Pay-at-Clinic vs Instant Online Payment options for physical clinic visits | P1 |
| PAY-FR-003 | Failed transactions MUST release the held appointment slot automatically after 10 minutes | P1 |
| PAY-FR-004 | Instant full refund MUST be processed if doctor cancels the appointment | P1 |
| PAY-FR-005 | Patient cancellations > 2 hours prior to slot MUST trigger automated refund minus transaction fee | P1 |
| PAY-FR-006 | System MUST issue GST-compliant digital tax invoices for every transaction | P1 |
