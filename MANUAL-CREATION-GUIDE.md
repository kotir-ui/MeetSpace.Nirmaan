# Manual Data Creation Guide for MeetSpace.Nirmaan

This guide provides **three complete methods** to manually create users, roles, departments, and meeting rooms in the MeetSpace application.

---

## 📖 Table of Contents

1. [Method 1: SQL Scripts (Direct Database)](#method-1-sql-scripts)
2. [Method 2: API Endpoints (Curl/Postman)](#method-2-api-endpoints)
3. [Method 3: Admin Panel UI](#method-3-admin-panel-ui)
4. [Sample Test Data](#sample-test-data)
5. [Troubleshooting](#troubleshooting)

---

## Method 1: SQL Scripts

### Quick Start
1. Open MySQL Workbench or any MySQL client
2. Connect to your database: `meetspace.nirmaan`
3. Copy the SQL scripts from [database/manual-creation.sql](../database/manual-creation.sql)
4. Execute the scripts in your MySQL client
5. Verify data creation using the verification queries

### Advantages
✅ Fastest method for bulk data creation
✅ Direct database access
✅ No authentication required
✅ Suitable for production seeding

### Disadvantages
❌ Requires database access
❌ Cannot validate API business logic
❌ Risk of breaking referential integrity

### Example SQL Commands

```sql
-- Create a department
INSERT INTO departments (name, description, createdAt, updatedAt) 
VALUES ('Engineering', 'Engineering Department', NOW(), NOW());

-- Create a user
INSERT INTO users 
(email, password, first_name, last_name, role_id, department_id, status, createdAt, updatedAt) 
VALUES
('manager-eng@nirmaan.org', '$2a$10$7D/dTiPAJe0Eg.R0OG/QieXnxJWYEv8G3VxQvVwF5GWm3cXGu1mhG', 
'Engineering', 'Manager', 3, 1, 'active', NOW(), NOW());

-- Create a meeting room
INSERT INTO meeting_rooms 
(name, building, floor, capacity, room_type, description, room_manager_id, status, createdAt, updatedAt) 
VALUES
('Conference A', 'Building 1', '2nd Floor', 10, 'Conference', 
'Large conference room', 1, 'active', NOW(), NOW());
```

### Password Hash Details
- All sample users use password: **Test@123**
- Hashed value (bcrypt, 10 rounds): 
  ```
  $2a$10$7D/dTiPAJe0Eg.R0OG/QieXnxJWYEv8G3VxQvVwF5GWm3cXGu1mhG
  ```
- To generate your own hash: https://bcrypt-generator.com/

---

## Method 2: API Endpoints

### Prerequisites
1. Backend must be running on `http://localhost:5000`
2. You need valid credentials to authenticate
3. User must have appropriate permissions

### Quick Start

#### Step 1: Login and Get JWT Token
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@nirmaan.org",
    "password": "Admin@123"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "superadmin@nirmaan.org",
    "first_name": "System",
    "role_id": 1
  }
}
```

#### Step 2: Use Token in Requests
```bash
$TOKEN = "your_token_from_login"

# Create a department
curl -X POST http://localhost:5000/api/departments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Engineering",
    "description": "Engineering Department"
  }'
```

### Complete API Commands

#### Create Departments
```bash
# Create Engineering Department
curl -X POST http://localhost:5000/api/departments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Engineering",
    "description": "Engineering Department"
  }'

# Create HR Department
curl -X POST http://localhost:5000/api/departments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Human Resources",
    "description": "HR Department"
  }'

# Create Finance Department
curl -X POST http://localhost:5000/api/departments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Finance",
    "description": "Finance Department"
  }'
```

#### Create Users
```bash
# Create Engineering Manager
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "manager-eng@nirmaan.org",
    "password": "Test@123",
    "first_name": "Engineering",
    "last_name": "Manager",
    "role_id": 3,
    "department_id": 1
  }'

# Create Employee
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "emp-eng1@nirmaan.org",
    "password": "Test@123",
    "first_name": "John",
    "last_name": "Engineer",
    "role_id": 4,
    "department_id": 1
  }'
```

#### Create Meeting Rooms
```bash
# Create Conference Room
curl -X POST http://localhost:5000/api/meeting-rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Conference A",
    "building": "Building 1",
    "floor": "2nd Floor",
    "capacity": 10,
    "room_type": "Conference",
    "description": "Large conference room with video conferencing",
    "room_manager_id": 1
  }'

# Create Huddle Space
curl -X POST http://localhost:5000/api/meeting-rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Huddle Space 1",
    "building": "Building 2",
    "floor": "1st Floor",
    "capacity": 4,
    "room_type": "Huddle",
    "description": "Small huddle room",
    "room_manager_id": 1
  }'
```

### Advantages
✅ Validates API business logic
✅ Follows authentication and authorization rules
✅ Integrates with activity logging
✅ Perfect for testing API workflows

### Disadvantages
❌ Requires authentication
❌ Slower than direct SQL
❌ Rate limiting may apply
❌ Need to manage JWT tokens

---

## Method 3: Admin Panel UI

### Quick Start
1. Navigate to: `http://localhost:8302/meeting-room/dashboard`
2. Login with Admin or Super Admin credentials
3. Click "⚙️ Admin Control" in the sidebar
4. Access the Administration Panel with tabs for:
   - 👥 Users Management
   - 🏢 Departments Management
   - 🏛️ Meeting Rooms Management

### Creating Users via UI
1. Go to **Admin Panel → Users tab**
2. Click the **+ Add** button
3. Fill in the form:
   - Email: `manager-eng@nirmaan.org`
   - First Name: `Engineering`
   - Last Name: `Manager`
   - Password: `Test@123` (minimum 6 characters)
   - Role: `Manager`
   - Department: `Engineering`
4. Click **Save**

### Creating Departments via UI
1. Go to **Admin Panel → Departments tab**
2. Click the **+ Add** button
3. Fill in the form:
   - Name: `Engineering`
   - Description: `Engineering Department`
   - Parent Department: (leave empty for root)
4. Click **Save**

### Creating Rooms via UI
1. Go to **Admin Panel → Meeting Rooms tab**
2. Click the **+ Add** button
3. Fill in the form:
   - Room Name: `Conference A`
   - Building: `Building 1`
   - Floor: `2nd Floor`
   - Capacity: `10`
   - Room Type: `Conference`
   - Room Manager: (optional)
   - Description: `Large conference room`
4. Click **Save**

### Advantages
✅ User-friendly interface
✅ No technical knowledge required
✅ Real-time validation and feedback
✅ Easy to see all records in tables
✅ Edit and delete functionality built-in
✅ No terminal/command line needed

### Disadvantages
❌ Slower for bulk data creation
❌ Requires web browser
❌ One record at a time

---

## Sample Test Data

### Default Test Credentials (Password: Test@123)

| Email | Role | Department | Permissions |
|-------|------|------------|-------------|
| superadmin@nirmaan.org | Super Admin | - | All (57) |
| admin@nirmaan.org | Admin | Engineering | 39 |
| admin-hr@nirmaan.org | Admin | HR | 39 |
| manager-eng@nirmaan.org | Manager | Engineering | 22 |
| manager-fin@nirmaan.org | Manager | Finance | 22 |
| emp-eng1@nirmaan.org | Employee | Engineering | 20 |
| emp-fin1@nirmaan.org | Employee | Finance | 20 |
| viewer@nirmaan.org | Viewer | - | 7 |

### Available Roles
- **Super Admin** (ID: 1): Full system access (57 permissions)
- **Admin** (ID: 2): Administrative access (39 permissions)
- **Manager** (ID: 3): Department manager (22 permissions)
- **Employee** (ID: 4): Regular employee (20 permissions)
- **Viewer** (ID: 5): Read-only access (7 permissions)

### Sample Departments
- Engineering
- Human Resources
- Finance
- Operations

### Sample Meeting Rooms
- Conference A (10 people) - Building 1, 2nd Floor
- Board Room (15 people) - Building 1, 3rd Floor
- Meeting Room 101 (6 people) - Building 2, 1st Floor
- Meeting Room 102 (8 people) - Building 2, 1st Floor
- Huddle Space 1 (4 people) - Building 2, 1st Floor
- Training Room (20 people) - Building 1, 2nd Floor
- Executive Suite (8 people) - Building 1, 4th Floor

### Room Facilities
- Projector
- Whiteboard
- Video Conference
- Conference Phone
- WiFi
- Air Conditioning

---

## Troubleshooting

### "Authentication Failed" (Method 2)
**Problem:** API returns 401 Unauthorized
- ✅ Verify JWT token is still valid (tokens expire after 24 hours)
- ✅ Ensure token is included in Authorization header
- ✅ Check credentials used for login

```bash
# Get new token if expired
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@nirmaan.org",
    "password": "Admin@123"
  }'
```

### "Permission Denied" (Method 2)
**Problem:** API returns 403 Forbidden
- ✅ Ensure user has required permissions
- ✅ Use Super Admin for maximum permissions
- ✅ Check user role_id matches permission requirements

### "Email Already Exists"
**Problem:** Cannot create user with duplicate email
- ✅ Change email address to unique value
- ✅ Delete existing user first (if needed)
- ✅ Check if email exists: `SELECT email FROM users`

### "Foreign Key Constraint Failed" (Method 1)
**Problem:** SQL returns error about referenced table
- ✅ Ensure department exists before creating user
- ✅ Ensure user exists before assigning as room manager
- ✅ Verify IDs are correct: `SELECT id FROM departments`

### Admin Panel Not Showing (Method 3)
**Problem:** Admin Control tab not visible
- ✅ Login with Admin or Super Admin user
- ✅ Check user role_id: `SELECT role_id FROM users WHERE email = 'your@email.com'`
- ✅ Verify role_id is 1 or 2 (Super Admin or Admin)

---

## Comparison Matrix

| Feature | Method 1 (SQL) | Method 2 (API) | Method 3 (UI) |
|---------|---|---|---|
| **Speed** | ⚡⚡⚡ Fast | ⚡⚡ Medium | ⚡ Slow |
| **Bulk Data** | ✅ Excellent | ✅ Good | ❌ Poor |
| **Validation** | ❌ Limited | ✅ Full | ✅ Full |
| **Learning Curve** | 🟡 Medium | 🟡 Medium | ✅ Easy |
| **Authentication** | ❌ No | ✅ Required | ✅ Required |
| **Audit Trail** | ❌ Limited | ✅ Full | ✅ Full |
| **Best For** | Initial seeding | Automation | Quick testing |

---

## Best Practices

1. **Use Method 3 (UI)** for:
   - Quick testing and development
   - Learning the system
   - Creating individual records

2. **Use Method 2 (API)** for:
   - Integration with external systems
   - Automated workflows
   - Testing API functionality

3. **Use Method 1 (SQL)** for:
   - Initial database seeding
   - Bulk data loading
   - Production setup scripts

4. **Security Notes:**
   - Never hardcode passwords in production
   - Use strong, unique passwords
   - Rotate JWT tokens regularly
   - Limit Super Admin access

5. **Testing Workflow:**
   ```
   1. Create Departments (Method 3)
   2. Create Users (Method 3)
   3. Create Rooms (Method 3)
   4. Test Bookings as different users
   5. Verify Approval Workflow
   6. Check Activity Logs
   ```

---

## Additional Resources

- [API Documentation](../README.md#api-endpoints)
- [Database Schema](../database/schema.sql)
- [Admin Panel Guide](./ADMIN_GUIDE.md)
- [Authentication Guide](../README.md#authentication)

---

**Last Updated:** 2026-09-06
**Version:** 1.0
