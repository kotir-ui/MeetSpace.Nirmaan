import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid, Card, CardContent, Typography, CircularProgress, Chip, Paper, Stack, TextField, Tooltip,
} from '@mui/material';
import {
  MeetingRoom as MeetingRoomIcon, CheckCircle as CheckCircleIcon, EventNote as EventNoteIcon, Pending as PendingIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import * as bookingApi from '../../api/booking.js';
import { useAuth } from '../../../../context/AuthContext.jsx';

export default function BookingDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateString = selectedDate.toISOString().split('T')[0];

  useEffect(() => { fetchDashboard(); }, [dateString]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [summaryResponse, bookingsResponse, roomsResponse] = await Promise.all([
        bookingApi.getDashboardSummary(),
        bookingApi.getBookings({ dateFrom: dateString, dateTo: dateString }),
        bookingApi.getRooms(),
      ]);
      setDashboard(summaryResponse.data?.data);
      setTodayBookings(bookingsResponse.data?.data || []);
      setRooms(roomsResponse.data?.data || []);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toMinutes = (value) => {
    const [hours, minutes] = String(value || '00:00').split(':').map(Number);
    return hours * 60 + minutes;
  };

  const timeSlots = Array.from({ length: 18 }, (_, index) => 9 * 60 + index * 30);
  const formatTime = (minutes) => new Date(0, 0, 1, Math.floor(minutes / 60), minutes % 60).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const getBookingForSlot = (roomId, slotStart) => todayBookings.find((booking) => {
    const bookingRoomId = booking.meeting_room_id || booking.room_id || booking.room?.id;
    return String(bookingRoomId) === String(roomId)
      && !['cancelled', 'rejected'].includes(booking.status)
      && toMinutes(booking.start_time) < slotStart + 30
      && toMinutes(booking.end_time) > slotStart;
  });
  const openBooking = (room, slotStart) => {
    const startTime = `${String(Math.floor(slotStart / 60)).padStart(2, '0')}:${String(slotStart % 60).padStart(2, '0')}`;
    const endMinutes = slotStart + 30;
    const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
    navigate(`/meeting-room/book?date=${dateString}&roomId=${room.id}&startTime=${startTime}&endTime=${endTime}`);
  };

  // Filter bookings based on showFilter
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card
      sx={{
        borderRadius: 1.5,
        background: `linear-gradient(135deg, ${color}10 0%, transparent 100%)`,
        border: `1px solid ${color}30`,
        transition: 'all 0.2s ease',
        boxShadow: 'none',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${color}20` },
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', py: '16px !important', px: 2 }}>
        <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: `${color}15`, display: 'flex', mr: 2 }}>
          <Icon sx={{ fontSize: 24, color }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color, lineHeight: 1, mb: 0.25 }}>
            {value}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {title}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Room schedule</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Rooms"
            value={dashboard?.totalRooms || 0}
            icon={MeetingRoomIcon}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Available Now"
            value={dashboard?.availableNow || 0}
            icon={CheckCircleIcon}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Bookings"
            value={todayBookings.filter((b) => !['cancelled', 'rejected'].includes(b.status)).length}
            icon={EventNoteIcon}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Approvals"
            value={dashboard?.pendingApprovals || 0}
            icon={PendingIcon}
            color="#f44336"
          />
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 1.5, overflow: 'hidden' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0.75, md: 2 }} alignItems={{ md: 'center' }}>
            <Box><Typography sx={{ fontWeight: 800 }}>Daily room board</Typography><Typography variant="body2" color="text.secondary">{selectedDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Typography></Box>
            <Stack direction="row" spacing={0.75} flexWrap="wrap">
              <Chip label="Available" size="small" sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }} />
              <Chip label="Booked" size="small" sx={{ bgcolor: '#DBEAFE', color: '#1D4ED8', fontWeight: 700 }} />
              <Chip label="Maintenance / Not available" size="small" sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }} />
            </Stack>
          </Stack>
          <TextField
            label="Select date"
            type="date"
            value={dateString}
            onChange={(event) => setSelectedDate(new Date(`${event.target.value}T00:00:00`))}
            size="small"
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
          />
        </Stack>
        <Box sx={{ maxHeight: 620, overflow: 'auto' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: `100px repeat(${Math.max(rooms.length, 1)}, minmax(180px, 1fr))`, minWidth: Math.max(760, 100 + rooms.length * 180) }}>
            <Box sx={{ position: 'sticky', top: 0, left: 0, zIndex: 4, p: 1.5, bgcolor: '#F8FAFC', borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}><Typography variant="caption" sx={{ fontWeight: 800 }}>TIME</Typography></Box>
            {rooms.map((room) => <Box key={room.id} sx={{ position: 'sticky', top: 0, zIndex: 3, p: 1.25, bgcolor: '#F8FAFC', borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}><Typography noWrap sx={{ fontWeight: 800, fontSize: 13 }}>{room.name}</Typography><Typography variant="caption" color="text.secondary">{room.capacity} seats</Typography></Box>)}
            {timeSlots.flatMap((slotStart) => [
              <Box key={`time-${slotStart}`} sx={{ position: 'sticky', left: 0, zIndex: 2, p: 1.25, bgcolor: '#FCFDFE', borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}><Typography variant="caption" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatTime(slotStart)}</Typography></Box>,
              ...rooms.map((room) => {
                const booking = getBookingForSlot(room.id, slotStart);
                const unavailable = room.room_status !== 'active';
                const style = unavailable ? { bgcolor: '#FEE2E2', color: '#B91C1C', label: 'Unavailable' } : booking ? { bgcolor: '#DBEAFE', color: '#1D4ED8', label: 'Booked' } : { bgcolor: '#DCFCE7', color: '#166534', label: 'Available' };
                const detail = unavailable ? `${room.room_status === 'maintenance' ? 'Maintenance' : 'Not available'}: ${room.description || 'Room is not available for booking.'}` : booking ? `${booking.title}\nBooked by: ${booking.organizer?.name || 'Unknown'}\nDepartment: ${booking.department?.name || 'Not specified'}\n${booking.start_time?.slice(0, 5)} - ${booking.end_time?.slice(0, 5)}\nParticipants: ${booking.participants?.length || booking.participants_count || 0}` : `Available ${formatTime(slotStart)} - ${formatTime(slotStart + 30)}. Click to book.`;
                return <Tooltip key={`${room.id}-${slotStart}`} title={<span style={{ whiteSpace: 'pre-line' }}>{detail}</span>} arrow><Box role={!unavailable && !booking ? 'button' : undefined} tabIndex={!unavailable && !booking ? 0 : undefined} onClick={() => !unavailable && !booking && openBooking(room, slotStart)} onKeyDown={(event) => event.key === 'Enter' && !unavailable && !booking && openBooking(room, slotStart)} sx={{ minHeight: 58, p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: style.bgcolor, color: style.color, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider', cursor: !unavailable && !booking ? 'pointer' : 'default', '&:hover': !unavailable && !booking ? { filter: 'brightness(0.96)' } : {} }}><Typography variant="caption" sx={{ fontWeight: 800 }}>{style.label}</Typography></Box></Tooltip>;
              }),
            ])}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

