# Attendance Module

A standalone attendance module with a React/Vite frontend and Express backend.
The module is intentionally loosely coupled: the frontend talks only to the
documented Attendance API, while the backend owns its routes, services, and
database schema. It does not import the current portal or its authentication.

## Quick start

```bash
npm install
npm run install:all
copy config\\.env.example backend\\.env
copy frontend\\.env.example frontend\\.env
npm run dev
```

The frontend and API origins are configured through environment variables. The
development defaults use the Vite proxy and the backend port from
`ATTENDANCE_API_PORT`; production should set `VITE_ATTENDANCE_API_URL` to the
deployed Attendance API origin and `FRONTEND_ORIGIN` to the deployed frontend
origin.

The starter API uses in-memory records so the module can run immediately.
PostgreSQL schema and seed files are provided separately for the persistence
layer. The database name, connection, and auth integration are not hardcoded.

See [docs/MODULE_SETUP.md](docs/MODULE_SETUP.md), [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md), and [database/README.md](database/README.md).
