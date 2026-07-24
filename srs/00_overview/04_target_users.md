# 4. Target Users

HealthSync serves five distinct user roles, each with specific needs, pain points, and feature requirements.

---

## 4.1 Patients

### Description

Individuals seeking healthcare services — from finding a suitable doctor to booking appointments, receiving consultations, and managing their medical records.

### Demographics

- **Age Range:** 18–75+ years
- **Technical Proficiency:** Ranges from minimal (elderly users) to advanced (younger users)
- **Location:** Urban and semi-urban areas in India (Phase 1)
- **Language:** English, Hindi, or Marathi speakers
- **Devices:** Android smartphones (primary), iPhones, desktop web browsers

### Key Needs

| Need | Description |
|------|-------------|
| Find the right doctor | Search by specialization, location, availability, fees, language, and experience |
| Book appointments easily | Minimal steps to book, reschedule, or cancel |
| Know waiting time | Real-time queue position and estimated wait |
| Access medical records | Prescriptions, reports, and consultation history in one place |
| Control data sharing | Choose who can access health records |
| Receive timely updates | Notifications for confirmations, reminders, queue changes |
| Offline access | View downloaded records without internet |

### User Personas

#### Persona 1: Rajesh (62, Retired)
- Limited smartphone experience
- Needs large text, simple navigation, Hindi interface
- Visits a doctor monthly for diabetes management
- Wants to see his prescription history and appointment schedule

#### Persona 2: Priya (28, Working Professional)
- Tech-savvy, values speed and convenience
- Wants to book appointments during lunch breaks
- Prefers English, uses both phone and desktop
- Wants all reports digitally accessible

#### Persona 3: Sunita (45, Mother of Two)
- Manages healthcare for herself and her children
- Needs family profile support (Phase 2)
- Speaks Marathi, uses Android
- Values doctor reviews and clinic proximity

---

## 4.2 Doctors

### Description

Licensed medical practitioners — including general physicians and specialists — who consult patients at clinics or hospitals.

### Demographics

- **Age Range:** 28–65 years
- **Technical Proficiency:** Moderate to advanced
- **Practice Type:** Individual private practice, multi-doctor clinic, hospital (future)
- **Devices:** Smartphones, tablets, desktop computers

### Key Needs

| Need | Description |
|------|-------------|
| Manage schedule | Set availability, view appointments, handle cancellations |
| Reduce double-booking | Automated slot management prevents conflicts |
| Access patient history | View relevant medical history (with patient consent) |
| Create prescriptions | Digital prescription creation during consultation |
| Upload reports | Attach lab results, imaging, and consultation notes |
| Track daily workload | See today's appointments, queue progress, completed consultations |

### User Personas

#### Persona: Dr. Amit (42, Orthopedic Surgeon)
- Runs a private clinic with one receptionist
- Sees 30–40 patients daily
- Struggles with overbooking and long patient queues
- Wants a simple system that doesn't add to his workload

---

## 4.3 Receptionists

### Description

Clinic staff who manage the front desk — handling appointment scheduling, patient check-ins, queue management, and coordination between patients and doctors.

### Demographics

- **Age Range:** 22–50 years
- **Technical Proficiency:** Basic to moderate
- **Devices:** Desktop computers, tablets

### Key Needs

| Need | Description |
|------|-------------|
| View daily appointments | See all scheduled, walk-in, and confirmed appointments |
| Manage walk-ins | Register and queue walk-in patients |
| Handle check-ins | Mark patients as arrived and start queue flow |
| Generate tokens | Assign digital tokens for queue positioning |
| Track doctor availability | Know which doctors are available, on break, or offline |
| Handle rescheduling | Reschedule or cancel appointments on behalf of patients |
| Track no-shows | Identify and record no-show patients |

### User Personas

#### Persona: Meena (35, Clinic Receptionist)
- Manages front desk for a 3-doctor multi-speciality clinic
- Handles 60–80 appointments daily plus 10–15 walk-ins
- Currently uses paper registers and phone calls
- Needs a single dashboard to manage everything

---

## 4.4 Clinics

### Description

Healthcare facilities — from single-doctor private practices to multi-speciality clinics. Hospitals are planned for future phases.

### Types (Phase 1)

| Type | Description |
|------|-------------|
| Private Clinic | Single doctor, one receptionist, limited specializations |
| Multi-Speciality Clinic | Multiple doctors across specializations, multiple receptionists |

### Types (Future Phases)

| Type | Phase |
|------|-------|
| Hospital | Phase 3 |
| Hospital Chain | Phase 4 |

### Key Needs

| Need | Description |
|------|-------------|
| Digital appointment management | Replace phone/in-person booking with online scheduling |
| Operational visibility | Real-time overview of clinic activity |
| Patient flow optimization | Reduce bottlenecks and waiting times |
| Record digitization | Move from paper to digital records |
| Staff management | Assign receptionists to doctors/shifts |

---

## 4.5 Administrators

### Description

HealthSync platform administrators who manage the overall system — including doctor and clinic verification, user management, analytics, and system monitoring.

### Responsibilities

| Responsibility | Description |
|----------------|-------------|
| Doctor Verification | Verify doctor credentials and activate accounts |
| Clinic Verification | Verify clinic legitimacy and activate profiles |
| User Management | Manage user accounts, roles, and permissions |
| Reception Management | Assign receptionists to clinics and manage access |
| Analytics & Reporting | Monitor platform usage, growth, and performance metrics |
| Audit Logs | Review system activity and data access logs |
| System Monitoring | Track platform health, uptime, and error rates |
| Content Moderation | Review reported content and manage platform integrity |

---

## 4.6 User Role Access Matrix

| Feature | Patient | Doctor | Receptionist | Admin |
|---------|---------|--------|--------------|-------|
| Registration / Login | ✅ | ✅ | ✅ | ✅ |
| Profile Management | ✅ | ✅ | ✅ | ✅ |
| Doctor Search | ✅ | ❌ | ❌ | ❌ |
| Appointment Booking | ✅ | ❌ | ✅ | ❌ |
| Queue Tracking | ✅ | ✅ | ✅ | ❌ |
| Prescription Viewing | ✅ | ✅ | ❌ | ❌ |
| Prescription Creation | ❌ | ✅ | ❌ | ❌ |
| Medical Record Access | ✅ (own) | ✅ (with consent) | ❌ | ❌ |
| Report Upload | ❌ | ✅ | ❌ | ❌ |
| Walk-in Registration | ❌ | ❌ | ✅ | ❌ |
| Token Management | ❌ | ❌ | ✅ | ❌ |
| Clinic Dashboard | ❌ | ✅ | ✅ | ✅ |
| Doctor Verification | ❌ | ❌ | ❌ | ✅ |
| Analytics | ❌ | ❌ | ❌ | ✅ |
| System Monitoring | ❌ | ❌ | ❌ | ✅ |
