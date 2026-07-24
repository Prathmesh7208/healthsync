# Phase 1 — Notifications

**Module Prefix:** `NOT`
**Priority:** P1 — Must Have

---

## 12.1 Purpose
The Notification module ensures timely and reliable communication between the platform and its users. It delivers critical updates regarding appointments, queue status, records, and emergencies to reduce missed appointments and improve the patient experience.

---

## 12.2 Notification Channels
Phase 1 will utilize the following notification channels:
1. **Push Notifications (Primary):** Delivered via Firebase Cloud Messaging (FCM) to the mobile app.
2. **In-App Notifications:** A notification center within the app to view historical alerts.
3. **SMS (Fallback):** Used only for critical alerts (e.g., OTP) or when push notifications fail.

---

## 12.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NOT-FR-001 | System MUST support push notifications via FCM for iOS and Android | P1 |
| NOT-FR-002 | System MUST maintain an in-app notification center for users to view past notifications | P1 |
| NOT-FR-003 | System MUST mark notifications as read when clicked or viewed | P1 |
| NOT-FR-004 | System MUST allow users to clear their notification history | P2 |
| NOT-FR-005 | Notifications MUST be localized based on the user's language preference | P1 |

---

## 12.4 Notification Triggers & Templates

| Trigger Event | Target Role | Priority | Template (English) |
|---------------|-------------|----------|--------------------|
| Appointment Confirmed | Patient | High | Your appointment with Dr. [Name] on [Date] at [Time] is confirmed. |
| Appointment Reminder | Patient | High | Reminder: You have an appointment with Dr. [Name] in 1 hour. |
| Appointment Cancelled | Patient | High | Your appointment with Dr. [Name] on [Date] has been cancelled. |
| Next in Queue | Patient | High | You are next! Please proceed to Dr. [Name]'s cabin. |
| Turn Arrived | Patient | High | It's your turn! Dr. [Name] is ready to see you. |
| Prescription Uploaded | Patient | Normal | Dr. [Name] has uploaded your prescription. Tap to view. |
| Consent Request | Patient | High | Dr. [Name] is requesting access to your medical records. |
| Emergency Alert | Emergency Contact | Critical | Emergency Alert: [Patient Name] has triggered an emergency from HealthSync. |

---

## 12.5 Acceptance Criteria

| ID | Criteria |
|----|----------|
| NOT-AC-001 | Push notifications are successfully delivered to Android and iOS devices. |
| NOT-AC-002 | In-app notification center displays all historical alerts. |
| NOT-AC-003 | Notifications are triggered correctly based on defined events. |
| NOT-AC-004 | Notification content is localized. |
