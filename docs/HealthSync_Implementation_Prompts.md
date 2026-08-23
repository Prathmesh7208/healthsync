# HealthSync — Implementation Prompts

> **How to use**: Copy-paste each prompt **in order** into your AI coding assistant. Wait for each phase to complete before moving to the next. Each prompt builds on the previous one.

---

## Phase 1 — Project Setup & Foundation

### Prompt 1.1: Initialize the Project

```
Create a full-stack web application called "HealthSync" in the current directory (c:\SyncHealth) using the following stack:

Frontend:
- Vite + React.js with TypeScript
- React Router v6 for routing
- Zustand for state management
- Socket.io-client for real-time features
- React-i18next for internationalization (English, Hindi, Marathi)
- Axios for API calls
- React Hook Form + Zod for form validation
- Lucide React for icons
- Google Fonts: Inter (primary), Noto Sans Devanagari (for Hindi/Marathi)

Backend:
- Node.js + Express with TypeScript
- Prisma ORM with PostgreSQL
- Socket.io for WebSockets
- JSON Web Tokens (jsonwebtoken) for auth
- BullMQ + Redis for background jobs
- Multer for file uploads
- Winston for structured logging

Project structure:
/client — React frontend (Vite)
/server — Express backend
/server/prisma — Prisma schema and migrations
/server/src/routes — API route handlers
/server/src/middleware — Auth, RBAC, validation, error handling middleware
/server/src/services — Business logic layer
/server/src/jobs — Background job processors
/server/src/utils — Utility functions
/server/src/types — TypeScript type definitions
/docs — PRD and SRS (already exists)

Set up:
1. Initialize both client and server with package.json and tsconfig.json
2. Create a root package.json with scripts to run both concurrently
3. Configure Vite proxy to forward /api and /socket.io requests to the backend (port 5000)
4. Set up environment variables (.env.example) for both client and server
5. Create a Docker Compose file with PostgreSQL 15 and Redis 7 services
6. Set up ESLint and Prettier for both client and server
7. Do NOT create any application code yet — just the project scaffolding
```

---

### Prompt 1.2: Design System & Global Styles

```
Set up the design system and global styles for HealthSync in /client. This is a healthcare platform, so the design should feel professional, trustworthy, and modern.

Design tokens:
- Primary: Deep blue (#1A56DB) for trust and professionalism
- Secondary: Teal (#0D9488) for health/wellness
- Emergency/Danger: Vivid red (#DC2626) for SOS and critical alerts
- Success: Green (#16A34A) for available slots and confirmations
- Warning: Amber (#F59E0B) for caution states
- Neutral: Slate scale for text and backgrounds
- Background: #F8FAFC (light), #0F172A (dark mode)
- Surface: White (light), #1E293B (dark)
- Border radius: 8px (small), 12px (medium), 16px (large)
- Shadows: Subtle, layered shadows for depth

Create:
1. /client/src/styles/index.css — CSS custom properties for all tokens, global resets, typography (Inter + Noto Sans Devanagari), dark mode support via [data-theme="dark"]
2. /client/src/styles/components.css — Reusable component styles: buttons (primary, secondary, danger, ghost, sizes), inputs, cards, badges, modals, tooltips, skeletons, alerts
3. Micro-animations: smooth transitions (200ms ease), hover scales, focus rings, loading spinners, pulse animation for SOS button
4. Mobile-first responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
5. Accessibility: focus-visible outlines, reduced-motion media query, minimum 44px touch targets

Also create these foundational React components in /client/src/components/ui/:
- Button.tsx (variants: primary, secondary, danger, ghost, outline; sizes: sm, md, lg)
- Input.tsx (with label, error state, helper text)
- Card.tsx (with header, body, footer slots)
- Modal.tsx (with overlay, close button, sizes)
- Badge.tsx (variants: success, warning, danger, info, neutral)
- Spinner.tsx (loading indicator)
- Avatar.tsx (image with fallback initials)
- Toast.tsx (notification toasts with auto-dismiss)

Make everything look premium and polished — no generic or plain styling.
```

---

## Phase 2 — Database & Backend Foundation

### Prompt 2.1: Database Schema

```
Create the complete Prisma schema for HealthSync in /server/prisma/schema.prisma based on the database design in our SRS document at c:\SyncHealth\docs\HealthSync_SRS.md (Section 6).

Include ALL entities:
1. Users — id (UUID), phone, countryCode, role (enum: PATIENT, DOCTOR, RECEPTIONIST, AMBULANCE_OPERATOR, ADMIN), languagePreference (enum: EN, HI, MR), isActive, timestamps
2. Patients — linked to Users, full profile fields (name, DOB, gender, bloodGroup, photo, emergency contact, address, allergies, conditions)
3. Doctors — linked to Users, professional fields (name, photo, registrationNumber, experience, bio, languages JSON, specializations JSON, isAvailable)
4. Hospitals — name, address, GPS coordinates (lat/lng as Decimal), phone, email, hasEmergency, departments JSON, facilities JSON
5. DoctorHospitalAffiliations — links doctors to hospitals with consultation fee, unique constraint on (doctorId, hospitalId)
6. DoctorSchedules — doctorId, hospitalId, dayOfWeek enum, startTime, endTime, slotDurationMinutes
7. DoctorBreaks — doctorId, hospitalId, dayOfWeek (nullable), specificDate (nullable), startTime, endTime
8. Slots — doctorId, hospitalId, date, startTime, endTime, status enum (AVAILABLE, BOOKED, UNAVAILABLE), version for optimistic concurrency. Unique on (doctorId, hospitalId, date, startTime)
9. Appointments — with human-readable appointmentId, linked to patient/doctor/hospital/slot, status enum (BOOKED, CONFIRMED, IN_PROGRESS, COMPLETED, NO_SHOW, CANCELLED_BY_PATIENT, CANCELLED_BY_DOCTOR), reasonForVisit, cancellationReason, checkedInAt
10. Consultations — linked to appointment, symptoms JSON, diagnosis, observations, advice, followUp fields, isFinalized
11. Prescriptions — linked to consultation/doctor/patient, pdfUrl
12. PrescriptionItems — medicine details (name, dosage, form enum, frequency, timing enum, duration, instructions)
13. MedicalRecords — patientId, type enum (PRESCRIPTION, LAB_REPORT, SCAN, INSURANCE, OTHER), fileUrl, fileName, category, notes, uploadedBy
14. MedicineReminders — patientId, medicineName, dosage, frequency, times JSON, startDate, endDate, isActive
15. Emergencies — with human-readable emergencyId, linked to patient/hospital/ambulanceOperator, status enum (all states from SRS), initial GPS, timestamps
16. EmergencyLocationTrail — emergencyId, source enum (PATIENT, AMBULANCE), lat, lng, accuracy, speed, heading, recordedAt
17. EmergencyStatusHistory — emergencyId, status, updatedBy, notes, timestamp
18. AmbulanceOperators — linked to Users, vehicleNumber, currentStatus enum (AVAILABLE, UNAVAILABLE, ON_ASSIGNMENT), current GPS
19. Receptionists — linked to Users, hospitalId
20. Notifications — userId, type, title, body, data JSON, channel enum, status enum, timestamps
21. AuditLogs — userId, action, resourceType, resourceId, details JSON, ipAddress, userAgent, timestamp

Add proper indexes as specified in the SRS (Section 6.2):
- Slots: (doctorId, date, status)
- Appointments: (patientId, date), (doctorId, date), (hospitalId, date, status)
- EmergencyLocationTrail: (emergencyId, source, recordedAt)
- AuditLogs: (userId, createdAt), (resourceType, resourceId)

After creating the schema, generate the Prisma client and create the initial migration.
```

---

### Prompt 2.2: Backend Core Setup

```
Set up the Express backend core in /server/src/ with:

1. /server/src/app.ts — Express app setup:
   - CORS configuration (allow frontend origin)
   - JSON body parser (limit: 10mb)
   - Cookie parser
   - Request ID middleware (UUID per request)
   - Request logging middleware (Winston)
   - Global error handler middleware
   - 404 handler
   - Health check endpoint: GET /api/v1/health

2. /server/src/server.ts — Server startup:
   - HTTP server creation
   - Socket.io attachment with CORS
   - Listen on PORT from env (default 5000)
   - Graceful shutdown handling (SIGTERM, SIGINT)

3. /server/src/config/index.ts — Centralized config from env vars:
   - PORT, DATABASE_URL, REDIS_URL
   - JWT_SECRET, JWT_EXPIRY, REFRESH_TOKEN_EXPIRY
   - SMS_API_KEY, SMS_SENDER_ID
   - MAPS_API_KEY
   - S3_BUCKET, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY
   - OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS, OTP_COOLDOWN_SECONDS

4. /server/src/middleware/auth.ts — Authentication middleware:
   - Extract JWT from Authorization: Bearer header
   - Verify token, attach user to request
   - Handle expired/invalid tokens

5. /server/src/middleware/rbac.ts — Role-based access control:
   - Factory function: authorize(...roles: Role[]) => middleware
   - Check user's role against allowed roles
   - Return 403 if unauthorized

6. /server/src/middleware/validate.ts — Request validation middleware:
   - Factory function that takes a Zod schema
   - Validates req.body, req.query, or req.params
   - Returns 400 with structured error details on failure

7. /server/src/middleware/rateLimiter.ts — Rate limiting:
   - Redis-backed rate limiter
   - Configurable limits per endpoint category (general: 100/min, OTP: 5/min, SOS: 3/day)

8. /server/src/middleware/auditLog.ts — Audit logging middleware:
   - Logs user actions to AuditLogs table
   - Captures userId, action, resource, IP, userAgent

9. /server/src/utils/logger.ts — Winston logger setup:
   - Console transport (dev), File transport (prod)
   - JSON format, timestamps, request ID correlation

10. /server/src/utils/prisma.ts — Prisma client singleton

11. /server/src/utils/redis.ts — Redis client setup and connection

12. /server/src/utils/errors.ts — Custom error classes:
    - AppError (base), ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError

Make sure all error responses follow the format:
{ "error": { "code": "ERROR_CODE", "message": "Human readable message", "details": {} } }
```

---

## Phase 3 — Authentication System

### Prompt 3.1: Auth API & OTP System

```
Implement the complete authentication system for HealthSync:

Backend (/server/src/):

1. /server/src/services/otp.service.ts:
   - generateOTP(): Generate 6-digit random OTP
   - storeOTP(phone, otp): Store in Redis with 5-minute TTL
   - verifyOTP(phone, otp): Validate OTP from Redis, delete on success
   - getAttempts(phone): Track failed attempts in Redis (max 3)
   - getCooldown(phone): Check resend cooldown (30 seconds)
   - sendOTP(phone, otp): Simulate SMS sending (log to console in dev, integrate MSG91/Twilio interface for prod)

2. /server/src/services/auth.service.ts:
   - generateToken(user): Create JWT with { userId, role, exp }
   - generateRefreshToken(user): Create refresh token (30-day expiry)
   - verifyToken(token): Verify and decode JWT
   - refreshAccessToken(refreshToken): Issue new access token

3. /server/src/routes/auth.routes.ts — Endpoints:
   - POST /api/v1/auth/otp/send — Send OTP
     - Validate phone format
     - Check rate limit (5/min)
     - Generate and store OTP
     - Send via SMS service
     - Response: { success: true, message: "OTP sent" }
   
   - POST /api/v1/auth/otp/verify — Verify OTP & login/register
     - Validate phone + OTP
     - Check attempts (max 3, then lock 30 min)
     - If user exists → login (return tokens + user)
     - If user doesn't exist → create user with role PATIENT → return tokens + user + isNewUser: true
     - Response: { token, refreshToken, user: { id, phone, role, isNewUser } }
   
   - POST /api/v1/auth/login — Credential login (for doctors, receptionists)
     - Email + password validation
     - bcrypt password comparison
     - Return tokens + user
   
   - POST /api/v1/auth/refresh — Refresh token
   - POST /api/v1/auth/logout — Invalidate refresh token (Redis blacklist)

Frontend (/client/src/):

4. /client/src/stores/authStore.ts (Zustand):
   - State: user, token, isAuthenticated, isLoading
   - Actions: sendOTP, verifyOTP, login, logout, refreshToken
   - Persist token to localStorage
   - Auto-refresh token before expiry

5. /client/src/pages/auth/LoginPage.tsx:
   - Step 1: Language selection (English, Hindi, Marathi) — 3 large buttons with flag/language name
   - Step 2: Phone number input with country code selector (flag dropdown, default India +91)
   - Step 3: OTP input (6 individual digit boxes with auto-focus)
   - Resend OTP button with 30-second cooldown timer
   - Auto-submit when 6 digits entered
   - If new user → redirect to profile setup
   - If existing user → redirect to dashboard
   - Beautiful, mobile-first design with HealthSync branding, gradient background, glassmorphism card

6. /client/src/components/auth/CountryCodeSelector.tsx:
   - Searchable dropdown with country flags (use emoji flags), country name, dial code
   - Default: 🇮🇳 India (+91)
   - Include 20+ major countries

7. /client/src/components/auth/OTPInput.tsx:
   - 6 individual input boxes
   - Auto-focus next on input
   - Backspace goes to previous
   - Paste support (auto-fill all 6)
   - Error shake animation on wrong OTP

8. /client/src/components/auth/ProtectedRoute.tsx:
   - Check authentication and role
   - Redirect to login if unauthenticated
   - Redirect to unauthorized page if wrong role
```

---

## Phase 4 — Patient Portal

### Prompt 4.1: Patient Profile & Home

```
Build the Patient Profile Setup and Home Screen for HealthSync:

1. /client/src/pages/patient/ProfileSetup.tsx:
   - Step-by-step form (3 steps with progress indicator):
     Step 1 — Basic Info: Full name, date of birth (date picker with age auto-calc), gender (radio buttons with icons), blood group (dropdown)
     Step 2 — Contact: Emergency contact name & phone, address (line1, line2, city, state, pin code)  
     Step 3 — Medical: Known allergies (tag input), existing conditions (multi-select checkboxes from common list), profile photo upload (with crop/preview)
   - Skip option for optional fields
   - Beautiful card-based layout with illustrations
   - Save to backend via PUT /api/v1/patients/me

2. /server/src/routes/patient.routes.ts:
   - GET /api/v1/patients/me — Get patient profile
   - PUT /api/v1/patients/me — Update patient profile (validate with Zod)
   - POST /api/v1/patients/me/photo — Upload profile photo (Multer, resize to 500x500, store to disk/S3)

3. /client/src/pages/patient/HomePage.tsx — Patient Dashboard:
   - Top bar: HealthSync logo, language switcher, profile avatar with dropdown (profile, settings, logout)
   - Search bar (prominent): "Search doctors, specializations, hospitals..."
   - Quick action cards (horizontal scroll): Book Appointment, My Appointments, Health Records, Medicine Reminders
   - Upcoming appointments section (next 3 appointments as cards with doctor photo, name, date/time, hospital, countdown timer)
   - SOS Button: Large, red, floating action button in bottom-right corner with pulse animation. Always visible on all patient screens.
   - Bottom navigation (mobile): Home, Search, Appointments, Records, Profile
   - Premium, modern healthcare UI — use subtle gradients, rounded cards, micro-animations

4. /client/src/layouts/PatientLayout.tsx:
   - Wraps all patient pages
   - Includes top bar, bottom navigation (mobile), and floating SOS button
   - Responsive: bottom nav on mobile, sidebar on desktop

5. /client/src/i18n/ — Set up i18next:
   - /client/src/i18n/config.ts — i18next configuration
   - /client/src/i18n/locales/en.json — English translations
   - /client/src/i18n/locales/hi.json — Hindi translations  
   - /client/src/i18n/locales/mr.json — Marathi translations
   - Include translations for: navigation, buttons, form labels, error messages, common medical terms, SOS-related text
```

---

### Prompt 4.2: Doctor Search & Discovery

```
Build the Doctor Search, Filtering, and Profile View for HealthSync:

Backend:

1. /server/src/routes/doctor.routes.ts:
   - GET /api/v1/doctors — Search doctors
     - Query params: q (search text), specialization, language, gender, feeMin, feeMax, availability (today/thisWeek/any), rating, sortBy (relevance/rating/fee/experience), page, limit
     - Full-text search on doctor name, specialization, hospital name
     - Return: paginated results with doctor photo, name, specialization, experience, fee, rating, hospital names, next available slot
   
   - GET /api/v1/doctors/:id — Get doctor full profile
     - All profile data + hospital affiliations + average rating + review count + next 7 days slot availability summary
   
   - GET /api/v1/doctors/:id/slots?date=YYYY-MM-DD&hospitalId=xxx — Get slots for specific date
     - Compute slots from schedule: working hours → generate slots by duration → subtract breaks → cross-reference bookings
     - Return array of: { time, endTime, status: 'available' | 'booked' | 'unavailable' }
     - Past time slots for today marked as unavailable

2. /server/src/services/slot.service.ts:
   - generateSlotsForDate(doctorId, hospitalId, date): Core slot generation logic
     - Get doctor's schedule for that day-of-week
     - Generate time slots based on slot duration
     - Apply breaks (mark as unavailable)
     - Query existing appointments (mark as booked)
     - Mark past slots for today as unavailable
     - Return slot array with statuses

Frontend:

3. /client/src/pages/patient/DoctorSearchPage.tsx:
   - Search bar at top with debounced autocomplete (300ms)
   - Filter panel (collapsible on mobile, sidebar on desktop):
     - Specialization: multi-select chips
     - Language: multi-select chips
     - Gender: radio buttons
     - Fee range: dual range slider with ₹ values
     - Availability: radio (Today, This Week, Any)
     - Rating: star selector (minimum)
   - Sort dropdown: Relevance, Rating, Fee (Low-High), Fee (High-Low), Experience
   - Active filters shown as removable chips above results
   - Results grid: Doctor cards with photo, name, specialization, experience, fee, rating stars, hospital, next available slot badge, "Book" button
   - Infinite scroll pagination
   - Empty state with illustration when no results
   - Loading skeleton cards

4. /client/src/pages/patient/DoctorProfilePage.tsx:
   - Hero section: Large photo, name, specialization badge, verification icon
   - Stats row: Experience years, ratings, total patients (if available)
   - About section: Bio, qualifications, registration number
   - Specializations: Badge list
   - Hospital affiliations: Cards with name, address, map thumbnail, fee
   - Languages spoken: Badge list
   - Reviews section: Average rating, rating distribution bar chart, individual reviews (paginated)
   - Availability preview: Next 7 days mini-calendar with green/grey dots
   - Prominent "Book Appointment" CTA button (sticky on mobile)

All designs should be premium, modern healthcare UI. Use smooth animations, subtle shadows, and professional color palette.
```

---

### Prompt 4.3: Appointment Booking System

```
Build the complete Appointment Booking, Confirmation, and Management system for HealthSync:

Backend:

1. /server/src/routes/appointment.routes.ts:
   - POST /api/v1/appointments — Create appointment
     - Body: { doctorId, hospitalId, slotDate, slotTime, reasonForVisit? }
     - Server-side flow:
       a. Validate all IDs exist
       b. Find the slot record for (doctorId, hospitalId, date, startTime)
       c. Use optimistic locking: UPDATE slots SET status='BOOKED', version=version+1 WHERE id=? AND status='AVAILABLE' AND version=currentVersion
       d. If update affected 0 rows → slot was taken → return 409 Conflict with "SLOT_UNAVAILABLE"
       e. If update succeeded → create appointment record with status BOOKED
       f. Generate human-readable appointmentId: HS-APT-YYYYMMDD-XXXX
       g. Send notifications to patient and doctor
       h. Broadcast slot update via Socket.io
     - Return: appointment details with confirmation

   - GET /api/v1/patients/me/appointments?status=upcoming|past|all — List patient appointments
     - Upcoming: future dates with status BOOKED/CONFIRMED/IN_PROGRESS, sorted chronological
     - Past: completed/cancelled, sorted reverse chronological
     - Include doctor details, hospital details

   - GET /api/v1/appointments/:id — Get appointment details

   - PUT /api/v1/appointments/:id/cancel — Cancel appointment
     - Validate: appointment belongs to patient, status is BOOKED or CONFIRMED
     - Update status to CANCELLED_BY_PATIENT
     - Release slot: UPDATE slots SET status='AVAILABLE' WHERE id=slotId
     - Notify doctor
     - Broadcast slot update via Socket.io

2. /server/src/services/notification.service.ts:
   - sendNotification(userId, type, title, body, data, channel):
     - Save to Notifications table
     - If channel includes PUSH → send via push service (stub for now)
     - If channel includes SMS → send via SMS service
     - If channel includes IN_APP → broadcast via Socket.io to user's notification channel

Frontend:

3. /client/src/pages/patient/BookAppointmentPage.tsx:
   - Date picker: Horizontal scrollable dates for next 30 days. Dates with 0 available slots greyed out.
   - Hospital/Clinic selector: If doctor has multiple affiliations, show selector
   - Time slots grid:
     - Available slots: green/teal cards — tappable
     - Booked slots: grey cards — disabled, show "Booked" label
     - Unavailable slots: red/muted cards — disabled, show "Unavailable" label  
     - Morning / Afternoon / Evening sections
   - Real-time updates via Socket.io (slots change color if booked by someone else while viewing)

4. /client/src/pages/patient/BookingConfirmPage.tsx:
   - Review screen before final confirmation:
     - Doctor card (photo, name, specialization)
     - Date & Time
     - Hospital/clinic with address
     - Consultation fee
     - Reason for visit (optional textarea)
     - "Confirm Booking" button with loading state
   - On success → navigate to Confirmation page
   - On conflict (slot taken) → show error toast, auto-redirect back to slot selection with refreshed data

5. /client/src/pages/patient/BookingSuccessPage.tsx:
   - Success animation (checkmark)
   - Appointment ID (large, copyable)
   - All booking details in a card
   - "Add to Calendar" button
   - "View My Appointments" button
   - "Book Another" button

6. /client/src/pages/patient/AppointmentsPage.tsx:
   - Tabs: Upcoming | Past
   - Upcoming: Cards with doctor photo, name, date/time countdown, hospital, status badge, "Cancel" action
   - Past: Cards with status, "View Details" to see consultation notes/prescription, "Book Again" button
   - Cancel flow: confirmation modal with reason dropdown → cancel → success toast → card removed with animation
   
7. Set up Socket.io on the client to listen for slot updates on the current doctor/date being viewed and update the slot grid in real-time.

Make the slot selection interface particularly beautiful — this is a core user experience. Use clear color coding, smooth selection animations, and intuitive date navigation.
```

---

### Prompt 4.4: Health Records & Medicine Reminders

```
Build the Digital Health Records and Medicine Reminders features for HealthSync:

Backend:

1. /server/src/routes/records.routes.ts:
   - GET /api/v1/patients/me/records — List all health records
     - Query: type (PRESCRIPTION, LAB_REPORT, SCAN, INSURANCE, OTHER), dateFrom, dateTo, page, limit
     - Return: records sorted by date descending with file URLs
   - POST /api/v1/patients/me/records — Upload health record
     - Multer file upload (PDF, JPEG, PNG, max 10MB)
     - Body: type, category, notes, date, doctorName (optional)
     - Store file to disk (dev) / S3 (prod)
     - Create MedicalRecords entry
   - DELETE /api/v1/patients/me/records/:id — Delete self-uploaded record
     - Only allow deleting records uploaded by patient (not doctor-uploaded)

2. /server/src/routes/reminder.routes.ts:
   - GET /api/v1/patients/me/reminders — List all active reminders
   - POST /api/v1/patients/me/reminders — Create reminder
     - Body: medicineName, dosage, frequency, times (array of HH:mm), startDate, endDate, instructions
   - PUT /api/v1/patients/me/reminders/:id — Update reminder
   - DELETE /api/v1/patients/me/reminders/:id — Delete reminder
   - PUT /api/v1/patients/me/reminders/:id/log — Log taken/skipped
     - Body: { status: 'taken' | 'skipped', timestamp }

3. /server/src/jobs/reminderJob.ts:
   - BullMQ repeatable job that runs every minute
   - Query reminders where current time matches any scheduled time
   - Send push notification to patient
   - Create notification record

Frontend:

4. /client/src/pages/patient/HealthRecordsPage.tsx:
   - Timeline view: All records in chronological order with type icons and color coding
   - Filter tabs: All, Prescriptions, Lab Reports, Scans, Insurance, Other
   - Each record card: type icon, date, title/doctor name, category badge, preview thumbnail (for images), download button
   - Upload button (FAB): Opens modal with file picker, type dropdown, date, notes, doctor name fields
   - Document viewer: In-app PDF/image viewer modal
   - Search bar for records

5. /client/src/pages/patient/MedicineRemindersPage.tsx:
   - Active reminders list: Cards with medicine name, dosage, next reminder time, frequency, adherence percentage ring
   - Add reminder form (bottom sheet/modal):
     - Medicine name, dosage, form (with icons: 💊 tablet, 🧴 syrup, etc.)
     - Frequency selector: Once daily, Twice daily, Three times, Custom
     - Time pickers for each dose
     - Start date, end date (optional)
     - Before/After food toggle
   - Today's schedule: Timeline view of today's reminders with taken/skipped/pending status
   - Mark taken (green checkmark button) / skipped (grey X button) for each dose
   - Weekly adherence chart (simple bar chart)

Both pages should maintain the premium HealthSync design language. The health records timeline should feel like a medical diary, and the reminders should feel helpful and encouraging.
```

---

## Phase 5 — Doctor Dashboard

### Prompt 5.1: Doctor Dashboard & Schedule Management

```
Build the complete Doctor Dashboard for HealthSync:

Backend:

1. /server/src/routes/doctorDashboard.routes.ts:
   - PUT /api/v1/doctors/me — Update doctor profile
   - GET /api/v1/doctors/me/schedules — Get all schedules
   - POST /api/v1/doctors/me/schedules — Create schedule
     - Body: { hospitalId, dayOfWeek, startTime, endTime, slotDurationMinutes }
     - Validate no overlapping schedules (same location, same day)
     - Validate no cross-location time conflicts
   - PUT /api/v1/doctors/me/schedules/:id — Update schedule
     - Trigger slot regeneration for future dates
   - DELETE /api/v1/doctors/me/schedules/:id — Delete schedule
   - POST /api/v1/doctors/me/breaks — Create break period
     - Body: { hospitalId, dayOfWeek?, specificDate?, startTime, endTime }
     - Check for booking conflicts, alert if any
   - DELETE /api/v1/doctors/me/breaks/:id — Remove break
   - PUT /api/v1/doctors/me/availability — Toggle availability
     - Body: { isAvailable: boolean }
     - Broadcast via Socket.io
   - POST /api/v1/doctors/me/leave — Mark leave dates
     - Body: { dates: string[], hospitalIds: string[] }
     - Cancel affected unbooked slots
     - Notify patients with existing bookings

2. /server/src/services/schedule.service.ts:
   - regenerateSlots(doctorId, hospitalId, fromDate): Regenerate unbooked slots from a given date forward (up to 30 days)
   - This should be a background job (BullMQ) triggered on schedule changes

Frontend:

3. /client/src/pages/doctor/DoctorDashboardPage.tsx:
   - Top bar: HealthSync logo, doctor name + avatar, availability toggle (green/red pill), notifications bell
   - Sidebar navigation (desktop) / bottom tabs (mobile): Dashboard, Schedule, Appointments, Patients, Profile
   - Dashboard home:
     - Today's stats cards: Total appointments, completed, pending, no-shows
     - Today's appointment timeline (vertical timeline with patient names, times, statuses)
     - Quick actions: Start next consultation, view queue
     - Upcoming week overview (mini calendar with appointment counts)

4. /client/src/pages/doctor/ScheduleManagementPage.tsx:
   - Hospital/Clinic selector tabs (if multiple affiliations)
   - Weekly schedule grid: Days as columns, time as rows
     - Working hours shown as colored blocks
     - Breaks shown as hatched/striped blocks
     - Visual drag-to-create/resize (if feasible, otherwise form-based)
   - Add/Edit working hours form: Day, start time, end time, slot duration
   - Add/Edit break form: Recurring (day-of-week) or one-time (date), start time, end time
   - Leave management: Calendar view, select dates, mark as leave
   - Conflict indicators: Highlight if schedules overlap across locations

5. /client/src/pages/doctor/DoctorProfileEditPage.tsx:
   - Edit all profile fields
   - Specialization multi-select with search
   - Hospital affiliation management: Add/remove hospitals, set fee per location
   - Languages spoken multi-select
   - Photo upload with crop

Use a professional, data-dense design suitable for doctor users. Calendar/schedule views should be clear and intuitive. Use subtle color coding for different states.
```

---

### Prompt 5.2: Doctor Appointments, Consultations & Prescriptions

```
Build the Appointment Management, Consultation Records, and Digital Prescriptions for the Doctor Dashboard:

Backend:

1. /server/src/routes/doctorAppointment.routes.ts:
   - GET /api/v1/doctors/me/appointments — List appointments
     - Query: date, hospitalId, status, view (calendar/list), page
     - Return with patient basic info
   - PUT /api/v1/doctors/me/appointments/:id/status — Update appointment status
     - Valid transitions: BOOKED→CONFIRMED, CONFIRMED→IN_PROGRESS, IN_PROGRESS→COMPLETED, IN_PROGRESS→NO_SHOW, BOOKED→CANCELLED_BY_DOCTOR
     - Notify patient on each transition
     - Update receptionist dashboard via Socket.io
   - GET /api/v1/doctors/me/appointments/:id/patient — Get patient info for appointment
     - Return: patient profile, past appointments with this doctor, past consultations/prescriptions by this doctor
     - Privacy: only show this doctor's own past records

2. /server/src/routes/consultation.routes.ts:
   - POST /api/v1/consultations — Create consultation record
     - Body: { appointmentId, symptoms, diagnosis, observations, advice, followUpRecommended, followUpDate }
     - Validate appointment belongs to this doctor and is IN_PROGRESS
   - PUT /api/v1/consultations/:id — Update consultation (only if not finalized)
   - PUT /api/v1/consultations/:id/finalize — Mark as finalized (immutable after)

3. /server/src/routes/prescription.routes.ts:
   - POST /api/v1/prescriptions — Create prescription
     - Body: { consultationId, items: [{ medicineName, dosage, form, frequency, timing, duration, instructions }] }
     - Generate PDF (use a simple HTML-to-PDF approach with doctor header, patient info, date, medicine table)
     - Store PDF in file storage
     - Auto-create medical record entry for patient
   - GET /api/v1/prescriptions/:id/pdf — Download prescription PDF

Frontend:

3. /client/src/pages/doctor/AppointmentsPage.tsx:
   - View toggle: Calendar view (day/week/month) | List view
   - Calendar view: Appointments as blocks with patient name, time, status color
   - List view: Table with columns — Time, Patient, Hospital, Status, Actions
   - Filter bar: Date picker, hospital selector, status filter
   - Click appointment → opens appointment detail slide-over/modal

4. /client/src/pages/doctor/ConsultationPage.tsx (opens when doctor starts a consultation):
   - Left panel: Patient info card (name, age, gender, blood group, allergies, conditions)
   - Below: Past visits with this doctor (accordion list with dates, diagnoses)
   - Right panel / Main area — Consultation form:
     - Symptoms: Tag input with autocomplete from common symptoms list
     - Diagnosis: Textarea with ICD code hint (future)
     - Observations/Clinical Notes: Rich textarea
     - Advice: Textarea
     - Follow-up: Toggle + date picker
   - Prescription section (expandable):
     - Add medicine rows: Medicine name (autocomplete), dosage, form (dropdown with icons), frequency, timing, duration, instructions
     - Add/remove medicine rows dynamically
     - "Generate Prescription" button → creates PDF and saves
   - Action buttons: "Save Draft" (auto-saves every 30s), "Complete Consultation" (finalizes + marks appointment COMPLETED)
   - Confirmation modal before completing

The consultation page is critical — it should be efficient for doctors to fill in quickly while being comprehensive. Use a clean, form-focused layout with keyboard navigation support.
```

---

## Phase 6 — Receptionist / Hospital Dashboard

### Prompt 6:

```
Build the complete Receptionist / Hospital Dashboard for HealthSync:

Backend:

1. /server/src/routes/receptionist.routes.ts:
   - GET /api/v1/hospitals/:hospitalId/appointments — List all appointments at hospital
     - Query: date, doctorId, department, status, page
   - GET /api/v1/hospitals/:hospitalId/doctors — List all doctors at hospital with real-time status
     - Return: doctor name, specialization, current status (Available/In Consultation/On Break/Off Duty), queue length, next available time
   - GET /api/v1/hospitals/:hospitalId/queue/:doctorId — Get patient queue for a doctor
     - Return: ordered list of patients with position, name, appointment time, status (Waiting/In Consultation/Completed), wait time
   - PUT /api/v1/appointments/:id/check-in — Check in patient
     - Update checkedInAt timestamp, move to queue as "Waiting"
     - Notify via Socket.io
   - POST /api/v1/hospitals/:hospitalId/walk-in — Register walk-in patient
     - Body: patient phone/name, doctorId
     - Create/find patient → create appointment (status: BOOKED, type: WALK_IN) → add to queue
   - GET /api/v1/hospitals/:hospitalId/ambulances — List ambulances with status
   - GET /api/v1/hospitals/:hospitalId/emergencies — List active emergencies

Frontend:

2. /client/src/pages/receptionist/ReceptionistDashboardPage.tsx:
   - Sidebar: Hospital logo + name, navigation (Dashboard, Appointments, Queue, Doctors, Emergencies)
   - Dashboard home:
     - Stats row: Today's appointments, checked-in, in-progress, completed, waiting, no-shows
     - Doctor availability board: Grid of doctor cards showing real-time status with color indicators (green=available, blue=in consultation, yellow=on break, grey=off duty)
     - Active emergencies alert banner (red, animated if any active)
     - Recent activity feed

3. /client/src/pages/receptionist/AppointmentDashboardPage.tsx:
   - Full appointment list/table for the hospital for selected date
   - Columns: Time, Patient Name, Phone, Doctor, Department, Status, Actions
   - Quick filters: All, Upcoming, In-Progress, Completed, Cancelled
   - Search by patient name, phone, or appointment ID
   - Check-in action button on each row
   - Bulk view: expandable row with appointment details

4. /client/src/pages/receptionist/QueueManagementPage.tsx:
   - Doctor selector (tabs or dropdown)
   - Per-doctor queue as a vertical list/kanban:
     - Columns: Waiting → In Consultation → Completed
     - Each patient card: queue number, name, appointment time, wait time (live counter), actions
   - "Check In Walk-in" button: opens form to search/create patient + add to queue
   - Average wait time display
   - Real-time updates via Socket.io

5. /client/src/pages/receptionist/DoctorBoardPage.tsx:
   - Grid of all doctors at the hospital
   - Each card: Doctor photo, name, specialization, status badge (large, color-coded), queue count, current patient (if in consultation), next available time
   - Real-time updates via Socket.io
   - Click doctor → see their full queue and schedule for the day

6. /client/src/pages/receptionist/EmergencyDashboardPage.tsx:
   - Active emergencies list (red-themed section)
   - Each emergency card: Patient info, emergency status, map preview with patient location, assigned ambulance (if any), time elapsed
   - "Assign Ambulance" action → opens ambulance selection modal
   - Ambulance selection modal: List available ambulances with vehicle number, operator name, current location, distance to patient, estimated arrival
   - Live map view (full screen option): Shows patient pin + ambulance moving marker + route
   - Emergency status timeline: vertical stepper showing each status with timestamps
   - Audio/visual alert on new incoming emergency (red flash + sound)

Design the receptionist dashboard for efficiency — it's an operational tool used all day. Use a dense but organized layout, real-time indicators, and clear status colors. The emergency section should feel urgent with appropriate visual treatment (red accents, pulsing indicators).
```

---

## Phase 7 — Ambulance Operator Interface

### Prompt 7:

```
Build the Ambulance Operator Interface for HealthSync — a mobile-optimized, one-hand-operable emergency response interface:

Backend:

1. /server/src/routes/ambulance.routes.ts:
   - PUT /api/v1/ambulance/me/status — Update availability (AVAILABLE/UNAVAILABLE)
   - PUT /api/v1/ambulance/me/location — Update current GPS location
     - Body: { latitude, longitude, accuracy, speed, heading }
     - Store in AmbulanceOperators table (current location)
   - GET /api/v1/ambulance/me/emergency — Get current active emergency assignment
   - PUT /api/v1/ambulance/me/emergency/:id/accept — Accept emergency assignment
   - PUT /api/v1/ambulance/me/emergency/:id/reject — Reject emergency assignment
   - PUT /api/v1/ambulance/me/emergency/:id/status — Update emergency status
     - Body: { status, notes? }
     - Valid transitions per SRS FR-A-007
     - Broadcast status update via Socket.io to patient + receptionist
   - POST /api/v1/ambulance/me/emergency/:id/message — Send message to hospital
     - Body: { message } or { quickMessage: 'PATIENT_CRITICAL' | 'PATIENT_STABLE' | 'NEED_ER_TEAM' | etc. }

2. /server/src/services/location.service.ts:
   - broadcastLocation(emergencyId, source, locationData): 
     - Save to EmergencyLocationTrail
     - Broadcast via Socket.io to emergency room
   - calculateETA(fromLat, fromLng, toLat, toLng): Use Maps API distance matrix

Frontend:

3. /client/src/pages/ambulance/AmbulanceLoginPage.tsx:
   - Simple login (OTP or credentials)
   - After login → AmbulanceDashboard

4. /client/src/pages/ambulance/AmbulanceDashboardPage.tsx:
   - Availability toggle: Large pill switch (Available / Unavailable) at the top
   - Status indicator: Current assignment status or "Waiting for assignment"
   - When on assignment → automatically switches to EmergencyViewPage
   - Minimal, clean interface with large elements

5. /client/src/pages/ambulance/EmergencyViewPage.tsx:
   This is the CRITICAL page — must be usable while driving with one hand:
   
   - Full-screen map (80% of viewport) showing:
     - Patient location pin (red, pulsing)
     - Ambulance current location (blue arrow)
     - Route line from ambulance to patient (or to hospital after pickup)
     - ETA overlay
   
   - Patient info bar (top, collapsible): Name, age, gender, blood group, allergies (critical info only)
   
   - Hospital destination bar (shows after patient pickup): Hospital name, address, ETA
   
   - Status update buttons (bottom of screen) — EXTRA LARGE (min 60px height), one at a time based on current state:
     - State: Accepted → Show "EN ROUTE TO PATIENT" (blue button, auto-selected)
     - State: En Route → Show "ARRIVED AT PATIENT" (green button)
     - State: At Patient → Show "PATIENT PICKED UP" (orange button)  
     - State: Picked Up → Show "EN ROUTE TO HOSPITAL" (blue button)
     - State: En Route Hospital → Show "ARRIVED AT HOSPITAL" (green button)
   
   - Each button: single tap with confirmation vibration (navigator.vibrate), no confirmation dialog (speed is critical in emergencies)
   
   - Quick message buttons (slide-up panel): "Patient Critical", "Patient Stable", "Need ER Team", "Need Stretcher", custom message
   
   - Location sharing: Auto-send GPS every 3 seconds via Socket.io while on assignment
   - Navigate button: Opens device native maps (Google Maps intent) with destination coordinates

6. /client/src/hooks/useGeolocation.ts:
   - Custom hook for continuous GPS tracking
   - watchPosition with high accuracy
   - Error handling for permission denied, unavailable
   - Battery-aware: reduce frequency when battery < 20%

The ambulance interface MUST be:
- Extra-large touch targets (everything fingertip-friendly)
- Minimal cognitive load (show only what's needed NOW)
- High contrast (readable in sunlight)
- Audio alerts for new assignments
- One-tap status updates (no confirmation dialogs — speed saves lives)
```

---

## Phase 8 — Emergency SOS System

### Prompt 8:

```
Build the complete Emergency SOS system that connects Patient → Hospital → Ambulance for HealthSync:

Backend:

1. /server/src/routes/emergency.routes.ts:
   - POST /api/v1/emergencies — Trigger SOS
     - Auth: Patient only
     - Body: { latitude, longitude, accuracy }
     - Processing:
       a. Rate limit check (max 3/day per user)
       b. Create Emergency record (status: INITIATED)
       c. Create EmergencyStatusHistory entry
       d. Find nearest hospital with hasEmergency=true using Haversine formula
       e. Send real-time alert to hospital's receptionist(s) via Socket.io
       f. Send push notification to receptionist
       g. Send SMS to patient's emergency contact
       h. Return emergency ID and status
     - Start patient location tracking (Socket.io channel)
   
   - PUT /api/v1/emergencies/:id/cancel — Cancel SOS
     - Only within 30 seconds of trigger
     - Status → CANCELLED
   
   - PUT /api/v1/emergencies/:id/acknowledge — Hospital acknowledges
     - Auth: Receptionist
     - Status → ACKNOWLEDGED
     - Notify patient
   
   - PUT /api/v1/emergencies/:id/assign-ambulance — Assign ambulance
     - Auth: Receptionist
     - Body: { ambulanceOperatorId }
     - Status → AMBULANCE_ASSIGNED
     - Notify ambulance operator (push + Socket.io)
     - Notify patient with ambulance details
   
   - GET /api/v1/emergencies/:id/suggest-ambulances — Get suggested ambulances
     - Auth: Receptionist
     - Calculate nearest 3 available ambulances with ETAs
   
   - PUT /api/v1/emergencies/:id/status — Update status (ambulance operator)
     - Enforce valid transitions
     - Create EmergencyStatusHistory entry
     - Broadcast to all parties
   
   - GET /api/v1/emergencies/:id — Get emergency details
     - Auth: involved parties only
   
   - GET /api/v1/emergencies/:id/location-trail — Get location history

2. /server/src/services/emergency.service.ts:
   - findNearestHospital(lat, lng): Haversine distance calculation to all partner hospitals with ER
   - findNearestAmbulances(lat, lng, limit): Find nearest available ambulances
   - escalateEmergency(emergencyId): If no hospital response in 2 minutes, alert next nearest hospital
   - Background job: Emergency escalation timeout checker (runs every 30 seconds)

3. /server/src/socket/emergency.socket.ts:
   - Socket.io namespace: /emergency
   - Rooms per emergency: emergency:{id}:patient, emergency:{id}:hospital, emergency:{id}:ambulance
   - Events:
     - location:update — { source, lat, lng, accuracy, speed, heading, timestamp }
     - status:update — { status, updatedBy, notes, timestamp }
     - message:new — { from, message, timestamp }
     - ambulance:assigned — { ambulanceDetails }
   - On location update: save to EmergencyLocationTrail, broadcast to room

Frontend:

4. /client/src/components/emergency/SOSButton.tsx:
   - Floating red button (bottom-right corner), always visible on patient pages
   - Pulse animation (CSS keyframes)
   - On tap: Confirmation modal with 5-second countdown
     - "Triggering Emergency SOS in 5... 4... 3... 2... 1..."
     - "Cancel" button to abort
     - If not cancelled → trigger SOS
   - Request location permission if not granted
   - Visual feedback: button changes to "SOS Active" state

5. /client/src/pages/patient/EmergencyStatusPage.tsx:
   - Full-screen emergency tracking view (replaces normal navigation)
   - Status stepper (vertical): Each stage with timestamp and status icon
     - ✅ Emergency Submitted
     - ⏳ Hospital Notified (waiting...)  
     - ✅ Hospital Acknowledged
     - ✅ Ambulance Assigned → shows ambulance details (vehicle number, driver name, phone)
     - 🚑 Ambulance En Route → shows ETA countdown
     - ✅ Ambulance Arrived
     - 🚑 En Route to Hospital → shows hospital name + ETA
     - ✅ Arrived at Hospital
   - Map section: Shows ambulance location (after assignment) moving in real-time
   - Emergency contact status: "Your emergency contact [name] has been notified"
   - Cancel button (only visible in first 30 seconds)
   - Call ambulance button (phone icon)

6. Integration in ReceptionistDashboard (update the emergency section from Phase 6):
   - When new emergency arrives:
     - Audio alert (siren sound effect)
     - Screen flash/pulse (red border animation)
     - Emergency card auto-appears at top of dashboard
     - Map auto-opens showing patient location
   - Ambulance assignment flow: See suggested ambulances → select → assign → track

Make sure ALL Socket.io connections are properly established and cleaned up. Use reconnection logic with exponential backoff. The emergency system must feel instant and reliable.
```

---

## Phase 9 — Real-time Features & Notifications

### Prompt 9:

```
Wire up all real-time features and the notification system across HealthSync:

Backend:

1. /server/src/socket/index.ts — Central Socket.io setup:
   - Authentication middleware for Socket.io (verify JWT on connection)
   - Namespaces:
     - /notifications — per-user notification channel
     - /slots — real-time slot availability
     - /queue — hospital queue updates
     - /emergency — emergency tracking (already built in Phase 8)
     - /doctor-status — doctor availability broadcast
   
   - Connection handling:
     - On connect: verify token, join user-specific room (user:{userId})
     - On disconnect: cleanup
     - Heartbeat: 30-second ping/pong

2. /server/src/socket/slots.socket.ts:
   - Room: slots:{doctorId}:{date}
   - Events:
     - slot:booked — { slotId, time } → marks slot as booked for all viewers
     - slot:released — { slotId, time } → marks slot as available (on cancellation)
   - Triggered from appointment.service when booking/cancelling

3. /server/src/socket/queue.socket.ts:
   - Room: queue:{hospitalId}:{doctorId}
   - Events:
     - queue:updated — full queue data
     - patient:checked-in — new patient in queue
     - patient:status-changed — status transition
   - Triggered from receptionist actions

4. /server/src/socket/doctorStatus.socket.ts:
   - Room: doctor-status:{hospitalId}
   - Events:
     - doctor:availability-changed — { doctorId, isAvailable, currentStatus }
   - Triggered from doctor toggle and appointment status changes

5. /server/src/services/notification.service.ts (complete implementation):
   - createAndSend(userId, { type, title, body, data, channels }):
     - Save to Notifications table
     - For IN_APP: emit to Socket.io user room
     - For PUSH: queue to BullMQ push notification job
     - For SMS: queue to BullMQ SMS job
   - markAsRead(notificationId, userId)
   - getUnreadCount(userId)
   - getUserNotifications(userId, page, limit)

6. /server/src/routes/notification.routes.ts:
   - GET /api/v1/notifications — List user's notifications (paginated)
   - PUT /api/v1/notifications/:id/read — Mark as read
   - PUT /api/v1/notifications/read-all — Mark all as read
   - GET /api/v1/notifications/unread-count — Get unread count

Frontend:

7. /client/src/hooks/useSocket.ts — Socket.io connection manager:
   - Connect on login, disconnect on logout
   - Auto-reconnect with exponential backoff
   - Expose joinRoom/leaveRoom/emit/on/off methods
   - Connection status indicator

8. /client/src/components/notifications/NotificationBell.tsx:
   - Bell icon in top bar with unread count badge
   - Click → dropdown panel with notification list
   - Each notification: icon (by type), title, body, time ago, read/unread indicator
   - "Mark all read" action
   - Click notification → navigate to relevant page (appointment details, emergency, etc.)
   - Real-time: new notifications appear instantly with subtle animation
   - Sound for critical notifications (emergencies)

9. /client/src/components/notifications/NotificationToast.tsx:
   - In-app toast for real-time notifications
   - Slides in from top-right
   - Auto-dismiss after 5 seconds (non-critical) or stays until dismissed (critical/emergency)
   - Click toast → navigate to relevant page

10. Update all existing pages to use real-time features:
    - BookAppointmentPage: Join slots room, update slot grid on slot:booked/released events
    - QueueManagementPage: Join queue room, update queue on events
    - DoctorBoardPage: Join doctor-status room, update cards on availability changes
    - AppointmentsPage: Update appointment status in real-time
    - EmergencyStatusPage: Already wired in Phase 8

Ensure all Socket.io rooms are properly joined on page mount and left on unmount. Handle reconnection gracefully — re-join rooms after reconnect.
```

---

## Phase 10 — Settings, Polish & Final Integration

### Prompt 10:

```
Complete the final features, settings, routing, and polish for HealthSync:

1. /client/src/pages/patient/SettingsPage.tsx:
   - Language selection: Radio buttons for English, Hindi, Marathi. Change triggers full i18n reload.
   - Notification preferences: Toggles for push, SMS (emergency notifications always on, cannot be disabled)
   - Privacy: Who can see my health records (Only treating doctor / All doctors I visit)
   - About: App version, terms of service, privacy policy
   - Help & Support: FAQ accordion, contact email/phone
   - Delete Account: Warning modal → confirmation → account deactivation
   - Logout button (red)

2. /client/src/App.tsx — Complete routing setup:
   - / → redirect based on role
   - /login → LoginPage
   - /patient/* → PatientLayout → patient pages (ProtectedRoute with role=PATIENT)
     - /patient/home
     - /patient/profile/setup
     - /patient/profile/edit
     - /patient/doctors → search
     - /patient/doctors/:id → profile
     - /patient/doctors/:id/book → booking flow
     - /patient/appointments
     - /patient/appointments/:id
     - /patient/records
     - /patient/reminders
     - /patient/emergency/:id → emergency status
     - /patient/settings
   - /doctor/* → DoctorLayout → doctor pages (ProtectedRoute with role=DOCTOR)
     - /doctor/dashboard
     - /doctor/schedule
     - /doctor/appointments
     - /doctor/consultation/:appointmentId
     - /doctor/profile
   - /receptionist/* → ReceptionistLayout → receptionist pages (ProtectedRoute with role=RECEPTIONIST)
     - /receptionist/dashboard
     - /receptionist/appointments
     - /receptionist/queue
     - /receptionist/doctors
     - /receptionist/emergencies
     - /receptionist/emergencies/:id
   - /ambulance/* → AmbulanceLayout → ambulance pages (ProtectedRoute with role=AMBULANCE_OPERATOR)
     - /ambulance/dashboard
     - /ambulance/emergency/:id
   - /404 → NotFoundPage
   - /unauthorized → UnauthorizedPage

3. Create seed data script (/server/prisma/seed.ts):
   - 3 hospitals in Pune with real-ish addresses and GPS coordinates
   - 10 doctors across various specializations, affiliated with the hospitals
   - Schedules for each doctor (working hours, breaks, slot durations)
   - 5 patient accounts
   - 3 receptionist accounts (one per hospital)
   - 3 ambulance operators
   - 20 sample appointments (mix of upcoming, past, cancelled)
   - 5 consultations with prescriptions
   - Generate available slots for the next 14 days
   - Make sure all seed data is realistic and consistent

4. Polish & UX improvements across ALL pages:
   - Loading states: Skeleton screens for all data-loading pages (not just spinners)
   - Empty states: Illustrated empty states with helpful messages for: no appointments, no records, no reminders, no search results
   - Error states: Friendly error pages with retry buttons
   - Form validation: Inline validation with helpful error messages in all 3 languages
   - Animations: Page transitions (fade), card hover effects, list item enter animations (stagger)
   - Dark mode: Implement theme toggle in settings. Ensure all pages look good in dark mode.
   - 404 page: Custom illustrated 404 page
   - Favicon and meta tags: Set proper title, description, favicon for HealthSync

5. Final verification script — add to package.json:
   - "dev" → runs both client and server
   - "db:setup" → runs docker-compose up -d (Postgres + Redis), prisma migrate, prisma seed
   - "db:reset" → prisma migrate reset + seed
   - Print startup instructions in console

6. Create a README.md at the project root with:
   - Project description
   - Tech stack
   - Prerequisites (Node 18+, Docker)
   - Setup instructions (step by step)
   - Available scripts
   - Project structure overview
   - Environment variables documentation
   - Default seed accounts (phone numbers + roles) for testing
```

---

## 🎯 Bonus Prompts (Optional Enhancements)

### Bonus A: Map Integration

```
Integrate Google Maps (or Leaflet with OpenStreetMap as a free alternative) across HealthSync:

1. Doctor search results: Show doctors on a map view (toggle between list and map)
2. Doctor profile: Embedded map showing hospital/clinic locations with markers
3. Receptionist emergency dashboard: Full interactive map showing patient location + ambulance tracking
4. Ambulance interface: Full-screen map with navigation route
5. Emergency status (patient view): Map showing ambulance location moving toward them

Use Leaflet + OpenStreetMap for Phase 1 (free, no API key needed). Create a reusable MapView component that supports: markers with custom icons, route lines, live-updating marker positions, zoom controls, and user location.
```

### Bonus B: PWA & Offline Support

```
Convert HealthSync patient portal into a Progressive Web App:

1. Add manifest.json with HealthSync branding, icons, theme colors
2. Service worker for caching static assets and API responses
3. Offline page with "You're offline" message and cached appointment data
4. Install prompt (Add to Home Screen)
5. Push notification support via Web Push API
6. Background sync for appointment actions taken while offline
```

### Bonus C: Analytics Dashboard (Admin)

```
Create an Admin Analytics Dashboard for HealthSync:

- Total registrations (patients, doctors) over time (line chart)
- Appointments per day/week/month (bar chart)
- Top specializations searched (pie chart)
- Average wait time per hospital (bar chart)
- Emergency response times (line chart: trigger to ambulance arrival)
- Platform health: API response times, error rates, active WebSocket connections
- Use Chart.js or Recharts for visualizations
```

---

> [!TIP]
> **Execution tips:**
> - Run prompts **sequentially** — each phase depends on previous ones
> - After each phase, **test** the new features before moving on
> - If a prompt is too large, ask the AI to split it into sub-steps
> - Keep Docker (PostgreSQL + Redis) running throughout development
> - Use the seed data to test all features with realistic data
