import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import * as bookingApi from '../../api/booking.js';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingApi.getBookings();
      setBookings(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleCancelBooking = async () => {
    try {
      await bookingApi.cancelBooking(selectedBooking.id, {
        reason: cancellationReason,
      });
      setCancelDialogOpen(false);
      setCancellationReason('');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      confirmed: '#4caf50',
      pending_department_head: '#ff9800',
      pending_hr: '#2196f3',
      rejected: '#f44336',
      cancelled: '#9e9e9e',
      completed: '#2196f3',
    };
    return statusColors[status] || '#2196f3';
  };

  const getStatusLabel = (status) => {
    const labels = {
      confirmed: 'Confirmed',
      pending_department_head: 'Pending Dept Head',
      pending_hr: 'Pending HR',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      completed: 'Completed',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const displayedBookings = bookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Meeting Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Room</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Participants</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedBookings.length > 0 ? (
                displayedBookings.map((booking) => (
                  <TableRow key={booking.id} hover>
                    <TableCell>{booking.title}</TableCell>
                    <TableCell>{booking.room?.name}</TableCell>
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
                    <TableCell>{booking.participants_count}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(booking.status)}
                        size="small"
                        sx={{
                          backgroundColor: `${getStatusColor(booking.status)}20`,
                          color: getStatusColor(booking.status),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewDetails(booking)}
                        sx={{ mr: 1 }}
                      >
                        Details
                      </Button>
                      {booking.status === 'pending_department_head' || booking.status === 'pending_hr' ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => {
                            setSelectedBooking(booking);
                            setCancelDialogOpen(true);
                          }}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No bookings found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={bookings.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Booking Details</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Meeting Title
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedBooking.title}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Room
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedBooking.room?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {new Date(selectedBooking.meeting_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Time
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedBooking.start_time} - {selectedBooking.end_time}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Purpose
                </Typography>
                <Typography variant="body1">{selectedBooking.purpose}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Participants
                </Typography>
                <Typography variant="body1">{selectedBooking.participants_count} people</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Status
                </Typography>
                <Chip
                  label={getStatusLabel(selectedBooking.status)}
                  sx={{
                    backgroundColor: `${getStatusColor(selectedBooking.status)}20`,
                    color: getStatusColor(selectedBooking.status),
                    fontWeight: 600,
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Cancel Booking</DialogTitle>
        <DialogContent>
          <TextField
            label="Cancellation Reason"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleCancelBooking}
            color="error"
            variant="contained"
          >
            Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
