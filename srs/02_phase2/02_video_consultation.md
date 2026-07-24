# Phase 2 — Video Consultation Module

**Module Prefix:** `VID`
**Priority:** P1 — Must Have (Phase 2)
**Status:** Draft

---

## 2.1 Purpose

The Video Consultation module enables secure, high-definition tele-consultations between patients and doctors over encrypted WebRTC / Agora video channels, integrated seamlessly with the Appointment Engine and Digital Health Records.

---

## 2.2 User Stories

| ID | Role | Story | Priority |
|----|------|-------|----------|
| VID-US-001 | Patient | As a patient, I want to join a video call with my doctor at the scheduled time | P1 |
| VID-US-002 | Doctor | As a doctor, I want to launch the video room from my dashboard and view the patient's records simultaneously | P1 |
| VID-US-003 | Both | As a user, I want the call to downgrade to audio-only if network quality drops | P1 |

---

## 2.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| VID-FR-001 | System MUST generate a secure, temporary WebRTC token for video sessions 10 minutes prior to slot start time | P1 |
| VID-FR-002 | Video stream MUST be encrypted end-to-end (DTLS-SRTP) | P1 |
| VID-FR-003 | In-call controls MUST support: Mute/Unmute audio, Toggle video, Switch camera, Screen share (Doctor only) | P1 |
| VID-FR-004 | System MUST provide a digital virtual waiting room for patients prior to doctor joining | P1 |
| VID-FR-005 | Doctor MUST be able to write prescriptions in side-by-side split screen view during active video calls | P1 |
| VID-FR-006 | Network monitor MUST auto-switch video to audio-only mode when bandwidth drops below 150 Kbps | P1 |

---

## 2.4 Data Model & API Endpoints

### Video Session Model (`video_sessions`)
- `id` (UUID, PK)
- `appointment_id` (UUID, FK to appointments)
- `room_name` (String, Unique)
- `session_token` (Text, Encrypted)
- `started_at` (Timestamp)
- `ended_at` (Timestamp)
- `quality_metrics` (JSONB)

### API Endpoints
- `POST /video/room/join`: Validate appointment & return room session token.
- `POST /video/room/end`: Terminate video session & mark consultation complete.
