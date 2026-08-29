# Module Setup

1. Install Node.js 18 or newer.
2. From `attendance-module`, run `npm install` and `npm run install:all`.
3. Copy `config/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.
4. Run `npm run dev`.
5. Open the frontend URL configured by `VITE_PORT`.

For PostgreSQL, provision a database using the externally supplied `DATABASE_URL`, then run `database/schema.sql` followed by `database/seed.sql`. Persistence can be added inside the Attendance service without changing the API routes or frontend.

Authentication is deliberately replaceable. The default `attendanceAuth`
middleware accepts an optional `x-attendance-user` header for local integration
testing. Replace `backend/src/middleware/auth.js` with an adapter for the host
portal's session, JWT, or gateway identity; do not put portal-specific auth in
the frontend.
