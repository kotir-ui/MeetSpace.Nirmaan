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
  Stack,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MeetingRoom as RoomIcon,
} from '@mui/icons-material';
import api from '../../../../api/client.js';

const DEFAULT_ROOMS = [
  {
    id: 1,
    name: 'Sarvepalli Radhakrishnan Hall',
    room_number: 'CR-101',
    building: 'Main Block',
    floor: 1,
    location: '1st Floor - East Wing',
    room_type: 'Conference',
    capacity: 18,
    status: 'available',
    description: 'Executive conference hall with video conferencing and smart board.',
  },
  {
    id: 2,
    name: 'APJ Abdul Kalam Board Room',
    room_number: 'BR-201',
    building: 'Main Block',
    floor: 2,
    location: '2nd Floor - Executive Suite',
    room_type: 'Board',
    capacity: 24,
    status: 'available',
    description: 'Board room for leadership sessions and strategic reviews.',
  },
  {
    id: 3,
    name: 'Swami Vivekananda Meeting Room',
    room_number: 'MR-102',
    building: 'Main Block',
    floor: 1,
    location: '1st Floor - West Wing',
    room_type: 'Standard',
    capacity: 10,
    status: 'available',
    description: 'Medium team collaboration and meeting room.',
  },
  {
    id: 4,
    name: 'Aryabhata Discussion Suite',
    room_number: 'DR-301',
    building: 'Innovation Block',
    floor: 3,
    location: '3rd Floor - Tech Wing',
    room_type: 'Huddle',
    capacity: 8,
    status: 'available',
    description: 'Rapid discussion and agile breakout room.',
  },
  {
    id: 5,
    name: 'Sir CV Raman Innovation Lab',
    room_number: 'TR-302',
    building: 'Innovation Block',
    floor: 3,
    location: '3rd Floor - South Wing',
    room_type: 'Training',
    capacity: 30,
    status: 'available',
    description: 'Spacious training and interactive presentation hall.',
  },
  {
    id: 6,
    name: 'Chanakya Strategy Room',
    room_number: 'MR-202',
    building: 'Main Block',
    floor: 2,
    location: '2nd Floor - North Wing',
    room_type: 'Executive',
    capacity: 12,
    status: 'available',
    description: 'Client meetings and department strategy room.',
  },
];

export default function AdminRoomsManagement() {
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    room_number: '',
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
      if (data && data.length > 0) {
        setRooms(data);
      } else {
        setRooms(DEFAULT_ROOMS);
      }
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms(DEFAULT_ROOMS);
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

  const handleOpen = (room = null) => {
    if (room) {
      setEditingId(room.id);
      setForm({
        name: room.name || '',
        room_number: room.room_number || '',
        building: room.building || room.location || '',
        floor: room.floor || '',
        capacity: room.capacity || '',
        room_type: room.room_type || 'Standard',
        description: room.description || '',
        room_manager_id: room.room_manager_id || '',
      });
    } else {
      setEditingId(null);
      setForm({
        name: '',
        room_number: '',
        building: '',
        floor: '1',
        capacity: '8',
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
      if (!form.name || !form.capacity) {
        setError('Please enter Room Name and Capacity');
        setLoading(false);
        return;
      }

      const payload = {
        name: form.name.trim(),
        room_number: form.room_number || form.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase(),
        location: form.building || 'Main Building',
        building: form.building || 'Main Building',
        floor: parseInt(form.floor) || 1,
        capacity: parseInt(form.capacity),
        room_type: form.room_type || 'Standard',
        description: form.description || '',
      };

      if (form.room_manager_id) {
        payload.room_manager_id = parseInt(form.room_manager_id);
      }

      if (editingId) {
        await api.put(`/booking/rooms/${editingId}`, payload);
        setSuccess('Meeting room updated successfully');
      } else {
        await api.post('/booking/rooms', payload);
        setSuccess('Meeting room created successfully');
      }

      handleClose();
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save meeting room');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meeting room?')) return;

    try {
      setLoading(true);
      await api.delete(`/booking/rooms/${id}`);
      setSuccess('Room deleted successfully');
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete room');
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
              <RoomIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Meeting Rooms Management
              </Typography>
            </Box>
          }
          subheader="Create and configure meeting rooms, capacity, floor, and equipment"
          action={
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Add Room
            </Button>
          }
        />
        <CardContent sx={{ pt: 0 }}>
          {loading && <CircularProgress size={28} sx={{ my: 2, display: 'block', mx: 'auto' }} />}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Room Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location / Building</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Floor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Capacity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {room.name}
                      </Typography>
                      {room.room_number && (
                        <Typography variant="caption" color="text.secondary">
                          No: {room.room_number}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {room.location || room.building || 'Main Building'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        Floor {room.floor || 1}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={`${room.capacity} seats`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={room.room_type || 'Standard'} size="small" sx={{ fontWeight: 500 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Room">
                        <IconButton
                          size="small"
                          onClick={() => handleOpen(room)}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Room">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(room.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {rooms.length === 0 && !loading && (
            <Alert severity="info" sx={{ mt: 2 }}>No meeting rooms found. Click "Add Room" to create one.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId ? 'Edit Meeting Room' : 'Create New Meeting Room'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Room Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              size="small"
              required
              placeholder="e.g. Conference Room A"
            />

            <Stack direction="row" spacing={2}>
              <TextField
                label="Room Number / Code"
                name="room_number"
                value={form.room_number}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="e.g. CR-101"
              />

              <TextField
                label="Capacity (Seats)"
                name="capacity"
                value={form.capacity}
                onChange={handleChange}
                type="number"
                fullWidth
                size="small"
                required
                placeholder="e.g. 12"
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Building / Location"
                name="building"
                value={form.building}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="e.g. Main Campus"
              />

              <TextField
                label="Floor"
                name="floor"
                value={form.floor}
                onChange={handleChange}
                fullWidth
                size="small"
                placeholder="e.g. 1 or 2"
              />
            </Stack>

            <FormControl fullWidth size="small">
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

            <TextField
              label="Description (Optional)"
              name="description"
              value={form.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder="Projector, Whiteboard, Video Conference equipment..."
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {loading ? 'Saving...' : editingId ? 'Save Changes' : 'Create Room'}
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

