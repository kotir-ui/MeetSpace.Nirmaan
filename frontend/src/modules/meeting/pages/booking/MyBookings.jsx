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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    dateFrom: '',
    dateTo: '',
  });
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const res = await axios.get('/api/booking/bookings', { params });
      setBookings(res.data.data || []);
    } catch (err) {
      setError('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    try {
      setCancelling(true);
      await axios.delete(`/api/booking/bookings/${selectedBooking.id}`, {
        data: { reason: cancelReason },
      });
      setCancelDialogOpen(false);
      setCancelReason('');
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending_department_head':
      case 'pending_hr':
        return 'warning';
      case 'cancelled':
        return 'default';
      default:
        return 'info';
    }
  };

  const getStatusLabel = (status) => {
    return status.replace(/_/g, ' ').toUpperCase();
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
            My Bookings
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            View and manage your meeting room bookings
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => navigate('/booking/new')}
        >
          + Book Room
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="pending_department_head">Pending Approval</MenuItem>
              <MenuItem value="pending_hr">Pending HR</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="From Date"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <TextField
            label="To Date"
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <Button
            variant="outlined"
            onClick={() => setFilters({ status: '', dateFrom: '', dateTo: '' })}
          >
            Clear
          </Button>
        </Stack>
      </Paper>

      {/* Bookings Table */}
      {bookings.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700 }}>Booking #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Meeting</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{booking.booking_number}</TableCell>
                  <TableCell>{booking.title}</TableCell>
                  <TableCell>
                    {new Date(booking.meeting_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    {booking.start_time} - {booking.end_time}
                  </TableCell>
                  <TableCell>{booking.room?.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(booking.status)}
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/booking/details/${booking.id}`)}
                      >
                        View
                      </Button>
                      {['pending_department_head', 'pending_hr'].includes(booking.status) && (
                        <>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() =>
                              navigate(`/booking/edit/${booking.id}`, { state: { booking } })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleCancelClick(booking)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
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
            No bookings found. Create your first booking!
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/booking/new')}
          >
            Book Room
          </Button>
        </Paper>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography sx={{ mb: 2 }}>
              Are you sure you want to cancel <strong>{selectedBooking?.title}</strong>?
            </Typography>
            <TextField
              fullWidth
              label="Cancellation Reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              multiline
              rows={3}
              placeholder="Explain why you're cancelling this booking..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={cancelling}
          >
            {cancelling ? 'Cancelling...' : 'Confirm Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyBookings;
