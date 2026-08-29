import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Card,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import PageHeader from '../components/PageHeader.jsx';

const emptyForm = { name: '', email: '', password: '', role_id: '', department: '', status: 'active' };

export default function Users() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [settings, setSettings] = useState({});
  const [resetTarget, setResetTarget] = useState(null);
  const [newPw, setNewPw] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetErr, setResetErr] = useState('');
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [searchParams] = useSearchParams();
  const excludeAdmins = searchParams.get('excludeAdmins') === '1';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setRows(
        data.map((u) => ({
          ...u,
          role_name: u.role?.name,
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/users/roles').then((res) => setRoles(res.data));
    api.get('/settings').then((r) => setSettings(r.data)).catch(() => {});
    api.get('/departments').then((r) => setDepartments(r.data)).catch(() => {});
    load();
  }, [load]);

  const handleSave = async () => {
    const payload = { ...form };
    if (editId && !payload.password) delete payload.password;
    if (editId) {
      await api.put(`/users/${editId}`, payload);
    } else {
      await api.post('/users', payload);
    }
    setOpen(false);
    setForm(emptyForm);
    setEditId(null);
    load();
  };

  const handleEdit = (row) => {
    setForm({
      name: row.name,
      email: row.email,
      password: '',
      role_id: row.role_id,
      department: row.department || '',
      status: row.status,
    });
    setEditId(row.id);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/users/${id}`);
    load();
  };

  const submitReset = async () => {
    setResetErr('');
    if (!newPw || newPw.length < 6) {
      setResetErr('Password must be at least 6 characters');
      return;
    }
    setResetting(true);
    try {
      await api.post(`/users/${resetTarget.id}/reset-password`, { newPassword: newPw });
      setResetTarget(null);
      setNewPw('');
    } catch (e) {
      setResetErr(e.response?.data?.message || 'Failed to reset password');
    } finally {
      setResetting(false);
    }
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 140 },
    { field: 'email', headerName: 'Email', flex: 1.3, minWidth: 180 },
    {
      field: 'role_name',
      headerName: 'Role',
      width: 130,
      renderCell: (p) => <Chip label={p.value} size="small" color="primary" variant="outlined" />,
    },
    { field: 'department', headerName: 'Department', width: 180, valueFormatter: (value) => value || '—' },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (p) => (
        <Chip label={p.value} size="small" color={p.value === 'active' ? 'success' : 'default'} />
      ),
    },
    {
      field: 'last_login',
      headerName: 'Last Login',
      width: 180,
      valueFormatter: (value) => (value ? new Date(value).toLocaleString() : 'Never'),
    },
  ];

  if (isAdmin) {
    columns.push({
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (p) => (
        <Stack direction="row">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEdit(p.row)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {settings.admin_reset_enabled && (
            <Tooltip title="Reset Password">
              <IconButton size="small" color="warning" onClick={() => { setResetErr(''); setNewPw(''); setResetTarget(p.row); }}>
                <LockResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    });
  }

  return (
    <Box>
      <PageHeader
        title="User Management"
        subtitle="Manage users and role-based access"
        actions={
          isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setForm(emptyForm);
                setEditId(null);
                setOpen(true);
              }}
            >
              Add User
            </Button>
          )
        }
      />

      <Card sx={{ p: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ p: 1.5, pb: 0 }}>
          <TextField
            select
            size="small"
            label="Filter by Department"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">All Departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.name}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
        <DataGrid
          rows={rows
            .filter((r) => (deptFilter ? r.department === deptFilter : true))
            .filter((r) => (excludeAdmins ? r.role_name !== 'Super Admin' && r.role_name !== 'Admin' : true))}
          columns={columns}
          loading={loading}
          autoHeight
          pageSizeOptions={[10, 25]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required fullWidth />
            <TextField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required fullWidth />
            <TextField
              label={editId ? 'Password (leave blank to keep)' : 'Password'}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              fullWidth
            />
            <TextField select label="Role" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} required fullWidth>
              {roles.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              fullWidth
            >
              <MenuItem value="">None</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.name}>
                  {d.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} fullWidth>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(resetTarget)} onClose={() => setResetTarget(null)} fullWidth maxWidth="xs">
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetErr && <Alert severity="error" sx={{ mb: 2 }}>{resetErr}</Alert>}
          <TextField
            label="New Password"
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitReset} disabled={resetting}>
            Reset
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
