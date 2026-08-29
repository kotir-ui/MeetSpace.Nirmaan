# API Documentation

Base URL: the Attendance API origin configured by the integrator (for example,
the value of `VITE_ATTENDANCE_API_URL`). No portal URL is assumed.

All endpoints are prefixed by `API_PREFIX` (default `/api`). The frontend only
uses these Attendance endpoints and does not access the database directly.

## `GET /api/health`
Returns `{ "ok": true }` when the API is running.

## `GET /api/attendance?date=YYYY-MM-DD`
Returns attendance records. The `date` query parameter is optional.

## `POST /api/attendance/check-in`
Creates a record. Body:

```json
{ "employee": "Aarav Sharma", "date": "2026-08-28", "checkIn": "09:00" }
```

## Authentication adapter

The starter backend uses a no-op, replaceable middleware so it can run without
a portal. Integrators should replace `backend/src/middleware/auth.js` with
their authentication adapter. The route contract remains unchanged; the
adapter may attach identity to `req.attendanceUser` for authorization and
tenant scoping.

## Errors

Validation errors return HTTP `400` with `{ "ok": false, "error": "..." }`.
