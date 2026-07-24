# Comprehensive Prompt for Building HealthSync Mobile App

You are an expert Flutter developer tasked with building the **HealthSync Mobile Application** based on the Software Requirements Specification (Phase 1 - MVP). 

HealthSync is a cross-platform digital healthcare ecosystem connecting patients, doctors, receptionists, clinics, and hospitals through one secure platform.

Please review the following requirements and build the complete frontend structure, UI screens, state management, and API integration layers for the mobile app.

---

## 1. Technology Stack
- **Framework:** Flutter 3.x
- **Target Platforms:** Android and iOS (Mobile First)
- **State Management:** `flutter_bloc` or `riverpod` (your choice, but remain consistent)
- **Routing:** `go_router`
- **Networking:** `dio`
- **Local Storage/Caching:** `hive` or `sqflite` (for offline caching and low-network optimization)
- **Notifications:** `firebase_messaging` & `flutter_local_notifications`
- **Localization:** `intl` (Must support English, Hindi, Marathi)
- **PDF Generation:** `pdf` package (for prescriptions and reports)
- **Security:** `flutter_secure_storage` (for JWT and session storage)

---

## 2. Core Modules (Phase 1)

The mobile app must support Role-Based Access Control (RBAC) and display specific dashboards/flows based on the authenticated user role. The primary roles are **Patient**, **Doctor**, and **Receptionist**.

### 2.1 Authentication Module
- OTP-based Login and Registration.
- Secure JWT storage.
- Session handling (auto-logout on token expiry).

### 2.2 Patient Module
- **Registration:** Collect Name, Mobile, Gender, DOB (must be 18+). Generate a unique HealthSync ID (`HS-YYYY-XXXXXX`).
- **Dashboard:** Display upcoming appointments (next 7 days), recent prescriptions (last 3), recent reports (last 3), unread notifications, and a prominent Emergency button.
- **Doctor Search:** Search by name, specialization, clinic, city. Filter by experience, fee range, language, and "Available Today".
- **Doctor Profile:** Show doctor details, available slots, consultation fee, reviews, and a "Book Appointment" CTA.
- **Appointment Booking:** Select Doctor -> Clinic -> Date -> Slot -> Confirm. Avoid double-booking. Support status tracking, rescheduling, and cancellations.
- **Queue Tracking:** Real-time token number tracking, estimated wait time, and doctor status.
- **Digital Health Records:** View consultation history. View and download prescriptions/reports as PDFs.

### 2.3 Doctor Module
- **Dashboard:** Today's schedule, pending appointments, active queue status.
- **Consultation Workflow:** Start consultation, view patient history (based on HealthSync ID), write/upload digital prescriptions (save as PDF), mark appointment as complete.
- **Schedule Management:** Configure availability, slots, and block dates.

### 2.4 Reception Module
- **Dashboard:** Clinic overview, today's appointments, doctor availability.
- **Walk-in Management:** Register walk-in patients, generate HealthSync ID, and book offline appointments.
- **Queue Management:** Check-in patients, issue tokens, update queue status in real-time.

---

## 3. UI/UX & Non-Functional Requirements
- **Design Aesthetic:** Premium, modern, intuitive interface with a clean color palette suitable for healthcare. Implement dark mode support.
- **Accessibility & Localization:** Ensure the app is accessible (large tap targets, readable fonts) and fully localized (English, Hindi, Marathi).
- **Low-Network Optimization:** Cache essential data (like previously viewed prescriptions, doctor profiles) for offline or low-bandwidth viewing.
- **Security:** Ensure medical data is not cached insecurely. No screenshots for sensitive record screens (if possible).

---

## 4. Execution Instructions

1. **Project Setup:** Initialize the Flutter project with the correct folder structure (e.g., Feature-first or Domain-driven design).
2. **Theming & Localization:** Setup the `ThemeData` (light/dark) and `intl` configurations.
3. **Routing:** Define the routes for Authentication, Patient Flows, Doctor Flows, and Reception Flows using `go_router`.
4. **State Management:** Implement the core state controllers/blocs for Auth, Appointments, and Queues.
5. **UI Implementation:** Build the critical screens:
   - Login/OTP Screen
   - Patient Dashboard
   - Doctor Search & Profile
   - Appointment Booking Flow & Queue Tracker
   - Doctor Dashboard & Consultation Screen
6. **API Services:** Create the `dio` interceptors and repository layer stubs for the REST API endpoints.

Please generate the foundational code, folder structure, and the critical UI screens to kickstart the development of HealthSync MVP.
