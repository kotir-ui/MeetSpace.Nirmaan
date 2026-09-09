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
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CorporateFare as DeptIcon,
} from '@mui/icons-material';
import api from '../../../../api/client.js';

const DEFAULT_DEPARTMENTS = [
  { id: 1, name: 'Engineering', code: 'ENG', description: 'Software and hardware engineering', status: 'active' },
  { id: 2, name: 'Human Resources', code: 'HR', description: 'Human resources and talent management', status: 'active' },
  { id: 3, name: 'Marketing', code: 'MKT', description: 'Brand and digital marketing', status: 'active' },
  { id: 4, name: 'Sales & Business', code: 'SALES', description: 'Sales and business development', status: 'active' },
  { id: 5, name: 'Finance & Accounts', code: 'FIN', description: 'Financial planning and accounts', status: 'active' },
  { id: 6, name: 'Operations & Facilities', code: 'OPS', description: 'Operations and facility management', status: 'active' },
  { id: 7, name: 'Information Technology', code: 'IT', description: 'IT infrastructure and support', status: 'active' },
  { id: 8, name: 'Product Management', code: 'PM', description: 'Product design and strategy', status: 'active' },
  { id: 9, name: 'Management / Executive', code: 'EXEC', description: 'Executive leadership and management', status: 'active' },
];

export default function AdminDepartmentsManagement() {
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    department_head_id: '',
    email: '',
  });

  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      if (data && data.length > 0) {
        setDepartments(data);
      } else {
        setDepartments(DEFAULT_DEPARTMENTS);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
      setDepartments(DEFAULT_DEPARTMENTS);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
      setUsers([]);
    }
  };

  const handleOpen = (dept = null) => {
    if (dept) {
      setEditingId(dept.id);
      setForm({
        name: dept.name || '',
        code: dept.code || '',
        description: dept.description || '',
        department_head_id: dept.department_head_id || dept.head?.id || '',
        email: dept.email || '',
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        code: '',
        description: '',
        department_head_id: '',
        email: '',
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
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-suggest code if typing name and code wasn't manually set
      if (name === 'name' && !editingId && (!prev.code || prev.code === prev.name.slice(0, 4).toUpperCase())) {
        updated.code = value.trim().slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
      }
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      // Validation
      if (!form.name || !form.name.trim()) {
        setError('Department name is required');
        setLoading(false);
        return;
      }

      const deptCode = form.code?.trim() || form.name.trim().slice(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '') || 'DEPT';

      const payload = {
        name: form.name.trim(),
        code: deptCode,
        description: form.description || null,
        email: form.email || null,
        department_head_id: form.department_head_id ? parseInt(form.department_head_id) : null,
      };

      if (editingId) {
        await api.put(`/departments/${editingId}`, payload);
        setSuccess('Department updated successfully');
      } else {
        await api.post('/departments', payload);
        setSuccess('Department created successfully');
      }

      handleClose();
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?'))
      return;

    try {
      setLoading(true);
      await api.delete(`/departments/${id}`);
      setSuccess('Department deleted successfully');
      fetchDepartments();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to delete department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DeptIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Department Management
              </Typography>
            </Box>
          }
          subheader="Create departments, manage organization hierarchy, and assign department heads"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Department
            </Button>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          {loading && <CircularProgress size={28} sx={{ my: 2, display: 'block', mx: 'auto' }} />}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Department Head</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((dept) => {
                  const headUser = users.find((u) => u.id === dept.department_head_id) || dept.head;
                  const headName = headUser?.name || `${headUser?.first_name || ''} ${headUser?.last_name || ''}`.trim() || headUser?.email || '-';

                  return (
                    <TableRow key={dept.id} hover>
                      <TableCell>
                        <Chip
                          label={dept.code || 'DEPT'}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontFamily: 'monospace' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {dept.name}
                        </Typography>
                        {dept.email && (
                          <Typography variant="caption" color="text.secondary">
                            {dept.email}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {headName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dept.description || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Department">
                          <IconButton
                            size="small"
                            onClick={() => handleOpen(dept)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Department">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(dept.id)}
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

          {departments.length === 0 && !loading && (
            <Alert severity="info" sx={{ mt: 2 }}>No departments found. Click "Add Department" to create one.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Edit Department' : 'Create New Department'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Department Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              size="small"
              required
              placeholder="e.g. Human Resources, Engineering"
            />

            <TextField
              label="Department Code"
              name="code"
              value={form.code}
              onChange={handleChange}
              fullWidth
              size="small"
              required
              placeholder="e.g. HR, ENG, SALES"
              helperText="Short uppercase code for this department"
            />

            <FormControl fullWidth size="small">
              <InputLabel>Department Head (Optional)</InputLabel>
              <Select
                name="department_head_id"
                value={form.department_head_id}
                onChange={handleChange}
                label="Department Head (Optional)"
              >
                <MenuItem value="">None / Unassigned</MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email} ({u.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Department Email (Optional)"
              name="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              size="small"
              type="email"
              placeholder="e.g. hr@nirmaan.org"
            />

            <TextField
              label="Description (Optional)"
              name="description"
              value={form.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="Brief summary of this department's role"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Create Department'}
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

