# Phase 1 — Low Network Optimization

**Module Prefix:** `NET`
**Priority:** P1 — Must Have
**Status:** Draft

---

## 15.1 Purpose

The Low Network Optimization module ensures HealthSync **functions reliably in areas with poor, intermittent, or absent internet connectivity** — a reality for a significant portion of HealthSync's target demographic in semi-urban and rural India. The architecture follows an **offline-first design philosophy**: the app must be usable even when the network is degraded, with graceful synchronization when connectivity is restored.

> **Design Principle:** Every screen the user has previously visited should be viewable offline. Every action the user takes offline should be queued and synced automatically when connectivity returns.

---

## 15.2 User Stories

| ID | Role | Story | Priority |
|----|------|-------|----------|
| NET-US-001 | Patient | As a patient in a low-network area, I want to view my appointments and prescriptions even without internet | P1 |
| NET-US-002 | Patient | As a patient, I want the app to clearly tell me when I'm offline so I understand what's happening | P1 |
| NET-US-003 | Patient | As a patient, I want actions I take offline to sync automatically when I'm back online | P1 |
| NET-US-004 | Doctor | As a doctor, I want to view today's appointment list even if the network drops during clinic hours | P1 |
| NET-US-005 | Receptionist | As a receptionist, I want the dashboard to continue working during brief network outages | P1 |
| NET-US-006 | All Users | As a user, I want the app to load quickly even on slow 2G/3G connections | P1 |

---

## 15.3 Network Tiers & Degradation Strategy

| Tier | Network Speed | Behavior |
|------|--------------|----------|
| **Tier 1: Full** | 4G/LTE/WiFi (≥1 Mbps) | All features available, real-time WebSocket updates, full image quality |
| **Tier 2: Moderate** | 3G (256 Kbps – 1 Mbps) | WebSocket with reduced payload, compressed images, deferred non-critical syncs |
| **Tier 3: Low** | 2G (≤256 Kbps) | Polling-based updates (30s interval), heavily compressed images, text-only where possible |
| **Tier 4: Offline** | No connectivity | Read-only cached data, queued write actions, offline banner |

---

## 15.4 Functional Requirements

### Local Caching

| ID | Requirement | Priority |
|----|-------------|----------|
| NET-FR-001 | App MUST cache essential user data locally: profile, appointments, prescriptions, reports metadata | P1 |
| NET-FR-002 | Cache MUST be encrypted at rest using device-level secure storage | P1 |
| NET-FR-003 | Cache MUST be invalidated and refreshed upon successful network reconnection | P1 |
| NET-FR-004 | Cache MUST have a maximum age of 24 hours; stale data beyond this MUST display a warning | P1 |
| NET-FR-005 | App MUST pre-fetch upcoming appointment details (next 7 days) for offline access | P1 |
| NET-FR-006 | Prescriptions and reports that the patient has previously viewed MUST be available offline | P1 |
| NET-FR-007 | Cache size MUST be limited to 100MB per user; oldest data is evicted first (LRU) | P2 |

### Offline Viewing

| ID | Requirement | Priority |
|----|-------------|----------|
| NET-FR-010 | Patient MUST be able to view cached profile, appointments, prescriptions, and reports offline | P1 |
| NET-FR-011 | Doctor MUST be able to view cached today's appointment list offline | P1 |
| NET-FR-012 | All offline-displayed data MUST show "Last synced: [timestamp]" indicator | P1 |
| NET-FR-013 | Features unavailable offline (e.g., booking, queue tracking) MUST display clear "requires internet" messaging | P1 |
| NET-FR-014 | Downloaded prescription PDFs MUST be viewable offline | P1 |

### Background Sync

| ID | Requirement | Priority |
|----|-------------|----------|
| NET-FR-020 | App MUST implement automatic background sync when connectivity is restored | P1 |
| NET-FR-021 | Sync MUST use delta synchronization (only changed data) to minimize bandwidth | P1 |
| NET-FR-022 | Sync MUST prioritize: appointments > queue status > prescriptions > reports > profile updates | P1 |
| NET-FR-023 | Failed sync operations MUST retry with exponential backoff (1s, 2s, 4s, 8s, max 60s) | P1 |
| NET-FR-024 | Sync status MUST be visible to the user (syncing indicator, last synced timestamp) | P1 |
| NET-FR-025 | Background sync MUST NOT consume excessive battery (use OS-appropriate background task APIs) | P2 |

### Offline Action Queue

| ID | Requirement | Priority |
|----|-------------|----------|
| NET-FR-030 | User actions taken offline MUST be queued locally and synced when online | P2 |
| NET-FR-031 | Queued actions MUST be processed in FIFO order | P2 |
| NET-FR-032 | If a queued action fails due to server-side conflict (e.g., slot no longer available), user MUST be notified | P2 |
| NET-FR-033 | Queued actions MUST be displayed to the user with "Pending sync" status | P2 |

### Network Quality Detection

| ID | Requirement | Priority |
|----|-------------|----------|
| NET-FR-040 | App MUST detect current network quality (4G/3G/2G/offline) | P1 |
| NET-FR-041 | App MUST display a clear visual indicator when offline (persistent banner) | P1 |
| NET-FR-042 | App MUST display a warning indicator when on low network (2G) | P2 |
| NET-FR-043 | Network transitions (offline → online, online → offline) MUST be handled gracefully without crashes | P1 |

### Bandwidth Optimization

| ID | Requirement | Priority |
|----|-------------|----------|
| NET-FR-050 | API responses MUST be compressed using gzip/brotli | P1 |
| NET-FR-051 | Images MUST be served in multiple quality tiers based on network speed | P1 |
| NET-FR-052 | Profile photos: Full (500KB max) on 4G, Medium (100KB) on 3G, Thumbnail (30KB) on 2G | P1 |
| NET-FR-053 | API payloads MUST use minimal JSON (no unnecessary fields, compact keys for mobile endpoints) | P2 |
| NET-FR-054 | List endpoints MUST support pagination to limit payload size | P1 |
| NET-FR-055 | Images MUST use lazy loading (load only when scrolled into viewport) | P1 |

### Queue Update Degradation

| ID | Requirement | Priority |
|----|-------------|----------|
| NET-FR-060 | Queue updates MUST use WebSocket on Tier 1 and Tier 2 networks | P1 |
| NET-FR-061 | Queue updates MUST fall back to long-polling (10s interval) on Tier 3 networks | P1 |
| NET-FR-062 | Queue updates MUST fall back to standard polling (30s interval) when long-polling fails | P1 |
| NET-FR-063 | Offline queue data MUST display last-known state with "Last updated" timestamp | P1 |

---

## 15.5 Bandwidth Budget Per Screen

| Screen | Target Size (First Load) | Target Size (Cached) |
|--------|-------------------------|---------------------|
| Login | < 200KB | < 50KB |
| Patient Dashboard | < 300KB | < 100KB |
| Doctor Search Results | < 250KB (20 results) | < 80KB |
| Doctor Profile | < 200KB | < 60KB |
| Appointment Booking | < 150KB | < 50KB |
| Queue Tracking | < 100KB | < 30KB |
| Prescription View | < 200KB | < 50KB |
| Doctor Dashboard | < 300KB | < 100KB |
| Reception Dashboard | < 400KB | < 150KB |

---

## 15.6 Conflict Resolution Rules

| Scenario | Resolution |
|----------|-----------|
| Patient updates profile offline; profile was updated on another device while offline | Last-write-wins based on timestamp; user notified of conflict |
| Patient tries to book a slot offline that was taken while they were offline | Queued action fails; user notified "Slot no longer available" with option to select another |
| Queue position changes while patient is offline | Cache updated on reconnection; stale queue data overwritten by server state |
| Doctor creates prescription offline | Queued for sync; if appointment status changed server-side, prescription is still saved but flagged for review |

---

## 15.7 Business Rules

| ID | Rule |
|----|------|
| NET-BR-001 | Offline mode is read-only for Tier 1 data (medical records) — no offline creation of prescriptions or reports |
| NET-BR-002 | Queue tracking data displayed offline MUST show a clear "data may be outdated" warning |
| NET-BR-003 | Emergency alert feature MUST be disabled when offline (requires network to notify contacts) |
| NET-BR-004 | Cache encryption MUST use the same standard as at-rest data encryption (AES-256) |
| NET-BR-005 | User logout MUST clear all cached data from the device |

---

## 15.8 Acceptance Criteria

| ID | Criteria |
|----|----------|
| NET-AC-001 | Patient can view appointments, prescriptions, and profile data while completely offline |
| NET-AC-002 | App displays clear offline banner when network is unavailable |
| NET-AC-003 | App automatically syncs when connectivity is restored without user intervention |
| NET-AC-004 | Delta sync minimizes data transfer (only changed data is synced) |
| NET-AC-005 | Queue updates degrade gracefully: WebSocket → long-polling → polling |
| NET-AC-006 | Images load in appropriate quality based on network speed |
| NET-AC-007 | API responses are compressed (gzip/brotli verified in response headers) |
| NET-AC-008 | Cached data displays "Last synced" timestamp |
| NET-AC-009 | Features unavailable offline show "requires internet" message |
| NET-AC-010 | All cached data is encrypted on device |
| NET-AC-011 | App handles network transitions (online ↔ offline) without crashes |
| NET-AC-012 | Sync retry uses exponential backoff and doesn't drain battery |
