import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  CircularProgress,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const RoomsManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const facilityOptions = [
    'projector',
    'tv',
    'video_conference',
    'whiteboard',
    'conference_phone',
    'speaker_phone',
    'air_conditioning',
    'hdmi_ports',
    'usb_charging',
  ];

  const [formData, setFormData] = useState({
    name: '',
    roomNumber: '',
    location: '',
    capacity: 1,
    floor: 1,
    description: '',
    roomStatus: 'active',
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/booking/rooms');
      setRooms(res.data.data || []);
    } catch (err) {
      setError('Failed to load rooms');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        roomNumber: room.room_number,
        location: room.location,
        capacity: room.capacity,
        floor: room.floor,
        description: room.description || '',
        roomStatus: room.room_status,
      });
      setFacilities(room.facilities?.map((f) => f.facility_type) || []);
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        roomNumber: '',
        location: '',
        capacity: 1,
        floor: 1,
        description: '',
        roomStatus: 'active',
      });
      setFacilities([]);
    }
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.roomNumber || !formData.location) {
        setError('Please fill in all required fields');
        return;
      }

      if (editingRoom) {
        await axios.put(`/api/booking/rooms/${editingRoom.id}`, {
          ...formData,
          facilities,
        });
      } else {
        await axios.post('/api/booking/rooms', {
          ...formData,
          facilities,
        });
      }

      setFormOpen(false);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save room');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/booking/rooms/${deleteConfirm.id}`);
      setDeleteConfirm(null);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete room');
    }
  };

  const toggleFacility = (facility) => {
    setFacilities((prev) =>
      prev.includes(facility) ? prev.filter((f) => f !== facility) : [...prev, facility]
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Meeting Rooms Management
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            Create and manage office meeting rooms
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          Add Room
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {rooms.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Room Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Floor</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Facilities</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{room.name}</TableCell>
                  <TableCell>{room.room_number}</TableCell>
                  <TableCell>{room.location}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell>{room.floor}</TableCell>
                  <TableCell>
                    <Chip
                      label={room.room_status.toUpperCase()}
                      color={room.room_status === 'active' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {room.facilities?.slice(0, 2).map((f) => (
                        <Chip
                          key={f.id}
                          label={f.facility_type.replace(/_/g, ' ')}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {room.facilities?.length > 2 && (
                        <Chip
                          label={`+${room.facilities.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleOpenForm(room)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteConfirm(room)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No rooms configured yet. Create your first room!
          </Typography>
        </Paper>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRoom ? 'Edit Room' : 'Add New Room'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Room Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Conference Room A"
            />
            <TextField
              fullWidth
              label="Room Number"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              placeholder="e.g., 302"
            />
            <TextField
              fullWidth
              label="Location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Building A, Wing B"
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) })}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.roomStatus}
                onChange={(e) => setFormData({ ...formData, roomStatus: e.target.value })}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="maintenance">Under Maintenance</MenuItem>
                <MenuItem value="disabled">Disabled</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional room description..."
            />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Facilities
              </Typography>
              <FormGroup>
                {facilityOptions.map((facility) => (
                  <FormControlLabel
                    key={facility}
                    control={
                      <Checkbox
                        checked={facilities.includes(facility)}
                        onChange={() => toggleFacility(facility)}
                      />
                    }
                    label={facility.replace(/_/g, ' ').toUpperCase()}
                  />
                ))}
              </FormGroup>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingRoom ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoomsManagement;
