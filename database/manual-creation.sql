-- =====================================================
-- Manual Creation Scripts for MeetSpace
-- =====================================================
-- Execute these SQL commands in MySQL to create sample data

-- =====================================================
-- 1. CREATE ROLES (if not already exist)
-- =====================================================
INSERT INTO roles (name, description, createdAt, updatedAt) VALUES
('Super Admin', 'Full system access', NOW(), NOW()),
('Admin', 'Administrative access', NOW(), NOW()),
('Manager', 'Department manager', NOW(), NOW()),
('Employee', 'Regular employee', NOW(), NOW()),
('Viewer', 'Read-only access', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- =====================================================
-- 2. CREATE DEPARTMENTS
-- =====================================================
INSERT INTO departments (name, parent_id, description, createdAt, updatedAt) VALUES
('Engineering', NULL, 'Engineering Department', NOW(), NOW()),
('Human Resources', NULL, 'HR Department', NOW(), NOW()),
('Finance', NULL, 'Finance Department', NOW(), NOW()),
('Operations', NULL, 'Operations Department', NOW(), NOW());

-- Get Department IDs for use in next section
-- Run this to see IDs:
-- SELECT id, name FROM departments;

-- =====================================================
-- 3. CREATE USERS
-- Note: Passwords should be hashed with bcryptjs
-- Password: Test@123 (hashed)
-- You can use this pre-hashed value or generate your own
-- =====================================================

-- Get role IDs first:
-- SELECT id, name FROM roles;

-- Example: Insert users (update role_id values based on your actual role IDs)
-- Assuming: Super Admin=1, Admin=2, Manager=3, Employee=4, Viewer=5

INSERT INTO users 
(email, password, first_name, last_name, role_id, department_id, status, created_by, createdAt, updatedAt) 
VALUES
-- Super Admin
('superadmin@nirmaan.org', '$2a$10$7D/dTiPAJe0Eg.R0OG/QieXnxJWYEv8G3VxQvVwF5GWm3cXGu1mhG', 'System', 'Admin', 1, NULL, 'active', 'system', NOW(), NOW()),

-- Admins
('admin@nirmaan.org', '$2a$10$7D/dTiPAJe0Eg.R0OG/QieXnxJWYEv8G3VxQvVwF5GWm3cXGu1mhG', 'Admin', 'User', 2, 1, 'active', 'system', NOW(), NOW()),
('admin-hr@nirmaan.org', '$2a$10$7D/dTiPAJe0Eg.R0OG/QieXnxJWYEv8G3VxQvVwF5GWm3cXGu1mhG', 'HR', 'Admin', 2, 2, 'active', 'system', NOW(), NOW()),

-- Managers
('manager-eng@nirmaan.org', '$2a$10$7D/dTiPAJe0Eg.R0OG/QieXnxJWYEv8G3VxQvVwF5GWm3cXGu1mhG', 'Engineering', 'Manager', 3, 1, 'active', 'system', NOW(), NOW()),
('manager-fin@nirmaan.org', '$2a$10$7D/dTiPAJe0Eg.R0OG/QieXnxJWYEv8G3VxQvVwF5GWm3cXGu1mhG', 'Finance', 'Manager', 3, 3, 'active', 'system', NOW(), NOW()),

-- Employees
('emp-eng1@nirmaan.org', '$2a$10$7D/dTiPAJe0Eg.R0OG/QieXnxJWYEv8G3VxQvVwF5GWm3cXGu1mhG', 'John', 'Engineer', 4, 1, 'active', 'system', NOW(), NOW()),
('emp-fin1@nirmaan.org', '$2a$10$7D/dTiPAJe0Eg.R0OG/QieXnxJWYEv8G3VxQvVwF5GWm3cXGu1mhG', 'Sarah', 'Accountant', 4, 3, 'active', 'system', NOW(), NOW()),

-- Viewers
('viewer@nirmaan.org', '$2a$10$7D/dTiPAJe0Eg.R0OG/QieXnxJWYEv8G3VxQvVwF5GWm3cXGu1mhG', 'Guest', 'Viewer', 5, NULL, 'active', 'system', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  password = VALUES(password),
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  status = VALUES(status),
  updatedAt = NOW();

-- =====================================================
-- 4. CREATE MEETING ROOMS
-- =====================================================
INSERT INTO meeting_rooms 
(name, building, floor, capacity, room_type, description, room_manager_id, status, createdAt, updatedAt) 
VALUES
('Conference A', 'Building 1', '2nd Floor', 10, 'Conference', 'Large conference room', 1, 'active', NOW(), NOW()),
('Board Room', 'Building 1', '3rd Floor', 15, 'Board', 'Executive board room', 1, 'active', NOW(), NOW()),
('Meeting Room 101', 'Building 2', '1st Floor', 6, 'Standard', 'Standard meeting room', 1, 'active', NOW(), NOW()),
('Meeting Room 102', 'Building 2', '1st Floor', 8, 'Standard', 'Standard meeting room', 1, 'active', NOW(), NOW()),
('Training Room', 'Building 1', '2nd Floor', 20, 'Training', 'Training facility', 1, 'active', NOW(), NOW()),
('Huddle Space 1', 'Building 2', '1st Floor', 4, 'Huddle', 'Small huddle room', 1, 'active', NOW(), NOW()),
('Executive Suite', 'Building 1', '4th Floor', 8, 'Executive', 'Executive meeting room', 1, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  capacity = VALUES(capacity),
  description = VALUES(description),
  updatedAt = NOW();

-- =====================================================
-- 5. ADD ROOM FACILITIES
-- =====================================================
-- Get room IDs first:
-- SELECT id, name FROM meeting_rooms;

-- Example: Add facilities to rooms (update room_id values based on your actual room IDs)
INSERT INTO room_facilities (room_id, facility_name, createdAt, updatedAt) VALUES
(1, 'Projector', NOW(), NOW()),
(1, 'Whiteboard', NOW(), NOW()),
(1, 'Video Conference', NOW(), NOW()),
(1, 'Air Conditioning', NOW(), NOW()),
(2, 'Projector', NOW(), NOW()),
(2, 'Video Conference', NOW(), NOW()),
(2, 'Conference Phone', NOW(), NOW()),
(3, 'Whiteboard', NOW(), NOW()),
(3, 'WiFi', NOW(), NOW()),
(4, 'Whiteboard', NOW(), NOW()),
(4, 'WiFi', NOW(), NOW()),
(5, 'Projector', NOW(), NOW()),
(5, 'Whiteboard', NOW(), NOW()),
(5, 'Video Conference', NOW(), NOW()),
(6, 'WiFi', NOW(), NOW()),
(7, 'Video Conference', NOW(), NOW()),
(7, 'Projector', NOW(), NOW())
ON DUPLICATE KEY UPDATE updatedAt = NOW();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify data was created:

-- Check Roles
-- SELECT id, name, description FROM roles;

-- Check Departments
-- SELECT id, name, parent_id, description FROM departments;

-- Check Users
-- SELECT id, email, first_name, last_name, role_id, department_id, status FROM users;

-- Check Meeting Rooms
-- SELECT id, name, building, floor, capacity, room_type, status FROM meeting_rooms;

-- Check Room Facilities
-- SELECT rf.id, mr.name as room_name, rf.facility_name FROM room_facilities rf 
-- JOIN meeting_rooms mr ON rf.room_id = mr.id;

-- =====================================================
-- TEST CREDENTIALS (Password: Test@123)
-- =====================================================
-- superadmin@nirmaan.org - Full system access
-- admin@nirmaan.org - Administrative access
-- admin-hr@nirmaan.org - HR administrative access
-- manager-eng@nirmaan.org - Engineering manager
-- manager-fin@nirmaan.org - Finance manager
-- emp-eng1@nirmaan.org - Engineering employee
-- emp-fin1@nirmaan.org - Finance employee
-- viewer@nirmaan.org - Viewer/Guest access

-- =====================================================
-- NOTE: Password Hash Details
-- =====================================================
-- The hashed password above is for: Test@123
-- Algorithm: bcrypt (round 10)
-- To generate your own hash, use:
-- Node.js: await bcrypt.hash('Test@123', 10)
-- Online: https://bcrypt-generator.com/ (use 10 rounds)
