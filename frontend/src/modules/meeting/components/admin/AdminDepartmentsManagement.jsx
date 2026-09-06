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
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../../../../api/client.js';

export default function AdminDepartmentsManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    parent_id: '',
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setDepartments(data);
    } catch (err) {
      setError('Failed to fetch departments');
      console.error(err);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (department = null) => {
    if (department) {
      setEditingId(department.id);
      setForm({
        name: department.name,
        description: department.description || '',
        parent_id: department.parent_id || '',
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        description: '',
        parent_id: '',
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
      if (!form.name) {
        setError('Department name is required');
        setLoading(false);
        return;
      }

      const payload = {
        name: form.name,
        description: form.description,
      };

      if (form.parent_id) {
        payload.parent_id = parseInt(form.parent_id);
      }

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
      setError(err.response?.data?.message || 'Failed to save department');
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
      setError('Failed to delete department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardHeader
          title="Department Management"
          action={
            <Tooltip title="Add new department">
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
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Parent Department</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell>{dept.description || '-'}</TableCell>
                    <TableCell>
                      {dept.parent_id
                        ? departments.find((d) => d.id === dept.parent_id)?.name ||
                          '-'
                        : 'Root'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(dept)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(dept.id)}
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

          {departments.length === 0 && !loading && (
            <Alert severity="info">No departments found</Alert>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Department' : 'Create New Department'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Department Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <TextField
            label="Parent Department ID (Optional)"
            name="parent_id"
            value={form.parent_id}
            onChange={handleChange}
            fullWidth
            type="number"
            helperText="Leave empty for root departments"
          />
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
