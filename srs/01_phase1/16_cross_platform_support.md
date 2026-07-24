# Phase 1 — Cross-Platform Support

**Module Prefix:** `PLT`
**Priority:** P1 — Must Have
**Status:** Draft

---

## 16.1 Purpose

The Cross-Platform Support module defines how HealthSync delivers a **consistent, native-quality experience** across Android, iOS, Web, Windows, and macOS from a single Flutter codebase. This module specifies responsive design breakpoints, platform-specific adaptations, minimum device requirements, and the testing matrix to ensure quality across all target platforms.

---

## 16.2 Supported Platforms

| Platform | Target Audience | Priority | Minimum Version | Form Factor |
|----------|-----------------|----------|-----------------|-------------|
| **Android** | Patients, Doctors | Primary | Android 8.0 (API 26)+ | Phone, Tablet |
| **iOS** | Patients, Doctors | Primary | iOS 14.0+ | iPhone, iPad |
| **Web** | Receptionists, Admins, Patients | Primary | Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) | Desktop, Tablet |
| **Windows** | Receptionists, Admins | Secondary | Windows 10+ | Desktop |
| **macOS** | Receptionists, Admins | Tertiary | macOS 11 (Big Sur)+ | Desktop |

---

## 16.3 User Stories

| ID | Role | Story | Priority |
|----|------|-------|----------|
| PLT-US-001 | Patient | As a patient, I want to use HealthSync on my Android phone and also check it on my desktop browser | P1 |
| PLT-US-002 | Receptionist | As a receptionist, I want to use the dashboard on a desktop computer with a large screen | P1 |
| PLT-US-003 | Doctor | As a doctor, I want the app to feel native on my iPhone | P1 |
| PLT-US-004 | Admin | As an admin, I want to access the admin panel from a web browser | P1 |
| PLT-US-005 | All Users | As a user, I want a consistent experience regardless of which device I use | P1 |

---

## 16.4 Functional Requirements

### Core

| ID | Requirement | Priority |
|----|-------------|----------|
| PLT-FR-001 | Application MUST be developed using Flutter with a single shared codebase | P1 |
| PLT-FR-002 | UI MUST be fully responsive across mobile, tablet, and desktop screen sizes | P1 |
| PLT-FR-003 | Application MUST utilize platform-specific design adaptations where necessary | P2 |
| PLT-FR-004 | All core features MUST function identically across all supported platforms | P1 |
| PLT-FR-005 | Platform-specific features (biometrics, notifications) MUST degrade gracefully on unsupported platforms | P1 |

### Responsive Design

| ID | Requirement | Priority |
|----|-------------|----------|
| PLT-FR-010 | Application MUST implement responsive layouts using the defined breakpoint system | P1 |
| PLT-FR-011 | Mobile layouts MUST use single-column, stacked navigation | P1 |
| PLT-FR-012 | Tablet layouts MUST use split-view or master-detail patterns where appropriate | P2 |
| PLT-FR-013 | Desktop layouts MUST use multi-column layouts with side navigation | P1 |
| PLT-FR-014 | All interactive elements MUST be usable with both touch and mouse/keyboard input | P1 |
| PLT-FR-015 | Desktop web MUST support keyboard navigation and shortcuts for common actions | P2 |

### Platform Adaptations

| ID | Requirement | Priority |
|----|-------------|----------|
| PLT-FR-020 | Android: MUST follow Material Design 3 navigation patterns (bottom nav, drawer) | P2 |
| PLT-FR-021 | iOS: MUST follow Cupertino navigation patterns (tab bar, navigation stack) | P2 |
| PLT-FR-022 | Web: MUST support browser back/forward navigation | P1 |
| PLT-FR-023 | Web: MUST support deep linking (direct URL to any screen) | P1 |
| PLT-FR-024 | Desktop: MUST support window resizing with responsive layout adaptation | P1 |
| PLT-FR-025 | Desktop: MUST support minimum window size of 800×600 | P1 |

---

## 16.5 Responsive Breakpoints

| Breakpoint | Width Range | Layout | Primary Audience |
|------------|-----------|--------|-----------------|
| **Mobile (S)** | 0 – 599px | Single column, bottom navigation | Patients |
| **Mobile (L) / Small Tablet** | 600 – 839px | Single column, expanded cards | Patients, Doctors |
| **Tablet** | 840 – 1199px | Two-column, split-view | Doctors, Receptionists |
| **Desktop** | 1200 – 1599px | Multi-column, side navigation | Receptionists, Admins |
| **Large Desktop** | 1600px+ | Multi-column with expanded panels | Admins |

### Layout Patterns by Breakpoint

| Screen | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| Patient Dashboard | Stacked cards, bottom nav | Two-column: sidebar + content | Three-column: nav + content + details |
| Doctor Dashboard | Scrollable list, bottom nav | Split: queue + appointments | Side nav + queue panel + appointment detail |
| Reception Dashboard | Simplified single-doctor view | Two-column: doctor list + queue | Full table layout with all doctors |
| Admin Dashboard | Tab-based sections | Split: metrics + details | Full dashboard with charts and tables |
| Doctor Search | Vertical card list | Grid (2 columns) | Grid (3–4 columns) with filter sidebar |
| Prescription View | Full-width, scrollable | Centered content, max-width 720px | Centered content, max-width 720px |

---

## 16.6 Platform-Specific Features

| Feature | Android | iOS | Web | Windows | macOS |
|---------|---------|-----|-----|---------|-------|
| Push Notifications | ✅ FCM | ✅ APNs + FCM | ✅ Web Push | ⚠️ Best effort | ⚠️ Best effort |
| Biometric Auth (future) | ✅ Fingerprint/Face | ✅ Face ID/Touch ID | ❌ | ✅ Windows Hello | ✅ Touch ID |
| Camera (profile photo) | ✅ | ✅ | ✅ | ✅ | ✅ |
| File Download | ✅ | ✅ (Share sheet) | ✅ (Browser download) | ✅ | ✅ |
| Secure Storage | ✅ Keystore | ✅ Keychain | ✅ Encrypted LocalStorage | ✅ DPAPI | ✅ Keychain |
| Offline Caching | ✅ Hive/SQLite | ✅ Hive/SQLite | ⚠️ IndexedDB (limited) | ✅ Hive/SQLite | ✅ Hive/SQLite |
| Deep Linking | ✅ App Links | ✅ Universal Links | ✅ URL Routing | N/A | N/A |

---

## 16.7 Minimum Device Specifications

### Android

| Spec | Minimum | Recommended |
|------|---------|------------|
| OS Version | Android 8.0 (API 26) | Android 12+ |
| RAM | 2 GB | 4 GB+ |
| Storage | 100 MB free | 500 MB+ free |
| Screen | 320dp width (4.5" phone) | 360dp+ |

### iOS

| Spec | Minimum | Recommended |
|------|---------|------------|
| OS Version | iOS 14.0 | iOS 16+ |
| Device | iPhone 6s | iPhone 12+ |
| Storage | 100 MB free | 500 MB+ free |

### Web

| Spec | Minimum | Recommended |
|------|---------|------------|
| Browser | Chrome 90, Firefox 88, Safari 14, Edge 90 | Latest versions |
| Screen | 1024×768 (desktop) | 1920×1080 |
| JavaScript | Required | Required |

### Desktop (Windows/macOS)

| Spec | Minimum | Recommended |
|------|---------|------------|
| OS | Windows 10 / macOS 11 | Latest |
| RAM | 4 GB | 8 GB+ |
| Screen | 1280×720 | 1920×1080+ |

---

## 16.8 Navigation Patterns

| Platform | Primary Navigation | Secondary Navigation | Back Navigation |
|----------|-------------------|---------------------|-----------------|
| Android (Mobile) | Bottom Navigation Bar (5 items max) | Drawer for settings/profile | System back button + app bar back |
| iOS (Mobile) | Tab Bar (5 items max) | Navigation stack | Swipe-back gesture + nav bar back |
| Web (Desktop) | Side Navigation Rail | Top breadcrumbs | Browser back/forward buttons |
| Windows/macOS | Side Navigation Rail | Top breadcrumbs | App bar back button |
| Tablet (any OS) | Side navigation (collapsed) + content area | Contextual menus | Back button in app bar |

---

## 16.9 Performance Budgets

| Metric | Mobile | Tablet | Desktop |
|--------|--------|--------|---------|
| App launch to interactive | < 3 seconds | < 3 seconds | < 2 seconds |
| Screen transition | < 300ms | < 300ms | < 200ms |
| List scroll (60fps) | ≥ 55fps sustained | ≥ 55fps sustained | ≥ 58fps sustained |
| Memory usage (idle) | < 150 MB | < 200 MB | < 300 MB |
| App binary size (Android) | < 30 MB | < 30 MB | N/A |
| App binary size (iOS) | < 40 MB | < 40 MB | N/A |
| Web initial load | N/A | N/A | < 2 MB (gzipped) |

---

## 16.10 Testing Matrix

| Platform | Devices / Browsers | Test Type |
|----------|-------------------|-----------|
| Android | Samsung Galaxy A14 (low-end), Pixel 7 (mid), Samsung S24 (high) | Functional, Performance, UI |
| iOS | iPhone SE 3rd gen (small), iPhone 14 (standard), iPad Air (tablet) | Functional, Performance, UI |
| Web Chrome | Chrome latest on Windows, macOS, Linux | Functional, Responsive, Accessibility |
| Web Firefox | Firefox latest on Windows | Functional, Responsive |
| Web Safari | Safari latest on macOS | Functional, Responsive |
| Windows | Windows 10 (min), Windows 11 | Functional, UI |
| macOS | macOS 11 (min), macOS 14 | Functional, UI |

---

## 16.11 Business Rules

| ID | Rule |
|----|------|
| PLT-BR-001 | All platforms share a single Flutter codebase; no separate native apps |
| PLT-BR-002 | Platform-specific code (plugins, UI adaptations) MUST be isolated behind platform abstraction layers |
| PLT-BR-003 | Web version MUST be the primary platform for Reception and Admin roles |
| PLT-BR-004 | Mobile (Android/iOS) MUST be the primary platform for Patient and Doctor roles |
| PLT-BR-005 | Features not available on a specific platform MUST be hidden (not disabled or broken) |

---

## 16.12 Acceptance Criteria

| ID | Criteria |
|----|----------|
| PLT-AC-001 | App builds and runs successfully on Android, iOS, Web, Windows, and macOS |
| PLT-AC-002 | All core features are functional on every supported platform |
| PLT-AC-003 | Responsive layouts adapt correctly at all defined breakpoints |
| PLT-AC-004 | Mobile platforms use platform-appropriate navigation patterns |
| PLT-AC-005 | Web version supports browser back/forward and deep linking |
| PLT-AC-006 | Desktop version supports window resizing with layout adaptation |
| PLT-AC-007 | Performance budgets are met on minimum-spec devices |
| PLT-AC-008 | Push notifications work on Android and iOS |
| PLT-AC-009 | Offline caching functions on Android, iOS, Windows, and macOS |
| PLT-AC-010 | All platforms pass the testing matrix without critical bugs |
