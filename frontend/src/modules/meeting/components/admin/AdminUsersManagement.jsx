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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../../../api/client.js';

export default function AdminUsersManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role_id: '',
    department_id: '',
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
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
      setUsers([]);
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
      setRoles(data);
    } catch (err) {
      console.error('Failed to fetch roles', err);
      setRoles([]);
    }
  };

  const handleOpen = (user = null) => {
    if (user) {
      setEditingId(user.id);
      setForm({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role_id: user.role_id,
        department_id: user.department_id || '',
        password: '',
      });
    } else {
      setEditingId(null);
      setForm({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role_id: '',
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
      if (!form.email || !form.first_name || !form.last_name || !form.role_id) {
        setError('Please fill all required fields');
        setLoading(false);
        return;
      }

      if (!editingId && !form.password) {
        setError('Password is required for new users');
        setLoading(false);
        return;
      }

      const payload = {
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
        role_id: parseInt(form.role_id),
        department_id: form.department_id ? parseInt(form.department_id) : null,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        setSuccess('User updated successfully');
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
      setError('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardHeader
          title="User Management"
          action={
            <Tooltip title="Add new user">
              <IconButton onClick={() => handleOpen()} color="primary">
                <AddIcon />
              </IconButton>
            </Tooltip>
          }
        />
        <CardContent>
          {loading && <CircularProgress />}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email.split('@')[0]}
                    </TableCell>
                    <TableCell>
                      {roles.find((r) => r.id === user.role_id)?.name || user.role?.name || user.role || '-'}
                    </TableCell>
                    <TableCell>
                      {departments.find((d) => d.id === user.department_id)?.name || user.department?.name || (typeof user.department === 'string' ? user.department : null) || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(user)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(user.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {users.length === 0 && !loading && (
            <Alert severity="info">No users found</Alert>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit User' : 'Create New User'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            fullWidth
            disabled={!!editingId}
            sx={{ mb: 2 }}
            type="email"
          />

          <TextField
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Last Name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />

          {!editingId && (
            <TextField
              label="Password"
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              fullWidth
              sx={{ mb: 2 }}
              helperText="Minimum 6 characters"
            />
          )}

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              name="role_id"
              value={form.role_id}
              onChange={handleChange}
              label="Role"
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              label="Department"
            >
              <MenuItem value="">None</MenuItem>
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success">{success}</Alert>
      </Snackbar>
    </Box>
  );
}
