# API Manual Creation Guide for MeetSpace
# =====================================================
# Use these curl commands to create users, roles, departments, and rooms via API
# Base URL: http://localhost:5000
# 
# Note: You need to be logged in as Super Admin or Admin to create these resources

# =====================================================
# 0. LOGIN FIRST (Get JWT Token)
# =====================================================

# Login as Super Admin
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@nirmaan.org",
    "password": "Admin@123"
  }'

# Response will include: { token: "jwt_token_here", user: {...} }
# Copy the token value and use it in the Authorization header for other requests

# Set token as environment variable (PowerShell):
# $TOKEN = "your_jwt_token_here"

# =====================================================
# 1. CREATE DEPARTMENTS
# =====================================================

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

# Create Operations Department
curl -X POST http://localhost:5000/api/departments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Operations",
    "description": "Operations Department"
  }'

# Get all departments (to see IDs)
curl -X GET http://localhost:5000/api/departments \
  -H "Authorization: Bearer $TOKEN"

# =====================================================
# 2. CREATE USERS
# =====================================================
# Note: Replace DEPT_ID with actual department IDs from step 1

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

# Create HR Manager
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "manager-hr@nirmaan.org",
    "password": "Test@123",
    "first_name": "HR",
    "last_name": "Manager",
    "role_id": 3,
    "department_id": 2
  }'

# Create Finance Manager
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "manager-fin@nirmaan.org",
    "password": "Test@123",
    "first_name": "Finance",
    "last_name": "Manager",
    "role_id": 3,
    "department_id": 3
  }'

# Create Engineer Employee
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

# Create Accountant Employee
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "emp-fin1@nirmaan.org",
    "password": "Test@123",
    "first_name": "Sarah",
    "last_name": "Accountant",
    "role_id": 4,
    "department_id": 3
  }'

# Get all users (to see IDs)
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"

# =====================================================
# 3. CREATE MEETING ROOMS
# =====================================================
# Note: Replace MANAGER_ID with actual user ID from step 2

# Create Conference Room A
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

# Create Board Room
curl -X POST http://localhost:5000/api/meeting-rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Board Room",
    "building": "Building 1",
    "floor": "3rd Floor",
    "capacity": 15,
    "room_type": "Board",
    "description": "Executive board room",
    "room_manager_id": 1
  }'

# Create Meeting Room 101
curl -X POST http://localhost:5000/api/meeting-rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Meeting Room 101",
    "building": "Building 2",
    "floor": "1st Floor",
    "capacity": 6,
    "room_type": "Standard",
    "description": "Standard meeting room",
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

# Create Training Room
curl -X POST http://localhost:5000/api/meeting-rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Training Room",
    "building": "Building 1",
    "floor": "2nd Floor",
    "capacity": 20,
    "room_type": "Training",
    "description": "Training facility",
    "room_manager_id": 1
  }'

# Get all rooms (to see IDs)
curl -X GET http://localhost:5000/api/meeting-rooms \
  -H "Authorization: Bearer $TOKEN"

# =====================================================
# 4. ADD ROOM FACILITIES
# =====================================================
# Note: Replace ROOM_ID with actual room IDs from step 3

# Add facilities to Conference Room A (Room ID: 1)
curl -X POST http://localhost:5000/api/meeting-rooms/1/facilities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "facility_name": "Projector"
  }'

curl -X POST http://localhost:5000/api/meeting-rooms/1/facilities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "facility_name": "Whiteboard"
  }'

curl -X POST http://localhost:5000/api/meeting-rooms/1/facilities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "facility_name": "Video Conference"
  }'

# Add facilities to Board Room (Room ID: 2)
curl -X POST http://localhost:5000/api/meeting-rooms/2/facilities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "facility_name": "Video Conference"
  }'

curl -X POST http://localhost:5000/api/meeting-rooms/2/facilities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "facility_name": "Conference Phone"
  }'

# =====================================================
# 5. VERIFICATION QUERIES
# =====================================================

# Get all departments
curl -X GET http://localhost:5000/api/departments \
  -H "Authorization: Bearer $TOKEN"

# Get all users
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"

# Get all meeting rooms
curl -X GET http://localhost:5000/api/meeting-rooms \
  -H "Authorization: Bearer $TOKEN"

# Get room details with facilities
curl -X GET http://localhost:5000/api/meeting-rooms/1 \
  -H "Authorization: Bearer $TOKEN"

# =====================================================
# USING POSTMAN
# =====================================================
# 1. Create a new request collection
# 2. Set base URL: http://localhost:5000
# 3. Create environment variable: {{TOKEN}} with JWT value
# 4. Add Authorization header: Bearer {{TOKEN}}
# 5. Copy-paste requests above replacing $TOKEN with {{TOKEN}}

# =====================================================
# ROLE IDs REFERENCE
# =====================================================
# 1 = Super Admin (57 permissions)
# 2 = Admin (39 permissions)
# 3 = Manager (22 permissions)
# 4 = Employee (20 permissions)
# 5 = Viewer (7 permissions)
