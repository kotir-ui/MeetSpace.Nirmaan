import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Stack,
  Typography,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as RoleIcon,
} from '@mui/icons-material';
import api from '../../../../api/client.js';

const DEFAULT_ROLES = [
  { id: 1, name: 'Super Admin', description: 'Full system control and configuration access' },
  { id: 2, name: 'Admin', description: 'Administrative and room management control' },
  { id: 3, name: 'Manager', description: 'Department manager and booking approver' },
  { id: 4, name: 'Employee', description: 'Standard employee and room booking user' },
  { id: 5, name: 'Viewer', description: 'Read-only viewer account' },
];

const DEFAULT_USERS = [
  {
    id: 1,
    employee_id: 'EMP0001',
    name: 'Super Admin',
    email: 'superadmin@nirmaan.org',
    designation: 'System Administrator',
    role: { id: 1, name: 'Super Admin' },
    departmentGroup: { id: 1, name: 'Engineering' },
    status: 'active',
  },
  {
    id: 2,
    employee_id: 'EMP0002',
    name: 'Admin',
    email: 'admin@nirmaan.org',
    designation: 'Administrator',
    role: { id: 2, name: 'Admin' },
    departmentGroup: { id: 1, name: 'Engineering' },
    status: 'active',
  },
  {
    id: 3,
    employee_id: 'EMP0003',
    name: 'Manager',
    email: 'manager@nirmaan.org',
    designation: 'Department Head',
    role: { id: 3, name: 'Manager' },
    departmentGroup: { id: 2, name: 'Human Resources' },
    status: 'active',
  },
  {
    id: 4,
    employee_id: 'EMP0004',
    name: 'Employee User',
    email: 'emp1@nirmaan.org',
    designation: 'Software Developer',
    role: { id: 4, name: 'Employee' },
    departmentGroup: { id: 1, name: 'Engineering' },
    status: 'active',
  },
  {
    id: 5,
    employee_id: 'EMP0009',
    name: 'Viewer',
    email: 'viewer@nirmaan.org',
    designation: 'Guest User',
    role: { id: 5, name: 'Viewer' },
    departmentGroup: { id: 3, name: 'Marketing' },
    status: 'active',
  },
];

export default function AdminUsersManagement() {
  const [users, setUsers] = useState(DEFAULT_USERS);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    employee_id: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role_id: '',
    department_id: '',
    designation: '',
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      if (data && data.length > 0) {
        setUsers(data);
      } else {
        setUsers(DEFAULT_USERS);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers(DEFAULT_USERS);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/departments');
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments', err);
      setDepartments([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/users/roles');
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      if (data && data.length > 0) {
        setRoles(data);
      } else {
        setRoles(DEFAULT_ROLES);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setRoles(DEFAULT_ROLES);
    }
  };

  const handleOpen = (user = null) => {
    if (user) {
      setEditingId(user.id);
      const fullName = user.name || '';
      const nameParts = fullName.split(' ');
      setForm({
        employee_id: user.employee_id || '',
        email: user.email || '',
        first_name: user.first_name || nameParts[0] || '',
        last_name: user.last_name || nameParts.slice(1).join(' ') || '',
        designation: user.designation || '',
        role_id: user.role_id || user.role?.id || '',
        department_id: user.department_id || user.departmentGroup?.id || '',
        password: '',
      });
    } else {
      setEditingId(null);
      const autoEmpId = `EMP${Math.floor(1000 + Math.random() * 9000)}`;
      setForm({
        employee_id: autoEmpId,
        email: '',
        first_name: '',
        last_name: '',
        designation: '',
        password: '',
        role_id: roles.length > 0 ? roles[roles.length - 1].id : '',
        department_id: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Validation
      if (!form.email || !form.first_name || !form.role_id) {
        setError('Please fill in required fields (Email, First Name, Role)');
        setLoading(false);
        return;
      }

      if (!editingId && !form.password) {
        setError('Password is required for new users (min 6 characters)');
        setLoading(false);
        return;
      }

      const fullName = `${form.first_name} ${form.last_name}`.trim();
      const payload = {
        employee_id: form.employee_id || `EMP${Math.floor(1000 + Math.random() * 9000)}`,
        name: fullName,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        designation: form.designation || null,
        role_id: parseInt(form.role_id),
        department_id: form.department_id ? parseInt(form.department_id) : null,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        setSuccess('User and role updated successfully');
      } else {
        await api.post('/users', payload);
        setSuccess('User created successfully');
      }

      handleClose();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      setLoading(true);
      await api.delete(`/users/${id}`);
      setSuccess('User deleted successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleChipColor = (roleName) => {
    switch (roleName) {
      case 'Super Admin':
        return { color: 'error', variant: 'filled' };
      case 'Admin':
        return { color: 'primary', variant: 'filled' };
      case 'Department Manager':
      case 'Department Head':
        return { color: 'warning', variant: 'filled' };
      case 'Employee':
        return { color: 'success', variant: 'filled' };
      default:
        return { color: 'info', variant: 'filled' };
    }
  };

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <RoleIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Users & Role Assignments
              </Typography>
            </Box>
          }
          subheader="Create users and assign system roles (Super Admin, Admin, Manager, Employee)"
          action={
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => handleOpen()}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add New User
            </Button>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          {loading && <CircularProgress size={28} sx={{ my: 2, display: 'block', mx: 'auto' }} />}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Emp ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => {
                  const roleName = roles.find((r) => r.id === u.role_id)?.name || u.role?.name || (typeof u.role === 'string' ? u.role : 'Employee');
                  const deptName = departments.find((d) => d.id === u.department_id)?.name || u.departmentGroup?.name || u.department?.name || (typeof u.department === 'string' ? u.department : '-');
                  const chipProps = getRoleChipColor(roleName);
                  const displayName = u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email.split('@')[0];

                  return (
                    <TableRow key={u.id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
                            {displayName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {u.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {u.employee_id || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={roleName}
                          size="small"
                          color={chipProps.color}
                          variant={chipProps.variant}
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {deptName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Role & Details">
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(u)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(u.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {users.length === 0 && !loading && (
            <Alert severity="info" sx={{ mt: 2 }}>No users found. Click "Add New User" to create one.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Edit User & Assign Role' : 'Create New User'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Employee ID"
              name="employee_id"
              value={form.employee_id}
              onChange={handleChange}
              fullWidth
              size="small"
              helperText="Unique identifier for the user"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="First Name"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                fullWidth
                size="small"
                required
              />
              <TextField
                label="Last Name"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                fullWidth
                size="small"
              />
            </Stack>

            <TextField
              label="Email Address"
              name="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              size="small"
              type="email"
              required
            />

            <TextField
              label="Designation (Optional)"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              fullWidth
              size="small"
              placeholder="e.g. Senior Software Engineer"
            />

            {!editingId && (
              <TextField
                label="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                type="password"
                fullWidth
                size="small"
                required
                helperText="Minimum 6 characters"
              />
            )}

            <FormControl fullWidth size="small" required>
              <InputLabel>Assign Role</InputLabel>
              <Select
                name="role_id"
                value={form.role_id}
                onChange={handleChange}
                label="Assign Role"
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Assign Department</InputLabel>
              <Select
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                label="Assign Department"
              >
                <MenuItem value="">None / Unassigned</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code || 'Dept'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>
    </Box>
  );
}

