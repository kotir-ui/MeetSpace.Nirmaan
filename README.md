# MeetSpace.Nirmaan

A comprehensive meeting room booking and management portal for Nirmaan organizations with multi-stage approval workflows, role-based access control, and real-time notifications.

## 🎯 Project Overview

- **Frontend**: React 18 + Vite + Material UI v5 with dark/light mode support
- **Backend**: Node.js + Express.js + Sequelize ORM
- **Database**: MySQL (XAMPP recommended)
- **Authentication**: JWT-based with role-based access control (RBAC)
- **Core Features**:
  - Meeting room booking with real-time availability checking
  - Multi-stage approval workflow (Department Head → HR)
  - Permission-based access control (57 permissions across 5 roles)
  - Activity logging and audit trails
  - Real-time notifications system
  - Dark/Light theme support
  - Responsive mobile-friendly UI

## 📁 Folder Structure

```
MeetSpace.Nirmaan/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app configuration
│   │   ├── server.js              # Server entry point
│   │   ├── config/
│   │   │   └── database.js        # Sequelize configuration
│   │   ├── controllers/           # Business logic controllers
│   │   ├── models/                # Sequelize models (25+ tables)
│   │   ├── middleware/            # Auth, error handling
│   │   ├── routes/                # API route definitions
│   │   ├── modules/
│   │   │   └── meeting/           # Meeting booking module
│   │   ├── services/              # Business services
│   │   └── utils/                 # Utilities (activity logging)
│   ├── .env                       # Environment variables
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # Entry point
│   │   ├── api/
│   │   │   └── client.js          # Axios HTTP client
│   │   ├── components/            # Reusable components
│   │   ├── context/               # Auth and Theme context
│   │   ├── layouts/               # Dashboard layout components
│   │   ├── pages/                 # Page components
│   │   ├── modules/
│   │   │   └── meeting/           # Meeting booking feature
│   │   └── theme.js               # Material UI theme config
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── database/
│   └── schema.sql                 # Database schema
├── Images/                        # Screenshot and assets
└── README.md
```

## 🛠️ Requirements

- **Node.js**: v18+
- **MySQL**: 5.7+ (recommend XAMPP for local development)
- **XAMPP MySQL Port**: Default 3307 (or 3306)
- **npm** or **yarn**

## 🚀 Quick Start

### 1️⃣ Clone and Setup

```bash
git clone https://github.com/kotir-ui/MeetSpace.Nirmaan.git
cd MeetSpace.Nirmaan
```

### 2️⃣ Start MySQL Server

**Windows (XAMPP)**:
```powershell
cmd /c C:\xampp\mysql_start.bat
```

Or open XAMPP Control Panel and click **Start** next to MySQL.

### 3️⃣ Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4️⃣ Configure Environment

Create `backend/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database (XAMPP defaults)
DB_HOST=127.0.0.1
DB_PORT=3307
DB_NAME=meetspace.nirmaan
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your_secret_key_change_this

# Client
CLIENT_URL=http://localhost:8302
```

### 5️⃣ Start Backend

```bash
cd backend
node src/server.js
```

Expected output:
```
✅ Database connection established
✅ Models synchronized
🚀 Server running on http://localhost:5000
```

### 6️⃣ Start Frontend

```bash
cd frontend
npm run dev
```

The app opens at: **http://localhost:8302**

## 🔑 Default Test Credentials

All passwords are `@123` suffix:

| Email | Password | Role | Permissions |
|-------|----------|------|-------------|
| `superadmin@nirmaan.org` | `Super@123` | Super Admin | All 57 permissions |
| `admin@nirmaan.org` | `Admin@123` | Admin | 39 permissions |
| `manager@nirmaan.org` | `Manager@123` | Department Manager | 22 permissions |
| `viewer@nirmaan.org` | `Viewer@123` | Viewer | 7 read-only permissions |
| `emp{1-5}@nirmaan.org` | `Employee@123` | Employee | 20 permissions |

## 📊 Database Schema

The application includes 25+ synchronized Sequelize models:

### Core Models
- **User**: Authentication and user management
- **Role**: Role definitions (Super Admin, Admin, Manager, Employee, Viewer)
- **Department**: Organizational departments
- **Permission**: 57 granular permissions
- **RolePermission**: Role-permission mapping
- **UserPermission**: User-specific overrides

### Meeting Module
- **MeetingRoom**: Room inventory with facilities
- **RoomFacility**: Available facilities (Projector, VC, Whiteboard, etc.)
- **MeetingBooking**: Core booking records
- **BookingParticipant**: Meeting participants
- **BookingStatusHistory**: Booking status audit trail
- **ApprovalRequest**: Approval workflow records
- **ApprovalHistory**: Approval decision audit trail

### System
- **Notification**: User notifications with read/unread status
- **ActivityLog**: Comprehensive audit trail of all operations
- **PasswordResetOtp**: Password reset flow
- **LoginAttempt**: Failed login attempt tracking
- **AppSetting**: Feature toggles and configuration

## 🔐 Authentication & Authorization

### JWT-Based Flow

1. User logs in with email/password
2. Backend validates and returns JWT token + user profile
3. Frontend stores token in localStorage
4. All API requests include `Authorization: Bearer <token>` header
5. Backend verifies token and enforces permission middleware

### 5 Role Levels

- **Super Admin** (57 permissions): Full system access, all management features
- **Admin** (39 permissions): User/department/room management, approvals
- **Manager** (22 permissions): Team bookings, approval delegation
- **Employee** (20 permissions): Personal bookings, view own approvals
- **Viewer** (7 permissions): Read-only access to rooms and schedules

### Permission-Based Access

Every API endpoint is protected with `requirePermission` middleware:

```javascript
POST /api/booking/create - Requires: CreateBooking permission
PATCH /api/booking/:id/approve - Requires: ApproveBooking permission
GET /api/rooms - Requires: ViewRooms permission
```

## 🎯 Key Features

### 📅 Booking Management
- Real-time room availability checking
- Overlap detection and conflict prevention
- Multiple time slot options (30-min increments)
- Booking status tracking (draft → submitted → confirmed/cancelled)
- Search by room, date, capacity, facilities

### ✅ Multi-Stage Approvals
- Department Head approval (if required)
- HR approval workflow
- Approval comments and audit trail
- Rejection reasons and resubmission support
- Auto-approval for eligible users

### 🔔 Notifications
- Real-time booking status updates
- Approval request alerts
- Notification dashboard with read/unread status
- Email notification templates (configurable)
- Unread count badge

### 👥 User Management
- User CRUD operations
- Role assignment
- Department association
- Account status (active/inactive)
- Password reset workflow
- Login attempt tracking

### 🏢 Room Management
- Room inventory with details (capacity, floor, building)
- Facility management (Projector, VC, Whiteboard, etc.)
- Room status tracking (available, maintenance, disabled)
- Room statistics and occupancy reports
- Maintenance scheduling

### 📊 Admin Controls
- Dashboard with key metrics
- Pending approvals management
- User and role administration
- Department management
- Settings and feature toggles
- Activity logs and audit trails

## 📡 API Endpoints (27 Total)

### Authentication (4 endpoints)
```
POST   /api/auth/login              - User login
POST   /api/auth/register           - User registration
POST   /api/auth/refresh            - Refresh JWT token
GET    /api/auth/me                 - Get current user
```

### Users (3 endpoints)
```
GET    /api/users                   - List all users
POST   /api/users                   - Create user
PATCH  /api/users/:id               - Update user
```

### Departments (3 endpoints)
```
GET    /api/departments             - List departments
POST   /api/departments             - Create department
PATCH  /api/departments/:id         - Update department
```

### Meeting Rooms (8 endpoints)
```
GET    /api/meeting/rooms           - List all rooms
POST   /api/meeting/rooms           - Create room
GET    /api/meeting/rooms/:id       - Get room details
PATCH  /api/meeting/rooms/:id       - Update room
DELETE /api/meeting/rooms/:id       - Delete room
GET    /api/meeting/rooms/stats     - Room statistics
POST   /api/meeting/rooms/availability - Check availability
```

### Bookings (7 endpoints)
```
GET    /api/booking                 - List bookings
POST   /api/booking                 - Create booking
GET    /api/booking/:id             - Get booking details
PATCH  /api/booking/:id             - Update booking
DELETE /api/booking/:id             - Cancel booking
POST   /api/booking/:id/submit      - Submit for approval
GET    /api/booking/occupancy       - Room occupancy report
```

### Approvals (5 endpoints)
```
GET    /api/booking/approvals       - List approval requests
POST   /api/booking/approvals/:id/approve   - Approve booking
POST   /api/booking/approvals/:id/reject    - Reject booking
GET    /api/booking/approvals/history      - Approval history
POST   /api/booking/approvals/comment      - Add approval comment
```

### Notifications (6 endpoints)
```
GET    /api/notifications           - Get user notifications
GET    /api/notifications/unread    - Get unread count
PATCH  /api/notifications/:id/read  - Mark as read
PATCH  /api/notifications/read-all  - Mark all as read
DELETE /api/notifications           - Delete all notifications
DELETE /api/notifications/:id       - Delete single notification
```

### Settings (1 endpoint)
```
GET    /api/settings                - Get app settings
```

## 🎨 Frontend Features

### Pages
- **Landing**: Public landing page with features overview
- **Login**: Email/password authentication with forgot password
- **Dashboard**: Key metrics, pending approvals, activity feed
- **Book Room**: Interactive calendar with real-time availability
- **My Bookings**: User's booking history with actions
- **Admin Control**: Approvals management, room/user administration
- **Users**: User management (temporarily disabled - DataGrid compatibility)

### Components
- Sidebar navigation with emoji labels
- Responsive header with notifications (🔔), dark mode toggle (🌙), user menu
- Booking calendar with time slot selector
- Approval workflow UI with comments
- Admin dashboard with tabs for rooms, bookings, approvals
- Real-time notification center

### Styling
- Material UI v5 components
- Custom theme with dark/light modes
- Responsive design (mobile → tablet → desktop)
- CSS Grid and Flexbox layouts
- Color scheme: Primary blue (#1B4EF5), Secondary accents

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 5000 (backend)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend auto-increments to next available port
```

### Database Connection Failed
- Verify MySQL is running (`netstat -ano | findstr :3307`)
- Check credentials in `backend/.env`
- Ensure database `meetspace.nirmaan` exists
- Clear credentials in `.env` if using XAMPP defaults

### Vite Cache Issues
```bash
cd frontend
rm -r -Force .vite node_modules\.vite
npm run dev
```

### Icon Rendering Errors
Icons are rendered as emojis (pragmatic workaround for @mui/icons-material conflicts)

## 📝 Development Notes

- Database uses Sequelize ORM with transaction support for booking operations
- All CRUD operations are logged in `ActivityLog` table
- Password reset flow uses OTP (one-time password)
- Booking overlap detection checks all bookings within time range
- Permissions are checked on every API endpoint via middleware
- Frontend uses JWT from localStorage for authentication
- Theme mode is persisted to localStorage

## 🔄 Activity Logging

Every operation logs to the `activity_logs` table:

```javascript
{
  user_id: 2,
  action: "CREATE",
  entity: "booking",
  details: "Created booking for MR-01 on 2024-09-10",
  ip_address: "127.0.0.1",
  created_at: "2024-09-06T07:15:00Z"
}
```

## 📱 Responsive Design

- **Mobile (<600px)**: Sidebar drawer, single column layout
- **Tablet (600-1024px)**: Collapsible sidebar, 2-column layout
- **Desktop (>1024px)**: Fixed sidebar, multi-column dashboard

## 🚢 Deployment Ready

- JWT authentication for stateless servers
- CORS configured for cross-origin requests
- Rate limiting on API endpoints (500 req/15min production, 5000 dev)
- SQL injection protection via parameterized queries
- XSS protection via Content Security Headers (Helmet.js)
- HTTPS-ready with secure cookie flags

## 📞 Support & Contributing

For issues, feature requests, or contributions:

1. Check existing GitHub issues
2. Create detailed bug reports with steps to reproduce
3. Submit pull requests with tests and documentation

## 📄 License

This project is part of the Nirmaan organization ecosystem.

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Material-UI](https://mui.com/)
- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [JWT](https://jwt.io/)

---

**Last Updated**: September 6, 2024  
**Status**: ✅ Fully Operational  
**Version**: 1.0.0
