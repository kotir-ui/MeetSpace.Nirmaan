import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Typography,
  Button,
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Badge,
  IconButton,
  Paper,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pause as PauseIcon,
  Build as BuildIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import * as bookingApi from '../../api/booking.js';
import { useAuth } from '../../../../context/AuthContext.jsx';

export default function AdminPanel() {
  const { user } = useAuth();
  const [adminTab, setAdminTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Rooms Management
  const [rooms, setRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomDialog, setRoomDialog] = useState(false);
  const [roomData, setRoomData] = useState({
    name: '',
    roomNumber: '',
    location: '',
    capacity: '',
    floor: '',
    building: '',
    status: 'available',
  });

  // Approvals
  const [pendingBookings, setPendingBookings] = useState([]);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [approvalAction, setApprovalAction] = useState('approve');

  // Maintenance
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [maintenanceRoom, setMaintenanceRoom] = useState(null);
  const [maintenanceData, setMaintenanceData] = useState({
    reason: '',
    endDate: '',
  });

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Department Manager') {
      fetchRooms();
      fetchPendingApprovals();
    }
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getRooms();
      setRooms((response.data?.data || []).map((room) => ({
        ...room,
        status: room.room_status,
        building: room.location,
      })));
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setSnackbar({ open: true, message: 'Failed to load rooms', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await bookingApi.getPendingApprovals();
      setPendingBookings(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const handleApproveBooking = async () => {
    if (!selectedBooking) return;

    try {
      setLoading(true);
      await bookingApi.approveBooking(selectedBooking.id, {
        status: approvalAction === 'approve' ? 'manager_approved' : 'rejected',
        notes: approvalNotes,
      });

      setSnackbar({
        open: true,
        message: `Booking ${approvalAction === 'approve' ? 'approved' : 'rejected'} successfully!`,
        severity: 'success',
      });

      setApprovalDialog(false);
      setSelectedBooking(null);
      setApprovalNotes('');
      fetchPendingApprovals();
    } catch (error) {
      console.error('Error updating booking:', error);
      setSnackbar({ open: true, message: 'Failed to update booking', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoom = async () => {
    if (!roomData.name || !roomData.capacity || (!editingRoom && !roomData.roomNumber) || !roomData.location) {
      setSnackbar({ open: true, message: 'Please fill all required room fields', severity: 'error' });
      return;
    }

    try {
      setLoading(true);
      if (editingRoom) {
        // Update room
        await bookingApi.updateRoom(editingRoom.id, {
          name: roomData.name,
          location: roomData.location,
          capacity: Number(roomData.capacity),
          floor: Number(roomData.floor) || 1,
          roomStatus: roomData.status,
        });
        setSnackbar({ open: true, message: 'Room updated successfully!', severity: 'success' });
      } else {
        // Create room
        await bookingApi.createRoom({
          name: roomData.name,
          roomNumber: roomData.roomNumber,
          location: roomData.location,
          capacity: Number(roomData.capacity),
          floor: Number(roomData.floor) || 1,
        });
        setSnackbar({ open: true, message: 'Room created successfully!', severity: 'success' });
      }

      setRoomDialog(false);
      setEditingRoom(null);
      setRoomData({ name: '', roomNumber: '', location: '', capacity: '', floor: '', building: '', status: 'active' });
      fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      setSnackbar({ open: true, message: 'Failed to save room', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetMaintenance = async () => {
    if (!maintenanceRoom) return;

    try {
      setLoading(true);
      await bookingApi.updateRoom(maintenanceRoom.id, {
        name: maintenanceRoom.name,
        location: maintenanceRoom.location || maintenanceRoom.building,
        capacity: maintenanceRoom.capacity,
        floor: maintenanceRoom.floor,
        roomStatus: 'maintenance',
      });

      setSnackbar({
        open: true,
        message: 'Room marked for maintenance!',
        severity: 'success',
      });

      setMaintenanceDialog(false);
      setMaintenanceRoom(null);
      setMaintenanceData({ reason: '', endDate: '' });
      fetchRooms();
    } catch (error) {
      console.error('Error setting maintenance:', error);
      setSnackbar({ open: true, message: 'Failed to set maintenance', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Remove ${room.name}? This cannot be undone.`)) return;
    try {
      setLoading(true);
      await bookingApi.deleteRoom(room.id);
      setSnackbar({ open: true, message: 'Room removed successfully!', severity: 'success' });
      fetchRooms();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Failed to remove room', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
      setRoomData({
      name: room.name,
        roomNumber: room.room_number || '',
        location: room.location || room.building || '',
      capacity: room.capacity,
      floor: room.floor || '',
        building: room.location || room.building || '',
        status: room.room_status || room.status || 'active',
    });
    setRoomDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
      case 'available':
        return '#4caf50';
      case 'booked':
        return '#ff9800';
      case 'maintenance':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'available':
        return 'Available';
      case 'booked':
        return 'Booked';
      case 'maintenance':
        return 'Maintenance';
      case 'pending_manager':
        return 'Pending Manager';
      case 'manager_approved':
        return 'Manager Approved';
      case 'pending_hr':
        return 'Pending HR';
      case 'hr_approved':
        return 'HR Approved';
      default:
        return status;
    }
  };

  // Check if user has admin privileges
  if (!user || (user.role !== 'Admin' && user.role !== 'Super Admin' && user.role !== 'Department Manager')) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          You do not have permission to access the Admin Panel. Only Admins and Department Managers can access this.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Container maxWidth="lg">
        {/* Admin Tab Navigation */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={adminTab}
            onChange={(e, newValue) => setAdminTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
              },
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: 2,
              },
            }}
          >
            <Tab label="📋 Room Management" />
            <Tab
              label={
                <Badge badgeContent={pendingBookings.length} color="error">
                  Booking Approvals
                </Badge>
              }
            />
            <Tab label="🔧 Maintenance" />
          </Tabs>
        </Paper>

        {/* TAB 1: Room Management */}
        {adminTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                All Meeting Rooms
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setEditingRoom(null);
                  setRoomData({ name: '', roomNumber: '', location: '', capacity: '', floor: '', building: '', status: 'active' });
                  setRoomDialog(true);
                }}
              >
                + Add New Room
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {rooms.map((room) => (
                  <Grid item xs={12} sm={6} md={4} key={room.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, flex: 1 }}>
                            {room.name}
                          </Typography>
                          <Chip
                            label={getStatusLabel(room.status)}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(room.status),
                              color: 'white',
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            👥 Capacity: <strong>{room.capacity} people</strong>
                          </Typography>
                          {room.floor && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              📊 Floor: <strong>{room.floor}</strong>
                            </Typography>
                          )}
                          {room.building && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              🏢 Building: <strong>{room.building}</strong>
                            </Typography>
                          )}
                          {room.status === 'maintenance' && room.maintenance_reason && (
                            <Typography variant="caption" sx={{ color: '#f44336', fontStyle: 'italic' }}>
                              🔧 Reason: {room.maintenance_reason}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>

                      <Box sx={{ display: 'flex', gap: 1, p: 2, pt: 0 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditRoom(room)}
                          fullWidth
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color={room.status === 'maintenance' ? 'success' : 'warning'}
                          startIcon={<BuildIcon />}
                          onClick={() => {
                            setMaintenanceRoom(room);
                            setMaintenanceData({ reason: room.maintenance_reason || '', endDate: room.maintenance_end_date || '' });
                            setMaintenanceDialog(true);
                          }}
                          fullWidth
                        >
                          {room.status === 'maintenance' ? 'Restore' : 'Maintenance'}
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteRoom(room)}
                          sx={{ minWidth: 40, px: 1 }}
                          aria-label={`Remove ${room.name}`}
                        />
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* TAB 2: Booking Approvals */}
        {adminTab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Pending Booking Approvals ({pendingBookings.length})
            </Typography>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : pendingBookings.length === 0 ? (
              <Alert severity="info">No pending booking approvals</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Meeting</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Organizer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Participants</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingBookings.map((booking) => (
                      <TableRow key={booking.id} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {booking.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {booking.purpose}
                          </Typography>
                        </TableCell>
                        <TableCell>{booking.room_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(booking.meeting_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {booking.start_time} - {booking.end_time}
                          </Typography>
                        </TableCell>
                        <TableCell>{booking.organizer_name || 'N/A'}</TableCell>
                        <TableCell>{booking.number_of_participants}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(booking.approval_status || 'pending_manager')}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <IconButton
                              size="small"
                              color="success"
                              title="Approve"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setApprovalAction('approve');
                                setApprovalNotes('');
                                setApprovalDialog(true);
                              }}
                            >
                              <CheckCircleIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              title="Reject"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setApprovalAction('reject');
                                setApprovalNotes('');
                                setApprovalDialog(true);
                              }}
                            >
                              <CancelIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="warning"
                              title="Hold"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setApprovalAction('hold');
                                setApprovalNotes('');
                                setApprovalDialog(true);
                              }}
                            >
                              <PauseIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {/* TAB 3: Maintenance Management */}
        {adminTab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Rooms Under Maintenance
            </Typography>

            <Grid container spacing={2}>
              {rooms
                .filter((room) => room.status === 'maintenance')
                .map((room) => (
                  <Grid item xs={12} sm={6} md={4} key={room.id}>
                    <Card sx={{ backgroundColor: '#fff3e0', borderLeft: '4px solid #f44336' }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                          {room.name}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                          <Typography variant="caption">
                            🔧 <strong>Maintenance Reason:</strong> {room.maintenance_reason || 'Not specified'}
                          </Typography>
                          {room.maintenance_end_date && (
                            <Typography variant="caption">
                              📅 <strong>Expected End:</strong> {new Date(room.maintenance_end_date).toLocaleDateString()}
                            </Typography>
                          )}
                          <Typography variant="caption">
                            👥 <strong>Capacity:</strong> {room.capacity} people
                          </Typography>
                        </Box>
                        <Button
                          variant="outlined"
                          color="success"
                          size="small"
                          fullWidth
                          onClick={() => {
                            setMaintenanceRoom(room);
                            setMaintenanceData({ reason: '', endDate: '' });
                            setMaintenanceDialog(true);
                          }}
                        >
                          Restore to Service
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
            </Grid>

            {rooms.filter((room) => room.status === 'maintenance').length === 0 && (
              <Alert severity="info">No rooms under maintenance</Alert>
            )}
          </Box>
        )}
      </Container>

      {/* Room Dialog */}
      <Dialog open={roomDialog} onClose={() => setRoomDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Room Name *"
            value={roomData.name}
            onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="Room Number *"
            value={roomData.roomNumber}
            onChange={(e) => setRoomData({ ...roomData, roomNumber: e.target.value })}
            fullWidth
            disabled={!!editingRoom}
          />
          <TextField
            label="Capacity *"
            type="number"
            value={roomData.capacity}
            onChange={(e) => setRoomData({ ...roomData, capacity: e.target.value })}
            fullWidth
            inputProps={{ min: 1 }}
          />
          <TextField
            label="Floor"
            value={roomData.floor}
            onChange={(e) => setRoomData({ ...roomData, floor: e.target.value })}
            fullWidth
          />
          <TextField
            label="Building"
            value={roomData.location}
            onChange={(e) => setRoomData({ ...roomData, location: e.target.value, building: e.target.value })}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={roomData.status}
              onChange={(e) => setRoomData({ ...roomData, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveRoom} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {approvalAction === 'approve' && '✅ Approve Booking'}
          {approvalAction === 'reject' && '❌ Reject Booking'}
          {approvalAction === 'hold' && '⏸️ Hold Booking'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {selectedBooking && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Meeting:</strong> {selectedBooking.title}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Date & Time:</strong> {new Date(selectedBooking.meeting_date).toLocaleDateString()} {selectedBooking.start_time}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Organizer:</strong> {selectedBooking.organizer_name}
              </Typography>
            </Box>
          )}
          <TextField
            label="Notes / Reason"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder={
              approvalAction === 'reject'
                ? 'Enter reason for rejection...'
                : approvalAction === 'hold'
                ? 'Enter reason for hold...'
                : 'Enter approval notes...'
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button onClick={handleApproveBooking} variant="contained" disabled={loading}>
            {loading ? 'Processing...' : approvalAction === 'approve' ? 'Approve' : approvalAction === 'reject' ? 'Reject' : 'Hold'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialog} onClose={() => setMaintenanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {maintenanceRoom?.status === 'maintenance' ? '✅ Restore Room to Service' : '🔧 Set Room for Maintenance'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {maintenanceRoom && <Typography variant="body2">Room: <strong>{maintenanceRoom.name}</strong></Typography>}
          {maintenanceRoom?.status !== 'maintenance' && (
            <>
              <TextField
                label="Maintenance Reason"
                value={maintenanceData.reason}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, reason: e.target.value })}
                fullWidth
                placeholder="e.g., HVAC repair, carpet replacement"
              />
              <TextField
                label="Expected End Date"
                type="date"
                value={maintenanceData.endDate}
                onChange={(e) => setMaintenanceData({ ...maintenanceData, endDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaintenanceDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSetMaintenance}
            variant="contained"
            disabled={loading}
            color={maintenanceRoom?.status === 'maintenance' ? 'success' : 'error'}
          >
            {loading ? 'Processing...' : maintenanceRoom?.status === 'maintenance' ? 'Restore' : 'Set Maintenance'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
