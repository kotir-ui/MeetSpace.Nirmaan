# Meetspace.Nirmaan — Office Meeting Room Management Portal

**Portal:** `meetspace.nirmaan.org`

An enterprise-grade full-stack **Office Meeting Room Management System** for Nirmaan Organization. The portal is designed to manage meeting rooms, room availability, bookings, meeting schedules, approvals, departments, notifications, and room utilization from one centralized platform.

The system should be built with **React (Vite) + MUI** on the frontend and **Node.js + Express + Sequelize + MySQL** on the backend, secured with **JWT authentication** and **role-based access control**.

---

## ✨ Core Features

### 🔐 Authentication & Roles

Implement secure JWT-based authentication with role-based permissions:

* Super Admin
* Admin
* Department Head / Manager
* Employee / User
* Viewer

Users should only see and perform actions allowed for their role.

---

## 🏢 Meeting Room Management

Create a complete **Meeting Room Master**.

Each room should support:

* Room Name
* Room Code
* Building
* Floor
* Location
* Seating Capacity
* Room Type
* Available Facilities

  * Projector
  * TV / Display
  * Video Conferencing
  * Whiteboard
  * AC
  * Wi-Fi
  * Speaker / Microphone
* Room Status

  * Available
  * Under Maintenance
  * Inactive
* Room Image
* Description

Admin should be able to:

* Add room
* Edit room
* View room
* Activate / deactivate room
* Mark room under maintenance
* Delete room where permitted

---

## 📅 Meeting Room Booking

The main purpose of the portal is to book meeting rooms.

Booking flow:

**Select Date → Select Time → Select Duration → Select Capacity → Select Building/Floor → Show Available Rooms → Select Room → Enter Meeting Details → Submit Booking**

Meeting details:

* Meeting Title
* Meeting Date
* Start Time
* End Time / Duration
* Meeting Room
* Organizer / User Name
* Department
* Manager / Department Head
* Number of Participants
* Participant Names
* Meeting Purpose
* Required Facilities
* Additional Notes

The system must automatically check room availability and prevent double booking.

---

## 🔎 Available Room Search

After selecting:

* Date
* Start Time
* End Time
* Number of Participants
* Building / Floor
* Required facilities

show only rooms that match the selected criteria.

Each room card should clearly show:

* Room name
* Capacity
* Floor
* Facilities
* Current availability
* Selected time slot
* Book Room button

If no room is available, display:

**“No meeting rooms are available for the selected time and requirements.”**

---

## 📊 Dashboard

Create a professional office-management dashboard showing:

### KPI Cards

* Total Meeting Rooms
* Available Rooms
* Occupied Rooms
* Today's Meetings
* Upcoming Meetings
* Pending Approvals
* Approved Meetings
* Cancelled Meetings
* Room Utilization %
* Most Used Room

### Dashboard Charts

Include:

* Daily Meeting Trend
* Weekly Meeting Trend
* Monthly Meeting Trend
* Room Utilization
* Department-wise Meetings
* Room-wise Booking Count
* Peak Meeting Hours
* Meeting Status Distribution

Use interactive charts with ApexCharts.

---

## 📆 Calendar

Create a dedicated **Meeting Calendar**.

Users should be able to view:

* Day
* Week
* Month

Calendar events should display:

**Meeting Title | Room | Start Time – End Time | Organizer | Department | Status**

Use different visual indicators for:

* Approved
* Pending
* Cancelled
* Completed

Clicking an event should open the complete meeting details.

---

## 🔔 Approval Workflow

Implement an approval workflow where required.

### Booking Flow

**Employee → Department Head / Manager → HR / Admin → Approved**

Depending on organizational configuration, some meetings may require only Department Head approval or Admin approval.

Booking statuses:

* Draft
* Pending Department Approval
* Pending HR/Admin Approval
* Approved
* Rejected
* Cancelled
* Completed

Approvers should receive notifications when an approval is required.

---

## 🔔 Notifications

Create a centralized notification system.

Notifications should be generated for:

* New booking request
* Department Head approval required
* HR/Admin approval required
* Booking approved
* Booking rejected
* Booking cancelled
* Meeting reminder
* Room unavailable
* Room maintenance
* Booking modification

Header should contain a notification bell with unread count.

---

## 🏢 Department Management

Create a Department Master.

Fields:

* Department Name
* Department Code
* Department Head
* Status

Departments should be associated with users and meeting bookings.

---

## 👥 User Management

Admin should be able to manage:

* Employee Name
* Employee ID
* Email
* Department
* Designation
* Manager / Department Head
* Role
* Status

Support:

* Add user
* Edit user
* Activate / deactivate
* Role assignment
* Department assignment

---

## 📋 My Bookings

Each employee should have a **My Bookings** page.

Display:

* Meeting Title
* Date
* Time
* Room
* Department
* Status
* Approval Status
* Organizer

Actions:

* View
* Edit where permitted
* Cancel
* Reschedule where permitted

---

## 📝 Approval Management

Department Heads and authorized Admin/HR users should have an **Approval Requests** page.

Filters:

* Pending
* Approved
* Rejected
* Date
* Department
* Room
* Organizer

Actions:

* View Details
* Approve
* Reject
* Add Comment

All approval actions must be recorded in the audit log.

---

## 📈 Reports

Provide reports for:

* Daily Meeting Report
* Weekly Meeting Report
* Monthly Meeting Report
* Quarterly Meeting Report
* Yearly Meeting Report
* Room Utilization Report
* Department-wise Booking Report
* Employee-wise Booking Report
* Peak Hour Report
* Cancelled Meeting Report

Reports should support:

* Search
* Sorting
* Filtering
* Pagination
* Date range
* Department
* Room
* Status

Export:

* Excel
* CSV
* PDF

---

## 🗓️ Fiscal Year

Where financial-year reporting is required, use the Nirmaan fiscal year:

* Q1: April – June
* Q2: July – September
* Q3: October – December
* Q4: January – March

---

## 🧾 Activity Logs / Audit Trail

Maintain a complete audit trail for:

* Login
* Logout
* Room creation
* Room update
* Room deletion
* Booking creation
* Booking modification
* Booking cancellation
* Approval
* Rejection
* User changes
* Department changes

Record:

* User
* Action
* Module
* Record ID
* Date & Time
* IP / relevant system information where appropriate

---

## 🎨 UI / UX

Use a professional **Nirmaan enterprise design**.

Primary style:

* Clean corporate interface
* Nirmaan branding
* Responsive MUI layout
* Desktop-first but fully responsive
* Light / Dark mode
* Modern sidebar
* Header with user profile and notifications

### Sidebar

Use a single **Meeting Room / Meetspace** section instead of creating multiple unrelated room-booking menu items.

Suggested navigation:

* 🏠 Dashboard
* 📅 Meeting Calendar
* ➕ Book Meeting Room
* 📋 My Bookings
* 🔔 Approval Requests
* 🏢 Meeting Rooms
* 👥 Departments
* 👤 Users
* 📊 Reports
* 🧾 Activity Logs
* ⚙️ Settings

Menu visibility must depend on the user's role.

---

## 🧱 Technology Stack

| Layer          | Technology                                  |
| -------------- | ------------------------------------------- |
| Frontend       | React 18, Vite, Material UI, MUI X DataGrid |
| Charts         | ApexCharts                                  |
| Backend        | Node.js, Express                            |
| ORM            | Sequelize                                   |
| Database       | MySQL                                       |
| Authentication | JWT + bcrypt                                |
| Export         | ExcelJS, PDFKit                             |
| API            | REST API                                    |

---

## 📁 Recommended Project Structure

```text
Meetspace.Nirmaan/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── seeders/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── context/
    │   ├── layouts/
    │   ├── pages/
    │   │   ├── Dashboard/
    │   │   ├── Calendar/
    │   │   ├── BookRoom/
    │   │   ├── MyBookings/
    │   │   ├── Approvals/
    │   │   ├── Rooms/
    │   │   ├── Departments/
    │   │   ├── Users/
    │   │   ├── Reports/
    │   │   └── ActivityLogs/
    │   ├── theme.js
    │   └── App.jsx
    └── package.json
```

---

## 🗄️ Database Structure

Use a normalized relational database.

Core tables:

```text
roles
users
departments
meeting_rooms
room_facilities
bookings
booking_participants
booking_approvals
notifications
activity_logs
room_maintenance
```

Important relationships:

```text
Department
    ↓
Users
    ↓
Bookings
    ↓
Meeting Room
    ↓
Booking Approvals
    ↓
Notifications
```

Do not create unnecessary duplicate tables or duplicate modules.

The booking system must use the **same source of truth** for room availability, bookings, approvals, and reports.

---

## 🔌 REST API

Suggested APIs:

```text
POST   /api/auth/login
GET    /api/auth/me

GET    /api/dashboard/summary
GET    /api/dashboard/room-utilization
GET    /api/dashboard/meeting-trend

GET    /api/rooms
POST   /api/rooms
PUT    /api/rooms/:id
DELETE /api/rooms/:id
GET    /api/rooms/available

GET    /api/bookings
POST   /api/bookings
GET    /api/bookings/:id
PUT    /api/bookings/:id
DELETE /api/bookings/:id
POST   /api/bookings/:id/cancel

GET    /api/approvals
POST   /api/approvals/:id/approve
POST   /api/approvals/:id/reject

GET    /api/calendar

GET    /api/departments
POST   /api/departments
PUT    /api/departments/:id
DELETE /api/departments/:id

GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/notifications
PUT    /api/notifications/:id/read

GET    /api/reports/daily
GET    /api/reports/monthly
GET    /api/reports/quarterly
GET    /api/reports/yearly

GET    /api/activity-logs
```

---

## ⚠️ Important Business Rules

1. **Never allow double booking of the same room for overlapping times.**
2. Room capacity must be equal to or greater than the number of participants.
3. Rooms under maintenance must not appear in available-room search.
4. Cancelled bookings must release the room slot.
5. Approval status must be clearly separated from booking status.
6. Users can only modify/cancel bookings according to their permissions and organizational rules.
7. Every approval/rejection/change must create an activity-log entry.
8. Dashboard and reports must calculate data from the actual booking records.
9. Do not use demo analytics/website data.
10. Do not include Website Analytics, Website Master, SEO Analytics, Visitors, Page Views, Sessions, Bounce Rate, or other website-analytics functionality.
11. This project is **exclusively for Nirmaan Office Meeting Room Management**.
12. Keep the architecture modular so the **Meeting Room module can be separated and moved to another Nirmaan portal in the future without breaking the main application.**

---

## 🎯 Project Identity

**Product Name:** Meetspace.Nirmaan
**Purpose:** Nirmaan Office Meeting Room Management
**Domain:** `meetspace.nirmaan.org`

The system should feel like an internal enterprise application for Nirmaan employees and should focus entirely on **meeting rooms, bookings, availability, approvals, notifications, calendars, and room utilization**.
