# MeetSpace.Nirmaan

A meeting room booking and management portal for Nirmaan.

## Project

- Frontend: React + Vite + Material UI
- Backend: Node.js + Express + Sequelize
- Database: MySQL (XAMPP)
- Main feature: meeting room booking, availability, approvals, notifications, and admin management

## Folder structure

```text
MeetSpace.Nirmaan/
+-- backend/
�   +-- src/
�   +-- .env
�   +-- package.json
+-- frontend/
�   +-- src/
�   +-- index.html
�   +-- package.json
+-- database/
�   +-- schema.sql
+-- Images/
+-- README.md
+-- .gitignore
```

## Requirements

- Node.js
- MySQL running via XAMPP
- XAMPP MySQL port: 3307

## Run the app

### 1) Start MySQL

```powershell
cmd /c C:\xampp\mysql_start.bat
```

### 2) Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3) Start backend

```bash
cd backend
npm run dev
```

Backend runs at:

- http://localhost:5000

### 4) Start frontend

```bash
cd frontend
npm run dev
```

Frontend runs at:

- http://localhost:8300

## Environment

Backend configuration is in `backend/.env`.

```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=meetspace.nirmaan
DB_USER=root
DB_PASSWORD=
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:8300
```

## Notes

- This project is focused on meeting-room booking, not analytics or website reporting.
- The app is already structured around a meeting module under the backend and frontend source folders.
- The README is intentionally short and keeps only the setup and project essentials.
