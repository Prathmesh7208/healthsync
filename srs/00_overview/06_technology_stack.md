# 6. Technology Stack

This document defines the technology stack used across all phases of HealthSync, with justifications for each choice.

---

## 6.1 Stack Overview

| Layer | Technology | Version (Minimum) | Purpose |
|-------|-----------|-------------------|---------|
| **Frontend** | Flutter | 3.x | Cross-platform UI framework |
| **Backend** | NestJS | 10.x | Server-side application framework |
| **Database** | PostgreSQL | 15.x | Primary relational database |
| **Caching** | Redis | 7.x | In-memory caching and session management |
| **Notifications** | Firebase Cloud Messaging (FCM) | Latest | Push notification delivery |
| **Containerization** | Docker | 24.x | Application containerization and deployment |
| **Version Control** | GitHub | N/A | Source code management and CI/CD |

---

## 6.2 Frontend — Flutter

### Why Flutter

- **Cross-platform:** Single codebase for Android, iOS, Web, Windows, and macOS
- **Performance:** Compiled to native ARM code; no JavaScript bridge
- **Rich UI:** Expressive widget system for premium, custom interfaces
- **Hot Reload:** Rapid development iteration
- **Growing ecosystem:** Large package library and community support
- **Dart language:** Strongly typed, null-safe, easy to learn

### Supported Platforms

| Platform | Priority | Phase |
|----------|----------|-------|
| Android | Primary | Phase 1 |
| iOS (iPhone) | Primary | Phase 1 |
| Web | Secondary | Phase 1 |
| Windows | Secondary | Phase 1 |
| macOS | Tertiary | Phase 1 |

### Key Libraries (Expected)

| Library | Purpose |
|---------|---------|
| `flutter_bloc` / `riverpod` | State management |
| `dio` | HTTP networking |
| `hive` / `sqflite` | Local storage and offline caching |
| `firebase_messaging` | Push notifications |
| `flutter_local_notifications` | Local notification display |
| `go_router` | Navigation and routing |
| `intl` | Internationalization (English, Hindi, Marathi) |
| `pdf` | PDF generation (prescriptions, reports) |
| `flutter_secure_storage` | Secure credential storage |

---

## 6.3 Backend — NestJS

### Why NestJS

- **TypeScript:** Strongly typed, reduces runtime errors
- **Modular architecture:** Aligns with HealthSync's module-based design
- **Built-in support:** Authentication, validation, ORM, caching, WebSockets
- **Scalable:** Microservice-ready architecture for future expansion
- **Testing:** Built-in testing utilities for unit and integration tests
- **Express/Fastify:** Proven HTTP foundation

### Key Dependencies (Expected)

| Package | Purpose |
|---------|---------|
| `@nestjs/typeorm` / `prisma` | Database ORM |
| `@nestjs/jwt` | JWT authentication |
| `@nestjs/passport` | Authentication strategies |
| `@nestjs/cache-manager` | Redis caching integration |
| `@nestjs/websockets` | Real-time queue updates |
| `@nestjs/swagger` | API documentation |
| `class-validator` | Request validation |
| `helmet` | Security headers |
| `winston` | Structured logging |

---

## 6.4 Database — PostgreSQL

### Why PostgreSQL

- **Relational integrity:** ACID compliance for healthcare data
- **JSON support:** JSONB columns for flexible medical data storage
- **Full-text search:** Built-in search for doctor/clinic discovery
- **Scalability:** Supports partitioning, replication, and connection pooling
- **Open source:** No licensing costs
- **Mature ecosystem:** Proven in healthcare and enterprise applications

### Key Design Principles

- **Normalized schema** for core entities (users, appointments, clinics)
- **JSONB columns** for flexible fields (medical notes, prescription details)
- **Soft deletes** for all entities (no hard deletes of medical data)
- **Audit columns** on every table (`created_at`, `updated_at`, `created_by`, `updated_by`)
- **UUID primary keys** for security (no sequential IDs)
- **Row-Level Security (RLS)** for multi-tenant data isolation (future)

---

## 6.5 Caching — Redis

### Why Redis

- **Performance:** Sub-millisecond response times
- **Session management:** JWT token blacklisting and session storage
- **Queue support:** Real-time queue state caching
- **Pub/Sub:** Real-time event broadcasting for queue updates
- **TTL support:** Automatic cache invalidation

### Use Cases

| Use Case | TTL | Description |
|----------|-----|-------------|
| Session tokens | 24 hours | Active user session storage |
| OTP codes | 5 minutes | Login verification codes |
| Doctor availability | 5 minutes | Cached slot availability |
| Queue state | Real-time | Current queue positions and estimates |
| Search results | 10 minutes | Cached doctor search results |
| Rate limiting | Per-endpoint | API rate limit counters |

---

## 6.6 Notifications — Firebase Cloud Messaging

### Why FCM

- **Cross-platform:** Android, iOS, and Web support
- **Reliable delivery:** Google's infrastructure ensures high delivery rates
- **Free tier:** Generous free tier sufficient for initial scale
- **Topic messaging:** Group notifications by clinic, doctor, or event type
- **Data messages:** Custom payload support for queue updates

### Notification Types

| Type | Trigger | Priority |
|------|---------|----------|
| Appointment Confirmation | Booking created | High |
| Appointment Reminder | 1 hour before appointment | High |
| Queue Update | Patient position changes | Normal |
| Prescription Uploaded | Doctor creates prescription | High |
| Report Uploaded | Doctor uploads report | Normal |
| Emergency Alert | Emergency button pressed | Critical |

---

## 6.7 Infrastructure — Docker

### Why Docker

- **Consistency:** Same environment across development, staging, and production
- **Isolation:** Each service runs in its own container
- **Scalability:** Easy horizontal scaling with orchestrators
- **CI/CD:** Streamlined build and deployment pipelines

### Container Architecture

```
┌─────────────────────────────────────────┐
│              Docker Compose             │
│                                         │
│  ┌───────────┐  ┌───────────┐          │
│  │  NestJS   │  │  NestJS   │          │
│  │  API      │  │  Worker   │          │
│  │  Server   │  │  (Queue)  │          │
│  └─────┬─────┘  └─────┬─────┘          │
│        │               │                │
│  ┌─────▼───────────────▼─────┐          │
│  │        Redis              │          │
│  └───────────┬───────────────┘          │
│              │                          │
│  ┌───────────▼───────────────┐          │
│  │      PostgreSQL           │          │
│  └───────────────────────────┘          │
└─────────────────────────────────────────┘
```

---

## 6.8 Version Control & CI/CD — GitHub

### Repository Strategy

| Repository | Contents |
|------------|----------|
| `healthsync-app` | Flutter frontend (all platforms) |
| `healthsync-api` | NestJS backend |
| `healthsync-infra` | Docker configs, CI/CD pipelines, deployment scripts |
| `healthsync-docs` | SRS, API docs, architecture decisions |

### Branching Strategy

- `main` — Production-ready code
- `develop` — Integration branch
- `feature/*` — Feature branches
- `bugfix/*` — Bug fix branches
- `release/*` — Release preparation branches

---

## 6.9 Future Technology Additions

| Technology | Phase | Purpose |
|------------|-------|---------|
| WebRTC / Agora | Phase 2 | Video consultation |
| Razorpay / Stripe | Phase 2 | Payment gateway |
| Elasticsearch | Phase 2 | Advanced search |
| TensorFlow Lite / ML Kit | Phase 3 | AI health insights |
| Kubernetes | Phase 3 | Container orchestration |
| Kafka | Phase 3 | Event streaming |
| FHIR/HL7 | Phase 3 | Healthcare data interoperability |
