# Phase 1 — Authentication Module

**Module Prefix:** `AUTH`
**Priority:** P1 — Must Have

---

## 2.1 Purpose

Provide secure, simple, and reliable user authentication for all HealthSync roles. The authentication module is the gateway to the platform and must balance security with ease of use — particularly for users with limited technical experience.

---

## 2.2 User Stories

| ID | Role | Story | Priority |
|----|------|-------|----------|
| AUTH-US-001 | Patient | As a patient, I want to log in using my mobile number and OTP so that I don't need to remember a password | P1 |
| AUTH-US-002 | Patient | As a patient, I want to select my preferred language during first launch so the app is in my language | P1 |
| AUTH-US-003 | Doctor | As a doctor, I want to log in securely so that my account and patient data are protected | P1 |
| AUTH-US-004 | All Users | As a user, I want my session to remain active so I don't have to log in every time I open the app | P1 |
| AUTH-US-005 | All Users | As a user, I want the app to auto-logout after inactivity so my account stays secure | P2 |
| AUTH-US-006 | All Users | As a user, I want to use the app on multiple devices so I can switch between phone and desktop | P2 |

---

## 2.3 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-FR-001 | System MUST support OTP-based login using mobile number | P1 |
| AUTH-FR-002 | System MUST send a 6-digit OTP to the registered mobile number via SMS | P1 |
| AUTH-FR-003 | OTP MUST expire after 5 minutes | P1 |
| AUTH-FR-004 | System MUST allow a maximum of 3 OTP verification attempts per request | P1 |
| AUTH-FR-005 | System MUST allow OTP resend after 30 seconds cooldown | P1 |
| AUTH-FR-006 | System MUST rate-limit OTP requests to 5 per mobile number per hour | P1 |
| AUTH-FR-007 | Upon successful OTP verification, system MUST issue a JWT access token and a refresh token | P1 |
| AUTH-FR-008 | Access token MUST expire after 1 hour; refresh token MUST expire after 30 days | P1 |
| AUTH-FR-009 | System MUST support token refresh without requiring re-login | P1 |
| AUTH-FR-010 | System MUST auto-logout users after 30 minutes of inactivity | P2 |
| AUTH-FR-011 | System MUST support concurrent sessions across multiple devices | P2 |
| AUTH-FR-012 | System MUST allow users to view and terminate active sessions | P2 |
| AUTH-FR-013 | System MUST present language selection (English, Hindi, Marathi) on first launch | P1 |
| AUTH-FR-014 | If the mobile number is new, system MUST redirect to the registration flow after OTP verification | P1 |
| AUTH-FR-015 | If the mobile number is existing, system MUST redirect to the role-appropriate dashboard after OTP verification | P1 |
| AUTH-FR-016 | System MUST support logout from the current device | P1 |
| AUTH-FR-017 | System MUST support "logout from all devices" functionality | P2 |

---

## 2.4 Business Rules

| ID | Rule |
|----|------|
| AUTH-BR-001 | Only Indian mobile numbers (+91) are supported in Phase 1 |
| AUTH-BR-002 | A single mobile number can be associated with only one user account |
| AUTH-BR-003 | Doctor and Receptionist accounts can only be created by Admin invitation |
| AUTH-BR-004 | Patient accounts are self-registered |
| AUTH-BR-005 | OTP delivery failure does not count as a verification attempt |
| AUTH-BR-006 | Blocked accounts (after maximum failed attempts) auto-unblock after 1 hour |

---

## 2.5 Authentication Flow

```
┌────────────┐
│ App Launch  │
└─────┬──────┘
      │
      ▼
┌─────────────────┐     Yes    ┌──────────────────┐
│ Valid Session?   │──────────▶│ Role Dashboard    │
└─────┬───────────┘            └──────────────────┘
      │ No
      ▼
┌─────────────────┐
│ Language Select  │ (First launch only)
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Enter Mobile No. │
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Send OTP         │
└─────┬───────────┘
      │
      ▼
┌─────────────────┐
│ Enter OTP        │
└─────┬───────────┘
      │
      ▼
┌─────────────────┐     No     ┌──────────────────┐
│ Valid OTP?       │──────────▶│ Retry / Resend    │
└─────┬───────────┘            └──────────────────┘
      │ Yes
      ▼
┌─────────────────┐
│ Issue JWT Tokens │
└─────┬───────────┘
      │
      ▼
┌─────────────────┐     No     ┌──────────────────┐
│ Existing User?   │──────────▶│ Registration Flow │
└─────┬───────────┘            └──────────────────┘
      │ Yes
      ▼
┌──────────────────┐
│ Role Dashboard   │
└──────────────────┘
```

---

## 2.6 Data Requirements

### OTP Record

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `mobile_number` | String | 10-digit Indian mobile number |
| `otp_code` | String | 6-digit numeric, hashed storage |
| `expires_at` | Timestamp | Created time + 5 minutes |
| `attempts` | Integer | Max 3 |
| `is_verified` | Boolean | Default: false |
| `created_at` | Timestamp | Auto-generated |

### Session Record

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users table |
| `device_info` | JSONB | Device name, OS, app version |
| `access_token` | String | JWT, hashed |
| `refresh_token` | String | JWT, hashed |
| `last_active_at` | Timestamp | Updated on each request |
| `expires_at` | Timestamp | Refresh token expiry |
| `is_active` | Boolean | Default: true |
| `created_at` | Timestamp | Auto-generated |

---

## 2.7 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/otp/send` | Send OTP to mobile number |
| `POST` | `/auth/otp/verify` | Verify OTP and issue tokens |
| `POST` | `/auth/token/refresh` | Refresh access token |
| `POST` | `/auth/logout` | Logout current device |
| `POST` | `/auth/logout-all` | Logout all devices |
| `GET` | `/auth/sessions` | List active sessions |
| `DELETE` | `/auth/sessions/:id` | Terminate a specific session |

---

## 2.8 Error Handling

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| `AUTH_001` | Invalid mobile number format | "Please enter a valid 10-digit mobile number" |
| `AUTH_002` | OTP expired | "OTP has expired. Please request a new one" |
| `AUTH_003` | Invalid OTP | "Incorrect OTP. X attempts remaining" |
| `AUTH_004` | Max OTP attempts exceeded | "Too many attempts. Please request a new OTP" |
| `AUTH_005` | OTP rate limit exceeded | "Too many OTP requests. Please try after some time" |
| `AUTH_006` | Invalid/expired access token | Silently refresh using refresh token |
| `AUTH_007` | Invalid/expired refresh token | Redirect to login screen |
| `AUTH_008` | Account blocked | "Your account is temporarily blocked. Please try after 1 hour" |

---

## 2.9 Acceptance Criteria

| ID | Criteria |
|----|----------|
| AUTH-AC-001 | User can successfully log in with valid mobile number and OTP |
| AUTH-AC-002 | OTP expires after 5 minutes and shows appropriate error |
| AUTH-AC-003 | User is blocked after 3 failed OTP attempts |
| AUTH-AC-004 | OTP resend is available after 30-second cooldown |
| AUTH-AC-005 | Session persists across app restarts within token validity |
| AUTH-AC-006 | Auto-logout triggers after 30 minutes of inactivity |
| AUTH-AC-007 | Language selection is presented on first launch and persists |
| AUTH-AC-008 | New users are redirected to registration after OTP verification |
| AUTH-AC-009 | Existing users are redirected to role-appropriate dashboard |
| AUTH-AC-010 | "Logout from all devices" terminates all active sessions |
