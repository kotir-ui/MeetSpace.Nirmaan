# Nirmaan Website Analytics Dashboard

**Portal:** analytics.nirmaan.org

An enterprise-grade full-stack MIS dashboard to monitor, compare and analyze the
performance of all Nirmaan websites in one place. Built with **React (Vite) + MUI + ApexCharts**
on the frontend and **Node.js + Express + Sequelize + MySQL** on the backend, secured with
**JWT** and **role-based access control**.

![Theme](https://img.shields.io/badge/primary-%230A2947-0A2947) ![Accent](https://img.shields.io/badge/accent-%232563EB-2563EB)

---

## ✨ Features

- 🔐 JWT authentication with **Super Admin / Admin / Manager / Viewer** roles
- 🌐 Website master with **Department** grouping (full CRUD)
- 📊 16 animated KPI cards (visitors, page views, sessions, bounce rate, growth %, best/lowest site…)
- 📈 Interactive charts — area, bar, horizontal bar, stacked bar, line, pie/donut, **heat map**, ranking
- 📅 Reports: **Daily · Half-Month (1–15 / 16–End) · Monthly · Quarterly · Yearly**
- 🗓️ **Fiscal-year quarters** (Q1 Apr–Jun, Q2 Jul–Sep, Q3 Oct–Dec, Q4 Jan–Mar)
- 📤 Export any report to **Excel · CSV · PDF**
- 🔎 Search, sorting, pagination & filters (category, department, status, date range) on all tables
- 🌗 Dark / Light mode
- 📱 Fully responsive sidebar layout
- 🧾 Activity logs / audit trail + **Recent Activity** feed
- 👥 User management

---

## 🧱 Tech Stack

| Layer     | Technology                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | React 18, Vite, Material UI, MUI X DataGrid, ApexCharts |
| Backend   | Node.js, Express, Sequelize ORM                         |
| Database  | MySQL (XAMPP)                                           |
| Auth      | JWT + bcrypt                                            |
| Exports   | ExcelJS, PDFKit                                         |

---

## 📁 Project Structure

```
Website dashboard/
├── backend/
│   ├── src/
│   │   ├── config/         # Sequelize DB connection
│   │   ├── models/         # users, roles, websites, analytics, reports…
│   │   ├── controllers/    # auth, users, websites, analytics, reports, dashboard, export
│   │   ├── routes/         # REST API routes
│   │   ├── middleware/     # JWT auth + RBAC, error handling
│   │   ├── services/       # analytics aggregation engine
│   │   ├── utils/          # metrics helpers, activity logger
│   │   ├── seeders/        # demo data generator
│   │   ├── app.js          # Express app
│   │   └── server.js       # entry point
│   ├── .env                # environment config
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/            # axios client + file downloader
    │   ├── components/     # KpiCard, ChartCard, ExportButtons, ReportTable…
    │   ├── context/        # Auth, ColorMode, Filter providers
    │   ├── layouts/        # DashboardLayout, Sidebar, Header
    │   ├── pages/          # Dashboard, Websites, Analytics, Users, reports/*
    │   ├── theme.js
    │   └── App.jsx
    └── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js](https://nodejs.org/) 18+
- **XAMPP** with **MySQL running** (start it from the XAMPP Control Panel)

### 2. Backend

```powershell
cd backend
npm install
# Adjust backend/.env if your MySQL user/password differ from XAMPP defaults (root / empty)
npm run seed      # creates the database, tables and 2 years of demo analytics
npm run dev       # starts API on http://localhost:5000
```

> `npm run seed` automatically **creates the `analytics_dashboard` database** if it does
> not exist, so you do not need to create it manually in phpMyAdmin.

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev       # starts app on http://localhost:5173
```

Open **http://localhost:5173** and log in.

---

## 🔑 Demo Accounts

| Role        | Email                     | Password      |
| ----------- | ------------------------- | ------------- |
| Super Admin | superadmin@nirmaan.org    | `Super@123`   |
| Admin       | admin@nirmaan.org         | `Admin@123`   |
| Manager     | manager@nirmaan.org       | `Manager@123` |
| Viewer      | viewer@nirmaan.org        | `Viewer@123`  |

---

## 🔌 REST API Overview

Base URL: `http://localhost:5000/api`

| Method | Endpoint                        | Description                    | Access          |
| ------ | ------------------------------- | ------------------------------ | --------------- |
| POST   | `/auth/login`                   | Login, returns JWT             | Public          |
| GET    | `/auth/me`                      | Current user                   | Authenticated   |
| GET    | `/dashboard/summary`            | KPI summary                    | Authenticated   |
| GET    | `/dashboard/performance`        | Website performance table      | Authenticated   |
| GET    | `/dashboard/monthly-trend`      | Per-website monthly trend      | Authenticated   |
| GET    | `/websites`                     | List (search/filter/paginate)  | Authenticated   |
| POST   | `/websites`                     | Create website                 | Admin / Manager |
| PUT    | `/websites/:id`                 | Update website                 | Admin / Manager |
| DELETE | `/websites/:id`                 | Delete website                 | Admin           |
| GET    | `/analytics`                    | Daily analytics records        | Authenticated   |
| POST   | `/analytics`                    | Upsert daily record            | Admin / Manager |
| GET    | `/reports/daily`                | Daily report                   | Authenticated   |
| GET    | `/reports/half-month`           | Half-month report              | Authenticated   |
| GET    | `/reports/monthly`              | Monthly comparison             | Authenticated   |
| GET    | `/reports/quarterly`            | Quarterly report               | Authenticated   |
| GET    | `/reports/yearly`               | Yearly report                  | Authenticated   |
| GET    | `/export/excel/:type`           | Export report to Excel         | Authenticated   |
| GET    | `/export/csv/:type`             | Export report to CSV           | Authenticated   |
| GET    | `/export/pdf/:type`             | Export report to PDF           | Authenticated   |
| GET    | `/users`                        | List users                     | Admin / Manager |
| GET    | `/activity-logs`                | Audit trail                    | Admin / Manager |

`:type` for exports = `performance | monthly | halfmonth | quarterly | yearly | daily`

---

## 🗄️ Database Tables

`roles`, `users`, `websites`, `website_daily_analytics`, `website_monthly_reports`,
`website_quarterly_reports`, `website_yearly_reports`, `dashboard_summary`, `activity_logs`

Monthly / quarterly / yearly figures are computed on-the-fly from
`website_daily_analytics` by the aggregation engine in
`backend/src/services/analyticsService.js`, guaranteeing the reports always reflect
the latest data.

---

## 🛠️ Configuration

Edit `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=analytics_dashboard
DB_USER=root
DB_PASSWORD=
JWT_SECRET=change_this_to_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

The frontend proxies `/api` to `http://localhost:5000` (see `frontend/vite.config.js`).

---

## 📝 Notes

- Re-running `npm run seed` **drops and recreates** all tables with fresh demo data.
- Growth percentages compare the selected period against the immediately preceding one.
- Use the **Month/Year** selectors in the header to change the reporting period globally.
- **Quarterly & Yearly reports use the fiscal year (April–March).** The header **Year**
  selector is treated as the fiscal year for those reports (e.g. 2025 = Apr 2025 – Mar 2026).
- Every report can be exported as **Excel (.xlsx)**, **CSV (.csv)** or **PDF (.pdf)** via the
  `/export/{excel|csv|pdf}/:type` endpoints.
