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
  Button,
  TextField,
  Stack,
  CircularProgress,
  Dialog,
  Typography,
  Chip,
  Alert,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BookingDetailsModal from '../../components/booking/BookingDetailsModal';

const MeetingCalendar = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Time slots from 9 AM to 6 PM in 30-minute intervals
  const timeSlots = generateTimeSlots();

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  function generateTimeSlots() {
    const slots = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
        slots.push(timeStr);
      }
    }
    return slots;
  }

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch rooms
      const roomsRes = await axios.get('/api/booking/rooms');
      setRooms(roomsRes.data.data);

      // Fetch bookings for selected date
      const bookingsRes = await axios.get(`/api/booking/bookings?dateFrom=${selectedDate}&dateTo=${selectedDate}`);
      setBookings(bookingsRes.data.data);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  };

  const isSlotBookedByRoom = (roomId, timeSlot) => {
    return bookings.find(
      b =>
        b.meeting_room_id === roomId &&
        b.start_time <= timeSlot &&
        b.end_time > timeSlot &&
        b.status !== 'rejected' &&
        b.status !== 'cancelled'
    );
  };

  const getSlotStatus = (booking) => {
    if (!booking) return 'available';
    if (booking.status === 'confirmed') return 'booked';
    if (booking.status === 'pending_department_head' || booking.status === 'pending_hr')
      return 'pending';
    return 'blocked';
  };

  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleSlotClick = (roomId, timeSlot) => {
    const booking = isSlotBookedByRoom(roomId, timeSlot);
    if (booking) {
      setSelectedBooking(booking);
      setDetailsOpen(true);
    } else {
      // Navigate to booking form with pre-filled values
      navigate('/booking/new', {
        state: {
          roomId,
          date: selectedDate,
          startTime: timeSlot,
        },
      });
    }
  };

  const getSlotColor = (status) => {
    switch (status) {
      case 'available':
        return '#c8e6c9'; // Light green
      case 'booked':
        return '#ef9a9a'; // Light red
      case 'pending':
        return '#fff9c4'; // Light yellow
      case 'blocked':
        return '#e0e0e0'; // Gray
      default:
        return '#ffffff';
    }
  };

  if (loading && rooms.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Meeting Room Calendar
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
            View and manage room bookings
          </Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/booking/new')}>
          + Book Room
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Date Navigation */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Button size="small" startIcon={<ChevronLeftIcon />} onClick={goToPreviousDay}>
            Previous
          </Button>

          <TextField
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            size="small"
            sx={{ width: 200 }}
          />

          <Typography sx={{ flex: 1, fontWeight: 600 }}>
            {formatDate(selectedDate)}
          </Typography>

          <Button size="small" endIcon={<ChevronRightIcon />} onClick={goToNextDay}>
            Next
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Today
          </Button>
        </Stack>
      </Paper>

      {/* Legend */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#c8e6c9', border: '1px solid #999' }} />
          <Typography variant="caption">Available</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#ef9a9a', border: '1px solid #999' }} />
          <Typography variant="caption">Booked</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#fff9c4', border: '1px solid #999' }} />
          <Typography variant="caption">Pending Approval</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, bgcolor: '#e0e0e0', border: '1px solid #999' }} />
          <Typography variant="caption">Blocked</Typography>
        </Box>
      </Box>

      {/* Calendar Table */}
      <TableContainer component={Paper}>
        <Table size="small" sx={{ minWidth: 1200 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell sx={{ fontWeight: 700, minWidth: 100, position: 'sticky', left: 0, zIndex: 1, bgcolor: '#f5f5f5' }}>
                Time
              </TableCell>
              {rooms.map((room) => (
                <TableCell
                  key={room.id}
                  align="center"
                  sx={{
                    fontWeight: 700,
                    minWidth: 150,
                    bgcolor: room.room_status !== 'active' ? '#fafafa' : 'white',
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {room.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Cap: {room.capacity} | Floor {room.floor}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {timeSlots.map((timeSlot, idx) => (
              <TableRow key={idx}>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    minWidth: 100,
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    bgcolor: '#fafafa',
                  }}
                >
                  {formatTime(timeSlot)}
                </TableCell>

                {rooms.map((room) => {
                  const booking = isSlotBookedByRoom(room.id, timeSlot);
                  const status = getSlotStatus(booking);
                  const isDisabled = room.room_status !== 'active';

                  return (
                    <TableCell
                      key={`${room.id}-${timeSlot}`}
                      align="center"
                      sx={{
                        p: 0.5,
                        minWidth: 150,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        backgroundColor: isDisabled ? '#fafafa' : getSlotColor(status),
                        border: '1px solid #e0e0e0',
                        '&:hover': !isDisabled && {
                          backgroundColor: booking ? getSlotColor(status) : '#a5d6a7',
                          opacity: 0.9,
                        },
                      }}
                      onClick={() => !isDisabled && handleSlotClick(room.id, timeSlot)}
                    >
                      {booking ? (
                        <Box sx={{ p: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                            {booking.title.substring(0, 15)}...
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {booking.organizer?.name}
                          </Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Chip
                              label={booking.status.replace(/_/g, ' ')}
                              size="small"
                              color={
                                booking.status === 'confirmed'
                                  ? 'success'
                                  : booking.status === 'rejected'
                                  ? 'error'
                                  : 'warning'
                              }
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          {isDisabled ? 'Unavailable' : 'Available'}
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Booking Details Modal */}
      <BookingDetailsModal
        open={detailsOpen}
        booking={selectedBooking}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedBooking(null);
        }}
        onUpdate={fetchData}
      />
    </Box>
  );
};

export default MeetingCalendar;
