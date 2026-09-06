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
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../../../api/client.js';

export default function AdminRoomsManagement() {
  const [rooms, setRooms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    building: '',
    floor: '',
    capacity: '',
    room_type: 'Standard',
    description: '',
    room_manager_id: '',
  });

  const roomTypes = ['Standard', 'Conference', 'Board', 'Training', 'Huddle', 'Executive'];

  useEffect(() => {
    fetchRooms();
    fetchUsers();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/booking/rooms');
      const data = response.data?.data || (Array.isArray(response.data) ? response.data : []);
      setRooms(data);
    } catch (err) {
      setError('Failed to fetch rooms');
      console.error(err);
      setRooms([]);
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
    }
  };

  const handleOpen = (room = null) => {
    if (room) {
      setEditingId(room.id);
      setForm({
        name: room.name,
        building: room.building,
        floor: room.floor,
        capacity: room.capacity,
        room_type: room.room_type,
        description: room.description || '',
        room_manager_id: room.room_manager_id || '',
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        building: '',
        floor: '',
        capacity: '',
        room_type: 'Standard',
        description: '',
        room_manager_id: '',
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
      if (!form.name || !form.building || !form.floor || !form.capacity) {
        setError('Please fill all required fields');
        setLoading(false);
        return;
      }

      const payload = {
        name: form.name,
        building: form.building,
        floor: form.floor,
        capacity: parseInt(form.capacity),
        room_type: form.room_type,
        description: form.description,
      };

      if (form.room_manager_id) {
        payload.room_manager_id = parseInt(form.room_manager_id);
      }

      if (editingId) {
        await api.put(`/meeting-rooms/${editingId}`, payload);
        setSuccess('Room updated successfully');
      } else {
        await api.post('/meeting-rooms', payload);
        setSuccess('Room created successfully');
      }

      handleClose();
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      setLoading(true);
      await api.delete(`/meeting-rooms/${id}`);
      setSuccess('Room deleted successfully');
      fetchRooms();
    } catch (err) {
      setError('Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardHeader
          title="Meeting Room Management"
          action={
            <Tooltip title="Add new room">
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
                  <TableCell>Building</TableCell>
                  <TableCell>Floor</TableCell>
                  <TableCell align="center">Capacity</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Manager</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell>{room.name}</TableCell>
                    <TableCell>{room.building}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    <TableCell align="center">
                      <Chip label={room.capacity} size="small" />
                    </TableCell>
                    <TableCell>{room.room_type}</TableCell>
                    <TableCell>
                      {users.find((u) => u.id === room.room_manager_id)
                        ?.first_name || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(room)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(room.id)}
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

          {rooms.length === 0 && !loading && (
            <Alert severity="info">No meeting rooms found</Alert>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Meeting Room' : 'Create New Meeting Room'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Room Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            placeholder="e.g., Conference A"
          />

          <TextField
            label="Building"
            name="building"
            value={form.building}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            placeholder="e.g., Building 1"
          />

          <TextField
            label="Floor"
            name="floor"
            value={form.floor}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            placeholder="e.g., 2nd Floor"
          />

          <TextField
            label="Capacity"
            name="capacity"
            value={form.capacity}
            onChange={handleChange}
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            placeholder="e.g., 10"
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Room Type</InputLabel>
            <Select
              name="room_type"
              value={form.room_type}
              onChange={handleChange}
              label="Room Type"
            >
              {roomTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Room Manager (Optional)</InputLabel>
            <Select
              name="room_manager_id"
              value={form.room_manager_id}
              onChange={handleChange}
              label="Room Manager"
            >
              <MenuItem value="">None</MenuItem>
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={3}
            placeholder="Room description and features"
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
