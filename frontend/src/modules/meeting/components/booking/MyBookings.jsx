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
  Tabs,
  Tab,
  InputAdornment,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Add as AddIcon,
  CalendarMonth as CalendarMonthIcon,
  EventAvailable as EventAvailableIcon,
  MeetingRoom as MeetingRoomIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as bookingApi from '../../api/booking.js';
import { useAuth } from '../../../../context/AuthContext.jsx';

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'my'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [filterMode]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = filterMode === 'my' ? { myBookings: 'true' } : {};
      const response = await bookingApi.getBookings(params);
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
      confirmed: '#16A34A',
      pending_department_head: '#D97706',
      pending_manager: '#D97706',
      pending: '#D97706',
      pending_hr: '#2563EB',
      rejected: '#DC2626',
      cancelled: '#6B7280',
      completed: '#4F46E5',
    };
    return statusColors[status] || '#2563EB';
  };

  const getStatusLabel = (status) => {
    const labels = {
      confirmed: 'Confirmed',
      pending_department_head: 'Pending Dept Head',
      pending_manager: 'Pending Manager',
      pending: 'Pending Approval',
      pending_hr: 'Pending HR',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
      completed: 'Completed',
    };
    return labels[status] || status;
  };

  // Filter bookings by status & search query
  const filteredBookings = bookings.filter((b) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'pending' && !b.status?.startsWith('pending')) return false;
      if (statusFilter === 'confirmed' && b.status !== 'confirmed') return false;
      if (statusFilter === 'completed' && b.status !== 'completed') return false;
      if (statusFilter === 'rejected_cancelled' && !['rejected', 'cancelled'].includes(b.status)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = b.title?.toLowerCase().includes(q);
      const matchRoom = b.room?.name?.toLowerCase().includes(q);
      const matchOrganizer = b.organizer?.name?.toLowerCase().includes(q) || b.organizer?.email?.toLowerCase().includes(q);
      const matchDate = b.meeting_date?.includes(q);
      return matchTitle || matchRoom || matchOrganizer || matchDate;
    }
    return true;
  });

  const displayedBookings = filteredBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header controls & Tabs */}
      <Paper sx={{ mb: 2.5, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
          <Tabs
            value={filterMode}
            onChange={(e, val) => {
              setFilterMode(val);
              setPage(0);
            }}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                borderRadius: 1.5,
                px: 2,
              },
            }}
          >
            <Tab label="All Bookings" value="all" icon={<EventAvailableIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="My Bookings" value="my" icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
          </Tabs>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <TextField
              size="small"
              placeholder="Search meetings, rooms, organizers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 260 }}
            />
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate('/meeting-room/calendar')}
              sx={{
                borderRadius: 1.5,
                textTransform: 'none',
                fontWeight: 700,
                px: 2,
                height: 40,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              }}
            >
              Book Room
            </Button>
          </Stack>
        </Stack>

        {/* Status Filter Badges */}
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
          <Chip
            label={`All (${bookings.length})`}
            size="small"
            clickable
            color={statusFilter === 'all' ? 'primary' : 'default'}
            variant={statusFilter === 'all' ? 'filled' : 'outlined'}
            onClick={() => { setStatusFilter('all'); setPage(0); }}
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label="Confirmed"
            size="small"
            clickable
            color={statusFilter === 'confirmed' ? 'success' : 'default'}
            variant={statusFilter === 'confirmed' ? 'filled' : 'outlined'}
            onClick={() => { setStatusFilter('confirmed'); setPage(0); }}
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label="Pending Approval"
            size="small"
            clickable
            color={statusFilter === 'pending' ? 'warning' : 'default'}
            variant={statusFilter === 'pending' ? 'filled' : 'outlined'}
            onClick={() => { setStatusFilter('pending'); setPage(0); }}
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label="Completed"
            size="small"
            clickable
            color={statusFilter === 'completed' ? 'info' : 'default'}
            variant={statusFilter === 'completed' ? 'filled' : 'outlined'}
            onClick={() => { setStatusFilter('completed'); setPage(0); }}
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label="Rejected / Cancelled"
            size="small"
            clickable
            color={statusFilter === 'rejected_cancelled' ? 'error' : 'default'}
            variant={statusFilter === 'rejected_cancelled' ? 'filled' : 'outlined'}
            onClick={() => { setStatusFilter('rejected_cancelled'); setPage(0); }}
            sx={{ fontWeight: 700 }}
          />
        </Stack>
      </Paper>

      {/* Bookings Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }} elevation={0}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                    <TableCell sx={{ fontWeight: 800 }}>Meeting Title</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Room</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Organizer</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Time</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Participants</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, textAlign: 'center' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedBookings.length > 0 ? (
                    displayedBookings.map((booking) => (
                      <TableRow key={booking.id} hover>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {booking.title}
                          {booking.purpose && booking.purpose !== booking.title && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {booking.purpose.slice(0, 40)}{booking.purpose.length > 40 ? '...' : ''}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <MeetingRoomIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {booking.room?.name || 'Room'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {booking.organizer?.name || booking.organizer?.email || 'Employee'}
                          </Typography>
                          {booking.department?.name && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {booking.department.name}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {booking.meeting_date ? new Date(booking.meeting_date).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }) : '-'}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`${booking.participants_count || 1} People`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, height: 22, fontSize: '0.72rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(booking.status)}
                            size="small"
                            sx={{
                              bgcolor: `${getStatusColor(booking.status)}15`,
                              color: getStatusColor(booking.status),
                              border: `1px solid ${getStatusColor(booking.status)}40`,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon sx={{ fontSize: 16 }} />}
                              onClick={() => handleViewDetails(booking)}
                              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, py: 0.4 }}
                            >
                              Details
                            </Button>
                            {(booking.status?.startsWith('pending') || booking.status === 'confirmed') && (
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon sx={{ fontSize: 16 }} />}
                                onClick={() => {
                                  setSelectedBooking(booking);
                                  setCancelDialogOpen(true);
                                }}
                                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 1.5, py: 0.4 }}
                              >
                                Cancel
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                        <Box sx={{ maxWidth: 360, mx: 'auto' }}>
                          <CalendarMonthIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                            No bookings found
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                            {filterMode === 'my'
                              ? 'You have not booked any meeting rooms yet.'
                              : 'No bookings match your current filter criteria.'}
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/meeting-room/calendar')}
                            sx={{
                              borderRadius: 1.5,
                              textTransform: 'none',
                              fontWeight: 700,
                              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                            }}
                          >
                            Book a Meeting Room Now
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredBookings.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Booking Details</DialogTitle>
        <DialogContent dividers>
          {selectedBooking && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  MEETING TITLE
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {selectedBooking.title}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  ROOM
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {selectedBooking.room?.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  ORGANIZER
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedBooking.organizer?.name || selectedBooking.organizer?.email || 'Employee'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  DATE
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {new Date(selectedBooking.meeting_date).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  TIME SLOT
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {selectedBooking.start_time} - {selectedBooking.end_time}
                </Typography>
              </Grid>
              {selectedBooking.purpose && (
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    AGENDA / PURPOSE
                  </Typography>
                  <Typography variant="body2">{selectedBooking.purpose}</Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  PARTICIPANTS
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>{selectedBooking.participants_count || 1} People</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  STATUS
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={getStatusLabel(selectedBooking.status)}
                    sx={{
                      bgcolor: `${getStatusColor(selectedBooking.status)}15`,
                      color: getStatusColor(selectedBooking.status),
                      border: `1px solid ${getStatusColor(selectedBooking.status)}40`,
                      fontWeight: 700,
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailsOpen(false)} variant="outlined" sx={{ borderRadius: 1.5, textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Cancel Meeting Booking</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Are you sure you want to cancel the booking for &quot;<strong>{selectedBooking?.title}</strong>&quot;?
          </Typography>
          <TextField
            label="Cancellation Reason (optional)"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Please mention reason for cancellation..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCancelDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Dismiss
          </Button>
          <Button
            onClick={handleCancelBooking}
            color="error"
            variant="contained"
            sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
          >
            Confirm Cancellation
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
