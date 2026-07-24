# API Design Standards

**Document:** 10_api_design_standards.md
**Status:** Draft
**Version:** 1.0

---

## 1. Architectural Style & Base URLs

HealthSync APIs follow RESTful principles, communicating strictly over HTTPS using JSON payloads.

- **Base URL Format:** `https://api.healthsync.in/v1`
- **Content-Type:** `application/json`

---

## 2. Standard Request & Response Structure

### Success Response Format
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {},
  "meta": {
    "timestamp": "2026-07-21T12:00:00Z",
    "requestId": "req-987654"
  }
}
```

### Error Response Format
```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "APT_002",
  "message": "Selected slot is no longer available",
  "errors": [],
  "meta": {
    "timestamp": "2026-07-21T12:00:00Z",
    "requestId": "req-987654"
  }
}
```

---

## 3. Standard HTTP Status Codes

- `200 OK`: Request succeeded (Read/Update).
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: Missing or invalid JWT access token.
- `403 Forbidden`: Authenticated user lacks RBAC permission or patient consent.
- `404 Not Found`: Requested resource does not exist.
- `409 Conflict`: Concurrency conflict (e.g., slot double-booking).
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unhandled server exception.

---

## 4. Pagination & Query Conventions

All list endpoints MUST support standard pagination query parameters:
- `page`: Page number (1-indexed, default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Paginated Response Meta:**
```json
"meta": {
  "page": 1,
  "limit": 20,
  "totalItems": 85,
  "totalPages": 5
}
```
